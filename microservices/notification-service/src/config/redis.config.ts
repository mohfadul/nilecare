/**
 * Redis Configuration
 * For Bull queues and caching
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger';
import SecretsConfig from './secrets.config';

let redisClient: Redis | null = null;

/**
 * Get Redis client
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const config = SecretsConfig.getRedisConfig();

    redisClient = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      tls: config.tls,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry attempt ${times}`, { delay });
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected', {
        host: config.host,
        port: config.port,
      });
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { 
        error: err.message,
        stack: err.stack 
      });
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    logger.info('Redis client initialized', {
      host: config.host,
      port: config.port,
      db: config.db,
    });
  }

  return redisClient;
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    if (pong === 'PONG') {
      logger.info('✅ Redis connection test successful');
      return true;
    }
    return false;
  } catch (error: any) {
    logger.error('❌ Redis connection test failed', { 
      error: error.message 
    });
    return false;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

/**
 * Get Redis configuration for Bull queues
 */
export function getBullRedisConfig() {
  const config = SecretsConfig.getRedisConfig();
  return {
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    tls: config.tls,
  };
}

export default {
  getRedisClient,
  testRedisConnection,
  closeRedis,
  getBullRedisConfig,
};

