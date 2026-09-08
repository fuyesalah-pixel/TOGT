import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AskChatbotDto } from './dto/ask-chatbot.dto';
import { Response } from 'express';
import { ValkeyService } from '../../valkey/valkey.service';
import { CredentialService } from '../system/credential.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

const services = 'Ticket Office, Umrah Packages, Domestic Tours, Foreigner Tours, Visa Processing, and Travel Consulting';
const policy = 'Refunds and cancellations depend on airline, visa authority, supplier, fare, and package rules. Customers should request changes through TOGT support before travel.';

const STRONG_PACKAGE = /package|\bumrah\b|عمرة|ኡምራ|\bhajj\b|\bhaj\b/i;
const PACKAGE_HINT = /tour|trip|destination|itinerar|offer|deal|price|cost|how much|budget|cheap|afford|under\s*\d|below\s*\d|\d[\d.,]*\s*(etb|birr|ብር|usd|\$)|book\b|booking/i;
const PACKAGE_OFF = /visa|ticket|phone|number|contact|address|location|email|passport|document|refund|cancel/i;
const FOLLOW_UP = /first|second|third|fourth|more|that one|the one|about the|those|these|them|detail|الاول|الأول|أول واحد|أول|تفاصيل|المزيد|قبل|የመጀመሪያ|ተጨማሪ|ያንን|መረጃ/i;
const BUDGET_PREFIX = /(?:under|below|less than|up to|about|max(?:imum)?|بحد أقصى|حتى|تحت|أقل من|እስከ|በታች|በጀት)\s*(\d[\d.,]*)/i;
const CURRENCY_AMOUNT = /(\d[\d.,]*)\s*(?:etb|birr|ብር|\$|usd|دولار|درهم|دينار)/i;

export interface PackageSnippet {
  id: string;
  title: string;
  description: string;
  image: string | null;
  price: number | null;
  currency: string | null;
  duration: string | null;
  includes: string[];
}

