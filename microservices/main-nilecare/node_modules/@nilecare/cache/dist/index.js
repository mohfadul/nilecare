"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
exports.createCacheMiddleware = createCacheMiddleware;
const ioredis_1 = __importDefault(require("ioredis"));
class CacheManager {
    constructor(config) {
        this.hits = 0;
        this.misses = 0;
        this.client = new ioredis_1.default({
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
    async get(key) {
        const fullKey = `${this.prefix}${key}`;
        try {
            const value = await this.client.get(fullKey);
            if (!value) {
                this.misses++;
                return null;
            }
            this.hits++;
            try {
                return JSON.parse(value);
            }
            catch {
                // If not JSON, return as-is
                return value;
            }
        }
        catch (error) {
            console.error('Cache get error:', error);
            this.misses++;
            return null;
        }
    }
    /**
     * Set value in cache with TTL
     */
    async set(key, value, ttl) {
        const fullKey = `${this.prefix}${key}`;
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        const expiry = ttl || this.defaultTTL;
        try {
            await this.client.setex(fullKey, expiry, serialized);
            return true;
        }
        catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }
    /**
     * Delete single key from cache
     */
    async del(key) {
        const fullKey = `${this.prefix}${key}`;
        try {
            const result = await this.client.del(fullKey);
            return result > 0;
        }
        catch (error) {
            console.error('Cache del error:', error);
            return false;
        }
    }
    /**
     * Delete multiple keys by pattern
     * Example: invalidatePattern('patients:*')
     */
    async invalidatePattern(pattern) {
        const fullPattern = `${this.prefix}${pattern}`;
        try {
            const keys = await this.client.keys(fullPattern);
            if (keys.length === 0) {
                return 0;
            }
            await this.client.del(...keys);
            return keys.length;
        }
        catch (error) {
            console.error('Cache invalidatePattern error:', error);
            return 0;
        }
    }
    /**
     * Get cache statistics
     */
    async getStats() {
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
        }
        catch (error) {
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
    resetStats() {
        this.hits = 0;
        this.misses = 0;
    }
    /**
     * Check if key exists
     */
    async exists(key) {
        const fullKey = `${this.prefix}${key}`;
        try {
            const result = await this.client.exists(fullKey);
            return result === 1;
        }
        catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }
    }
    /**
     * Get remaining TTL for a key (in seconds)
     */
    async ttl(key) {
        const fullKey = `${this.prefix}${key}`;
        try {
            return await this.client.ttl(fullKey);
        }
        catch (error) {
            console.error('Cache ttl error:', error);
            return -1;
        }
    }
    /**
     * Flush all keys with prefix
     */
    async flushAll() {
        try {
            const keys = await this.client.keys(`${this.prefix}*`);
            if (keys.length === 0) {
                return true;
            }
            await this.client.del(...keys);
            this.resetStats();
            return true;
        }
        catch (error) {
            console.error('Cache flushAll error:', error);
            return false;
        }
    }
    /**
     * Close Redis connection
     */
    async close() {
        await this.client.quit();
    }
    /**
     * Ping Redis to check connection
     */
    async ping() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            return false;
        }
    }
}
exports.CacheManager = CacheManager;
/**
 * Create cache middleware for Express
 */
function createCacheMiddleware(cache, options) {
    return async (req, res, next) => {
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
        res.json = (data) => {
            // Cache the response
            cache.set(cacheKey, data, options?.ttl);
            return originalJson(data);
        };
        next();
    };
}
exports.default = CacheManager;
