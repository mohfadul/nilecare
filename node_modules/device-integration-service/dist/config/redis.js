"use strict";
/**
 * Redis Configuration
 * For caching and pub/sub messaging
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeRedis = exports.initializeRedisPubSub = exports.getRedisClient = exports.initializeRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '3', 10),
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
};
let redisClient = null;
let redisPubClient = null;
let redisSubClient = null;
const initializeRedis = () => {
    if (redisClient) {
        return redisClient;
    }
    redisClient = new ioredis_1.default(redisConfig);
    redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
    });
    redisClient.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
    });
    redisClient.on('ready', () => {
        console.log('Redis client is ready');
    });
    return redisClient;
};
exports.initializeRedis = initializeRedis;
const getRedisClient = () => {
    if (!redisClient) {
        return (0, exports.initializeRedis)();
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const initializeRedisPubSub = () => {
    if (redisPubClient && redisSubClient) {
        return { pub: redisPubClient, sub: redisSubClient };
    }
    redisPubClient = new ioredis_1.default(redisConfig);
    redisSubClient = new ioredis_1.default(redisConfig);
    redisPubClient.on('connect', () => {
        console.log('✅ Redis Pub client connected');
    });
    redisSubClient.on('connect', () => {
        console.log('✅ Redis Sub client connected');
    });
    return { pub: redisPubClient, sub: redisSubClient };
};
exports.initializeRedisPubSub = initializeRedisPubSub;
const closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
    if (redisPubClient) {
        await redisPubClient.quit();
        redisPubClient = null;
    }
    if (redisSubClient) {
        await redisSubClient.quit();
        redisSubClient = null;
    }
    console.log('Redis connections closed');
};
exports.closeRedis = closeRedis;
exports.default = {
    initializeRedis: exports.initializeRedis,
    getRedisClient: exports.getRedisClient,
    initializeRedisPubSub: exports.initializeRedisPubSub,
    closeRedis: exports.closeRedis,
};
//# sourceMappingURL=redis.js.map