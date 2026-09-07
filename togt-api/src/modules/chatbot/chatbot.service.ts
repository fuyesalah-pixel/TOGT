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

  async stream(dto: AskChatbotDto, response: Response) {
    const conversationId = dto.conversationId ?? `guest-${Date.now()}`;
    const history = (await this.valkey.list(`chatbot:conversation:${conversationId}`)).reverse().map((item) => JSON.parse(item) as { role: 'user' | 'assistant'; content: string });
    const words = dto.message.toLowerCase().split(/\W+/).filter((word) => word.length > 2);
    const [packages, faqs, gallery] = await Promise.all([this.prisma.package.findMany({ where: { isActive: true }, take: 50 }), this.prisma.fAQItem.findMany({ where: { isActive: true }, take: 100 }), this.prisma.galleryItem.findMany({ take: 50, orderBy: { createdAt: 'desc' } })]);
    const score = (text: string) => words.reduce((total, word) => total + (text.toLowerCase().includes(word) ? 1 : 0), 0);
    const packageResults = packages.map((item) => ({ item, score: score(`${item.title} ${item.description} ${item.type} ${item.destination}`) })).sort((a, b) => b.score - a.score).slice(0, 5).map(({ item }) => item);
    const faqResults = faqs.map((item) => ({ item, score: score(`${item.question} ${item.answer}`) })).sort((a, b) => b.score - a.score).slice(0, 5).map(({ item }) => item);
    const galleryResults = gallery.map((item) => ({ item, score: score(`${item.title} ${item.description} ${item.category} ${item.location}`) })).sort((a, b) => b.score - a.score).slice(0, 3).map(({ item }) => item);
    const context = `Services: ${services}\nPolicies: ${policy}\nContact: +251 99 797 9741 / +251 99 797 9740, info@togttrading.com, Jemo 1, Addis Ababa.\nPackages:\n${packageResults.map((item) => `- ${item.id}: ${item.title}, ${item.price ?? 'custom'} ${item.currency ?? 'ETB'}, ${item.duration ?? 'varies'}: ${item.description}`).join('\n')}\nFAQ:\n${faqResults.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n')}\nGallery:\n${galleryResults.map((item) => `- ${item.title}: ${item.description}`).join('\n')}`;
    const language = this.language(dto.message);
    const languageRules = language === 'Amharic' ? 'Use proper Amharic script (አማርኛ), formal but friendly Ethiopian travel language, and write ETB as ብር where natural. Avoid unnecessary English words.' : language === 'Arabic' ? 'Use clear, polite Modern Standard Arabic.' : 'Use natural professional English.';
    const system = `You are Ahmed, a warm senior TOGT travel consultant. ${languageRules} Use only the supplied live context; never invent prices. Ask a follow-up when useful.\n${context}\n\nFINAL INSTRUCTION: The user wrote in ${language}. Reply entirely in ${language}${language === 'Amharic' ? ' using proper Amharic script (አማርኛ)' : ''}. Do not reply in English. Do not refuse to answer in this language. If the user sends a greeting, greet back warmly in ${language} and offer help.`;
    let text = this.fallback(dto.message, packageResults, faqResults, galleryResults);
    const meta = { packages: packageResults.map((item) => ({ id: item.id, title: item.title, description: item.description, image: item.image, price: item.price, currency: item.currency, duration: item.duration, includes: item.includes.slice(0, 4) })) };
    const writeWords = () => { for (const word of text.split(/\s+/)) response.write(`data: ${JSON.stringify({ chunk: `${word} ` })}\n\n`); };
    response.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });

    await this.valkey.push(`chatbot:conversation:${conversationId}`, JSON.stringify({ role: 'user', content: dto.message }));

    let streamed = false;
    if (language === 'Amharic') {
      const gemini = await this.geminiProvider();
      if (gemini) {
        try {
          const model = new GoogleGenerativeAI(gemini.key).getGenerativeModel({ model: gemini.model });
          const result = await model.generateContentStream(`${system}\nPrevious conversation:\n${history.map((item) => `${item.role}: ${item.content}`).join('\n')}\nUser: ${dto.message}`);
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
    response.write(`data: ${JSON.stringify({ meta })}\n\n`);
    response.write('data: [DONE]\n\n');
    response.end();
  }

  async ask(dto: AskChatbotDto) {
    const words = dto.message.toLowerCase().split(/\W+/).filter((word) => word.length > 2);
    const [packages, faqs, gallery] = await Promise.all([
      this.prisma.package.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.fAQItem.findMany({ where: { isActive: true }, orderBy: { order: 'asc' }, take: 100 }),
      this.prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    const score = (text: string) => words.reduce((total, word) => total + (text.toLowerCase().includes(word) ? 1 : 0), 0);
    const relevantPackages = packages.map((item) => ({ item, score: score(`${item.title} ${item.description} ${item.type} ${item.destination} ${item.includes.join(' ')}`) })).sort((a, b) => b.score - a.score).slice(0, 5).map(({ item }) => item);
    const relevantFaqs = faqs.map((item) => ({ item, score: score(`${item.question} ${item.answer} ${item.category}`) })).sort((a, b) => b.score - a.score).slice(0, 5).map(({ item }) => item);
    const relevantGallery = gallery.map((item) => ({ item, score: score(`${item.title} ${item.description} ${item.category} ${item.location}`) })).sort((a, b) => b.score - a.score).slice(0, 3).map(({ item }) => item);
    const context = [`Services: ${services}`, `Policies: ${policy}`, `Contact: +251 99 797 9741, +251 99 797 9740, info@togttrading.com, Jemo 1, Front of Saba Building, Addis Ababa.`, `Packages:\n${relevantPackages.map((item) => `- ${item.title}: ${item.price ?? 'custom price'} ${item.currency ?? 'ETB'}, ${item.duration ?? 'duration varies'}; ${item.description}`).join('\n')}`, `FAQ:\n${relevantFaqs.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n')}`, `Gallery:\n${relevantGallery.map((item) => `- ${item.title}: ${item.description} (${item.location ?? 'TOGT'})`).join('\n')}`].join('\n\n');
    const language = this.language(dto.message);
    let reply = this.fallback(dto.message, relevantPackages, relevantFaqs, relevantGallery);
    try {
      if (language === 'Amharic') {
        const gemini = await this.geminiProvider();
        if (gemini) {
          const model = new GoogleGenerativeAI(gemini.key).getGenerativeModel({ model: gemini.model });
          const result = await model.generateContent(`${`You are TOGT AI Assistant, a concise professional travel support agent. The user wrote in ${language}. You MUST answer in ${language}${language === 'Amharic' ? ' using proper Amharic script (አማርኛ)' : ''}. Answer only from the supplied context.\n\n${context}`}\nUser: ${dto.message}`);
          const value = result.response.text();
          if (value) reply = value;
        }
      }
      if (!reply || language !== 'Amharic') {
        const provider = await this.completionsProvider(language);
        if (provider) {
          const res = await fetch(`${provider.baseUrl}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${provider.key}`, 'Content-Type': 'application/json', ...(provider.name === 'OpenRouter' ? { 'HTTP-Referer': 'https://travel.togttrading.com', 'X-Title': 'TOGT Tour and Travel' } : {}) }, body: JSON.stringify({ model: provider.model, temperature: 0.2, messages: [{ role: 'system', content: `You are TOGT AI Assistant, a concise professional travel support agent. The user wrote in ${language}; you MUST answer in ${language} and never switch. Answer only from the supplied context. If context is insufficient, say so and direct the customer to support.\n\n${context}` }, { role: 'user', content: dto.message }] }) });
          const payload = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
          if (res.ok && payload.choices?.[0]?.message?.content) reply = payload.choices[0].message.content;
        }
      }
    } catch (error) { this.logger.warn(`AI request failed: ${(error as Error).message}`); }
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