interface CompletionsProvider {
  key: string;
  baseUrl: string;
  model: string;
  name: string;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly valkey: ValkeyService, private readonly credentials: CredentialService) {}

  private language(text: string) { return /[\u0600-\u06FF]/.test(text) ? 'Arabic' : /[\u1200-\u137F]/.test(text) ? 'Amharic' : 'English'; }

  private async completionsProvider(language: string): Promise<CompletionsProvider | undefined> {
    const openRouterKey = await this.credentials.get('OPENROUTER');
    if (openRouterKey) {
      const model = language === 'Arabic'
        ? this.config.get<string>('openRouter.arabicModel') ?? 'google/gemini-2.5-flash'
        : language === 'Amharic'
          ? this.config.get<string>('openRouter.amharicModel') ?? 'google/gemini-2.5-flash'
          : this.config.get<string>('OPENROUTER_MODEL') ?? 'google/gemini-2.5-flash';
      return { key: openRouterKey, baseUrl: this.config.get<string>('openRouter.baseUrl') ?? 'https://openrouter.ai/api/v1', model, name: 'OpenRouter' };
    }
    const openAiKey = await this.credentials.get('OPENAI');
    if (openAiKey) return { key: openAiKey, baseUrl: 'https://api.openai.com/v1', model: this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini', name: 'OpenAI' };
    return undefined;
  }

  private async geminiProvider(): Promise<{ key: string; model: string } | undefined> {
    const key = await this.credentials.get('GEMINI');
    if (key) return { key, model: this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash' };
    return undefined;
  }

  private toSnippet(item: { id: string; title: string; description: string; image: string | null; price: number | null; currency: string | null; duration: string | null; includes: string[] }): PackageSnippet {
    return { id: item.id, title: item.title, description: item.description, image: item.image, price: item.price, currency: item.currency, duration: item.duration, includes: (item.includes ?? []).slice(0, 4) };
  }

  formatPackagesText(snippets: PackageSnippet[]): string {
    return snippets.slice(0, 5).map((p) => `\u{1F955} ${p.title} — ${p.duration ?? 'Flexible duration'}\n\u{1F4B0} ${p.price ? `${Number(p.price).toLocaleString()} ${p.currency ?? 'ETB'}` : 'Custom pricing'}\n\u{2705} ${(p.includes ?? []).slice(0, 4).join(', ') || 'Rates, flights, and visa support'}`).join('\n\n');
  }

  private budgetOf(message: string): number | null {
    const match = message.match(BUDGET_PREFIX) ?? message.match(CURRENCY_AMOUNT);
    if (!match) return null;
    const amount = parseFloat((match[1] ?? match[0]).replace(/,/g, ''));
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }

  private packageRelevant(message: string): boolean {
    if (STRONG_PACKAGE.test(message)) return !/refund|cance[lt]/i.test(message);
    if (PACKAGE_OFF.test(message)) return false;
    return PACKAGE_HINT.test(message);
  }

  private followUpIndex(message: string): number {
    if (/\b(first|الأول|الاول)\b/.test(message)) return 0;
    if (/\b(second|الثاني|الثانى)\b/.test(message)) return 1;
    if (/\b(third|الثالث)\b/.test(message)) return 2;
    if (/\b(fourth|الرابع)\b/.test(message)) return 3;
    return -1;
  }

  private wantsFollowUp(message: string): boolean {
    return FOLLOW_UP.test(message);
  }

  private async relevantPackages(message: string, conversationId: string): Promise<{ packages: PackageSnippet[] }> {
    const lastKey = `chatbot:last:${conversationId}`;
    const relevant = this.packageRelevant(message);
    const useStored = !relevant && this.wantsFollowUp(message);
    let snippets: PackageSnippet[] = [];
    const budget = this.budgetOf(message);
    if (relevant) {
      const all = await this.prisma.package.findMany({ where: { isActive: true }, take: 50 });
      const words = message.toLowerCase().split(/\W+/).filter((word) => word.length > 2);
      const score = (text: string) => words.reduce((total, word) => total + (text.toLowerCase().includes(word) ? 1 : 0), 0);
      snippets = all
        .map((item) => ({ item, score: score(`${item.title} ${item.description} ${item.type} ${item.destination}`) }))
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => this.toSnippet(item));
    } else if (useStored) {
      const stored = await this.valkey.get(lastKey);
      if (stored) {
        const parsed = JSON.parse(stored) as PackageSnippet[];
        const refIndex = this.followUpIndex(message);
        snippets = refIndex >= 0 && parsed[refIndex] ? [parsed[refIndex]] : parsed;
      }
    }
    if (budget != null && snippets.length) snippets = snippets.filter((p) => p.price != null && p.price <= budget);
    const selected = snippets.slice(0, 5);
    if (selected.length) await this.valkey.set(lastKey, JSON.stringify(selected), 6 * 3600);
    return { packages: selected };
  }

  private buildContext(language: string, snippets: PackageSnippet[], faqs: Array<{ question: string; answer: string }>, gallery: Array<{ title: string; description: string }>): string {
    const packageContext = snippets.length ? `Packages:\n${snippets.map((item) => `- ${item.id}: ${item.title}, ${item.price ?? 'custom'} ${item.currency ?? 'ETB'}, ${item.duration ?? 'varies'}: ${item.description}`).join('\n')}` : '';
    const faqContext = faqs.length ? `FAQ:\n${faqs.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n')}` : '';
    const galleryContext = gallery.length ? `Gallery:\n${gallery.map((item) => `- ${item.title}: ${item.description}`).join('\n')}` : '';
    return [`Services: ${services}`, `Policies: ${policy}`, `Contact: +251 99 797 9741 / +251 99 797 9740, info@togttrading.com, Jemo 1, Addis Ababa.`, packageContext, faqContext, galleryContext].filter(Boolean).join('\n');
  }

  private systemPrompt(language: string, context: string, history: Array<{ role: 'user' | 'assistant'; content: string }>): string {
    const languageRules = language === 'Amharic' ? 'Use proper Amharic script (አማርኛ), formal but friendly Ethiopian travel language, and write ETB as ብር where natural. Avoid unnecessary English words.' : language === 'Arabic' ? 'Use clear, polite Modern Standard Arabic.' : 'Use natural professional English.';
    const previous = history.length ? `\nPrevious conversation:\n${history.map((item) => `${item.role}: ${item.content}`).join('\n')}` : '';
    return `You are Ahmed, a warm senior TOGT travel consultant. ${languageRules} Use only the supplied live context; never invent prices. Ask a follow-up when useful.\n${context}${previous}\n\nCONSULTATION STYLE: Answer conversationally, like a helpful travel agent. Recommend or list specific packages ONLY when the user asks about packages, tours, trips, prices, budgets, or refers to a package already shown in this conversation — never otherwise. Never output JSON, code blocks, or raw metadata in your reply.\n\nFINAL INSTRUCTION: The user wrote in ${language}. Reply entirely in ${language}${language === 'Amharic' ? ' using proper Amharic script (አማርኛ)' : ''}. Do not reply in English. Do not refuse to answer in this language. If the user sends a greeting, greet back warmly in ${language} and offer help.`;
  }

  private async history(conversationId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    return (await this.valkey.list(`chatbot:conversation:${conversationId}`)).reverse().map((item) => JSON.parse(item) as { role: 'user' | 'assistant'; content: string });
  }

  async stream(dto: AskChatbotDto, response: Response) {
    const conversationId = dto.conversationId ?? `guest-${Date.now()}`;
    const history = await this.history(conversationId);
    const { packages: packageResults } = await this.relevantPackages(dto.message, conversationId);
    const words = dto.message.toLowerCase().split(/\W+/).filter((word) => word.length > 2);
    const [faqs, gallery] = await Promise.all([this.prisma.fAQItem.findMany({ where: { isActive: true }, take: 100 }), this.prisma.galleryItem.findMany({ take: 50, orderBy: { createdAt: 'desc' } })]);
    const score = (text: string) => words.reduce((total, word) => total + (text.toLowerCase().includes(word) ? 1 : 0), 0);
    const faqResults = faqs.map((item) => ({ item, score: score(`${item.question} ${item.answer}`) })).sort((a, b) => b.score - a.score).slice(0, 5).map(({ item }) => item);
    const galleryResults = gallery.map((item) => ({ item, score: score(`${item.title} ${item.description} ${item.category} ${item.location}`) })).sort((a, b) => b.score - a.score).slice(0, 3).map(({ item }) => item);
    const language = this.language(dto.message);
    const context = this.buildContext(language, packageResults, faqResults, galleryResults);
    const system = this.systemPrompt(language, context, history);
    let text = this.fallback(dto.message, packageResults, faqResults, galleryResults);
    const writeWords = () => { for (const word of text.split(/\s+/)) response.write(`data: ${JSON.stringify({ chunk: `${word} ` })}\n\n`); };
    response.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });

    await this.valkey.push(`chatbot:conversation:${conversationId}`, JSON.stringify({ role: 'user', content: dto.message }));

    let streamed = false;
    if (language === 'Amharic') {
      const gemini = await this.geminiProvider();
      if (gemini) {
        try {
          const model = new GoogleGenerativeAI(gemini.key).getGenerativeModel({ model: gemini.model });
          const result = await model.generateContentStream(`${system}\nUser: ${dto.message}`);
          text = '';
          for await (const chunk of result.stream) { const part = chunk.text(); text += part; streamed = true; response.write(`data: ${JSON.stringify({ chunk: part })}\n\n`); }
          this.logger.log(`Gemini reply for Amharic (${gemini.model})`);
        } catch (error) { this.logger.warn(`Gemini request failed: ${(error as Error).message}`); streamed = false; text = this.fallback(dto.message, packageResults, faqResults, galleryResults); }
      } else {
        this.logger.warn('No Gemini credential configured for Amharic; trying OpenRouter.');
      }
    }
    if (!streamed) {
      const provider = await this.completionsProvider(language);
      if (provider) {
        try {
          const result = await fetch(`${provider.baseUrl}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${provider.key}`, 'Content-Type': 'application/json', ...(provider.name === 'OpenRouter' ? { 'HTTP-Referer': 'https://travel.togttrading.com', 'X-Title': 'TOGT Tour and Travel' } : {}) }, body: JSON.stringify({ model: provider.model, temperature: 0.7, max_tokens: 500, stream: true, messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: dto.message }] }) });
          if (!result.ok || !result.body) throw new Error(`HTTP ${result.status}`);
          text = '';
          const reader = result.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === '[DONE]') continue;
              try {
                const json = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
                const part = json.choices?.[0]?.delta?.content ?? '';
                if (part) { text += part; streamed = true; response.write(`data: ${JSON.stringify({ chunk: part })}\n\n`); }
              } catch { /* ignore partial JSON lines */ }
            }
          }
          if (!streamed) throw new Error('Empty stream');
          this.logger.log(`${provider.name} reply via ${provider.model}`);
        } catch (error) {
          this.logger.warn(`Completions request failed: ${(error as Error).message}`);
          streamed = false;
        }
      } else {
        this.logger.warn('No runtime AI credential configured for OpenRouter/OpenAI; used fallback.');
      }
      if (!streamed) { text = this.fallback(dto.message, packageResults, faqResults, galleryResults); writeWords(); }
    }

    await this.valkey.push(`chatbot:conversation:${conversationId}`, JSON.stringify({ role: 'assistant', content: text }));
    this.logger.log(`Chatbot stream resolved ${language === 'Amharic' ? '(Gemini path)' : ''} ${text ? 'AI reply' : 'fallback'}`);
    if (packageResults.length) response.write(`data: ${JSON.stringify({ meta: { packages: packageResults } })}\n\n`);
    response.write('data: [DONE]\n\n');
    response.end();
  }

  async ask(dto: AskChatbotDto) {
    const conversationId = dto.conversationId ?? `guest-${Date.now()}`;
    const history = await this.history(conversationId);
    const { packages: relevantPackages } = await this.relevantPackages(dto.message, conversationId);
    const words = dto.message.toLowerCase().split(/\W+/).filter((word) => word.length > 2);
    const [faqs, gallery] = await Promise.all([
      this.prisma.fAQItem.findMany({ where: { isActive: true }, orderBy: { order: 'asc' }, take: 100 }),
      this.prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    const score = (text: string) => words.reduce((total, word) => total + (text.toLowerCase().includes(word) ? 1 : 0), 0);
    const relevantFaqs = faqs.map((item) => ({ item, score: score(`${item.question} ${item.answer} ${item.category}`) })).sort((a, b) => b.score - a.score).slice(0, 5).map(({ item }) => item);
    const relevantGallery = gallery.map((item) => ({ item, score: score(`${item.title} ${item.description} ${item.category} ${item.location}`) })).sort((a, b) => b.score - a.score).slice(0, 3).map(({ item }) => item);
    const language = this.language(dto.message);
    const context = this.buildContext(language, relevantPackages, relevantFaqs, relevantGallery);
    let reply = this.fallback(dto.message, relevantPackages, relevantFaqs, relevantGallery);
    try {
      if (language === 'Amharic') {
        const gemini = await this.geminiProvider();
        if (gemini) {
          const model = new GoogleGenerativeAI(gemini.key).getGenerativeModel({ model: gemini.model });
          const result = await model.generateContent(`${this.systemPrompt(language, context, history)}\nUser: ${dto.message}`);
          const value = result.response.text();
          if (value) reply = value;
        }
      }
      if (!reply || language !== 'Amharic') {
        const provider = await this.completionsProvider(language);
        if (provider) {
          const res = await fetch(`${provider.baseUrl}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${provider.key}`, 'Content-Type': 'application/json', ...(provider.name === 'OpenRouter' ? { 'HTTP-Referer': 'https://travel.togttrading.com', 'X-Title': 'TOGT Tour and Travel' } : {}) }, body: JSON.stringify({ model: provider.model, temperature: 0.2, messages: [{ role: 'system', content: `${this.systemPrompt(language, context, history)}` }, { role: 'user', content: dto.message }] }) });
          const payload = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
          if (res.ok && payload.choices?.[0]?.message?.content) reply = payload.choices[0].message.content;
        }
      }
    } catch (error) { this.logger.warn(`AI request failed: ${(error as Error).message}`); }
    await this.valkey.push(`chatbot:conversation:${conversationId}`, JSON.stringify({ role: 'user', content: dto.message }));
    await this.valkey.push(`chatbot:conversation:${conversationId}`, JSON.stringify({ role: 'assistant', content: reply }));
    return { reply, suggestions: ['View packages', 'Umrah information', 'Book a ticket', 'Contact support'], packages: relevantPackages, links: [{ label: 'Book a service', url: '#smart-form' }, { label: 'Contact support', url: '#smart-form' }] };
  }

  private fallback(message: string, packages: Array<{ title: string; price: number | null; currency: string | null; duration: string | null; description: string }>, faqs: Array<{ question: string; answer: string }>, gallery: Array<{ title: string; description: string }>) {
    const lower = message.toLowerCase();
    if (lower.includes('refund') || lower.includes('cancel')) return policy;
    if (lower.includes('book') || lower.includes('order') || lower.includes('pay')) return 'To book: choose a package or service, click Book Now, complete the smart form, then choose Pay Now through Chapa or Pay Later. You can track the request in My Requests.';
    if (lower.includes('photo') || lower.includes('gallery')) return gallery.length ? `Recent TOGT travel highlights include ${gallery.map((item) => item.title).join(', ')}.` : 'Our gallery is being updated. Contact support for recent trip photos.';
    if (lower.includes('visa') || lower.includes('document')) { const faq = faqs.find((item) => `${item.question} ${item.answer}`.toLowerCase().includes('visa') || `${item.question} ${item.answer}`.toLowerCase().includes('document')); if (faq) return faq.answer; return 'Visa requirements commonly include a valid passport, recent photo, travel details, and supporting financial or purpose documents. Contact TOGT for a document review.'; }
    if (packages.length) return `We currently have ${packages.length} active packages. ${packages.slice(0, 4).map((item) => `${item.title} (${item.price ? `${item.price.toLocaleString()} ${item.currency ?? 'ETB'}` : 'custom pricing'})`).join('; ')}. Tell me your budget or destination and I can recommend one.`;
    return 'I can help with TOGT tickets, Umrah, tours, visas, packages, booking, payment, and travel support. Please contact +251 99 797 9741 if you need a team member.';
  }
}