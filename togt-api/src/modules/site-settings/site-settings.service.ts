import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSiteSettingsDto } from './dto/site-settings.dto';

const ALLOWED_KEYS = ['OKRA_LINK', 'OKRA_IMAGE', 'TICKETING_ENABLED', 'ABOUT_VIDEO_URL', 'ABOUT_TEXT'] as const;
export type SiteSettingKey = (typeof ALLOWED_KEYS)[number];

const DEFAULTS: Record<SiteSettingKey, string> = {
  OKRA_LINK: 'https://okratech.et',
  OKRA_IMAGE: '',
  TICKETING_ENABLED: 'true',
  ABOUT_VIDEO_URL: '',
  ABOUT_TEXT: '',
};

const PUBLIC_KEYS: SiteSettingKey[] = ['OKRA_LINK', 'OKRA_IMAGE', 'TICKETING_ENABLED', 'ABOUT_VIDEO_URL', 'ABOUT_TEXT'];

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);
  constructor(private readonly prisma: PrismaService) {}

  /** Public read: no auth required (used by the website footer/home page). */
  async publicSettings() {
    const rows = await this.prisma.siteSetting.findMany({ where: { key: { in: PUBLIC_KEYS } } });
    const map = new Map(rows.map((row) => [row.key, row.value]));
    return Object.fromEntries(PUBLIC_KEYS.map((key) => [key, map.get(key) ?? DEFAULTS[key]])) as Record<SiteSettingKey, string>;
  }

  /** Admin/TECH full read including updater metadata. */
  async listSettings(actor: User) {
    if (actor.role !== Role.ADMIN && actor.role !== Role.TECH) throw new ForbiddenException('Admin access required');
    const rows = await this.prisma.siteSetting.findMany();
    const map = new Map(rows.map((row) => [row.key, row]));
    return ALLOWED_KEYS.map((key) => ({
      key,
      value: map.get(key)?.value ?? DEFAULTS[key],
      updatedAt: map.get(key)?.updatedAt ?? null,
      updatedBy: map.get(key)?.updatedById ?? null,
    }));
  }

  async updateSettings(dto: UpdateSiteSettingsDto, actor: User) {
    if (actor.role !== Role.ADMIN && actor.role !== Role.TECH) throw new ForbiddenException('Admin access required');
    const unknown = dto.settings.filter((item) => !(ALLOWED_KEYS as readonly string[]).includes(item.key));
    if (unknown.length) throw new BadRequestException(`Unknown setting keys: ${unknown.map((item) => item.key).join(', ')}`);
    for (const item of dto.settings) {
      if (item.key === 'TICKETING_ENABLED' && !['true', 'false'].includes(item.value)) {
        throw new BadRequestException('TICKETING_ENABLED must be "true" or "false"');
      }
      await this.prisma.siteSetting.upsert({
        where: { key: item.key },
        create: { key: item.key, value: item.value, updatedById: actor.id },
        update: { value: item.value, updatedById: actor.id },
      });
    }
    this.logger.log(`Site settings updated by ${actor.email}: ${dto.settings.map((item) => item.key).join(', ')}`);
    return this.publicSettings();
  }
}
