import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async listForUser(userId: string) {
    return this.prisma.contact.findMany({
      where: { ownerId: userId },
      include: {
        contactUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            jobTitle: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addContact(ownerId: string, email: string, nickname?: string) {
    const contactUser = await this.prisma.user.findUnique({ where: { email } });
    if (!contactUser) {
      throw new NotFoundException('No user found with that email');
    }
    if (contactUser.id === ownerId) {
      throw new BadRequestException('You cannot add yourself as a contact');
    }

    const existing = await this.prisma.contact.findUnique({
      where: { ownerId_contactUserId: { ownerId, contactUserId: contactUser.id } },
    });
    if (existing) {
      throw new ConflictException('Contact already exists');
    }

    return this.prisma.contact.create({
      data: {
        ownerId,
        contactUserId: contactUser.id,
        nickname: nickname || null,
      },
      include: {
        contactUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            jobTitle: true,
            company: true,
          },
        },
      },
    });
  }

  async removeContact(ownerId: string, contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });
    if (!contact || contact.ownerId !== ownerId) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.contact.delete({ where: { id: contactId } });
    return { deleted: true };
  }
}
