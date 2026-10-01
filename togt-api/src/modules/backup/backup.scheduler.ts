import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BackupService } from './backup.service';

/**
 * Runs the scheduled automatic backup. The cron expression and timezone come
 * from the BackupSchedule table (default: 02:00 Africa/Addis_Ababa daily);
 * @nestjs/schedule re-evaluates the decorated method against this dynamic
 * expression on every tick of its internal minute-interval scheduler.
 */
@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger(BackupScheduler.name);
  private running = false;

  constructor(private readonly backups: BackupService) {}

  // The decorator needs a literal; the service reads the live expression from
  // the schedule table at execution time and decides whether the current
  // minute matches (see `shouldRunNow`).
  @Cron('* * * * *', { name: 'backup-schedule-tick', timeZone: 'UTC' })
  async tick() {
    if (this.running) return;
    let schedule;
    try {
      schedule = await this.backups.getSchedule();
    } catch {
      return; // DB not ready; skip silently
    }
    if (!schedule.enabled) return;
    if (!this.matchesCron(schedule.cron, schedule.timezone)) return;

    this.running = true;
    try {
      this.logger.log(`Scheduled backup starting (cron ${schedule.cron} ${schedule.timezone})`);
      await this.backups.runScheduledBackup();
    } catch (error) {
      this.logger.error(`Scheduled backup failed: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  /** Minimal cron matcher for "m h dom mon dow" supporting *, step, list and range fields. */
  private matchesCron(cron: string, timezone: string): boolean {
    const nowParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      minute: '2-digit', hour: '2-digit', day: '2-digit', month: '2-digit',
      weekday: 'short', hour12: false,
    }).formatToParts(new Date());
    const get = (type: string) => nowParts.find((p) => p.type === type)?.value ?? '';
    const minute = parseInt(get('minute'), 10);
    const hour = parseInt(get('hour'), 10);
    const dom = parseInt(get('day'), 10);
    const month = parseInt(get('month'), 10);
    const weekdayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dow = weekdayNames.indexOf(get('weekday').toLowerCase());

    const fields = cron.trim().split(/\s+/);
    if (fields.length !== 5) return false;
    const [m, h, domF, monF, dowF] = fields;
    const matchField = (field: string, value: number, max: number) => {
      return field.split(',').some((part) => {
        if (part === '*') return true;
        if (part.startsWith('*/')) {
          const step = parseInt(part.slice(2), 10);
          return Number.isInteger(step) && step > 0 && value % step === 0;
        }
        if (part.includes('-')) {
          const [lo, hi] = part.split('-').map(Number);
          return value >= lo && value <= hi;
        }
        const num = Number(part);
        return Number.isInteger(num) && num >= 0 && num <= max && num === value;
      });
    };
    if (!matchField(m, minute, 59)) return false;
    if (!matchField(h, hour, 23)) return false;
    // Standard cron OR-rule for day-of-month / day-of-week when both are restricted.
    const domRestricted = domF !== '*';
    const dowRestricted = dowF !== '*';
    if (domRestricted && dowRestricted) {
      if (!matchField(domF, dom, 31) && !matchField(dowF, dow, 6)) return false;
    } else {
      if (domRestricted && !matchField(domF, dom, 31)) return false;
      if (dowRestricted && !matchField(dowF, dow, 6)) return false;
    }
    if (!matchField(monF, month, 12)) return false;
    return true;
  }
}
