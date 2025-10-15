/**
 * @nilecare/cache
 * 
 * Redis-based caching layer with TTL, invalidation, and statistics.
 * 
 * Usage:
 * ```typescript
 * import { CacheManager } from '@nilecare/cache';
 * 
 * const cache = new CacheManager({
 *   redis: {
 *     host: 'localhost',
 *     port: 6379
 *   },
 *   defaultTTL: 300,
 *   prefix: 'nilecare:'
 * });
 * 
 * // Get/Set
 * const data = await cache.get('key');
 * await cache.set('key', { data: 'value' }, 600);
 * 
 * // Invalidate pattern
 * await cache.invalidatePattern('patients:*');
 * ```
 */

import Redis from 'ioredis';

export interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultTTL: number; // seconds
  prefix: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keysCount: number;
}

export class CacheManager {
  private client: Redis;
  private prefix: string;
  private defaultTTL: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(config: CacheConfig) {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.prefix = config.prefix;
    this.defaultTTL = config.defaultTTL;

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.prefix}${key}`;
    
    try {
      const value = await this.client.get(fullKey);
      
      if (!value) {
        this.misses++;
        return null;
      }
      
      this.hits++;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        // If not JSON, return as-is
        return value as any;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      this.misses++;
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    const fullKey = `${this.prefix}${key}`;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const expiry = ttl || this.defaultTTL;
    
    try {
      await this.client.setex(fullKey, expiry, serialized);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete single key from cache
   */
  async del(key: string): Promise<boolean> {
    const fullKey = `${this.prefix}${key}`;
    
    try {
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   * Example: invalidatePattern('patients:*')
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const fullPattern = `${this.prefix}${pattern}`;
    
    try {
      const keys = await this.client.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('Cache invalidatePattern error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.client.info('stats');
      const keysCount = await this.client.dbsize();
      
      // Parse Redis stats
      const serverHits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
      const serverMisses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');
      
      // Use application-level stats (more accurate for our use case)
      const totalRequests = this.hits + this.misses;
      const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
      
      return {
        hits: this.hits,
        misses: this.misses,
        hitRate: parseFloat(hitRate.toFixed(2)),
        keysCount
      };
    } catch (error) {
      console.error('Cache getStats error:', error);
      return {
        hits: this.hits,
        misses: this.misses,
        hitRate: 0,
        keysCount: 0
      };
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = `${this.prefix}${key}`;
    
    try {
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    const fullKey = `${this.prefix}${key}`;
    
    try {
      return await this.client.ttl(fullKey);
    } catch (error) {
      console.error('Cache ttl error:', error);
      return -1;
    }
  }

  /**
   * Flush all keys with prefix
   */
  async flushAll(): Promise<boolean> {
    try {
      const keys = await this.client.keys(`${this.prefix}*`);
      
      if (keys.length === 0) {
        return true;
      }
      
      await this.client.del(...keys);
      this.resetStats();
      return true;
    } catch (error) {
      console.error('Cache flushAll error:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}

/**
 * Create cache middleware for Express
 */
export function createCacheMiddleware(cache: CacheManager, options?: {
  ttl?: number;
  keyGenerator?: (req: any) => string;
}) {
  return async (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = options?.keyGenerator
      ? options.keyGenerator(req)
      : `${req.method}:${req.path}:${JSON.stringify(req.query)}`;

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Cache miss - intercept response
    res.setHeader('X-Cache', 'MISS');
    
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      // Cache the response
      cache.set(cacheKey, data, options?.ttl);
      return originalJson(data);
    };

    next();
  };
}

export default CacheManager;

