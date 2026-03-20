import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
