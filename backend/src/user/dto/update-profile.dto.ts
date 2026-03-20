import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  jobTitle?: string;

  @ApiPropertyOptional()
  company?: string;

  @ApiPropertyOptional()
  timezone?: string;

  @ApiPropertyOptional()
  language?: string;
}
