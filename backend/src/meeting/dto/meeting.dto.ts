import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInstantMeetingDto {
  @ApiPropertyOptional()
  title?: string;
}

export class ScheduleMeetingDto {
  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  scheduledAt: string; // ISO date string

  @ApiPropertyOptional({ type: [String] })
  inviteeEmails?: string[];
}

export class UpdateMeetingDto {
  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  scheduledAt?: string;
}

export class InviteDto {
  @ApiProperty({ type: [String] })
  emails: string[];
}

export class MeetingQueryDto {
  @ApiPropertyOptional({ enum: ['upcoming', 'past', 'all'] })
  filter?: 'upcoming' | 'past' | 'all';

  @ApiPropertyOptional()
  limit?: number;

  @ApiPropertyOptional()
  offset?: number;
}
