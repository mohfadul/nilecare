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
export function validateEnvironment(
  variables: EnvironmentVariable[],
  throwOnError: boolean = true
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
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
      } catch (error: unknown) {
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
  
  const result: ValidationResult = {
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
function validateType(
  name: string,
  value: string,
  type: string
): string | null {
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
      } catch {
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
export const commonValidators = {
  port: (value: string) => {
    const port = Number(value);
    return port >= 1 && port <= 65535;
  },
  
  positiveNumber: (value: string) => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  },
  
  url: (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  
  nonEmpty: (value: string) => {
    return value.length > 0;
  },
  
  minLength: (min: number) => (value: string) => {
    return value.length >= min;
  },
};

/**
 * Preset environment configurations for common services
 */
export const environmentPresets = {
  /**
   * Database service environment variables
   */
  database: (): EnvironmentVariable[] => [
    { name: 'DB_HOST', required: true, type: 'string' },
    { name: 'DB_PORT', required: true, type: 'number', validator: commonValidators.port },
    { name: 'DB_NAME', required: true, type: 'string' },
    { name: 'DB_USER', required: true, type: 'string' },
    { name: 'DB_PASSWORD', required: true, type: 'string', validator: commonValidators.nonEmpty },
  ],
  
  /**
   * Authentication service environment variables
   */
  authentication: (): EnvironmentVariable[] => [
    { name: 'JWT_SECRET', required: true, type: 'string', validator: commonValidators.minLength(32) },
    { name: 'SESSION_SECRET', required: true, type: 'string', validator: commonValidators.minLength(32) },
    { name: 'JWT_EXPIRES_IN', required: false, defaultValue: '24h' },
    { name: 'JWT_REFRESH_EXPIRES_IN', required: false, defaultValue: '7d' },
  ],
  
  /**
   * Redis cache environment variables
   */
  redis: (): EnvironmentVariable[] => [
    { name: 'REDIS_URL', required: false, type: 'url', defaultValue: 'redis://localhost:6379' },
    { name: 'REDIS_HOST', required: false, defaultValue: 'localhost' },
    { name: 'REDIS_PORT', required: false, type: 'number', defaultValue: '6379' },
  ],
  
  /**
   * Kafka message broker environment variables
   */
  kafka: (): EnvironmentVariable[] => [
    { name: 'KAFKA_BROKER', required: false, defaultValue: 'localhost:9092' },
    { name: 'KAFKA_CLIENT_ID', required: false },
  ],
  
  /**
   * Common service environment variables
   */
  common: (): EnvironmentVariable[] => [
    { name: 'NODE_ENV', required: false, defaultValue: 'development' },
    { name: 'PORT', required: true, type: 'number', validator: commonValidators.port },
    { name: 'CLIENT_URL', required: false, type: 'url', defaultValue: 'http://localhost:3000' },
    { name: 'LOG_LEVEL', required: false, defaultValue: 'info' },
  ],
};

/**
 * Validate all environment variables for a service
 */
export function validateServiceEnvironment(
  serviceName: string,
  ...presets: EnvironmentVariable[][]
): void {
  console.log(`\n🔍 Validating environment for ${serviceName}...\n`);
  
  const allVariables = presets.flat();
  const result = validateEnvironment(allVariables, true);
  
  if (result.valid) {
    console.log(`✅ ${serviceName} environment validated successfully\n`);
  }
}

