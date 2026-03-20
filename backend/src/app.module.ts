import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MeetingModule } from './meeting/meeting.module';
import { LiveKitModule } from './livekit/livekit.module';
import { GatewayModule } from './gateway/gateway.module';
import { RecordingModule } from './recording/recording.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    UserModule,
    MeetingModule,
    LiveKitModule,
    GatewayModule,
    RecordingModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
