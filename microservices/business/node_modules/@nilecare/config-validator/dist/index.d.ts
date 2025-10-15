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
export declare const commonEnvSchema: Joi.ObjectSchema<any>;
/**
 * Database schema (MySQL/PostgreSQL)
 */
export declare const databaseEnvSchema: Joi.ObjectSchema<any>;
/**
 * Redis schema
 */
export declare const redisEnvSchema: Joi.ObjectSchema<any>;
/**
 * Kafka schema
 */
export declare const kafkaEnvSchema: Joi.ObjectSchema<any>;
/**
 * Auth service specific schema
 */
export declare const authServiceEnvSchema: Joi.ObjectSchema<any>;
/**
 * Validate environment variables
 * @param schema Joi schema to validate against
 * @param env Environment object to validate (defaults to process.env)
 * @returns Validated environment object
 * @throws Error if validation fails
 */
export declare function validateEnv<T = any>(schema: Joi.ObjectSchema, env?: any): T;
/**
 * Validate environment and log success
 */
export declare function validateAndLog(schema: Joi.ObjectSchema, serviceName: string, env?: any): any;
/**
 * Check if required environment variables are set
 * (Simpler alternative to Joi validation)
 */
export declare function requireEnv(keys: string[]): void;
declare const _default: {
    validateEnv: typeof validateEnv;
    validateAndLog: typeof validateAndLog;
    requireEnv: typeof requireEnv;
};
export default _default;
