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
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Chat gateway. Clients connect with the `togt_access` cookie; each user
 * joins the room `user:{id}` and receives `message:new` / `message:read`.
 */
@WebSocketGateway({
  path: '/api/socket.io',
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true },
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const cookieHeader = client.handshake.headers.cookie ?? '';
      const accessCookie = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('togt_access='));
      if (!accessCookie) {
        client.data.public = true;
        return;
      }

      const token = decodeURIComponent(accessCookie.slice('togt_access='.length));
      const payload = this.jwt.verify<{ sub: string; role: string }>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, status: true } });
      if (!user || user.status === 'TERMINATED') throw new Error('account unavailable');

      client.data.userId = user.id;
      client.data.role = user.role;
      await client.join(`user:${user.id}`);
      await client.join(`role:${user.role}`);
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

  broadcast(event: string, payload: unknown) {
    this.server?.emit(event, payload);
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, @MessageBody() payload: { toUserId?: string; isTyping?: boolean }) {
    if (!client.data.userId) return;
    if (!payload?.toUserId || typeof payload.isTyping !== 'boolean') return;
    this.emitToUser(payload.toUserId, 'typing', { fromUserId: client.data.userId, isTyping: payload.isTyping });
  }
}
