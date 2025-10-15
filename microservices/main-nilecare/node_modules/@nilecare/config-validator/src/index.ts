/**
 * @nilecare/config-validator
 * 
 * Environment variable validation for NileCare microservices.
 * Validates configuration on startup to fail fast if misconfigured.
 * 
 * Usage:
 * ```typescript
 * import { validateEnv, commonEnvSchema } from '@nilecare/config-validator';
 * import Joi from 'joi';
 * 
 * const config = validateEnv(commonEnvSchema.keys({
 *   DB_HOST: Joi.string().required(),
 *   DB_PORT: Joi.number().default(3306),
 *   DB_NAME: Joi.string().required()
 * }));
 * 
 * // Use validated config
 * console.log(config.DB_HOST); // TypeScript knows this exists
 * ```
 */

import Joi from 'joi';

/**
 * Common environment schema for all NileCare services
 */
export const commonEnvSchema = Joi.object({
  // Service basics
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  
  SERVICE_NAME: Joi.string().required(),
  PORT: Joi.number().integer().min(1000).max(65535).required(),
  
  // Authentication
  AUTH_SERVICE_URL: Joi.string().uri().required(),
  AUTH_SERVICE_API_KEY: Joi.string().length(64).required(),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'debug')
    .default('info'),
  LOG_DIR: Joi.string().default('logs'),
  LOG_AUTH: Joi.boolean().default(false),
  
  // CORS (optional)
  CORS_ORIGIN: Joi.string().default('*'),
  
  // Rate limiting (optional)
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100)
}).unknown(true); // Allow unknown keys for service-specific vars

/**
 * Database schema (MySQL/PostgreSQL)
 */
export const databaseEnvSchema = commonEnvSchema.keys({
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().integer().min(1000).max(65535).required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').optional(),
  DB_NAME: Joi.string().required(),
  DB_CONNECTION_LIMIT: Joi.number().integer().default(10)
});

/**
 * Redis schema
 */
export const redisEnvSchema = commonEnvSchema.keys({
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().integer().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().default(0)
});

/**
 * Kafka schema
 */
export const kafkaEnvSchema = commonEnvSchema.keys({
  KAFKA_BROKERS: Joi.string().required(),
  KAFKA_CLIENT_ID: Joi.string().required(),
  KAFKA_GROUP_ID: Joi.string().optional()
});

/**
 * Auth service specific schema
 */
export const authServiceEnvSchema = databaseEnvSchema.keys({
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRY: Joi.string().default('24h'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  
  // Email (optional)
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().integer().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SMTP_FROM: Joi.string().email().optional(),
  
  // Session
  SESSION_SECRET: Joi.string().min(32).optional(),
  SESSION_MAX_AGE: Joi.number().integer().default(86400000) // 24 hours
});

/**
 * Validate environment variables
 * @param schema Joi schema to validate against
 * @param env Environment object to validate (defaults to process.env)
 * @returns Validated environment object
 * @throws Error if validation fails
 */
export function validateEnv<T = any>(
  schema: Joi.ObjectSchema,
  env: any = process.env
): T {
  const { error, value } = schema.validate(env, {
    allowUnknown: true,
    abortEarly: false,
    stripUnknown: false
  });

  if (error) {
    const details = error.details
      .map(d => `  ❌ ${d.message}`)
      .join('\n');
    
    const message = `
═══════════════════════════════════════════════════
❌ ENVIRONMENT VALIDATION FAILED
═══════════════════════════════════════════════════

${details}

Service cannot start with invalid configuration.
Please check your .env file and ensure all required
variables are set correctly.

═══════════════════════════════════════════════════
`;

    throw new Error(message);
  }

  return value as T;
}

/**
 * Validate environment and log success
 */
export function validateAndLog(
  schema: Joi.ObjectSchema,
  serviceName: string,
  env: any = process.env
): any {
  console.log(`[${serviceName}] Validating environment configuration...`);
  
  try {
    const config = validateEnv(schema, env);
    console.log(`[${serviceName}] ✅ Environment validation passed`);
    console.log(`[${serviceName}] Environment: ${config.NODE_ENV}`);
    console.log(`[${serviceName}] Port: ${config.PORT}`);
    console.log(`[${serviceName}] Log Level: ${config.LOG_LEVEL}`);
    
    return config;
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

/**
 * Check if required environment variables are set
 * (Simpler alternative to Joi validation)
 */
export function requireEnv(keys: string[]): void {
  const missing: string[] = [];
  
  keys.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    const message = `
❌ Missing required environment variables:
${missing.map(k => `  - ${k}`).join('\n')}

Please set these variables in your .env file.
`;
    throw new Error(message);
  }
}

export default { validateEnv, validateAndLog, requireEnv };

