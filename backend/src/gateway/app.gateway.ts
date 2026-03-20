import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SupabaseService } from '../supabase/supabase.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);
  private socketUserMap = new Map<string, string>(); // socketId → userId

  constructor(private readonly supabaseService: SupabaseService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .auth.getUser(token);

      if (error || !data?.user) {
        client.disconnect();
        return;
      }

      const userId = data.user.id;
      this.socketUserMap.set(client.id, userId);
      client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.socketUserMap.delete(client.id);
      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  /**
   * Send event to a specific user
   */
  sendToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /**
   * Send event to multiple users
   */
  sendToUsers(userIds: string[], event: string, payload: any) {
    for (const userId of userIds) {
      this.sendToUser(userId, event, payload);
    }
  }

  /**
   * Send to all participants of a meeting
   */
  async sendToMeetingParticipants(
    meetingId: string,
    event: string,
    payload: any,
    prisma: any,
  ) {
    const participants = await prisma.meetingParticipant.findMany({
      where: { meetingId },
      select: { userId: true },
    });
    const userIds = participants.map((p: any) => p.userId);
    this.sendToUsers(userIds, event, payload);
  }
}
