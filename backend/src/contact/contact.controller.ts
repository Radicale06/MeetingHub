import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { AddContactDto } from './dto/contact.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('contacts')
@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  list(@Req() req: any) {
    return this.contactService.listForUser(req.user.id);
  }

  @Post()
  add(@Req() req: any, @Body() dto: AddContactDto) {
    return this.contactService.addContact(req.user.id, dto.email, dto.nickname);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.contactService.removeContact(req.user.id, id);
  }
}
