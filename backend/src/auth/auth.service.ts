import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, ResetPasswordDto, OAuthCallbackDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  private mapUser(supabaseUser: any) {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      roleId: supabaseUser.app_metadata?.roleId ?? 3,
    };
  }

  /**
   * Upsert user into Prisma DB on every successful authentication.
   * Ensures every Supabase user has a matching local record.
   */
  private async upsertUser(supabaseUser: any) {
    const metadata = supabaseUser.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(' ') || null;

    await this.prisma.user.upsert({
      where: { id: supabaseUser.id },
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        firstName,
        lastName,
        avatarUrl: metadata.avatar_url || metadata.picture || null,
      },
      update: {
        email: supabaseUser.email,
      },
    });
  }

  async login(dto: LoginDto): Promise<any> {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signInWithPassword({ email: dto.email, password: dto.password });

    if (error || !data?.session) {
      throw new UnauthorizedException(error?.message ?? 'Invalid credentials');
    }

    await this.upsertUser(data.user);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: this.mapUser(data.user),
    };
  }

  async register(dto: RegisterDto): Promise<any> {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        app_metadata: { roleId: 3 },
        user_metadata: {
          full_name: [dto.firstName, dto.lastName].filter(Boolean).join(' '),
        },
      });

    if (error) {
      throw new HttpException(error.message, 400);
    }

    // Sign in immediately to get tokens
    const { data: sessionData, error: signInError } =
      await this.supabaseService
        .getClient()
        .auth.signInWithPassword({ email: dto.email, password: dto.password });

    if (signInError || !sessionData?.session) {
      throw new HttpException(
        signInError?.message ?? 'Registration succeeded but sign-in failed',
        400,
      );
    }

    await this.upsertUser(data.user);

    return {
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      user: this.mapUser(data.user),
    };
  }

  async oauthCallback(dto: OAuthCallbackDto): Promise<any> {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.getUser(dto.accessToken);

    if (error || !data?.user) {
      throw new UnauthorizedException('Invalid OAuth token');
    }

    // Ensure roleId is set in app_metadata for OAuth users
    if (!data.user.app_metadata?.roleId) {
      await this.supabaseService
        .getClient()
        .auth.admin.updateUserById(data.user.id, {
          app_metadata: { roleId: 3 },
        });
      data.user.app_metadata = { ...data.user.app_metadata, roleId: 3 };
    }

    await this.upsertUser(data.user);

    return {
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken || null,
      user: this.mapUser(data.user),
    };
  }

  async refreshToken(refreshTok: string): Promise<any> {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.refreshSession({ refresh_token: refreshTok });

    if (error || !data?.session) {
      throw new UnauthorizedException(
        error?.message ?? 'Invalid refresh token',
      );
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: this.mapUser(data.user),
    };
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    const { error } = await this.supabaseService
      .getClient()
      .auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });

    if (error) {
      return false;
    }
    return true;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<boolean> {
    const { data: userData, error: userError } = await this.supabaseService
      .getClient()
      .auth.getUser(dto.resetPasswordToken);

    if (userError || !userData?.user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const { error } = await this.supabaseService
      .getClient()
      .auth.admin.updateUserById(userData.user.id, {
        password: dto.newPassword,
      });

    if (error) {
      throw new HttpException(error.message, 400);
    }

    return true;
  }

  async getAuthUser(token: string): Promise<any> {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.getUser(token);

    if (error || !data?.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Also return the full profile from Prisma
    const profile = await this.prisma.user.findUnique({
      where: { id: data.user.id },
    });

    return {
      accessToken: token,
      user: {
        ...this.mapUser(data.user),
        ...(profile
          ? {
              firstName: profile.firstName,
              lastName: profile.lastName,
              avatarUrl: profile.avatarUrl,
              jobTitle: profile.jobTitle,
              company: profile.company,
              timezone: profile.timezone,
              language: profile.language,
            }
          : {}),
      },
    };
  }
}
