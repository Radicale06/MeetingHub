import { Module } from '@nestjs/common';
import { LiveKitService } from './livekit.service';
import { LiveKitController } from './livekit.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { ReportModule } from '../report/report.module';

@Module({
  imports: [PrismaModule, SupabaseModule, ReportModule],
  controllers: [LiveKitController],
  providers: [LiveKitService],
  exports: [LiveKitService],
})
export class LiveKitModule {}
