import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import type { Update } from 'grammy/types';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { CredentialService } from '../system/credential.service';

const menu = new Keyboard().text('🕋 Umrah Packages').text('✈️ Tickets').row().text('🛂 Visa').text('🏔️ Tours').row().text('📞 Contact').text('ℹ️ Help').resized();

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Bot;
  private botToken = '';
  private polling = false;
  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService, private readonly chatbot: ChatbotService, private readonly credentials: CredentialService) { this.bot = new Bot('disabled-token'); }

async onModuleInit() {
    const token = await this.credentials.get('TELEGRAM_SUPPORT_BOT');
    if (!token) { this.logger.warn('Telegram support bot disabled: no TELEGRAM_SUPPORT_BOT token configured in the Tech Dashboard'); return; }
    this.bot = new Bot(token);
    this.botToken = token;
    this.bot.catch((error) => this.logger.error(`Telegram bot handling error: ${String(error?.error ?? error)}`));
    this.registerHandlers();
    try {
      const me = await this.bot.api.getMe();
      this.logger.log(`Telegram support bot ready as @${me.username}`);
    } catch (error) {
      this.logger.error(`Telegram support bot token invalid or network failure: ${(error as Error).message}`);
      return;
    }
    if (this.config.get<string>('NODE_ENV') !== 'production') {
      this.polling = true;
      this.bot.start().catch((error) => this.logger.error(`Telegram polling failed: ${(error as Error).message}`));
      this.logger.log('Telegram support bot polling started (dev mode).');
      return;
    }
    const webhook = this.config.get<string>('TELEGRAM_WEBHOOK_URL');
    if (webhook) {
      try {
        await this.bot.api.setWebhook(webhook);
        this.logger.log(`Telegram webhook set: ${webhook}`);
      } catch (error) {
        this.logger.error(`Telegram webhook set failed: ${(error as Error).message}`);
        this.polling = true;
        this.bot.start().catch((err) => this.logger.error(`Telegram polling fallback failed: ${(err as Error).message}`));
        this.logger.warn('Fell back to Telegram long polling because webhook setup failed.');
      }
      return;
    }
    this.polling = true;
    this.bot.start().catch((error) => this.logger.error(`Telegram polling failed: ${(error as Error).message}`));
    this.logger.warn('TELEGRAM_WEBHOOK_URL not configured; Telegram support bot is using long polling.');
  }

  async onModuleDestroy() { if (this.polling) { await this.bot.stop().catch(() => undefined); } }
  async handleUpdate(update: Update) {
    const token = await this.credentials.get('TELEGRAM_SUPPORT_BOT');
    if (!token) { this.logger.warn('Telegram webhook update ignored: no support bot token configured.'); return; }
    if (token !== this.botToken) { this.bot = new Bot(token); this.botToken = token; this.registerHandlers(); }
    try { await this.bot.handleUpdate(update); } catch (error) { this.logger.error(`Telegram webhook handling failed: ${(error as Error).message}`); }
  }

  private registerHandlers() {
    this.bot.command('start', (ctx) => ctx.reply('Welcome to TOGT Tour & Travel! 🎉\n\nI can help with:\n🕋 Umrah packages\n✈️ Flight tickets\n🛂 Visa processing\n🏔️ Tours\n💼 Travel consulting\n\nType your question in English, Arabic, or Amharic.', { reply_markup: menu }));
    this.bot.command('help', (ctx) => ctx.reply('How to use TOGT Bot:\n\n/packages - View all packages\n/umrah - Umrah packages\n/ticket - Flight information\n/visa - Visa information\n/contact - Contact TOGT\n\nYou can also type a question in English, العربية, or አማርኛ.', { reply_markup: menu }));
    this.bot.command('contact', (ctx) => ctx.reply('📞 TOGT Contact\n\n+251 99 797 9741\n+251 99 797 9740\n📧 info@togttrading.com\n📍 Jemo 1, Front of Saba Building, Addis Ababa, Ethiopia\n\nhttps://maps.app.goo.gl/rFFRbFUhKS2zZRS46', { reply_markup: menu }));
    this.bot.command('ticket', (ctx) => ctx.reply('✈️ TOGT ticketing includes flight search, passenger details, seats, payment, and e-ticket confirmation. Start here: https://travel.togttrading.com/en#flight-booking', { reply_markup: menu }));
    this.bot.command('visa', (ctx) => ctx.reply('🛂 TOGT provides visit, medical, family, educational, and merchant visa assistance. Requirements depend on destination and nationality. Start here: https://travel.togttrading.com/en/visa-requirements', { reply_markup: menu }));
    this.bot.command('umrah', (ctx) => this.sendPackages(ctx, 'UMRAH'));
    this.bot.command('packages', (ctx) => this.sendPackages(ctx));
    this.bot.hears('🕋 Umrah Packages', (ctx) => this.sendPackages(ctx, 'UMRAH'));
    this.bot.hears('✈️ Tickets', (ctx) => ctx.reply('✈️ Start ticket booking: https://travel.togttrading.com/en#flight-booking'));
    this.bot.hears('🛂 Visa', (ctx) => ctx.reply('🛂 Visa guidance: https://travel.togttrading.com/en/visa-requirements'));
    this.bot.hears('🏔️ Tours', (ctx) => this.sendPackages(ctx, 'DOMESTIC'));
    this.bot.hears('📞 Contact', (ctx) => ctx.reply('📞 +251 99 797 9741\n📧 info@togttrading.com\n📍 Jemo 1, Front of Saba Building, Addis Ababa', { reply_markup: menu }));
    this.bot.hears('ℹ️ Help', (ctx) => ctx.reply('Ask me about packages, prices, visas, tickets, tours, booking, or refunds.'));
    this.bot.callbackQuery(/^package:(.+)$/, async (ctx) => { const pkg = await this.prisma.package.findUnique({ where: { id: ctx.match[1] } }); await ctx.answerCallbackQuery(); if (!pkg) return ctx.reply('Package not found.'); const text = `${pkg.title}\n💰 ${pkg.price ? `${pkg.price.toLocaleString()} ${pkg.currency ?? 'ETB'}` : 'Custom pricing'}\n📅 ${pkg.duration ?? 'Flexible duration'}\n\n${pkg.description}`; return ctx.reply(text, { reply_markup: new InlineKeyboard().url('📦 Book Now', 'https://travel.togttrading.com/en#smart-form').text('📞 Contact', 'contact:call') }); });
    this.bot.callbackQuery('contact:call', async (ctx) => { await ctx.answerCallbackQuery(); await ctx.reply('Call TOGT: +251 99 797 9741'); });
    this.bot.on('message:text', async (ctx) => {
      if (ctx.message.text.startsWith('/')) return;
      await ctx.replyWithChatAction('typing');
      try {
        const result = await this.chatbot.ask({ message: ctx.message.text, conversationId: `telegram:${ctx.from.id}`, userInfo: { name: ctx.from.first_name } });
        let text = result.reply;
        if (result.packages && result.packages.length) text = `${result.reply}\n\n${this.chatbot.formatPackagesText(result.packages)}`;
        try { await ctx.reply(this.formatTelegramText(text).html, { parse_mode: 'HTML', reply_markup: menu }); }
        catch (error) { this.logger.warn(`Telegram HTML reply rejected (${(error as Error).message}); sending plain text.`); await ctx.reply(this.formatTelegramText(text).plain, { reply_markup: menu }); }
      } catch (error) {
        this.logger.error(`Telegram assistant failed: ${(error as Error).message}`);
        await ctx.reply('Sorry, I could not reach the assistant right now. Please call +251 99 797 9741.').catch(() => undefined);
      }
    });
  }

  private formatTelegramText(text: string) {
    const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const html = esc
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/^\s*(#{1,3})\s+(.+)$/gm, '<b>$2</b>')
      .replace(/^\s*(?:[-•])\s+/gm, '• ')
      .replace(/^\s*(\d+)[.)]\s+/gm, '$1. ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    const plain = text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#{1,3}\s+/gm, '').trim();
    return { html, plain };
  }

  private async sendPackages(ctx: { reply: (text: string, options?: Record<string, unknown>) => Promise<unknown> }, type?: string) {
    const allPackages = await this.prisma.package.findMany({ where: { isActive: true }, orderBy: { price: 'asc' }, take: 50 });
    const packages = type ? allPackages.filter((pkg) => pkg.type.startsWith(type)) : allPackages;
    if (!packages.length) return ctx.reply('No active packages are available right now. Please contact TOGT support.');
    const keyboard = new InlineKeyboard(); packages.slice(0, 10).forEach((pkg, index) => { keyboard.text(`${pkg.title} - ${pkg.price ? `${pkg.price.toLocaleString()} ETB` : 'Custom'}`, `package:${pkg.id}`); if (index % 2 === 1) keyboard.row(); });
    await ctx.reply(`Available ${type ? `${type.toLowerCase()} ` : ''}packages:\n\n${packages.map((pkg) => `• ${pkg.title} - ${pkg.price ? `${pkg.price.toLocaleString()} ${pkg.currency ?? 'ETB'}` : 'Custom pricing'} (${pkg.duration ?? 'flexible'})`).join('\n')}`, { reply_markup: keyboard });
  }
}
