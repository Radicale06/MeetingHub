import { Controller, Post, Req, RawBodyRequest, Logger } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { LiveKitService } from './livekit.service';
import { Request } from 'express';

@Controller('livekit')
@ApiTags('livekit')
export class LiveKitController {
  private readonly logger = new Logger(LiveKitController.name);

  constructor(private readonly livekitService: LiveKitService) {}

  @Post('webhook')
  @ApiExcludeEndpoint()
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const authHeader = req.headers['authorization'] as string;
    // LiveKit sends the body as raw text
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    try {
      await this.livekitService.handleWebhook(body, authHeader);
      return { received: true };
    } catch (error) {
      this.logger.error('Webhook handling failed', error);
      return { received: false, error: 'Invalid webhook' };
    }
  }
}
