/**
 * Environment Configuration
 * Validates and exports all environment variables
 */
interface EnvConfig {
    NODE_ENV: string;
    PORT: number;
    SERVICE_NAME: string;
    SERVICE_VERSION: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_SSL: boolean;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD?: string;
    REDIS_DB: number;
    MQTT_BROKER_URL: string;
    MQTT_USERNAME?: string;
    MQTT_PASSWORD?: string;
    HL7_SERVER_URL: string;
    HL7_API_KEY: string;
    FHIR_SERVER_URL: string;
    FHIR_API_KEY: string;
    AUTH_SERVICE_URL: string;
    FACILITY_SERVICE_URL: string;
    NOTIFICATION_SERVICE_URL: string;
    INVENTORY_SERVICE_URL: string;
    EHR_SERVICE_URL: string;
    JWT_PUBLIC_KEY_PATH?: string;
    JWT_SECRET: string;
    SERVICE_API_KEY: string;
    ALLOWED_ORIGINS: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    MAX_DEVICES_PER_FACILITY: number;
    DEVICE_TIMEOUT_SECONDS: number;
    DEVICE_HEARTBEAT_INTERVAL: number;
    LOG_LEVEL: string;
    LOG_FILE_PATH: string;
    FEATURE_REAL_TIME_STREAMING: boolean;
    FEATURE_WAVEFORM_CAPTURE: boolean;
    DEV_MOCK_DEVICES: boolean;
    DEV_BYPASS_AUTH: boolean;
}
export declare const config: EnvConfig;
export declare const validateConfig: () => void;
export default config;
//# sourceMappingURL=env.d.ts.map