import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LiveKitService } from '../livekit/livekit.service';
import {
  CreateInstantMeetingDto,
  ScheduleMeetingDto,
  UpdateMeetingDto,
  MeetingQueryDto,
} from './dto/meeting.dto';
import { MeetingStatus, MeetingType } from '@prisma/client';

@Injectable()
export class MeetingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly livekitService: LiveKitService,
  ) {}

  /**
   * Generate a human-readable meeting code: xxx-xxxx-xxx
   */
  private generateCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segment = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${segment(3)}-${segment(4)}-${segment(3)}`;
  }

  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists: boolean;
    do {
      code = this.generateCode();
      const meeting = await this.prisma.meeting.findUnique({ where: { code } });
      exists = !!meeting;
    } while (exists);
    return code;
  }

  async createInstant(hostId: string, dto: CreateInstantMeetingDto) {
    const code = await this.generateUniqueCode();
    const id = crypto.randomUUID();

    const meeting = await this.prisma.meeting.create({
      data: {
        id,
        title: dto.title || 'Quick Meeting',
        code,
        status: MeetingStatus.SCHEDULED,
        type: MeetingType.INSTANT,
        hostId,
        livekitRoomName: id,
        participants: {
          create: {
            userId: hostId,
            role: 'HOST',
            status: 'INVITED',
          },
        },
      },
      include: { participants: { include: { user: true } } },
    });

    return meeting;
  }

  async schedule(hostId: string, dto: ScheduleMeetingDto) {
    const code = await this.generateUniqueCode();
    const id = crypto.randomUUID();
    const scheduledAt = new Date(dto.scheduledAt);

    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    // Find or create users for invitees
    const participantCreates: any[] = [
      { userId: hostId, role: 'HOST', status: 'INVITED' },
    ];

    if (dto.inviteeEmails?.length) {
      for (const email of dto.inviteeEmails) {
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
          // Create a placeholder user — they'll be fully set up on first login
          user = await this.prisma.user.create({
            data: { id: crypto.randomUUID(), email },
          });
        }
        if (user.id !== hostId) {
          participantCreates.push({
            userId: user.id,
            role: 'PARTICIPANT',
            status: 'INVITED',
          });
        }
      }
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        id,
        title: dto.title,
        description: dto.description,
        code,
        status: MeetingStatus.SCHEDULED,
        type: MeetingType.SCHEDULED,
        scheduledAt,
        hostId,
        livekitRoomName: id,
        participants: { create: participantCreates },
      },
      include: { participants: { include: { user: true } } },
    });

    return meeting;
  }

  async findByCode(code: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { code },
      include: {
        host: true,
        participants: { include: { user: true } },
      },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async findById(id: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        host: true,
        participants: { include: { user: true } },
        recordings: true,
        report: true,
      },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async listForUser(userId: string, query: MeetingQueryDto) {
    const { filter = 'all', limit = 20, offset = 0 } = query;
    const now = new Date();

    const where: any = {
      participants: { some: { userId } },
    };

    if (filter === 'upcoming') {
      where.status = { in: [MeetingStatus.SCHEDULED, MeetingStatus.LIVE] };
    } else if (filter === 'past') {
      where.status = { in: [MeetingStatus.ENDED, MeetingStatus.CANCELLED] };
    }

    const [meetings, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        include: {
          host: true,
          participants: { include: { user: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { scheduledAt: filter === 'past' ? 'desc' : 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return { meetings, total };
  }

  async update(meetingId: string, hostId: string, dto: UpdateMeetingDto) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostId !== hostId) throw new ForbiddenException('Only the host can update this meeting');
    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw new BadRequestException('Can only update scheduled meetings');
    }

    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
      },
      include: { participants: { include: { user: true } } },
    });
  }

  async cancel(meetingId: string, hostId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostId !== hostId) throw new ForbiddenException('Only the host can cancel this meeting');
    if (meeting.status === MeetingStatus.ENDED) {
      throw new BadRequestException('Meeting already ended');
    }

    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: { status: MeetingStatus.CANCELLED },
    });
  }

  async invite(meetingId: string, hostId: string, emails: string[]) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostId !== hostId) throw new ForbiddenException('Only the host can invite');

    const results: any[] = [];
    for (const email of emails) {
      let user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await this.prisma.user.create({
          data: { id: crypto.randomUUID(), email },
        });
      }

      const existing = await this.prisma.meetingParticipant.findUnique({
        where: { meetingId_userId: { meetingId, userId: user.id } },
      });

      if (!existing) {
        const participant = await this.prisma.meetingParticipant.create({
          data: {
            meetingId,
            userId: user.id,
            role: 'PARTICIPANT',
            status: 'INVITED',
          },
          include: { user: true },
        });
        results.push(participant);
      }
    }

    return results;
  }

  async join(code: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { code },
      include: { host: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.status === MeetingStatus.ENDED || meeting.status === MeetingStatus.CANCELLED) {
      throw new BadRequestException('Meeting is no longer active');
    }

    // Upsert participant
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.meetingParticipant.upsert({
      where: { meetingId_userId: { meetingId: meeting.id, userId } },
      create: {
        meetingId: meeting.id,
        userId,
        role: meeting.hostId === userId ? 'HOST' : 'PARTICIPANT',
        status: 'JOINED',
        joinedAt: new Date(),
      },
      update: {
        status: 'JOINED',
        joinedAt: new Date(),
      },
    });

    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
    const token = await this.livekitService.generateToken(
      meeting.livekitRoomName,
      userId,
      displayName,
      meeting.hostId === userId,
    );

    return {
      serverUrl: this.livekitService.getPublicUrl(),
      token,
      meeting,
    };
  }

  async endMeeting(meetingId: string, hostId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostId !== hostId) throw new ForbiddenException('Only the host can end this meeting');
    if (meeting.status === MeetingStatus.ENDED) {
      throw new BadRequestException('Meeting already ended');
    }

    // Delete room in LiveKit (kicks everyone, triggers room_finished webhook)
    await this.livekitService.deleteRoom(meeting.livekitRoomName);

    return { ended: true };
  }

  async getChatMessages(meetingId: string, userId: string, limit = 50, offset = 0) {
    // Verify user is a participant
    const participant = await this.prisma.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    return this.prisma.chatMessage.findMany({
      where: { meetingId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  async createChatMessage(meetingId: string, userId: string, content: string) {
    return this.prisma.chatMessage.create({
      data: { meetingId, userId, content },
      include: { user: true },
    });
  }
}
