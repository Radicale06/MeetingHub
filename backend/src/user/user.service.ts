import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
        ...(dto.company !== undefined && { company: dto.company }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.language !== undefined && { language: dto.language }),
      },
    });
    return user;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const filePath = `avatars/${userId}/${Date.now()}-${file.originalname}`;

    const { error } = await this.supabaseService
      .getClient()
      .storage.from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = this.supabaseService
      .getClient()
      .storage.from('avatars')
      .getPublicUrl(filePath);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: urlData.publicUrl },
    });

    return user;
  }

  async removeAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.avatarUrl) {
      // Extract path from URL and delete from storage
      const path = user.avatarUrl.split('/avatars/').pop();
      if (path) {
        await this.supabaseService
          .getClient()
          .storage.from('avatars')
          .remove([path]);
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
  }
}
