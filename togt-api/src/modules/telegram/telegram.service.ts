import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import type { Update } from 'grammy/types';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatbotService } from '../chatbot/chatbot.service';

const menu = new Keyboard().text('🕋 Umrah Packages').text('✈️ Tickets').row().text('🛂 Visa').text('🏔️ Tours').row().text('📞 Contact').text('ℹ️ Help').resized();

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private readonly bot: Bot;
  private polling = false;
  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService, private readonly chatbot: ChatbotService) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.bot = new Bot(token || 'disabled-token');
    this.registerHandlers();
  }

  async onModuleInit() {
    if (!this.config.get<string>('TELEGRAM_BOT_TOKEN')) { this.logger.warn('Telegram bot disabled: TELEGRAM_BOT_TOKEN is not configured'); return; }
    if (this.config.get<string>('NODE_ENV') !== 'production') { this.polling = true; this.bot.start().catch((error) => this.logger.error(`Telegram polling failed: ${(error as Error).message}`)); }
    else { const webhook = this.config.get<string>('TELEGRAM_WEBHOOK_URL'); if (webhook) await this.bot.api.setWebhook(webhook); }
  }

  async onModuleDestroy() { if (this.polling) await this.bot.stop(); }
  async handleUpdate(update: Update) { if (this.config.get<string>('TELEGRAM_BOT_TOKEN')) await this.bot.handleUpdate(update); }

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
    this.bot.on('message:text', async (ctx) => { if (ctx.message.text.startsWith('/')) return; await ctx.replyWithChatAction('typing'); try { const result = await this.chatbot.ask({ message: ctx.message.text, conversationId: `telegram:${ctx.from.id}` }); await ctx.reply(result.reply, { reply_markup: menu }); } catch { await ctx.reply('I could not reach the assistant. Please contact +251 99 797 9741.'); } });
  }

  private async sendPackages(ctx: { reply: (text: string, options?: Record<string, unknown>) => Promise<unknown> }, type?: string) {
    const allPackages = await this.prisma.package.findMany({ where: { isActive: true }, orderBy: { price: 'asc' }, take: 50 });
    const packages = type ? allPackages.filter((pkg) => pkg.type.startsWith(type)) : allPackages;
    if (!packages.length) return ctx.reply('No active packages are available right now. Please contact TOGT support.');
    const keyboard = new InlineKeyboard(); packages.slice(0, 10).forEach((pkg, index) => { keyboard.text(`${pkg.title} - ${pkg.price ? `${pkg.price.toLocaleString()} ETB` : 'Custom'}`, `package:${pkg.id}`); if (index % 2 === 1) keyboard.row(); });
    await ctx.reply(`Available ${type ? `${type.toLowerCase()} ` : ''}packages:\n\n${packages.map((pkg) => `• ${pkg.title} - ${pkg.price ? `${pkg.price.toLocaleString()} ${pkg.currency ?? 'ETB'}` : 'Custom pricing'} (${pkg.duration ?? 'flexible'})`).join('\n')}`, { reply_markup: keyboard });
  }
}
