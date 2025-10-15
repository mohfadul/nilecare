/**
 * Environment Variable Validator
 *
 * Validates required environment variables at application startup
 * Prevents services from starting with missing or invalid configuration
 */
export interface EnvironmentVariable {
    name: string;
    required: boolean;
    type?: 'string' | 'number' | 'boolean' | 'url' | 'email';
    defaultValue?: string;
    validator?: (value: string) => boolean;
    description?: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Validates environment variables at startup
 * @throws Error if required variables are missing or invalid
 */
export declare function validateEnvironment(variables: EnvironmentVariable[], throwOnError?: boolean): ValidationResult;
/**
 * Common environment variable validators
 */
export declare const commonValidators: {
    port: (value: string) => boolean;
    positiveNumber: (value: string) => boolean;
    url: (value: string) => boolean;
    nonEmpty: (value: string) => boolean;
    minLength: (min: number) => (value: string) => boolean;
};
/**
 * Preset environment configurations for common services
 */
export declare const environmentPresets: {
    /**
     * Database service environment variables
     */
    database: () => EnvironmentVariable[];
    /**
     * Authentication service environment variables
     */
    authentication: () => EnvironmentVariable[];
    /**
     * Redis cache environment variables
     */
    redis: () => EnvironmentVariable[];
    /**
     * Kafka message broker environment variables
     */
    kafka: () => EnvironmentVariable[];
    /**
     * Common service environment variables
     */
    common: () => EnvironmentVariable[];
};
/**
 * Validate all environment variables for a service
 */
export declare function validateServiceEnvironment(serviceName: string, ...presets: EnvironmentVariable[][]): void;
//# sourceMappingURL=environment-validator.d.ts.map