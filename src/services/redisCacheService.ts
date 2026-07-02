import Redis from 'ioredis';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class RedisCacheService {
  private redis: Redis;
  private readonly defaultTTL: number = 5 * 60; // 5 minutes in seconds
  private fallbackCache: Map<string, CacheEntry<any>> = new Map();

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis connected');
    });

    // Throttle error logging to prevent spam
    let lastErrorTime = 0;
    this.redis.on('error', (err) => {
      const now = Date.now();
      // Only log once per 10 seconds
      if (now - lastErrorTime > 10000) {
        console.warn('⚠️ Redis connection error, falling back to in-memory cache:', err.message);
        lastErrorTime = now;
      }
    });
  }

  /**
   * Check if Redis is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Check Redis availability cache
    if (!this.redisAvailable && (await this.isAvailable())) {
      this.redisAvailable = true;
    }

    // If Redis is not available, use fallback immediately
    if (!this.redisAvailable) {
      return this.getFromFallback(key);
    }

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
      return null;
    } catch (error) {
      this.redisAvailable = false;
      return this.getFromFallback(key);
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    // If Redis is not available, use fallback
    if (!this.redisAvailable) {
      return this.setInFallback(key, data, ttl);
    }

    try {
      const expiry = ttl || this.defaultTTL;
      await this.redis.setex(key, expiry, JSON.stringify(data));
    } catch (error) {
      this.redisAvailable = false;
      this.setInFallback(key, data, ttl);
    }
  }

  /**
   * Invalidate cache for a specific key pattern
   */
  async invalidate(pattern: string): Promise<void> {
    // If Redis is not available, use fallback
    if (!this.redisAvailable) {
      return this.invalidateFallback(pattern);
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      // Silently fallback without logging
    }
  }

  /**
   * Clear all cache entries matching pattern
   */
  async clear(pattern?: string): Promise<void> {
    // If Redis is not available, use fallback
    if (!this.redisAvailable) {
      if (pattern) {
        this.invalidateFallback(pattern);
      } else {
        this.fallbackCache.clear();
      }
      return;
    }

    try {
      if (pattern) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        await this.redis.flushdb();
      }
    } catch (error) {
      // Silently fallback without logging
      if (pattern) {
        this.invalidateFallback(pattern);
      } else {
        this.fallbackCache.clear();
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ size: number; keys: string[] }> {
    // If Redis is not available, use fallback
    if (!this.redisAvailable) {
      return this.getFallbackStats();
    }

    try {
      const dbSize = await this.redis.dbsize();
      
      return {
        size: dbSize,
        keys: [], // Redis doesn't provide keys listing efficiently
      };
    } catch {
      this.redisAvailable = false;
      return this.getFallbackStats();
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  // Fallback in-memory cache methods
  private redisAvailable = false; // Track Redis availability to avoid repeated failed calls
  private getFromFallback<T>(key: string): T | null {
    const entry = this.fallbackCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.fallbackCache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setInFallback<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL) * 1000;
    this.fallbackCache.set(key, { data, expiry });
  }

  private invalidateFallback(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.fallbackCache.keys()) {
      if (regex.test(key)) {
        this.fallbackCache.delete(key);
      }
    }
  }

  private getFallbackStats(): { size: number; keys: string[] } {
    return {
      size: this.fallbackCache.size,
      keys: Array.from(this.fallbackCache.keys()),
    };
  }
}

// Singleton instance
export const redisCacheService = new RedisCacheService();