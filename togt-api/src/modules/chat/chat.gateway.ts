import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  SubscribeMessage,
  MessageBody,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Chat gateway. Clients connect with the `togt_access` cookie; each user
 * joins the room `user:{id}` and receives `message:new` / `message:read`.
 */
@WebSocketGateway({
  path: '/api/socket.io',
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const cookieHeader = client.handshake.headers.cookie ?? '';
      const accessCookie = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('togt_access='));
      if (!accessCookie) throw new Error('missing auth cookie');

      const token = decodeURIComponent(accessCookie.slice('togt_access='.length));
      const payload = this.jwt.verify<{ sub: string; role: string }>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });

      client.data.userId = payload.sub;
      client.data.role = payload.role;
      await client.join(`user:${payload.sub}`);
      await client.join(`role:${payload.role}`);
      this.logger.debug(`Socket connected: user ${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToRole(role: string, event: string, payload: unknown) {
    this.server.to(`role:${role}`).emit(event, payload);
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, @MessageBody() payload: { toUserId?: string; isTyping?: boolean }) {
    if (!payload?.toUserId || typeof payload.isTyping !== 'boolean') return;
    this.emitToUser(payload.toUserId, 'typing', { fromUserId: client.data.userId, isTyping: payload.isTyping });
  }
}
