import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TicketsReminderService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendDueReminders() {
    const now = Date.now();
    const windows = [
      { hours: 24, field: 'reminder24Sent' as const, title: 'Your flight is tomorrow' },
      { hours: 3, field: 'reminder3Sent' as const, title: 'Your flight is in 3 hours' },
    ];
    for (const window of windows) {
      const from = new Date(now + (window.hours - 0.5) * 60 * 60 * 1000);
      const to = new Date(now + (window.hours + 0.5) * 60 * 60 * 1000);
      const tickets = await this.prisma.ticket.findMany({ where: { status: 'CONFIRMED', departureAt: { gte: from, lt: to }, [window.field]: false }, include: { user: true } });
      for (const ticket of tickets) {
        await this.notifications.notifyUser(ticket.userId, { title: window.title, message: `${ticket.airline} ${ticket.flightNumber} departs from ${ticket.origin} to ${ticket.destination}. Ticket ${ticket.ticketNumber}.`, type: 'ALERT' });
        if (ticket.user.email) await this.notifications.sendEmail(ticket.user.email, window.title, `<p>${window.title}, ${ticket.user.fullName}.</p><p>Ticket ${ticket.ticketNumber}: ${ticket.origin} to ${ticket.destination}.</p>`);
        await this.prisma.ticket.update({ where: { id: ticket.id }, data: { [window.field]: true } });
      }
    }
  }
}
