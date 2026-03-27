import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateInstantMeetingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}

export class ScheduleMeetingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty()
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  inviteeEmails?: string[];
}

export class UpdateMeetingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class InviteDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  emails: string[];
}

export class CreateChatMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}

export class MeetingQueryDto {
  @ApiPropertyOptional({ enum: ['upcoming', 'past', 'all'] })
  @IsOptional()
  @IsEnum(['upcoming', 'past', 'all'])
  filter?: 'upcoming' | 'past' | 'all';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
