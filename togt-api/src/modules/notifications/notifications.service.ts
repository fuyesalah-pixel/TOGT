import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import { Resend } from 'resend';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly gateway: NotificationsGateway,
  ) {
    const apiKey = this.config.get<string>('resend.apiKey');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  findForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }

  /** Create an in-app notification for a single user. */
  async notifyUser(
    userId: string,
    data: { title: string; message: string; type: NotificationType; channel?: string; payload?: unknown },
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        channel: data.channel ?? 'IN_APP',
        data: data.payload as any,
      },
    });
    this.gateway.emitToUser(userId, 'newNotification', notification);
    return notification;
  }

  async sendBulk(dto: BulkNotificationDto) {
    const channel = dto.channel ?? 'IN_APP';
    let userIds = dto.userIds ?? [];
    if (dto.target === 'individual') userIds = userIds.slice(0, 1);
    if (dto.target === 'group' && dto.groupId) {
      const group = await this.prisma.group.findUnique({ where: { id: dto.groupId }, select: { members: { select: { userId: true } } } });
      userIds = group?.members.map((member) => member.userId) ?? [];
    } else if (dto.target === 'service_type' && dto.serviceType) {
      const users = await this.prisma.user.findMany({ where: { status: 'ACTIVE', serviceRequests: { some: { serviceType: dto.serviceType } } }, select: { id: true } });
      userIds = users.map((user) => user.id);
    } else if (dto.target === 'role' && dto.role) {
      const users = await this.prisma.user.findMany({ where: { status: 'ACTIVE', role: dto.role }, select: { id: true } });
      userIds = users.map((user) => user.id);
    } else if ((dto.target === 'all' || !dto.target) && userIds.length === 0) {
      const users = await this.prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
      userIds = users.map((user) => user.id);
    }
    userIds = [...new Set(userIds)];

    const result = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        channel,
      })),
    });

    for (const userId of userIds) {
      this.gateway.emitToUser(userId, 'newNotification', { title: dto.title, message: dto.message, type: dto.type, channel });
    }

    // Best-effort external delivery
    const channels = channel.split(',').map((value) => value.trim().toUpperCase());
    if (channels.includes('EMAIL') || channels.includes('SMS')) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { email: true, phone: true },
      });
      for (const user of users) {
        if (channels.includes('EMAIL')) {
          await this.sendEmail(user.email, dto.title, `<p>${dto.message}</p>`);
        } else if (channels.includes('SMS') && user.phone) {
          await this.sendSms(user.phone, `${dto.title}: ${dto.message}`);
        }
      }
    }

    return { sent: result.count };
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } }).then((unreadCount) => ({ unreadCount }));
  }

  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) throw new NotFoundException('Notification not found');
    return this.prisma.notification.delete({ where: { id } });
  }

  async clearAll(userId: string) {
    await this.prisma.notification.deleteMany({ where: { userId } });
    return { ok: true };
  }

  async confirmDevice(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({ where: { id }, data: { isRead: true, data: { ...(notification.data as object ?? {}), confirmed: true } } });
  }

  /** Resend email — no-op (logged) when RESEND_API_KEY is not configured. */
  async sendEmail(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.logger.log(`[email:skipped] to=${to} subject="${subject}"`);
      return;
    }
    try {
      await this.resend.emails.send({
        from: this.config.get<string>('resend.from') ?? 'TOGT <noreply@togt.com>',
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.warn(`[email:failed] to=${to}: ${(err as Error).message}`);
    }
  }

  /** SMSEthiopia SMS — no-op (logged) when SMS_ETHIOPIA_TOKEN is not configured. */
  async sendSms(phone: string, message: string) {
    const token = this.config.get<string>('sms.token');
    if (!token) {
      this.logger.log(`[sms:skipped] to=${phone} message="${message}"`);
      return;
    }
    try {
      await fetch('https://api.smsethiopia.com/v1/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: phone, message }),
      });
    } catch (err) {
      this.logger.warn(`[sms:failed] to=${phone}: ${(err as Error).message}`);
    }
  }
}
