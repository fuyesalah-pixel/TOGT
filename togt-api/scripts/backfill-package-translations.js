require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const apiKey = process.env.OPENROUTER_API_KEY;
const endpoint = `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`;

async function translate(source, language) {
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');
  const languageName = language === 'ar' ? 'natural Modern Standard Arabic' : 'natural Amharic using Ethiopic script';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://travel.togttrading.com',
      'X-Title': 'TOGT Tour and Travel',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `You are a native ${languageName} travel copywriter. Understand the idea before writing. Do not translate word-for-word. Use a warm, professional travel-agency tone. Keep TOGT, IATA, prices, numbers, dates, and proper names accurate. Return valid JSON only with title, description, includes, and excludes.` },
        { role: 'user', content: JSON.stringify(source) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned no content');
  return JSON.parse(String(content).replace(/^```json\s*/, '').replace(/\s*```$/, ''));
}

async function main() {
  const packages = await prisma.package.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`Found ${packages.length} packages`);
  for (const pkg of packages) {
    const source = { title: pkg.title, description: pkg.description, includes: pkg.includes, excludes: pkg.excludes };
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const [ar, am] = await Promise.all([translate(source, 'ar'), translate(source, 'am')]);
        await prisma.package.update({ where: { id: pkg.id }, data: {
          titleAr: ar.title, descriptionAr: ar.description, includesAr: ar.includes ?? [], excludesAr: ar.excludes ?? [],
          titleAm: am.title, descriptionAm: am.description, includesAm: am.includes ?? [], excludesAm: am.excludes ?? [],
          translationStatus: 'COMPLETED', translationAttempts: attempt,
        } });
        console.log(`Translated ${pkg.id}: ${pkg.title}`);
        break;
      } catch (error) {
        console.error(`Failed ${pkg.id} attempt ${attempt}: ${error.message}`);
        if (attempt === 3) await prisma.package.update({ where: { id: pkg.id }, data: { translationStatus: 'FAILED', translationAttempts: attempt } });
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
