"use strict";
/**
 * Environment Variable Validator
 *
 * Validates required environment variables at application startup
 * Prevents services from starting with missing or invalid configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.environmentPresets = exports.commonValidators = void 0;
exports.validateEnvironment = validateEnvironment;
exports.validateServiceEnvironment = validateServiceEnvironment;
/**
 * Validates environment variables at startup
 * @throws Error if required variables are missing or invalid
 */
function validateEnvironment(variables, throwOnError = true) {
    const errors = [];
    const warnings = [];
    for (const variable of variables) {
        const value = process.env[variable.name];
        // Check if required variable is missing
        if (variable.required && !value) {
            errors.push(`❌ Missing required environment variable: ${variable.name}`);
            continue;
        }
        // Skip validation if value is not provided and not required
        if (!value) {
            if (variable.defaultValue) {
                warnings.push(`⚠️  Using default value for ${variable.name}: ${variable.defaultValue}`);
            }
            continue;
        }
        // Type validation
        if (variable.type) {
            const typeError = validateType(variable.name, value, variable.type);
            if (typeError) {
                errors.push(typeError);
            }
        }
        // Custom validator
        if (variable.validator) {
            try {
                if (!variable.validator(value)) {
                    errors.push(`❌ Invalid value for ${variable.name}: ${value}`);
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Validation failed';
                errors.push(`❌ Validation error for ${variable.name}: ${message}`);
            }
        }
    }
    // Log results
    if (errors.length > 0) {
        console.error('╔═══════════════════════════════════════════════════╗');
        console.error('║   ENVIRONMENT VALIDATION FAILED                   ║');
        console.error('╚═══════════════════════════════════════════════════╝');
        errors.forEach(error => console.error(error));
    }
    if (warnings.length > 0) {
        console.warn('╔═══════════════════════════════════════════════════╗');
        console.warn('║   ENVIRONMENT VALIDATION WARNINGS                 ║');
        console.warn('╚═══════════════════════════════════════════════════╝');
        warnings.forEach(warning => console.warn(warning));
    }
    if (errors.length === 0 && warnings.length === 0) {
        console.log('✅ All environment variables validated successfully');
    }
    const result = {
        valid: errors.length === 0,
        errors,
        warnings,
    };
    if (throwOnError && !result.valid) {
        throw new Error(`Environment validation failed: ${errors.join(', ')}`);
    }
    return result;
}
/**
 * Validates value type
 */
function validateType(name, value, type) {
    switch (type) {
        case 'number':
            if (isNaN(Number(value))) {
                return `❌ ${name} must be a number, got: ${value}`;
            }
            break;
        case 'boolean':
            if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
                return `❌ ${name} must be a boolean, got: ${value}`;
            }
            break;
        case 'url':
            try {
                new URL(value);
            }
            catch {
                return `❌ ${name} must be a valid URL, got: ${value}`;
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return `❌ ${name} must be a valid email, got: ${value}`;
            }
            break;
    }
    return null;
}
/**
 * Common environment variable validators
 */
exports.commonValidators = {
    port: (value) => {
        const port = Number(value);
        return port >= 1 && port <= 65535;
    },
    positiveNumber: (value) => {
        const num = Number(value);
        return !isNaN(num) && num > 0;
    },
    url: (value) => {
        try {
            new URL(value);
            return true;
        }
        catch {
            return false;
        }
    },
    nonEmpty: (value) => {
        return value.length > 0;
    },
    minLength: (min) => (value) => {
        return value.length >= min;
    },
};
/**
 * Preset environment configurations for common services
 */
exports.environmentPresets = {
    /**
     * Database service environment variables
     */
    database: () => [
        { name: 'DB_HOST', required: true, type: 'string' },
        { name: 'DB_PORT', required: true, type: 'number', validator: exports.commonValidators.port },
        { name: 'DB_NAME', required: true, type: 'string' },
        { name: 'DB_USER', required: true, type: 'string' },
        { name: 'DB_PASSWORD', required: true, type: 'string', validator: exports.commonValidators.nonEmpty },
    ],
    /**
     * Authentication service environment variables
     */
    authentication: () => [
        { name: 'JWT_SECRET', required: true, type: 'string', validator: exports.commonValidators.minLength(32) },
        { name: 'SESSION_SECRET', required: true, type: 'string', validator: exports.commonValidators.minLength(32) },
        { name: 'JWT_EXPIRES_IN', required: false, defaultValue: '24h' },
        { name: 'JWT_REFRESH_EXPIRES_IN', required: false, defaultValue: '7d' },
    ],
    /**
     * Redis cache environment variables
     */
    redis: () => [
        { name: 'REDIS_URL', required: false, type: 'url', defaultValue: 'redis://localhost:6379' },
        { name: 'REDIS_HOST', required: false, defaultValue: 'localhost' },
        { name: 'REDIS_PORT', required: false, type: 'number', defaultValue: '6379' },
    ],
    /**
     * Kafka message broker environment variables
     */
    kafka: () => [
        { name: 'KAFKA_BROKER', required: false, defaultValue: 'localhost:9092' },
        { name: 'KAFKA_CLIENT_ID', required: false },
    ],
    /**
     * Common service environment variables
     */
    common: () => [
        { name: 'NODE_ENV', required: false, defaultValue: 'development' },
        { name: 'PORT', required: true, type: 'number', validator: exports.commonValidators.port },
        { name: 'CLIENT_URL', required: false, type: 'url', defaultValue: 'http://localhost:3000' },
        { name: 'LOG_LEVEL', required: false, defaultValue: 'info' },
    ],
};
/**
 * Validate all environment variables for a service
 */
function validateServiceEnvironment(serviceName, ...presets) {
    console.log(`\n🔍 Validating environment for ${serviceName}...\n`);
    const allVariables = presets.flat();
    const result = validateEnvironment(allVariables, true);
    if (result.valid) {
        console.log(`✅ ${serviceName} environment validated successfully\n`);
    }
}
//# sourceMappingURL=environment-validator.js.map