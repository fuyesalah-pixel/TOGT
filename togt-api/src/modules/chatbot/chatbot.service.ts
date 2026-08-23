import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AskChatbotDto } from './dto/ask-chatbot.dto';
import { Response } from 'express';
import { ValkeyService } from '../../valkey/valkey.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

const services = 'Ticket Office, Umrah Packages, Domestic Tours, Foreigner Tours, Visa Processing, and Travel Consulting';
const policy = 'Refunds and cancellations depend on airline, visa authority, supplier, fare, and package rules. Customers should request changes through TOGT support before travel.';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly valkey: ValkeyService) {}

  private language(text: string) { return /[\u0600-\u06FF]/.test(text) ? 'Arabic' : /[\u1200-\u137F]/.test(text) ? 'Amharic' : 'English'; }

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
    const system = `You are Ahmed, a warm senior TOGT travel consultant. Speak naturally and concisely in ${language}. ${languageRules} Use only the supplied live context; never invent prices. Ask a follow-up when useful.\n${context}`;
    let text = this.fallback(dto.message, packageResults, faqResults, galleryResults);
    const geminiKey = this.config.get<string>('GEMINI_API_KEY');
    if (language === 'Amharic' && geminiKey) {
      response.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      try {
        const model = new GoogleGenerativeAI(geminiKey).getGenerativeModel({ model: this.config.get<string>('GEMINI_MODEL') ?? 'gemini-1.5-flash' });
        const result = await model.generateContentStream(`${system}\nPrevious conversation:\n${history.map((item) => `${item.role}: ${item.content}`).join('\n')}\nUser: ${dto.message}\nRespond in natural Amharic script.`);
        text = '';
        for await (const chunk of result.stream) { const part = chunk.text(); text += part; response.write(`data: ${JSON.stringify({ chunk: part })}\n\n`); }
      } catch (error) { this.logger.warn(`Gemini request failed: ${(error as Error).message}`); for (const word of text.split(/\s+/)) response.write(`data: ${JSON.stringify({ chunk: `${word} ` })}\n\n`); }
      await this.valkey.push(`chatbot:conversation:${conversationId}`, JSON.stringify({ role: 'user', content: dto.message })); await this.valkey.push(`chatbot:conversation:${conversationId}`, JSON.stringify({ role: 'assistant', content: text }));
      response.write(`data: ${JSON.stringify({ meta: { packages: packageResults.map((item) => ({ id: item.id, title: item.title, description: item.description, image: item.image, price: item.price, currency: item.currency, duration: item.duration, includes: item.includes.slice(0, 4) })) } })}\n\n`); response.write('data: [DONE]\n\n'); response.end(); return;
    }
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      try { const result = await fetch(`${this.config.get<string>('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1'}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...(this.config.get<string>('OPENAI_BASE_URL')?.includes('openrouter') ? { 'HTTP-Referer': 'https://travel.togttrading.com', 'X-Title': 'TOGT Tour and Travel' } : {}) }, body: JSON.stringify({ model: this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini', temperature: 0.7, max_tokens: 500, messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: dto.message }], tools: [{ type: 'function', function: { name: 'search_packages', description: 'Search live available packages', parameters: { type: 'object', properties: { query: { type: 'string' }, maxPrice: { type: 'number' } }, required: ['query'] } } }, { type: 'function', function: { name: 'search_faq', description: 'Search live FAQ', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } }] }) }); const payload = await result.json() as { choices?: Array<{ message?: { content?: string } }> }; text = payload.choices?.[0]?.message?.content ?? text; } catch (error) { this.logger.warn(`OpenAI request failed: ${(error as Error).message}`); }
    }
    await this.valkey.push(`chatbot:conversation:${conversationId}`, JSON.stringify({ role: 'user', content: dto.message })); await this.valkey.push(`chatbot:conversation:${conversationId}`, JSON.stringify({ role: 'assistant', content: text }));
    response.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    for (const word of text.split(/\s+/)) { response.write(`data: ${JSON.stringify({ chunk: `${word} ` })}\n\n`); await new Promise((resolve) => setTimeout(resolve, 18)); }
    response.write(`data: ${JSON.stringify({ meta: { packages: packageResults.map((item) => ({ id: item.id, title: item.title, description: item.description, image: item.image, price: item.price, currency: item.currency, duration: item.duration, includes: item.includes.slice(0, 4) })) } })}\n\n`);
    response.write('data: [DONE]\n\n'); response.end();
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
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    let reply = this.fallback(dto.message, relevantPackages, relevantFaqs, relevantGallery);
    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini', temperature: 0.2, messages: [{ role: 'system', content: `You are TOGT AI Assistant, a concise professional travel support agent. Answer only from the supplied context. If context is insufficient, say so and direct the customer to support. Respond in the user's language.\n\n${context}` }, { role: 'user', content: dto.message }] }) });
        const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        if (response.ok && payload.choices?.[0]?.message?.content) reply = payload.choices[0].message.content;
      } catch (error) { this.logger.warn(`OpenAI request failed: ${(error as Error).message}`); }
    }
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
