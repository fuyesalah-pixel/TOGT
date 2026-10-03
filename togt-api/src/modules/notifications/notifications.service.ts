import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType, User } from '@prisma/client';
import { Resend } from 'resend';
import { createTransport, Transporter } from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { NotificationsGateway } from './notifications.gateway';
import { CredentialService } from '../system/credential.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly hostinger: Transporter | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly gateway: NotificationsGateway,
    private readonly credentials: CredentialService,
  ) {
    const smtpUser = this.config.get<string>('hostingerSmtp.user');
    const smtpPassword = this.config.get<string>('hostingerSmtp.password');
    this.hostinger = smtpUser && smtpPassword ? createTransport({ host: this.config.get<string>('hostingerSmtp.host'), port: this.config.get<number>('hostingerSmtp.port') ?? 465, secure: (this.config.get<number>('hostingerSmtp.port') ?? 465) === 465, auth: { user: smtpUser, pass: smtpPassword } }) : null;
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
        if (channels.includes('EMAIL') && user.email) {
          // Prefer Resend (when configured) so bulk email actually delivers;
          // fall back to the Hostinger SMTP mailbox otherwise.
          const resent = await this.sendEmail(user.email, dto.title, `<p>${dto.message}</p>`);
          if (!resent) await this.sendAdminEmail(user.email, dto.title, `<p>${dto.message}</p>`);
        }
        if (channels.includes('SMS') && user.phone) {
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

  /**
   * TECH/ADMIN: send a test email to verify the delivery stack. Tries Resend
   * first (same path as bulk email), then the Hostinger SMTP mailbox, and
   * reports which provider actually delivered.
   */
  async sendTestEmail(to: string | undefined, actor: User) {
    const recipient = to?.trim() || actor.email;
    const subject = 'TOGT email delivery test';
    const html = `<p>This is a test email from the TOGT platform, requested by ${actor.fullName}.</p><p>If you received this message, email delivery is working correctly.</p>`;
    const resent = await this.sendEmail(recipient, subject, html);
    if (resent) return { ok: true, provider: 'resend', to: recipient };
    if (!this.hostinger) {
      this.logger.warn(`[email:test] no provider configured; nothing delivered to=${recipient}`);
      return { ok: false, provider: 'none', to: recipient };
    }
    await this.sendAdminEmail(recipient, subject, html);
    return { ok: true, provider: 'smtp', to: recipient };
  }

  /** Resend email — returns false (logged) when RESEND_API_KEY is not configured. */
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const apiKey = await this.credentials.get('RESEND');
    if (!apiKey) {
      this.logger.log(`[email:skipped] to=${to} subject="${subject}"`);
      return false;
    }
    try {
      const result = await new Resend(apiKey).emails.send({
        from: this.config.get<string>('resend.from') ?? 'TOGT <noreply@togttrading.com>',
        to,
        subject,
        html,
      });
      if (result.error) {
        this.logger.warn(`[email:failed] to=${to}: ${result.error.message}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(`[email:failed] to=${to}: ${(err as Error).message}`);
      return false;
    }
  }

  /** Admin/manual delivery through the Hostinger mailbox, never Resend. */
  async sendAdminEmail(to: string, subject: string, html: string) {
    if (!this.hostinger) { this.logger.warn(`[smtp:skipped] Hostinger SMTP credentials are not configured; to=${to}`); return; }
    try { await this.hostinger.sendMail({ from: this.config.get<string>('hostingerSmtp.from') || this.config.get<string>('hostingerSmtp.user'), to, subject, html }); }
    catch (err) { this.logger.warn(`[smtp:failed] to=${to}: ${(err as Error).message}`); }
  }

  /** SMSEthiopia SMS — no-op (logged) when SMS_ETHIOPIA_TOKEN is not configured. */
  async sendSms(phone: string, message: string) {
    const token = await this.credentials.get('SMS_ETHIOPIA');
    if (!token) {
      this.logger.log(`[sms:skipped] to=${phone} message="${message}"`);
      return;
    }
    try {
      await fetch('https://api.smsethiopia.com/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: phone, message, sender_id: this.config.get<string>('sms.senderId') ?? 'TOGT' }),
      });
    } catch (err) {
      this.logger.warn(`[sms:failed] to=${phone}: ${(err as Error).message}`);
    }
  }
}
