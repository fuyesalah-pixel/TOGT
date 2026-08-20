import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Valkey (Redis-compatible) client used for refresh-token storage,
 * JWT blacklist and light caching.
 */
@Injectable()
export class ValkeyService implements OnModuleDestroy {
  private readonly logger = new Logger(ValkeyService.name);
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(config.get<string>('valkeyUrl') ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
    this.client.on('error', (err) => this.logger.error(`Valkey error: ${err.message}`));
    this.client.connect().catch((err) => this.logger.error(`Valkey connect failed: ${err.message}`));
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /** Set with optional TTL in seconds */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Delete all keys matching a glob pattern, e.g. "refresh:123:*" */
  async delPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
