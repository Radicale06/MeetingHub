import { Module } from '@nestjs/common';
import { RecordingService } from './recording.service';
import { RecordingController } from './recording.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [RecordingController],
  providers: [RecordingService],
  exports: [RecordingService],
})
export class RecordingModule {}
