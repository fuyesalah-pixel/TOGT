import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

/** Uses the authenticated user rooms created by ChatGateway. */
@WebSocketGateway({ path: '/api/socket.io', cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true } })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }
}
