import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RecordingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async listForUser(userId: string, limit = 20, offset = 0) {
    const [recordings, total] = await Promise.all([
      this.prisma.recording.findMany({
        where: {
          meeting: {
            participants: { some: { userId } },
          },
          status: 'READY',
        },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              code: true,
              startedAt: true,
              endedAt: true,
              host: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.recording.count({
        where: {
          meeting: { participants: { some: { userId } } },
          status: 'READY',
        },
      }),
    ]);

    return { recordings, total };
  }

  async getSignedUrl(recordingId: string, userId: string) {
    const recording = await this.prisma.recording.findUnique({
      where: { id: recordingId },
      include: {
        meeting: {
          include: { participants: true },
        },
      },
    });

    if (!recording) throw new NotFoundException('Recording not found');

    const isParticipant = recording.meeting.participants.some(
      (p) => p.userId === userId,
    );
    if (!isParticipant) throw new ForbiddenException('Not a meeting participant');

    const client = this.supabase.getClient();
    const { data, error } = await client.storage
      .from('recordings')
      .createSignedUrl(recording.storagePath, 3600); // 1 hour

    if (error) throw new NotFoundException('Recording file not available');

    return { url: data.signedUrl, recording };
  }
}
