/**
 * Redis Configuration
 * For caching and pub/sub messaging
 */

import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '3', 10),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

let redisClient: Redis | null = null;
let redisPubClient: Redis | null = null;
let redisSubClient: Redis | null = null;

export const initializeRedis = (): Redis => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(redisConfig);

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

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    return initializeRedis();
  }
  return redisClient;
};

export const initializeRedisPubSub = (): { pub: Redis; sub: Redis } => {
  if (redisPubClient && redisSubClient) {
    return { pub: redisPubClient, sub: redisSubClient };
  }

  redisPubClient = new Redis(redisConfig);
  redisSubClient = new Redis(redisConfig);

  redisPubClient.on('connect', () => {
    console.log('✅ Redis Pub client connected');
  });

  redisSubClient.on('connect', () => {
    console.log('✅ Redis Sub client connected');
  });

  return { pub: redisPubClient, sub: redisSubClient };
};

export const closeRedis = async (): Promise<void> => {
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

export default {
  initializeRedis,
  getRedisClient,
  initializeRedisPubSub,
  closeRedis,
};

