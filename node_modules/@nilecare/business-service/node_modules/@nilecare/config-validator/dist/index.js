"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authServiceEnvSchema = exports.kafkaEnvSchema = exports.redisEnvSchema = exports.databaseEnvSchema = exports.commonEnvSchema = void 0;
exports.validateEnv = validateEnv;
exports.validateAndLog = validateAndLog;
exports.requireEnv = requireEnv;
const joi_1 = __importDefault(require("joi"));
/**
 * Common environment schema for all NileCare services
 */
exports.commonEnvSchema = joi_1.default.object({
    // Service basics
    NODE_ENV: joi_1.default.string()
        .valid('development', 'production', 'test', 'staging')
        .default('development'),
    SERVICE_NAME: joi_1.default.string().required(),
    PORT: joi_1.default.number().integer().min(1000).max(65535).required(),
    // Authentication
    AUTH_SERVICE_URL: joi_1.default.string().uri().required(),
    AUTH_SERVICE_API_KEY: joi_1.default.string().length(64).required(),
    // Logging
    LOG_LEVEL: joi_1.default.string()
        .valid('error', 'warn', 'info', 'http', 'debug')
        .default('info'),
    LOG_DIR: joi_1.default.string().default('logs'),
    LOG_AUTH: joi_1.default.boolean().default(false),
    // CORS (optional)
    CORS_ORIGIN: joi_1.default.string().default('*'),
    // Rate limiting (optional)
    RATE_LIMIT_WINDOW_MS: joi_1.default.number().default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: joi_1.default.number().default(100)
}).unknown(true); // Allow unknown keys for service-specific vars
/**
 * Database schema (MySQL/PostgreSQL)
 */
exports.databaseEnvSchema = exports.commonEnvSchema.keys({
    DB_HOST: joi_1.default.string().required(),
    DB_PORT: joi_1.default.number().integer().min(1000).max(65535).required(),
    DB_USER: joi_1.default.string().required(),
    DB_PASSWORD: joi_1.default.string().allow('').optional(),
    DB_NAME: joi_1.default.string().required(),
    DB_CONNECTION_LIMIT: joi_1.default.number().integer().default(10)
});
/**
 * Redis schema
 */
exports.redisEnvSchema = exports.commonEnvSchema.keys({
    REDIS_HOST: joi_1.default.string().default('localhost'),
    REDIS_PORT: joi_1.default.number().integer().default(6379),
    REDIS_PASSWORD: joi_1.default.string().allow('').optional(),
    REDIS_DB: joi_1.default.number().integer().default(0)
});
/**
 * Kafka schema
 */
exports.kafkaEnvSchema = exports.commonEnvSchema.keys({
    KAFKA_BROKERS: joi_1.default.string().required(),
    KAFKA_CLIENT_ID: joi_1.default.string().required(),
    KAFKA_GROUP_ID: joi_1.default.string().optional()
});
/**
 * Auth service specific schema
 */
exports.authServiceEnvSchema = exports.databaseEnvSchema.keys({
    JWT_SECRET: joi_1.default.string().min(32).required(),
    JWT_EXPIRY: joi_1.default.string().default('24h'),
    JWT_REFRESH_EXPIRY: joi_1.default.string().default('7d'),
    // Email (optional)
    SMTP_HOST: joi_1.default.string().optional(),
    SMTP_PORT: joi_1.default.number().integer().optional(),
    SMTP_USER: joi_1.default.string().optional(),
    SMTP_PASSWORD: joi_1.default.string().optional(),
    SMTP_FROM: joi_1.default.string().email().optional(),
    // Session
    SESSION_SECRET: joi_1.default.string().min(32).optional(),
    SESSION_MAX_AGE: joi_1.default.number().integer().default(86400000) // 24 hours
});
/**
 * Validate environment variables
 * @param schema Joi schema to validate against
 * @param env Environment object to validate (defaults to process.env)
 * @returns Validated environment object
 * @throws Error if validation fails
 */
function validateEnv(schema, env = process.env) {
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
    return value;
}
/**
 * Validate environment and log success
 */
function validateAndLog(schema, serviceName, env = process.env) {
    console.log(`[${serviceName}] Validating environment configuration...`);
    try {
        const config = validateEnv(schema, env);
        console.log(`[${serviceName}] ✅ Environment validation passed`);
        console.log(`[${serviceName}] Environment: ${config.NODE_ENV}`);
        console.log(`[${serviceName}] Port: ${config.PORT}`);
        console.log(`[${serviceName}] Log Level: ${config.LOG_LEVEL}`);
        return config;
    }
    catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}
/**
 * Check if required environment variables are set
 * (Simpler alternative to Joi validation)
 */
function requireEnv(keys) {
    const missing = [];
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
exports.default = { validateEnv, validateAndLog, requireEnv };
