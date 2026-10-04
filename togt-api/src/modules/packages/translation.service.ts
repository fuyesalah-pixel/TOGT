import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CredentialService } from '../system/credential.service';

export type Language = 'ar' | 'am' | 'om';
type PackageSource = { title: string; description: string; includes: string[]; excludes: string[] };
export type TextTranslations = Record<'ar' | 'am' | 'om', string>;

/**
 * Shared company context injected into every translation request. The model
 * must understand WHO we are and WHAT the text describes before translating,
 * so output reads like a native travel copywriter wrote it — never a
 * word-by-word swap. (TOGT = IATA-accredited Ethiopian travel agency.)
 */
const COMPANY_CONTEXT = `Company context: TOGT Tour & Travel (travel.togttrading.com) is a full-service, IATA-accredited travel agency based in Addis Ababa, Ethiopia, operated by Tsegababu Ogre General Trading. We guide Ethiopian pilgrims on Umrah and Hajj trips to Makkah and Medina, issue official airline tickets worldwide, process visas, and organize domestic tours across Ethiopia and international tours abroad. Our customers are Ethiopian Muslims and travelers; a "package" is an Umrah/tour bundle with hotel, transport and a guide, a "guide" is the group leader during the trip, and prices are usually quoted in ETB (Ethiopian Birr) or USD. Translate so an Ethiopian reader immediately understands this travel context — convey the meaning naturally in polished, professional marketing language used by the travel industry, never a word-by-word substitution. Keep brand names (TOGT, Tsegababu Ogre), IATA airport codes, prices, currencies, dates, and personal names unchanged.`;

const LANGUAGES: { code: Language; target: string; configKey: string }[] = [
  { code: 'ar', target: 'Modern Standard Arabic', configKey: 'openRouter.arabicModel' },
  { code: 'am', target: 'natural professional Amharic using Ethiopic script', configKey: 'openRouter.amharicModel' },
  { code: 'om', target: 'natural Afaan Oromoo (Oromiffa) written in Qubee (Latin) script', configKey: 'openRouter.oromoModel' },
];

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
        const [ar, am, om] = await Promise.all([this.translate(pkg, 'ar'), this.translate(pkg, 'am'), this.translate(pkg, 'om')]);
        await this.prisma.package.update({ where: { id }, data: { ...this.fields('ar', ar), ...this.fields('am', am), ...this.fields('om', om), translationStatus: 'COMPLETED', translationAttempts: attempt } });
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
      const [ar, am, om] = await Promise.all([this.translateFields(item, 'ar'), this.translateFields(item, 'am'), this.translateFields(item, 'om')]);
      await this.prisma.fAQItem.update({ where: { id }, data: { questionAr: ar.question, answerAr: ar.answer, questionAm: am.question, answerAm: am.answer, questionOm: om.question, answerOm: om.answer } });
    } catch (error) { this.logger.warn(`FAQ ${id} translation failed: ${(error as Error).message}`); }
  }

  async translateGallery(id: string) {
    const item = await this.prisma.galleryItem.findUnique({ where: { id }, select: { title: true, category: true, location: true, description: true } });
    if (!item) return;
    try {
      const [ar, am, om] = await Promise.all([this.translateFields(item, 'ar'), this.translateFields(item, 'am'), this.translateFields(item, 'om')]);
      await this.prisma.galleryItem.update({ where: { id }, data: { titleAr: ar.title, categoryAr: ar.category, locationAr: ar.location, descriptionAr: ar.description, titleAm: am.title, categoryAm: am.category, locationAm: am.location, descriptionAm: am.description, titleOm: om.title, categoryOm: om.category, locationOm: om.location, descriptionOm: om.description } });
    } catch (error) { this.logger.warn(`Gallery ${id} translation failed: ${(error as Error).message}`); }
  }

  /**
   * Translate one free-text block (e.g. the About page copy) into all three
   * target languages. Used by site-settings: the admin saves the English
   * (or source-language) text once, we store ABOUT_TEXT_AR/AM/OM and the
   * website serves the stored translation on language switch — the AI is
   * never called per visitor.
   */
  async translateText(text: string): Promise<TextTranslations> {
    const source = { text };
    const results = await Promise.all(LANGUAGES.map(async ({ code }) => {
      const parsed = await this.translateFields(source, code);
      return [code, String(parsed.text ?? text)] as const;
    }));
    return Object.fromEntries(results) as unknown as TextTranslations;
  }

  private fields(language: Language, value: PackageSource) {
    switch (language) {
      case 'ar': return { titleAr: value.title, descriptionAr: value.description, includesAr: value.includes, excludesAr: value.excludes };
      case 'am': return { titleAm: value.title, descriptionAm: value.description, includesAm: value.includes, excludesAm: value.excludes };
      default: return { titleOm: value.title, descriptionOm: value.description, includesOm: value.includes, excludesOm: value.excludes };
    }
  }

  private async translate(source: PackageSource, language: Language): Promise<PackageSource> {
    const parsed = await this.translateFields(source, language);
    return { title: String(parsed.title ?? source.title), description: String(parsed.description ?? source.description), includes: Array.isArray(parsed.includes) ? parsed.includes.map(String) : source.includes, excludes: Array.isArray(parsed.excludes) ? parsed.excludes.map(String) : source.excludes };
  }

  private async translateFields(source: Record<string, unknown>, language: Language): Promise<Record<string, any>> {
    const apiKey = await this.credentials.get('OPENROUTER');
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');
    const meta = LANGUAGES.find((entry) => entry.code === language)!;
    const model = this.config.get<string>(meta.configKey) ?? 'google/gemini-2.5-flash';
    const response = await fetch(`${this.config.get<string>('openRouter.baseUrl')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://travel.togttrading.com', 'X-Title': 'TOGT Tour and Travel' },
      body: JSON.stringify({ model, temperature: 0.35, response_format: { type: 'json_object' }, messages: [
        { role: 'system', content: `You are a native ${meta.target} travel copywriter for TOGT Tour & Travel.\n\n${COMPANY_CONTEXT}\n\nFirst understand what the text says about our trips and services, then rewrite it as a skilled local copywriter would. Return only JSON with the same keys as the input. Preserve arrays as arrays.` },
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
