/**
 * Redis Configuration
 * For caching and pub/sub messaging
 */
import Redis from 'ioredis';
export declare const initializeRedis: () => Redis;
export declare const getRedisClient: () => Redis;
export declare const initializeRedisPubSub: () => {
    pub: Redis;
    sub: Redis;
};
export declare const closeRedis: () => Promise<void>;
declare const _default: {
    initializeRedis: () => Redis;
    getRedisClient: () => Redis;
    initializeRedisPubSub: () => {
        pub: Redis;
        sub: Redis;
    };
    closeRedis: () => Promise<void>;
};
export default _default;
//# sourceMappingURL=redis.d.ts.map