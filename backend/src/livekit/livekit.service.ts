import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccessToken,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  RoomServiceClient,
  WebhookReceiver,
} from 'livekit-server-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { MeetingStatus, RecordingStatus } from '@prisma/client';
import { ReportService } from '../report/report.service';

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly livekitUrl: string;
  private readonly publicUrl: string;
  private readonly webhookReceiver: WebhookReceiver;
  private readonly egressClient: EgressClient;
  private readonly roomService: RoomServiceClient;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly reportService: ReportService,
  ) {
    this.apiKey = this.config.get('LIVEKIT_API_KEY', 'devkey');
    this.apiSecret = this.config.get('LIVEKIT_API_SECRET', 'secret');
    this.livekitUrl = this.config.get('LIVEKIT_URL', 'http://localhost:7880');
    this.publicUrl = this.config.get('LIVEKIT_PUBLIC_URL', 'ws://localhost:7880');

    this.webhookReceiver = new WebhookReceiver(this.apiKey, this.apiSecret);
    this.egressClient = new EgressClient(this.livekitUrl, this.apiKey, this.apiSecret);
    this.roomService = new RoomServiceClient(this.livekitUrl, this.apiKey, this.apiSecret);
  }

  getPublicUrl(): string {
    return this.publicUrl;
  }

  /**
   * Generate a LiveKit access token for a participant
   */
  async generateToken(
    roomName: string,
    userId: string,
    userName: string,
    isHost = false,
  ): Promise<string> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: userId,
      name: userName,
      ttl: '5m',
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost,
    });

    return await token.toJwt();
  }

  /**
   * Start recording a room via egress → Supabase S3
   */
  async startRecording(roomName: string, meetingId: string): Promise<string | null> {
    try {
      // Check for existing active egress
      const existing = await this.egressClient.listEgress({ roomName });
      const active = existing.find((e: any) => e.status < 2);
      if (active) {
        this.logger.log(`Recording already active for room ${roomName}`);
        return null;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filepath = `recordings/${meetingId}/${timestamp}.mp4`;

      const output = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath,
        output: {
          case: 's3',
          value: {
            accessKey: this.config.get('SUPABASE_S3_ACCESS_KEY', ''),
            secret: this.config.get('SUPABASE_S3_SECRET_KEY', ''),
            endpoint: this.config.get('SUPABASE_S3_ENDPOINT', ''),
            bucket: this.config.get('SUPABASE_BUCKET_NAME', 'recordings'),
            region: 'stub',
            forcePathStyle: true,
          },
        },
      });

      const egress = await this.egressClient.startRoomCompositeEgress(
        roomName,
        { file: output },
      );

      // Save recording record
      await this.prisma.recording.create({
        data: {
          meetingId,
          egressId: egress.egressId,
          storagePath: filepath,
          status: RecordingStatus.RECORDING,
        },
      });

      this.logger.log(`Started recording for room ${roomName}, egressId: ${egress.egressId}`);
      return egress.egressId;
    } catch (error) {
      this.logger.error(`Failed to start recording for room ${roomName}`, error);
      return null;
    }
  }

  /**
   * Stop an active recording
   */
  async stopRecording(egressId: string): Promise<void> {
    try {
      await this.egressClient.stopEgress(egressId);
      this.logger.log(`Stopped egress ${egressId}`);
    } catch (error) {
      this.logger.error(`Failed to stop egress ${egressId}`, error);
    }
  }

  /**
   * Delete a LiveKit room (kicks all participants)
   */
  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomName);
      this.logger.log(`Deleted room ${roomName}`);
    } catch (error) {
      this.logger.error(`Failed to delete room ${roomName}`, error);
    }
  }

  /**
   * Handle incoming LiveKit webhook
   */
  async handleWebhook(body: string, authHeader: string): Promise<void> {
    const event = await this.webhookReceiver.receive(body, authHeader);
    this.logger.log(`Webhook event: ${event.event}`);

    switch (event.event) {
      case 'room_started':
        await this.onRoomStarted(event);
        break;
      case 'room_finished':
        await this.onRoomFinished(event);
        break;
      case 'participant_joined':
        await this.onParticipantJoined(event);
        break;
      case 'participant_left':
        await this.onParticipantLeft(event);
        break;
      case 'egress_ended':
        await this.onEgressEnded(event);
        break;
    }
  }

  private async onRoomStarted(event: any) {
    const roomName = event.room?.name;
    if (!roomName) return;

    await this.prisma.meeting.updateMany({
      where: { livekitRoomName: roomName, status: MeetingStatus.SCHEDULED },
      data: { status: MeetingStatus.LIVE, startedAt: new Date() },
    });
  }

  private async onRoomFinished(event: any) {
    const roomName = event.room?.name;
    if (!roomName) return;

    const endedMeetings = await this.prisma.meeting.findMany({
      where: { livekitRoomName: roomName, status: MeetingStatus.LIVE },
      select: { id: true },
    });

    await this.prisma.meeting.updateMany({
      where: { livekitRoomName: roomName, status: MeetingStatus.LIVE },
      data: { status: MeetingStatus.ENDED, endedAt: new Date() },
    });

    // Trigger report generation asynchronously
    for (const m of endedMeetings) {
      this.reportService.generateReport(m.id).catch((err) => {
        this.logger.error(`Report generation failed for meeting ${m.id}`, err);
      });
    }

    // Stop any active egress
    try {
      const egressList = await this.egressClient.listEgress({ roomName });
      for (const egress of egressList) {
        if ((egress as any).status < 2) {
          await this.stopRecording(egress.egressId);
        }
      }
    } catch (error) {
      this.logger.error('Error stopping egress on room finish', error);
    }
  }

  private async onParticipantJoined(event: any) {
    const roomName = event.room?.name;
    const identity = event.participant?.identity;
    if (!roomName || !identity) return;

    // Skip agent participants
    if (identity.startsWith('agent-')) return;

    // Find meeting by room name
    const meeting = await this.prisma.meeting.findFirst({
      where: { livekitRoomName: roomName },
    });
    if (!meeting) return;

    // Update participant status
    await this.prisma.meetingParticipant.updateMany({
      where: { meetingId: meeting.id, userId: identity },
      data: { status: 'JOINED', joinedAt: new Date() },
    });

    // Check if this is the first real participant → start recording
    const joinedCount = await this.prisma.meetingParticipant.count({
      where: { meetingId: meeting.id, status: 'JOINED' },
    });

    if (joinedCount === 1) {
      await this.startRecording(roomName, meeting.id);
    }
  }

  private async onParticipantLeft(event: any) {
    const roomName = event.room?.name;
    const identity = event.participant?.identity;
    if (!roomName || !identity) return;
    if (identity.startsWith('agent-')) return;

    const meeting = await this.prisma.meeting.findFirst({
      where: { livekitRoomName: roomName },
    });
    if (!meeting) return;

    await this.prisma.meetingParticipant.updateMany({
      where: { meetingId: meeting.id, userId: identity },
      data: { status: 'LEFT', leftAt: new Date() },
    });
  }

  private async onEgressEnded(event: any) {
    const egressId = event.egressInfo?.egressId;
    if (!egressId) return;

    const status = event.egressInfo?.error
      ? RecordingStatus.FAILED
      : RecordingStatus.READY;

    const duration = event.egressInfo?.endedAt && event.egressInfo?.startedAt
      ? Math.floor((event.egressInfo.endedAt - event.egressInfo.startedAt) / 1_000_000_000)
      : null;

    await this.prisma.recording.updateMany({
      where: { egressId },
      data: {
        status,
        duration,
      },
    });

    this.logger.log(`Egress ${egressId} ended with status: ${status}`);
  }
}
