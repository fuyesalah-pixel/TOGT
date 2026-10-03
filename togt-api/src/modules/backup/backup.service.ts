import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { spawn } from 'child_process';
import { closeSync, createReadStream, createWriteStream, existsSync, mkdirSync, openSync, readSync, statSync, unlinkSync } from 'fs';
import { copyFile } from 'fs/promises';
import { join } from 'path';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramBackupService } from '../telegram/telegram-backup.service';
import { CredentialService } from '../system/credential.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { UpdateScheduleDto } from './dto/schedule.dto';

const BACKUP_ROLES: Role[] = [Role.ADMIN, Role.TECH];
const RESTORE_ROLES: Role[] = [Role.TECH];

/**
 * Database backup engine.
 *
 * Produces gzip-compressed pg_dump artifacts into BACKUP_DIR (default
 * /tmp/togt-backups inside the API container), records every run in the
 * `Backup` table and notifies the Telegram backup bot on success/failure.
 *
 * pg_dump runs against DATABASE_URL. The production image ships
 * postgresql-client (see togt-api/Dockerfile); when the binary is missing —
 * e.g. a local dev machine — the run fails with a clear message instead of
 * hanging, and Telegram still gets the failure notification.
 */
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly telegram: TelegramBackupService,
    private readonly credentials: CredentialService,
  ) {
    this.backupDir = this.config.get<string>('backupDir') ?? process.env.BACKUP_DIR ?? '/tmp/togt-backups';
    try {
      mkdirSync(this.backupDir, { recursive: true });
    } catch (error) {
      this.logger.warn(`Backup dir ${this.backupDir} unavailable: ${(error as Error).message}`);
    }
  }

  private assertBackupRole(actor: User) {
    if (!BACKUP_ROLES.includes(actor.role)) throw new ForbiddenException('Admin or Tech access required');
  }

  private assertRestoreRole(actor: User) {
    if (!RESTORE_ROLES.includes(actor.role)) throw new ForbiddenException('Only Tech can restore backups');
  }

  async list(actor: User) {
    this.assertBackupRole(actor);
    const [data, schedule] = await Promise.all([
      this.prisma.backup.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      this.getSchedule(),
    ]);
    return { data, schedule, total: data.length };
  }

  async getSchedule(actor?: User) {
    if (actor) this.assertBackupRole(actor);
    let row = await this.prisma.backupSchedule.findFirst();
    if (!row) row = await this.prisma.backupSchedule.create({ data: {} });
    return row;
  }

  async updateSchedule(dto: UpdateScheduleDto, actor: User) {
    this.assertBackupRole(actor);
    if (dto.cron && !/^\S+\s+\S+\s+\S+\s+\S+\s+\S+$/.test(dto.cron)) {
      throw new BadRequestException('cron must have 5 space-separated fields, e.g. "0 2 * * *"');
    }
    if (dto.retentionDays != null && (dto.retentionDays < 1 || dto.retentionDays > 365)) {
      throw new BadRequestException('retentionDays must be between 1 and 365');
    }
    const current = await this.getSchedule();
    const updated = await this.prisma.backupSchedule.update({ where: { id: current.id }, data: { enabled: dto.enabled, cron: dto.cron, timezone: dto.timezone, retentionDays: dto.retentionDays } });
    // Apply retention immediately so shrinking retention cleans up now.
    await this.applyRetention(updated.retentionDays);
    return updated;
  }

  async findOne(id: string, actor: User) {
    this.assertBackupRole(actor);
    const row = await this.prisma.backup.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Backup not found');
    return row;
  }

  async createBackup(dto: CreateBackupDto, actor: User) {
    this.assertBackupRole(actor);
    return this.runBackup(dto.type ?? 'database', actor.id);
  }

  /** Called by the scheduler — no role check, triggered internally. */
  async runScheduledBackup() {
    return this.runBackup('database', 'scheduler');
  }

  async download(id: string, actor: User): Promise<{ filePath: string; fileName: string }> {
    this.assertBackupRole(actor);
    const row = await this.prisma.backup.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Backup not found');
    if (row.status !== 'completed' || !row.filePath) throw new BadRequestException('Backup artifact is not available');
    if (!existsSync(row.filePath)) throw new NotFoundException('Backup file no longer exists on disk');
    return { filePath: row.filePath, fileName: row.fileName ?? `backup-${row.id}.sql.gz` };
  }

  async remove(id: string, actor: User) {
    this.assertBackupRole(actor);
    const row = await this.prisma.backup.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Backup not found');
    if (row.filePath && existsSync(row.filePath)) {
      try { unlinkSync(row.filePath); } catch (error) { this.logger.warn(`Could not delete file ${row.filePath}: ${(error as Error).message}`); }
    }
    await this.prisma.backup.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * TECH-only. Restores a stored backup artifact in place:
   * 1. takes a safety backup of the current database (so a restore never
   *    destroys data),
   * 2. drops + recreates the public schema, replays the SQL dump,
   * 3. re-runs prisma migrate deploy so the schema matches the running app.
   */
  async restore(id: string, actor: User, confirm: string) {
    this.assertRestoreRole(actor);
    if (confirm !== 'RESTORE') throw new BadRequestException('Type RESTORE to confirm the restore operation');
    const row = await this.prisma.backup.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Backup not found');
    if (row.status !== 'completed' || !row.filePath || !existsSync(row.filePath)) {
      throw new BadRequestException('Backup artifact is not available on disk');
    }
    return this.performRestore(row.filePath);
  }

  /**
   * TECH-only. Restores a backup FILE uploaded from the Tech Dashboard
   * (Backups tab → “Restore from backup file”). The artifact is verified
   * (gzip integrity + “PostgreSQL database dump” header), recorded in the
   * backup history, then restored exactly like a stored backup. Media files
   * live in Cloudflare R2 and are untouched — the database references them.
   */
  async restoreFromFile(file: Express.Multer.File | undefined, actor: User, confirm: string) {
    this.assertRestoreRole(actor);
    if (confirm !== 'RESTORE') throw new BadRequestException('Type RESTORE to confirm the restore operation');
    if (!file?.path || !existsSync(file.path)) throw new BadRequestException('No backup file was uploaded');

    // Validate BEFORE touching the database.
    const gzipped = this.isGzipFile(file.path);
    if (gzipped) await this.testGzip(file.path);
    const head = await this.readHeadText(file.path, gzipped);
    if (!head.includes('PostgreSQL database dump')) {
      throw new BadRequestException('This file is not a TOGT SQL backup. Upload the .sql.gz file produced by “Create Backup Now” (custom pg_dump formats are not supported).');
    }

    // Move the artifact into the backup dir and record it in the history so it
    // is downloadable like any other backup.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = `togt-db-upload-${stamp}.sql${gzipped ? '.gz' : ''}`;
    const targetPath = join(this.backupDir, safeName);
    try {
      await copyFile(file.path, targetPath);
    } catch (error) {
      throw new BadRequestException(`Could not store the uploaded file: ${(error as Error).message}`);
    }
    const size = statSync(targetPath).size;
    await this.prisma.backup.create({
      data: {
        type: 'database',
        status: 'completed',
        triggeredBy: `upload:${actor.id.slice(0, 8)}`,
        filePath: targetPath,
        fileName: safeName,
        checksum: await this.sha256(targetPath),
        sizeBytes: BigInt(size),
        completedAt: new Date(),
      },
    });

    return this.performRestore(targetPath);
  }

  /** Shared restore pipeline: safety backup → schema reset → replay dump →
   *  migrate deploy → sanity check. */
  private async performRestore(artifactPath: string) {
    const startedAt = Date.now();
    const psqlPath = await this.resolveBinary('psql');
    if (!psqlPath) throw new ServiceUnavailableException('psql is not installed in the API container. Rebuild the image (Dockerfile installs postgresql-client-16).');
    const databaseUrl = this.config.get<string>('databaseUrl') ?? process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

    // 1. Safety backup of the current state first — a restore never destroys data.
    let safetyBackupId: string | null = null;
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safetyName = `togt-db-before-restore-${stamp}.sql.gz`;
      const safetyPath = join(this.backupDir, safetyName);
      await this.dumpDatabase(safetyPath);
      const size = statSync(safetyPath).size;
      const safety = await this.prisma.backup.create({
        data: {
          type: 'database',
          status: 'completed',
          triggeredBy: 'pre-restore-safety',
          filePath: safetyPath,
          fileName: safetyName,
          checksum: await this.sha256(safetyPath),
          sizeBytes: BigInt(size),
          completedAt: new Date(),
        },
      });
      safetyBackupId = safety.id;
      this.logger.log(`Restore safety backup created: ${safetyName}`);
    } catch (error) {
      throw new ServiceUnavailableException(`Safety backup before restore failed — restore aborted: ${(error as Error).message}`);
    }

    // 2. Drop + recreate the schema, then replay the SQL dump.
    await this.runPsqlCommand(psqlPath, databaseUrl, 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid(); DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    try {
      await this.runPsqlApply(psqlPath, databaseUrl, artifactPath, this.isGzipFile(artifactPath));
    } catch (error) {
      throw new BadRequestException(`Restore failed after the schema reset — the database is empty. The pre-restore safety backup (${safetyBackupId}) can be restored to recover: ${(error as Error).message}`);
    }

    // 3. Align the restored schema with the running application.
    await this.runPrismaMigrateDeploy();

    // 4. Sanity check.
    await this.prisma.$queryRaw`SELECT 1`;
    this.logger.log(`Restore completed in ${Date.now() - startedAt}ms (safety backup ${safetyBackupId})`);
    return { ok: true, safetyBackupId, durationMs: Date.now() - startedAt };
  }

  private async runPsqlCommand(psqlPath: string, databaseUrl: string, sql: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const psql = spawn(psqlPath, ['--dbname', databaseUrl, '--set', 'ON_ERROR_STOP=1', '--command', sql], {
        env: { ...process.env, PGPASSWORD: this.extractPassword(databaseUrl) },
      });
      let stderr = '';
      psql.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      psql.on('error', reject);
      psql.on('close', (code) => {
        if (code !== 0) reject(new Error(`psql exited with code ${code}${stderr ? `: ${stderr.slice(0, 400)}` : ''}`));
        else resolve();
      });
    });
  }

  /** Streams (optionally gunzipped) SQL into psql with ON_ERROR_STOP. */
  private async runPsqlApply(psqlPath: string, databaseUrl: string, filePath: string, gzipped: boolean): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const psql = spawn(psqlPath, ['--dbname', databaseUrl, '--set', 'ON_ERROR_STOP=1', '--quiet'], {
        env: { ...process.env, PGPASSWORD: this.extractPassword(databaseUrl) },
      });
      let stderr = '';
      psql.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      if (gzipped) {
        const gzipPath = this.resolveBinarySync('gzip');
        if (!gzipPath) { reject(new Error('gzip is not installed in the API container')); return; }
        const gunzip = spawn(gzipPath, ['-dc', filePath]);
        gunzip.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
        gunzip.stdout.pipe(psql.stdin);
        gunzip.on('error', reject);
        gunzip.on('close', (code) => {
          if (code !== 0) reject(new Error(`gzip decompression failed with code ${code}${stderr ? `: ${stderr.slice(0, 300)}` : ''}`));
        });
      } else {
        createReadStream(filePath).pipe(psql.stdin);
      }
      psql.on('error', reject);
      psql.on('close', (code) => {
        if (code !== 0) reject(new Error(`psql restore exited with code ${code}${stderr ? `: ${stderr.slice(0, 500)}` : ''}`));
        else resolve();
      });
    });
  }

  /** Re-runs pending migrations so the restored database matches this API build. */
  private runPrismaMigrateDeploy(): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('npx prisma migrate deploy', { shell: true, env: process.env, cwd: process.cwd() });
      let output = '';
      child.stdout.on('data', (chunk) => { output += chunk.toString(); });
      child.stderr.on('data', (chunk) => { output += chunk.toString(); });
      const timer = setTimeout(() => { child.kill(); reject(new Error(`prisma migrate deploy timed out: ${output.slice(0, 300)}`)); }, 300_000);
      child.on('error', (error) => { clearTimeout(timer); reject(error); });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) reject(new Error(`prisma migrate deploy exited with code ${code}: ${output.slice(0, 400)}`));
        else resolve();
      });
    });
  }

  private isGzipFile(path: string): boolean {
    const fd = openSync(path, 'r');
    try {
      const buf = Buffer.alloc(2);
      const bytes = readSync(fd, buf, 0, 2, 0);
      return bytes === 2 && buf[0] === 0x1f && buf[1] === 0x8b;
    } finally {
      closeSync(fd);
    }
  }

  private testGzip(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const gzipPath = this.resolveBinarySync('gzip');
      if (!gzipPath) { resolve(); return; }
      const gunzip = spawn(gzipPath, ['-t', path]);
      let stderr = '';
      gunzip.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      gunzip.on('error', reject);
      gunzip.on('close', (code) => {
        if (code !== 0) reject(new BadRequestException(`This backup file is corrupted (gzip test failed: ${stderr.slice(0, 200)})`));
        else resolve();
      });
    });
  }

  /** First bytes of the artifact (transparently gunzipped) for header checks. */
  private async readHeadText(path: string, gzipped: boolean): Promise<string> {
    if (!gzipped) {
      const fd = openSync(path, 'r');
      try {
        const buf = Buffer.alloc(512);
        const bytes = readSync(fd, buf, 0, 512, 0);
        return buf.subarray(0, bytes).toString('utf8');
      } finally {
        closeSync(fd);
      }
    }
    const gzipPath = this.resolveBinarySync('gzip');
    if (!gzipPath) return '';
    return new Promise((resolve, reject) => {
      const gunzip = spawn(gzipPath, ['-dc', path]);
      let out = '';
      gunzip.stdout.on('data', (chunk) => {
        out += chunk.toString('utf8');
        if (out.length >= 512) { gunzip.kill(); resolve(out.slice(0, 512)); }
      });
      gunzip.on('error', reject);
      gunzip.on('close', () => resolve(out.slice(0, 512)));
    });
  }

  private resolveBinarySync(name: 'gzip' | 'psql' | 'pg_dump'): string | null {
    const direct = join('/usr/bin', name);
    if (existsSync(direct)) return direct;
    const local = join(this.backupDir, 'bin', name);
    return existsSync(local) ? local : null;
  }

  private async runBackup(type: 'database' | 'full', triggeredBy: string) {
    const schedule = await this.getSchedule();
    const record = await this.prisma.backup.create({ data: { type, status: 'running', triggeredBy } });

    // Run asynchronously so the HTTP request returns immediately with the
    // queued/running record; clients poll GET /backups for status.
    void this.executeBackup(record.id, type, schedule.retentionDays).catch(() => undefined);
    return record;
  }

  private async executeBackup(recordId: string, type: 'database' | 'full', retentionDays: number) {
    const startedAt = Date.now();
    try {
      // 1. Connectivity check.
      await this.prisma.$queryRaw`SELECT 1`;

      // 2. pg_dump | gzip -> artifact file.
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `togt-db-${stamp}.sql.gz`;
      const filePath = join(this.backupDir, fileName);
      await this.dumpDatabase(filePath);

      // 3. Verify and record.
      const size = statSync(filePath).size;
      const checksum = await this.sha256(filePath);
      const completed = await this.prisma.backup.update({
        where: { id: recordId },
        data: { status: 'completed', sizeBytes: BigInt(size), filePath, fileName, checksum, durationMs: Date.now() - startedAt, completedAt: new Date() },
      });
      this.logger.log(`Backup ${recordId} completed: ${fileName} (${(size / 1024 / 1024).toFixed(2)} MB)`);

      // 4. Telegram success notification (never fails the backup).
      await this.notify(completed.id, type, size, null).catch((error) => this.logger.warn(`Backup Telegram notify failed: ${(error as Error).message}`));

      // 5. Retention cleanup.
      await this.applyRetention(retentionDays).catch((error) => this.logger.warn(`Retention cleanup failed: ${(error as Error).message}`));
    } catch (error) {
      const message = (error as Error).message ?? 'Unknown backup error';
      this.logger.error(`Backup ${recordId} failed: ${message}`);
      await this.prisma.backup.update({
        where: { id: recordId },
        data: { status: 'failed', error: message.slice(0, 900), durationMs: Date.now() - startedAt, completedAt: new Date() },
      }).catch(() => undefined);
      await this.notify(recordId, type, 0, message).catch(() => undefined);
    }
  }

  /** Runs pg_dump piped through gzip. Falls back to plain pg_dump without gzip
   *  if gzip is unavailable (still valid SQL). */
  private async dumpDatabase(filePath: string): Promise<void> {
    const databaseUrl = this.config.get<string>('databaseUrl') ?? process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not configured');
    const dumpPath = await this.resolveBinary('pg_dump');
    if (!dumpPath) {
      throw new Error('pg_dump is not installed in the API container. Rebuild the image (Dockerfile now installs postgresql-client).');
    }
    const gzipPath = await this.resolveBinary('gzip');

    await new Promise<void>((resolve, reject) => {
      const dump = spawn(dumpPath, ['--dbname', databaseUrl, '--no-owner', '--no-privileges', '--format', 'plain'], {
        env: { ...process.env, PGPASSWORD: this.extractPassword(databaseUrl) },
      });
      let stderr = '';
      dump.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

      if (gzipPath) {
        const gzip = spawn(gzipPath, ['-6']);
        const file = createWriteStream(filePath);
        dump.stdout.pipe(gzip.stdin);
        gzip.stdout.pipe(file);
        gzip.on('error', reject);
        file.on('finish', () => resolve());
        file.on('error', reject);
      } else {
        const file = createWriteStream(filePath);
        dump.stdout.pipe(file);
        file.on('finish', () => resolve());
        file.on('error', reject);
      }
      dump.on('error', reject);
      dump.on('close', (code) => {
        if (code !== 0) reject(new Error(`pg_dump exited with code ${code}${stderr ? `: ${stderr.slice(0, 400)}` : ''}`));
      });
    });
  }

  /** Prefer the postgres tools shipped in this container; fall back to running
   *  them inside the postgres container via docker (host runner case). */
  private async resolveBinary(name: 'pg_dump' | 'psql' | 'gzip'): Promise<string | null> {
    const direct = join('/usr/bin', name);
    if (existsSync(direct)) return direct;
    const local = join(this.backupDir, 'bin', name);
    return existsSync(local) ? local : null;
  }

  private extractPassword(url: string): string | undefined {
    try { return new URL(url).password || undefined; } catch { return undefined; }
  }

  private async sha256(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(path);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async notify(backupId: string, type: string, sizeBytes: number, error: string | null) {
    const baseUrl = this.config.get<string>('frontendUrl') ?? 'https://travel.togttrading.com';
    const sizeFormatted = `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
    // Chat ID comes from the encrypted provider store (Tech Dashboard →
    // Providers → Telegram Backup Chat) or the TELEGRAM_BACKUP_CHAT_ID env.
    const chatId = await this.credentials.get('TELEGRAM_BACKUP_CHAT');
    const overrides = chatId ? { chatId } : undefined;
    if (error) {
      await this.telegram.sendNotification(
        `❌ TOGT Backup Failed\n📅 Date: ${new Date().toISOString()}\n📦 Type: ${type}\n⚠️ Error: ${error.slice(0, 300)}\nID: ${backupId}`,
        overrides,
      );
      return;
    }
    await this.telegram.sendNotification(
      `✅ TOGT Backup Completed\n📅 Date: ${new Date().toISOString()}\n📦 Type: ${type}\n💾 Size: ${sizeFormatted}\n🔗 Download: ${baseUrl}/dashboard/tech?tab=backups\nID: ${backupId}`,
      overrides,
    );
  }

  private async applyRetention(retentionDays: number) {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const stale = await this.prisma.backup.findMany({ where: { createdAt: { lt: cutoff }, status: 'completed' } });
    for (const row of stale) {
      if (row.filePath && existsSync(row.filePath)) {
        try { unlinkSync(row.filePath); } catch { /* already gone */ }
      }
    }
    if (stale.length) {
      await this.prisma.backup.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
      this.logger.log(`Retention: deleted ${stale.length} backup(s) older than ${retentionDays} days`);
    }
  }
}
