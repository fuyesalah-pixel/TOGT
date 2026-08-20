import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadsService } from '../uploads/uploads.service';
import { safeUserSelect } from '../users/users.service';
import { ChatGateway } from './chat.gateway';

const ITEMS_PER_PAGE = 30;

export interface ConversationQuery {
  page?: number;
  search?: string;
  filter?: 'all' | 'unread' | 'read';
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly uploads: UploadsService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly gateway: ChatGateway,
  ) {}

  async getWorkers() {
    return this.prisma.user.findMany({
      where: { status: 'ACTIVE', role: { in: [Role.WORKER, Role.ADMIN] } },
      select: safeUserSelect,
      orderBy: { fullName: 'asc' },
    });
  }

  async getUnreadCount(actor: User) {
    const where = actor.role === Role.CUSTOMER
      ? { receiverId: actor.id, isRead: false }
      : { sender: { role: Role.CUSTOMER }, isRead: false };
    return { unreadCount: await this.prisma.chatMessage.count({ where }) };
  }

  async start(user: User, receiverId?: string, channel: 'support' | 'worker' = 'support') {
    if (user.role !== Role.CUSTOMER) throw new ForbiddenException('Only customers start support conversations');
    const worker = receiverId
      ? await this.prisma.user.findFirst({ where: { id: receiverId, status: 'ACTIVE', role: { in: [Role.WORKER, Role.ADMIN] } } })
      : await this.prisma.user.findFirst({ where: { status: 'ACTIVE', role: { in: [Role.WORKER, Role.ADMIN] } }, orderBy: { createdAt: 'asc' } });
    if (!worker) throw new NotFoundException('No support worker is available');

    const existing = await this.prisma.conversation.findFirst({
      where: { customerId: user.id, channel: 'support' },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        customerId: user.id,
        workerId: worker.id,
        channel: 'support',
        messages: { create: { senderId: worker.id, receiverId: user.id, message: 'Hello! How can we help you today?' } },
      },
      include: { customer: { select: safeUserSelect }, worker: { select: safeUserSelect } },
    });
  }

  /** Lists all active customers for workers, including customers with no messages yet. */
  async getConversations(actor: User, query: ConversationQuery = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const filter = query.filter ?? 'all';
    const search = query.search?.trim().toLowerCase();
    const customers = actor.role === Role.CUSTOMER
      ? [await this.prisma.user.findUnique({ where: { id: actor.id }, select: safeUserSelect })].filter(Boolean)
      : await this.prisma.user.findMany({ where: { role: Role.CUSTOMER, status: 'ACTIVE' }, select: safeUserSelect, orderBy: { fullName: 'asc' } });

    const summaries = [] as Array<{ user: NonNullable<typeof customers[number]>; lastMessage: any; unreadCount: number; updatedAt: Date }>;
    for (const customer of customers) {
      if (!customer) continue;
      const conversation = await this.prisma.conversation.findFirst({
        where: actor.role === Role.CUSTOMER
          ? { customerId: actor.id, channel: 'support' }
          : { customerId: customer.id, channel: 'support' },
        include: { worker: { select: safeUserSelect }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { updatedAt: 'desc' },
      });
      if (actor.role === Role.CUSTOMER && !conversation) continue;
      const otherUser = actor.role === Role.CUSTOMER
        ? conversation?.worker && { ...conversation.worker, fullName: 'TOGT Support' }
        : customer;
      if (!otherUser) continue;
      const lastMessage = conversation?.messages[0] ?? null;
      const unreadCount = await this.prisma.chatMessage.count({ where: { conversationId: conversation?.id, senderId: customer.id, isRead: false } });
      if (filter === 'unread' && unreadCount === 0) continue;
      if (filter === 'read' && unreadCount > 0) continue;
      if (search && !`${otherUser.fullName} ${otherUser.email}`.toLowerCase().includes(search)) continue;
      summaries.push({ user: otherUser, lastMessage, unreadCount, updatedAt: conversation?.updatedAt ?? otherUser.createdAt });
    }

    summaries.sort((a, b) => b.unreadCount - a.unreadCount || b.updatedAt.getTime() - a.updatedAt.getTime() || a.user.fullName.localeCompare(b.user.fullName));
    const total = summaries.length;
    const data = summaries.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map(({ updatedAt: _updatedAt, ...summary }) => summary);
    return { data, total, page, limit: ITEMS_PER_PAGE, totalPages: Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)) };
  }

  async getMessages(actor: User, otherUserId: string) {
    const customerId = actor.role === Role.CUSTOMER ? actor.id : otherUserId;
    const sharedConversation = await this.prisma.conversation.findFirst({
      where: { customerId, channel: 'support' },
    });
    if (sharedConversation) {
      return this.prisma.chatMessage.findMany({
        where: { conversationId: sharedConversation.id },
        include: { sender: { select: { id: true, fullName: true, role: true } } },
        orderBy: { createdAt: 'asc' },
        take: 200,
      });
    }
    return this.prisma.chatMessage.findMany({
      where: { OR: [{ senderId: actor.id, receiverId: otherUserId }, { senderId: otherUserId, receiverId: actor.id }] },
      include: { sender: { select: { id: true, fullName: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async send(sender: User, receiverId: string, message: string | undefined, file?: Express.Multer.File) {
    if (receiverId === sender.id) throw new BadRequestException('Cannot message yourself');
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw new NotFoundException('Recipient not found');
    const fileUrl = file ? await this.uploads.upload(file, 'chat') : undefined;
    if (!message?.trim() && !fileUrl) throw new BadRequestException('Message or file is required');

    const customerId = sender.role === Role.CUSTOMER ? sender.id : receiver.id;
    const workerId = sender.role === Role.CUSTOMER ? undefined : sender.id;
    let conversation = await this.prisma.conversation.findFirst({ where: { customerId, channel: 'support' } });
    if (!conversation) {
      const supportWorker = workerId ? sender : await this.prisma.user.findFirst({ where: { role: { in: [Role.WORKER, Role.ADMIN] }, status: 'ACTIVE' }, orderBy: { createdAt: 'asc' } });
      if (!supportWorker) throw new NotFoundException('No support worker is available');
      conversation = await this.prisma.conversation.create({ data: { customerId, workerId: supportWorker.id, channel: 'support' } });
    }
    const actualReceiverId = sender.role === Role.CUSTOMER ? conversation.workerId : customerId;
    if (!actualReceiverId) throw new NotFoundException('No support worker is available');
    await this.prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

    const created = await this.prisma.chatMessage.create({
      data: { conversationId: conversation.id, senderId: sender.id, receiverId: actualReceiverId, message: message?.trim() ?? '', fileUrl, fileType: file?.mimetype },
      include: { sender: { select: { id: true, fullName: true, role: true } } },
    });
    if (sender.role === Role.CUSTOMER) {
      this.gateway.emitToRole(Role.WORKER, 'newCustomerMessage', created);
      this.gateway.emitToRole(Role.ADMIN, 'newCustomerMessage', created);
    } else {
      this.gateway.emitToUser(customerId, 'newWorkerReply', created);
      this.gateway.emitToRole(Role.WORKER, 'workerReplied', created);
      this.gateway.emitToRole(Role.ADMIN, 'workerReplied', created);
    }
    this.gateway.emitToUser(actualReceiverId, 'message:new', created);
    this.gateway.emitToUser(actualReceiverId, 'newMessage', created);
    await this.notifications.notifyUser(customerId === sender.id ? actualReceiverId : customerId, { title: `New message from ${sender.role === Role.CUSTOMER ? 'a customer' : 'TOGT Support'}`, message: message?.trim()?.slice(0, 120) || 'Sent you a file', type: 'CHAT_MESSAGE' });
    return created;
  }

  async markRead(id: string, user: User) {
    const message = await this.prisma.chatMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Message not found');
    const supportWorker = user.role === Role.WORKER || user.role === Role.ADMIN;
    if (message.receiverId !== user.id && !supportWorker) throw new ForbiddenException('Not your message');
    const updated = await this.prisma.chatMessage.update({ where: { id }, data: { isRead: true } });
    this.gateway.emitToUser(message.senderId, 'message:read', { id, readerId: user.id });
    this.gateway.emitToUser(message.senderId, 'readReceipt', { id, readerId: user.id });
    return updated;
  }

  uploadAttachment(file: Express.Multer.File) {
    return this.uploads.upload(file, 'chat');
  }
}
