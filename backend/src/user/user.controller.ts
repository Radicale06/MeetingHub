import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('user')
@ApiTags('user')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getProfile(@Req() req: any) {
    return this.userService.getProfile(req.user.id);
  }

  @Patch('me')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @Post('me/avatar')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.userService.uploadAvatar(req.user.id, file);
  }

  @Delete('me/avatar')
  removeAvatar(@Req() req: any) {
    return this.userService.removeAvatar(req.user.id);
  }
}
