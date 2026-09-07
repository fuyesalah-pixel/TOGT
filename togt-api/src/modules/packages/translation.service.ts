import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CredentialService } from '../system/credential.service';

type Language = 'ar' | 'am';
type PackageSource = { title: string; description: string; includes: string[]; excludes: string[] };

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly credentials: CredentialService) {}

  async translatePackage(id: string) {
    const pkg = await this.prisma.package.findUnique({ where: { id }, select: { title: true, description: true, includes: true, excludes: true } });
    if (!pkg) return;
    await this.prisma.package.update({ where: { id }, data: { translationStatus: 'IN_PROGRESS' } });
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const [ar, am] = await Promise.all([this.translate(pkg, 'ar'), this.translate(pkg, 'am')]);
        await this.prisma.package.update({ where: { id }, data: { ...this.fields('ar', ar), ...this.fields('am', am), translationStatus: 'COMPLETED', translationAttempts: attempt } });
        return;
      } catch (error) {
        this.logger.warn(`Package ${id} translation attempt ${attempt} failed: ${(error as Error).message}`);
        if (attempt === 3) await this.prisma.package.update({ where: { id }, data: { translationStatus: 'FAILED', translationAttempts: attempt } });
      }
    }
  }

  async translateFaq(id: string) {
    const item = await this.prisma.fAQItem.findUnique({ where: { id }, select: { question: true, answer: true } });
    if (!item) return;
    try {
      const [ar, am] = await Promise.all([this.translateFields(item, 'ar'), this.translateFields(item, 'am')]);
      await this.prisma.fAQItem.update({ where: { id }, data: { questionAr: ar.question, answerAr: ar.answer, questionAm: am.question, answerAm: am.answer } });
    } catch (error) { this.logger.warn(`FAQ ${id} translation failed: ${(error as Error).message}`); }
  }

  async translateGallery(id: string) {
    const item = await this.prisma.galleryItem.findUnique({ where: { id }, select: { title: true, category: true, location: true, description: true } });
    if (!item) return;
    try {
      const [ar, am] = await Promise.all([this.translateFields(item, 'ar'), this.translateFields(item, 'am')]);
      await this.prisma.galleryItem.update({ where: { id }, data: { titleAr: ar.title, categoryAr: ar.category, locationAr: ar.location, descriptionAr: ar.description, titleAm: am.title, categoryAm: am.category, locationAm: am.location, descriptionAm: am.description } });
    } catch (error) { this.logger.warn(`Gallery ${id} translation failed: ${(error as Error).message}`); }
  }

  private fields(language: Language, value: PackageSource) {
    return language === 'ar'
      ? { titleAr: value.title, descriptionAr: value.description, includesAr: value.includes, excludesAr: value.excludes }
      : { titleAm: value.title, descriptionAm: value.description, includesAm: value.includes, excludesAm: value.excludes };
  }

  private async translate(source: PackageSource, language: Language): Promise<PackageSource> {
    const parsed = await this.translateFields(source, language);
    return { title: String(parsed.title ?? source.title), description: String(parsed.description ?? source.description), includes: Array.isArray(parsed.includes) ? parsed.includes.map(String) : source.includes, excludes: Array.isArray(parsed.excludes) ? parsed.excludes.map(String) : source.excludes };
  }

  private async translateFields(source: Record<string, unknown>, language: Language): Promise<Record<string, any>> {
    const apiKey = await this.credentials.get('OPENROUTER');
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');
    const target = language === 'ar' ? 'Modern Standard Arabic' : 'natural professional Amharic using Ethiopic script';
    const model = this.config.get<string>(language === 'ar' ? 'openRouter.arabicModel' : 'openRouter.amharicModel');
    const response = await fetch(`${this.config.get<string>('openRouter.baseUrl')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://travel.togttrading.com', 'X-Title': 'TOGT Tour and Travel' },
      body: JSON.stringify({ model, temperature: 0.35, response_format: { type: 'json_object' }, messages: [
        { role: 'system', content: `You are a native ${target} travel copywriter. Translate meaning naturally, not word-for-word. Keep TOGT, IATA, prices, dates, and proper names unchanged. Return only JSON with the same keys as the input. Preserve arrays as arrays.` },
        { role: 'user', content: JSON.stringify(source) },
      ] }),
    });
    if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenRouter returned no translation');
    return JSON.parse(content) as Record<string, any>;
  }
}
