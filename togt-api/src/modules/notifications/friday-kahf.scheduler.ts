import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

/**
 * Friday (Jumu'ah) reminder: every Friday shortly before Dhuhr, active users
 * get a reminder to read Surat Al-Kahf — the sunnah for Jumu'ah. Time comes
 * from the FRIDAY_KAHF_HOUR/FRIDAY_KAHF_MINUTE env vars (default 11:30
 * Africa/Addis_Ababa, one hour before Jumu'ah prayer) so it stays close to
 * the local prayer time without hardcoding a city.
 */
@Injectable()
export class FridayKahfScheduler {
  private readonly logger = new Logger(FridayKahfScheduler.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  @Cron('* * * * *', { name: 'friday-kahf-tick', timeZone: 'UTC' })
  async tick() {
    if (this.running) return;
    const timezone = process.env.FRIDAY_KAHF_TZ ?? 'Africa/Addis_Ababa';
    const targetHour = Number(process.env.FRIDAY_KAHF_HOUR ?? 11);
    const targetMinute = Number(process.env.FRIDAY_KAHF_MINUTE ?? 30);
    if (!Number.isInteger(targetHour) || !Number.isInteger(targetMinute)) return;

    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    if (get('weekday').toLowerCase() !== 'fri') return;
    if (parseInt(get('hour'), 10) !== targetHour || parseInt(get('minute'), 10) !== targetMinute) return;

    this.running = true;
    try {
      const users = await this.prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, role: true },
      });
      // Mobile push is for the traveling community — staff receive the
      // in-app/e-mail copy but the phone reminder targets customers.
      const recipients = users.filter((user) => user.role === Role.CUSTOMER);
      const title = "Jumu'ah Mubarak 🕌";
      const message =
        'It is Friday — recite Surat Al-Kahf today. "Whoever recites Surat Al-Kahf on Friday, light will shine for him between the two Fridays."';
      for (const user of users) {
        await this.notifications
          .notifyUser(user.id, { title, message, type: 'SYSTEM', channel: 'IN_APP' })
          .catch(() => undefined);
      }
      const pushed = await this.push.sendToUsersWhereIn(recipients.map((user) => user.id), title, message, { kind: 'friday_kahf' });
      this.logger.log(`Friday Al-Kahf reminder sent to ${users.length} users (push delivered to ${pushed})`);
    } catch (error) {
      this.logger.error(`Friday reminder failed: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
