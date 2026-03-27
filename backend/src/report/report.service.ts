import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import Redis from 'ioredis';

interface TranscriptEntry {
  speaker: string;
  speakerId: string;
  text: string;
  language: string;
  timestamp: number;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly redis: Redis;
  private readonly llmApiUrl: string;
  private readonly llmApiKey: string;
  private readonly llmModel: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {
    this.redis = new Redis(this.config.get<string>('REDIS_URL') || 'redis://localhost:6379');
    this.llmApiUrl = this.config.get('LLM_API_URL', 'https://api.openai.com/v1/chat/completions');
    this.llmApiKey = this.config.get('LLM_API_KEY', '');
    this.llmModel = this.config.get('LLM_MODEL', 'gpt-4o');
  }

  /**
   * Generate a meeting report from Redis transcript buffer.
   * Called after room_finished webhook.
   */
  async generateReport(meetingId: string): Promise<void> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { report: true },
    });

    if (!meeting) {
      this.logger.warn(`Meeting ${meetingId} not found, skipping report`);
      return;
    }

    if (meeting.report) {
      this.logger.log(`Report already exists for meeting ${meetingId}`);
      return;
    }

    const redisKey = `transcript:${meeting.livekitRoomName}`;

    // 1. Get all transcript entries from Redis
    const rawEntries = await this.redis.lrange(redisKey, 0, -1);
    if (!rawEntries.length) {
      this.logger.log(`No transcript data for meeting ${meetingId}, skipping report`);
      return;
    }

    const entries: TranscriptEntry[] = rawEntries.map((r) => JSON.parse(r));
    this.logger.log(`Found ${entries.length} transcript entries for meeting ${meetingId}`);

    // 2. Dump transcript to Supabase Storage as a temp file
    const tempPath = `temp-transcripts/${meetingId}.json`;
    const client = this.supabase.getClient();

    const { error: uploadError } = await client.storage
      .from('recordings')
      .upload(tempPath, JSON.stringify(entries, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError) {
      this.logger.error(`Failed to upload temp transcript for ${meetingId}`, uploadError);
      return;
    }

    // 3. Build transcript text for LLM
    const transcriptText = entries
      .map((e) => `[${e.speaker}]: ${e.text}`)
      .join('\n');

    // 4. Call LLM to generate report
    try {
      const report = await this.callLlm(meeting.title, transcriptText);

      // 5. Save report to database
      await this.prisma.meetingReport.create({
        data: {
          meetingId,
          summary: report.summary,
          keyTopics: report.keyTopics,
          actionItems: report.actionItems,
        },
      });

      this.logger.log(`Report generated for meeting ${meetingId}`);

      // 6. Delete temp transcript file from storage
      await client.storage.from('recordings').remove([tempPath]);
      this.logger.log(`Deleted temp transcript for ${meetingId}`);

      // 7. Delete transcript from Redis
      await this.redis.del(redisKey);
      this.logger.log(`Cleared Redis transcript for ${meetingId}`);
    } catch (error) {
      // Keep temp file on failure for retry
      this.logger.error(`Failed to generate report for ${meetingId}`, error);
    }
  }

  private async callLlm(
    meetingTitle: string,
    transcript: string,
  ): Promise<{ summary: string; keyTopics: string[]; actionItems: string[] }> {
    if (!this.llmApiKey) {
      this.logger.warn('No LLM API key configured, generating placeholder report');
      return {
        summary: `Meeting "${meetingTitle}" was conducted. Configure LLM_API_KEY to generate detailed reports.`,
        keyTopics: ['Meeting conducted'],
        actionItems: ['Configure AI report generation'],
      };
    }

    const prompt = `You are a meeting assistant. Analyze the following meeting transcript and generate a structured report.

Meeting title: "${meetingTitle}"

Transcript:
${transcript}

Respond with a JSON object containing exactly these fields:
- "summary": A 2-4 sentence summary of the meeting.
- "keyTopics": An array of the main topics discussed (3-8 items).
- "actionItems": An array of action items or follow-ups identified (0-10 items).

Respond ONLY with the JSON object, no other text.`;

    const response = await fetch(this.llmApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.llmApiKey}`,
      },
      body: JSON.stringify({
        model: this.llmModel,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: 'You are a meeting assistant. Respond only with valid JSON.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    try {
      return JSON.parse(content);
    } catch {
      return {
        summary: content,
        keyTopics: [],
        actionItems: [],
      };
    }
  }

  /**
   * Get report for a meeting (frontend endpoint)
   */
  async getReport(meetingId: string, userId: string) {
    const participant = await this.prisma.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    if (!participant) throw new ForbiddenException('Not a meeting participant');

    const report = await this.prisma.meetingReport.findUnique({
      where: { meetingId },
      include: {
        meeting: {
          select: { title: true, code: true, startedAt: true, endedAt: true },
        },
      },
    });
    if (!report) throw new NotFoundException('Report not yet available');

    return report;
  }

  /**
   * List all reports for a user
   */
  async listForUser(userId: string, limit = 20, offset = 0) {
    const [reports, total] = await Promise.all([
      this.prisma.meetingReport.findMany({
        where: {
          meeting: { participants: { some: { userId } } },
        },
        include: {
          meeting: {
            select: { id: true, title: true, code: true, startedAt: true, endedAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.meetingReport.count({
        where: {
          meeting: { participants: { some: { userId } } },
        },
      }),
    ]);

    return { reports, total };
  }
}
