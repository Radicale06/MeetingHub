import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { SupabaseModule } from '../supabase/supabase.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [SupabaseModule, PrismaModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
