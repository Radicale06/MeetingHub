import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('reports')
@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  list(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.reportService.listForUser(req.user.id, limit, offset);
  }

  @Get('meeting/:meetingId')
  getByMeeting(@Req() req: any, @Param('meetingId') meetingId: string) {
    return this.reportService.getReport(meetingId, req.user.id);
  }
}
