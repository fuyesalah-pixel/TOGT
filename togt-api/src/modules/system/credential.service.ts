import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDecipheriv, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const ENV_FALLBACKS: Record<string, string[]> = {
  OPENROUTER: ['OPENROUTER_API_KEY', 'OPENAI_API_KEY'],
  OPENAI: ['OPENAI_API_KEY'],
  GEMINI: ['GEMINI_API_KEY'],
  DUFFEL: ['DUFFEL_ACCESS_TOKEN'],
  CHAPA: ['CHAPA_SECRET_KEY'],
  RESEND: ['RESEND_API_KEY'],
  SMS_ETHIOPIA: ['SMS_ETHIOPIA_API_KEY', 'SMS_ETHIOPIA_TOKEN'],
  R2: ['R2_SECRET_ACCESS_KEY'],
  TELEGRAM: ['TELEGRAM_BOT_TOKEN'],
};

@Injectable()
export class CredentialService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async get(provider: string): Promise<string | undefined> {
    const row = await this.prisma.systemSecret.findUnique({ where: { provider: provider as never } });
    if (row?.enabled) return this.decrypt(row.ciphertext);
    for (const name of ENV_FALLBACKS[provider] ?? []) {
      const value = process.env[name] || this.config.get<string>(name);
      if (value) return value;
    }
    return undefined;
  }

  private decrypt(value: string) {
    const raw = this.config.get<string>('systemEncryptionKey') || process.env.SYSTEM_CONFIG_ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!raw) throw new ServiceUnavailableException('System encryption key is not configured');
    const [iv, tag, encrypted] = value.split('.');
    if (!iv || !tag || !encrypted) throw new ServiceUnavailableException('Stored credential is invalid');
    const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(raw).digest(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
  }
}
