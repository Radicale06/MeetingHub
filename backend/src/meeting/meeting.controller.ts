import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import {
  CreateInstantMeetingDto,
  ScheduleMeetingDto,
  UpdateMeetingDto,
  InviteDto,
  MeetingQueryDto,
} from './dto/meeting.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('meetings')
@ApiTags('meetings')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post('instant')
  createInstant(@Req() req: any, @Body() dto: CreateInstantMeetingDto) {
    return this.meetingService.createInstant(req.user.id, dto);
  }

  @Post('schedule')
  schedule(@Req() req: any, @Body() dto: ScheduleMeetingDto) {
    return this.meetingService.schedule(req.user.id, dto);
  }

  @Get()
  list(@Req() req: any, @Query() query: MeetingQueryDto) {
    return this.meetingService.listForUser(req.user.id, query);
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.meetingService.findByCode(code);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.meetingService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.meetingService.cancel(id, req.user.id);
  }

  @Post(':id/invite')
  invite(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: InviteDto,
  ) {
    return this.meetingService.invite(id, req.user.id, dto.emails);
  }

  @Post(':code/join')
  join(@Req() req: any, @Param('code') code: string) {
    return this.meetingService.join(code, req.user.id);
  }

  @Post(':id/end')
  endMeeting(@Req() req: any, @Param('id') id: string) {
    return this.meetingService.endMeeting(id, req.user.id);
  }

  @Get(':id/chat')
  getChatMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.meetingService.getChatMessages(id, req.user.id, limit, offset);
  }

  @Post(':id/chat')
  createChatMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.meetingService.createChatMessage(id, req.user.id, content);
  }
}
