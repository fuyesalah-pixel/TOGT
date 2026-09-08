import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';
import { CredentialService } from '../system/credential.service';

@Injectable()
export class TelegramBackupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBackupService.name);
  private bot: Bot;
  private botToken = '';
  private username: string | undefined;

  constructor(private readonly config: ConfigService, private readonly credentials: CredentialService) {
    this.bot = new Bot('disabled-token');
  }

  async onModuleInit() {
    this.username = undefined;
    const token = await this.credentials.get('TELEGRAM_BACKUP_BOT');
    if (token) {
      try {
        const me = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(15000) }).then((res) => res.json() as Promise<{ ok: boolean; result?: { username?: string } }>);
        if (me.ok && me.result?.username) this.username = `@${me.result.username}`;
        this.bot = new Bot(token);
        this.botToken = token;
        this.logger.log(`Telegram backup bot ready (${this.username ?? 'token'})`);
      } catch (error) { this.logger.warn(`Telegram backup bot init failed: ${(error as Error).message}`); }
    } else {
      this.logger.warn('Telegram backup bot disabled: TELEGRAM_BACKUP_BOT_TOKEN is not configured');
    }
  }

  async onModuleDestroy() { try { await this.bot.stop(); } catch { /* not polling */ } }

  get usernameLabel(): string | undefined { return this.username; }

  async refresh() {
    const token = await this.credentials.get('TELEGRAM_BACKUP_BOT');
    if (token && token !== this.botToken) {
      this.bot = new Bot(token);
      this.botToken = token;
    }
    if (!token) return;
    const me = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(15000) }).then((res) => res.json() as Promise<{ ok: boolean; result?: { username?: string } }>);
    if (me.ok && me.result?.username) this.username = `@${me.result.username}`;
  }

  async sendNotification(message: string, overrides?: { chatId?: string }): Promise<{ ok: boolean; chatId?: string; username?: string }> {
    const token = await this.credentials.get('TELEGRAM_BACKUP_BOT');
    if (!token) throw new Error('TELEGRAM_BACKUP_BOT is not configured');
    await this.refresh();
    const chatId = overrides?.chatId ?? this.config.get<string>('telegramBackupChatId');
    if (!chatId) throw new Error('TELEGRAM_BACKUP_CHAT_ID is not configured');
    await this.bot.api.sendMessage(chatId, message);
    this.logger.log(`Telegram backup notification sent to ${chatId}`);
    return { ok: true, chatId, username: this.username };
  }

  async sendTestNotification(): Promise<{ ok: boolean; chatId?: string; username?: string; message: string }> {
    const result = await this.sendNotification('✅ TOGT backup bot test notification.\nTimestamp: ' + new Date().toISOString());
    return { ...result, message: 'Test backup notification sent via Telegram backup bot.' };
  }
}