import { BadRequestException, ForbiddenException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { hostname, loadavg, uptime, totalmem, freemem } from 'os';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, User } from '@prisma/client';
import { SystemProvider, UpdateMaintenanceDto, UpsertSystemKeyDto } from './dto/system-key.dto';
import { ChatGateway } from '../chat/chat.gateway';

const PROVIDERS = Object.values(SystemProvider);

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);
  private readonly startedAt = new Date();

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly gateway: ChatGateway) {}

  private assertTech(actor: User) {
    if (actor.role !== Role.TECH) throw new ForbiddenException('Tech access required');
  }

  private key() {
    const raw = this.config.get<string>('SYSTEM_CONFIG_ENCRYPTION_KEY');
    if (!raw) throw new ServiceUnavailableException('System encryption key is not configured');
    return createHash('sha256').update(raw).digest();
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  private decrypt(value: string) {
    const [iv, tag, encrypted] = value.split('.');
    if (!iv || !tag || !encrypted) throw new BadRequestException('Stored secret is invalid');
    const decipher = createDecipheriv('aes-256-gcm', this.key(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
  }

  private async audit(actor: User, action: string, target: string | undefined, outcome: string, metadata?: object) {
    await this.prisma.systemAuditLog.create({ data: { actorId: actor.id, action, target, outcome, metadata: metadata as never } });
  }

  async health(actor: User) {
    this.assertTech(actor);
    const database = await this.prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 as ok`.then(() => 'UP').catch(() => 'DOWN');
    const memoryUsed = totalmem() - freemem();
    return { status: database === 'UP' ? 'UP' : 'DEGRADED', host: hostname(), uptimeSeconds: uptime(), processUptimeSeconds: process.uptime(), startedAt: this.startedAt, cpu: { load1m: loadavg()[0], cores: loadavg().length }, memory: { usedBytes: memoryUsed, totalBytes: totalmem(), usedPercent: Math.round(memoryUsed / totalmem() * 100) }, database, valkey: this.config.get<string>('valkeyUrl') ? 'CONFIGURED' : 'MISSING', node: process.version, now: new Date() };
  }

  async metrics(actor: User) {
    this.assertTech(actor);
    const [users, activeUsers, requests, pendingBackups] = await Promise.all([
      this.prisma.user.count(), this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.serviceRequest.count({ where: { status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } } }),
      this.prisma.systemBackup.count({ where: { status: 'PENDING' } }),
    ]);
    return { activeUsers, users, activeRequests: requests, pendingBackups, requestRate: null, responseTimeMs: null, note: 'Request latency history is not available until the metrics collector is configured.' };
  }

  async providers(actor: User) {
    this.assertTech(actor);
    const rows = await this.prisma.systemSecret.findMany({ orderBy: { provider: 'asc' } });
    return PROVIDERS.map((provider) => { const row = rows.find((item) => item.provider === provider); return { provider, configured: !!row, enabled: row?.enabled ?? false, lastTestedAt: row?.lastTestedAt, lastTestStatus: row?.lastTestStatus, rotatedAt: row?.rotatedAt }; });
  }

  async upsertProvider(dto: UpsertSystemKeyDto, actor: User) {
    this.assertTech(actor);
    const result = await this.prisma.systemSecret.upsert({ where: { provider: dto.provider }, create: { provider: dto.provider, ciphertext: this.encrypt(dto.secret), enabled: dto.enabled ?? true }, update: { ciphertext: this.encrypt(dto.secret), enabled: dto.enabled ?? true, rotatedAt: new Date(), lastTestStatus: null } });
    await this.audit(actor, 'SYSTEM_SECRET_UPSERT', dto.provider, 'SUCCESS');
    return { provider: result.provider, configured: true, enabled: result.enabled, rotatedAt: result.rotatedAt };
  }

  async deleteProvider(provider: string, actor: User) {
    this.assertTech(actor);
    await this.prisma.systemSecret.delete({ where: { provider } }).catch(() => undefined);
    await this.audit(actor, 'SYSTEM_SECRET_DELETE', provider, 'SUCCESS');
    return { ok: true };
  }

  async testProvider(provider: string, actor: User) {
    this.assertTech(actor);
    const row = await this.prisma.systemSecret.findUnique({ where: { provider } });
    if (!row) throw new BadRequestException('Provider secret is not configured');
    let outcome = 'PASS';
    try { this.decrypt(row.ciphertext); } catch { outcome = 'FAIL'; }
    await this.prisma.systemSecret.update({ where: { provider }, data: { lastTestedAt: new Date(), lastTestStatus: outcome } });
    await this.audit(actor, 'SYSTEM_SECRET_TEST', provider, outcome);
    return { provider, status: outcome, testedAt: new Date() };
  }

  async maintenance(actor: User) {
    this.assertTech(actor);
    return this.prisma.systemMaintenance.findFirst({ orderBy: { updatedAt: 'desc' } });
  }

  async publicMaintenance() {
    const row = await this.prisma.systemMaintenance.findFirst({ orderBy: { updatedAt: 'desc' } });
    return { enabled: !!row?.enabled, message: row?.message ?? 'TOGT is temporarily unavailable for maintenance.', startsAt: row?.startsAt ?? null, endsAt: row?.endsAt ?? null };
  }

  async setMaintenance(dto: UpdateMaintenanceDto, actor: User) {
    this.assertTech(actor);
    const row = await this.prisma.systemMaintenance.findFirst();
    const result = row ? await this.prisma.systemMaintenance.update({ where: { id: row.id }, data: { enabled: dto.enabled, message: dto.message ?? row.message, startsAt: dto.startsAt ? new Date(dto.startsAt) : null, endsAt: dto.endsAt ? new Date(dto.endsAt) : null, updatedById: actor.id } }) : await this.prisma.systemMaintenance.create({ data: { enabled: dto.enabled, message: dto.message ?? 'TOGT is temporarily unavailable for maintenance.', startsAt: dto.startsAt ? new Date(dto.startsAt) : null, endsAt: dto.endsAt ? new Date(dto.endsAt) : null, updatedById: actor.id } });
    await this.audit(actor, 'SYSTEM_MAINTENANCE_SET', result.id, 'SUCCESS', { enabled: dto.enabled });
    this.gateway.broadcast('maintenance_mode_changed', { enabled: result.enabled, message: result.message, startsAt: result.startsAt, endsAt: result.endsAt });
    return result;
  }

  async logs(actor: User, level?: string, search?: string) {
    this.assertTech(actor);
    const path = this.config.get<string>('SYSTEM_LOG_PATH');
    if (!path || !existsSync(path)) return { available: false, entries: [], message: 'No allowlisted log file is configured.' };
    const lines = readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean).slice(-1000);
    const filtered = lines.filter((line) => (!level || line.toLowerCase().includes(level.toLowerCase())) && (!search || line.toLowerCase().includes(search.toLowerCase())));
    return { available: true, entries: filtered.slice(-200).map((message, index) => ({ id: index, level: /error|fatal/i.test(message) ? 'ERROR' : /warn/i.test(message) ? 'WARN' : 'INFO', message })) };
  }

  async backups(actor: User) { this.assertTech(actor); return this.prisma.systemBackup.findMany({ orderBy: { startedAt: 'desc' }, take: 50 }); }
  async backup(actor: User) { this.assertTech(actor); await this.audit(actor, 'SYSTEM_BACKUP_REQUEST', undefined, 'REJECTED', { reason: 'Host runner not configured' }); throw new ServiceUnavailableException('Backup host runner is not configured'); }
  async migrate(actor: User) { this.assertTech(actor); await this.audit(actor, 'SYSTEM_MIGRATE_REQUEST', undefined, 'REJECTED', { reason: 'Host runner not configured' }); throw new ServiceUnavailableException('Migration host runner is not configured'); }
  async services(actor: User) { this.assertTech(actor); return { available: false, services: [], message: 'Configure the restricted host runner to expose container state.' }; }
  async migrations(actor: User) { this.assertTech(actor); const count = await this.prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint as count FROM "_prisma_migrations"`.catch(() => [{ count: BigInt(0) }]); return { applied: Number(count[0]?.count ?? 0), runnerConfigured: false }; }
  async auditLogs(actor: User) { this.assertTech(actor); return this.prisma.systemAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }); }
  async version(actor: User) { this.assertTech(actor); return { version: process.env.APP_VERSION ?? 'local', commit: process.env.APP_COMMIT ?? 'unknown', node: process.version, environment: process.env.NODE_ENV ?? 'development' }; }
}
