/**
 * Payment Gateway Environment Validation
 * ✅ Phase 2: Comprehensive environment variable validation
 */

import Joi from 'joi';

/**
 * Payment Gateway specific environment schema
 */
export const paymentGatewayEnvSchema = Joi.object({
  // Service basics
  SERVICE_NAME: Joi.string().required(),
  PORT: Joi.number().default(7030),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // Authentication (Phase 1: Centralized)
  AUTH_SERVICE_URL: Joi.string().uri().required(),
  AUTH_SERVICE_API_KEY: Joi.string().min(32).required(),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_CONNECTION_POOL_MAX: Joi.number().default(50),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().default(2),

  // Payment Security
  PAYMENT_ENCRYPTION_KEY: Joi.string().length(64).pattern(/^[0-9a-f]{64}$/i).required()
    .messages({
      'string.length': 'PAYMENT_ENCRYPTION_KEY must be 64 hex characters',
      'string.pattern.base': 'PAYMENT_ENCRYPTION_KEY must be hexadecimal'
    }),
  PAYMENT_WEBHOOK_SECRET: Joi.string().min(16).required(),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_DIR: Joi.string().default('logs'),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // Payment Providers (Optional)
  BANK_OF_KHARTOUM_API_KEY: Joi.string().optional(),
  BANK_OF_KHARTOUM_API_SECRET: Joi.string().optional(),
  ZAIN_CASH_API_KEY: Joi.string().optional(),
  ZAIN_CASH_API_SECRET: Joi.string().optional(),
  ZAIN_CASH_MERCHANT_ID: Joi.string().optional(),
  MTN_MONEY_API_KEY: Joi.string().optional(),
  MTN_MONEY_API_SECRET: Joi.string().optional(),
  SUDANI_CASH_API_KEY: Joi.string().optional(),
  SUDANI_CASH_API_SECRET: Joi.string().optional(),
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),

  // Kafka (Optional)
  KAFKA_BROKER: Joi.string().optional(),
  KAFKA_CLIENT_ID: Joi.string().optional(),
  KAFKA_GROUP_ID: Joi.string().optional(),

  // Service URLs
  BILLING_SERVICE_URL: Joi.string().uri().optional(),
  NOTIFICATION_SERVICE_URL: Joi.string().uri().optional(),

  // Monitoring (Phase 3 - Optional)
  ENABLE_METRICS: Joi.boolean().default(false),
  ENABLE_TRACING: Joi.boolean().default(false),
  JAEGER_AGENT_HOST: Joi.string().when('ENABLE_TRACING', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  JAEGER_AGENT_PORT: Joi.number().when('ENABLE_TRACING', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),

  // Feature flags
  ENABLE_FRAUD_DETECTION: Joi.boolean().default(true),
  ENABLE_AUTO_RECONCILIATION: Joi.boolean().default(true),
  ENABLE_WEBHOOKS: Joi.boolean().default(true)
}).unknown(true); // Allow additional env vars

/**
 * Validate payment gateway environment
 */
export function validatePaymentGatewayEnv(): void {
  const { error, value } = paymentGatewayEnvSchema.validate(process.env, {
    abortEarly: false
  });

  if (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════');
    console.error('❌ PAYMENT GATEWAY CONFIGURATION ERROR');
    console.error('═══════════════════════════════════════════════════');
    error.details.forEach((detail) => {
      console.error(`  ❌ ${detail.message}`);
    });
    console.error('');
    console.error('Please check your .env file and ensure all required');
    console.error('variables are set correctly.');
    console.error('═══════════════════════════════════════════════════');
    console.error('');
    throw new Error('Payment Gateway environment validation failed');
  }

  // Update process.env with validated and defaulted values
  Object.assign(process.env, value);

  console.log('✅ Payment Gateway environment validation passed');
}

