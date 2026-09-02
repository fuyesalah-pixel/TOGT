import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CurrencyRates {
  USD_TO_ETB: number;
  updatedAt: string;
  isFallback: boolean;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cached: { rates: CurrencyRates; expiresAt: number; all: Record<string, number> } | null = null;

  constructor(private readonly config: ConfigService) {}

  async getRates(): Promise<CurrencyRates> {
    const cached = await this.load();
    return cached.rates;
  }

  async convertToEtb(amount: number, currency: string): Promise<number> {
    if (currency.toUpperCase() === 'ETB') return amount;
    const cached = await this.load();
    const code = currency.toUpperCase();
    const usdToCurrency = cached.all[code] ?? 1;
    const usdAmount = code === 'USD' ? amount : amount / usdToCurrency;
    return usdAmount * cached.rates.USD_TO_ETB;
  }

  async convertToUsd(amount: number, currency: string): Promise<number> {
    if (currency.toUpperCase() === 'USD') return amount;
    const cached = await this.load();
    const usdToCurrency = cached.all[currency.toUpperCase()] ?? 1;
    return amount / usdToCurrency;
  }

  private async load() {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached;
    const fallback = Number(this.config.get<string>('DUFFEL_FALLBACK_ETB_RATE') ?? '55.5') || 55.5;
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error(`currency API returned ${response.status}`);
      const payload = await response.json() as { result?: string; rates?: Record<string, number> };
      if (payload.result !== 'success' || !payload.rates?.ETB) throw new Error('currency API returned no ETB rate');
      const rates: CurrencyRates = { USD_TO_ETB: payload.rates.ETB, updatedAt: new Date().toISOString(), isFallback: false };
      this.cached = { rates, all: payload.rates, expiresAt: Date.now() + 60 * 60 * 1000 };
    } catch (error) {
      this.logger.warn(`Using fallback currency rate: ${error instanceof Error ? error.message : 'unknown error'}`);
      const rates: CurrencyRates = { USD_TO_ETB: fallback, updatedAt: new Date().toISOString(), isFallback: true };
      this.cached = { rates, all: { USD: 1 }, expiresAt: Date.now() + 30 * 60 * 1000 };
    }
    return this.cached;
  }
}
