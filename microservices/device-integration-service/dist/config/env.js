"use strict";
/**
 * Environment Configuration
 * Validates and exports all environment variables
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getEnvVar = (key, defaultValue) => {
    const value = process.env[key] || defaultValue;
    if (value === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};
const getEnvVarOptional = (key, defaultValue) => {
    return process.env[key] || defaultValue;
};
const getEnvVarInt = (key, defaultValue) => {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
};
const getEnvVarBool = (key, defaultValue = false) => {
    const value = process.env[key];
    return value ? value === 'true' : defaultValue;
};
exports.config = {
    // Service
    NODE_ENV: getEnvVar('NODE_ENV', 'development'),
    PORT: getEnvVarInt('PORT', 7009),
    SERVICE_NAME: getEnvVar('SERVICE_NAME', 'device-integration-service'),
    SERVICE_VERSION: getEnvVar('SERVICE_VERSION', '1.0.0'),
    // Database
    DB_HOST: getEnvVar('DB_HOST'),
    DB_PORT: getEnvVarInt('DB_PORT', 5432),
    DB_NAME: getEnvVar('DB_NAME'),
    DB_USER: getEnvVar('DB_USER'),
    DB_PASSWORD: getEnvVar('DB_PASSWORD'),
    DB_SSL: getEnvVarBool('DB_SSL', false),
    // Redis
    REDIS_HOST: getEnvVar('REDIS_HOST', 'localhost'),
    REDIS_PORT: getEnvVarInt('REDIS_PORT', 6379),
    REDIS_PASSWORD: getEnvVarOptional('REDIS_PASSWORD'),
    REDIS_DB: getEnvVarInt('REDIS_DB', 3),
    // MQTT
    MQTT_BROKER_URL: getEnvVar('MQTT_BROKER_URL', 'mqtt://localhost:1883'),
    MQTT_USERNAME: getEnvVarOptional('MQTT_USERNAME'),
    MQTT_PASSWORD: getEnvVarOptional('MQTT_PASSWORD'),
    // HL7
    HL7_SERVER_URL: getEnvVar('HL7_SERVER_URL'),
    HL7_API_KEY: getEnvVar('HL7_API_KEY'),
    // FHIR
    FHIR_SERVER_URL: getEnvVar('FHIR_SERVER_URL'),
    FHIR_API_KEY: getEnvVar('FHIR_API_KEY'),
    // Microservices
    AUTH_SERVICE_URL: getEnvVar('AUTH_SERVICE_URL'),
    FACILITY_SERVICE_URL: getEnvVar('FACILITY_SERVICE_URL'),
    NOTIFICATION_SERVICE_URL: getEnvVar('NOTIFICATION_SERVICE_URL'),
    INVENTORY_SERVICE_URL: getEnvVar('INVENTORY_SERVICE_URL'),
    EHR_SERVICE_URL: getEnvVar('EHR_SERVICE_URL', 'http://localhost:7002'),
    // Authentication
    JWT_PUBLIC_KEY_PATH: getEnvVarOptional('JWT_PUBLIC_KEY_PATH'),
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    SERVICE_API_KEY: getEnvVar('SERVICE_API_KEY'),
    // CORS
    ALLOWED_ORIGINS: getEnvVar('ALLOWED_ORIGINS', 'http://localhost:3000'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: getEnvVarInt('RATE_LIMIT_WINDOW_MS', 900000),
    RATE_LIMIT_MAX_REQUESTS: getEnvVarInt('RATE_LIMIT_MAX_REQUESTS', 1000),
    // Device Configuration
    MAX_DEVICES_PER_FACILITY: getEnvVarInt('MAX_DEVICES_PER_FACILITY', 500),
    DEVICE_TIMEOUT_SECONDS: getEnvVarInt('DEVICE_TIMEOUT_SECONDS', 300),
    DEVICE_HEARTBEAT_INTERVAL: getEnvVarInt('DEVICE_HEARTBEAT_INTERVAL', 30000),
    // Logging
    LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
    LOG_FILE_PATH: getEnvVar('LOG_FILE_PATH', './logs/device-integration.log'),
    // Feature Flags
    FEATURE_REAL_TIME_STREAMING: getEnvVarBool('FEATURE_REAL_TIME_STREAMING', true),
    FEATURE_WAVEFORM_CAPTURE: getEnvVarBool('FEATURE_WAVEFORM_CAPTURE', true),
    DEV_MOCK_DEVICES: getEnvVarBool('DEV_MOCK_DEVICES', false),
    DEV_BYPASS_AUTH: getEnvVarBool('DEV_BYPASS_AUTH', false),
};
const validateConfig = () => {
    const requiredVars = [
        'DB_HOST',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'AUTH_SERVICE_URL',
        'FACILITY_SERVICE_URL',
        'NOTIFICATION_SERVICE_URL',
        'HL7_SERVER_URL',
        'FHIR_SERVER_URL',
        'JWT_SECRET',
        'SERVICE_API_KEY',
    ];
    const missing = requiredVars.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    console.log('✅ Environment configuration validated successfully');
};
exports.validateConfig = validateConfig;
exports.default = exports.config;
//# sourceMappingURL=env.js.map