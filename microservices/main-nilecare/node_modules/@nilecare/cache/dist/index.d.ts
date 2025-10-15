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
export interface CacheConfig {
    redis: {
        host: string;
        port: number;
        password?: string;
        db?: number;
    };
    defaultTTL: number;
    prefix: string;
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    keysCount: number;
}
export declare class CacheManager {
    private client;
    private prefix;
    private defaultTTL;
    private hits;
    private misses;
    constructor(config: CacheConfig);
    /**
     * Get value from cache
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set value in cache with TTL
     */
    set(key: string, value: any, ttl?: number): Promise<boolean>;
    /**
     * Delete single key from cache
     */
    del(key: string): Promise<boolean>;
    /**
     * Delete multiple keys by pattern
     * Example: invalidatePattern('patients:*')
     */
    invalidatePattern(pattern: string): Promise<number>;
    /**
     * Get cache statistics
     */
    getStats(): Promise<CacheStats>;
    /**
     * Reset statistics
     */
    resetStats(): void;
    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;
    /**
     * Get remaining TTL for a key (in seconds)
     */
    ttl(key: string): Promise<number>;
    /**
     * Flush all keys with prefix
     */
    flushAll(): Promise<boolean>;
    /**
     * Close Redis connection
     */
    close(): Promise<void>;
    /**
     * Ping Redis to check connection
     */
    ping(): Promise<boolean>;
}
/**
 * Create cache middleware for Express
 */
export declare function createCacheMiddleware(cache: CacheManager, options?: {
    ttl?: number;
    keyGenerator?: (req: any) => string;
}): (req: any, res: any, next: any) => Promise<any>;
export default CacheManager;
