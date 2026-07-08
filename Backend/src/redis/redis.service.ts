import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(
    key: string,
    value: string,
    options?: { ttlSeconds?: number },
  ): Promise<void> {
    if (options?.ttlSeconds) {
      await this.redisClient.set(key, value, 'EX', options.ttlSeconds);
      return;
    }
    await this.redisClient.set(key, value);
  }

  async setJson(
    key: string,
    value: unknown,
    options?: { ttlSeconds?: number },
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), options);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  /**
   * Fixed-window rate-limit counter shared across all backend instances.
   * Returns the new hit count, or null if Redis is unavailable (so the caller
   * can fall back to a local limiter). Never hangs the request (150ms cap).
   */
  async rateLimitHit(key: string, windowSeconds: number): Promise<number | null> {
    try {
      return await Promise.race([
        (async () => {
          const count = await this.redisClient.incr(key);
          if (count === 1) {
            await this.redisClient.expire(key, windowSeconds);
          }
          return count;
        })(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 150)),
      ]);
    } catch {
      return null;
    }
  }
}

