import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RecordingService } from './recording.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('recordings')
@ApiTags('recordings')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
export class RecordingController {
  constructor(private readonly recordingService: RecordingService) {}

  @Get()
  list(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.recordingService.listForUser(req.user.id, limit, offset);
  }

  @Get(':id/url')
  getUrl(@Req() req: any, @Param('id') id: string) {
    return this.recordingService.getSignedUrl(id, req.user.id);
  }
}
