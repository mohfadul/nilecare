/**
 * Database Environment Variable Validator
 * Ensures all required database configuration is present
 * 
 * Usage:
 *   import { validateDatabaseConfig } from '@nilecare/config-validator';
 *   validateDatabaseConfig();
 */

interface DatabaseConfig {
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate database environment variables
 * @param required - Array of required environment variable names
 * @returns ValidationResult
 */
export function validateDatabaseConfig(required: string[] = []): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Default required variables
  const defaultRequired = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];

  const requiredVars = required.length > 0 ? required : defaultRequired;

  // Check required variables
  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Validate DB_PORT is a number
  const dbPort = process.env.DB_PORT;
  if (dbPort && isNaN(parseInt(dbPort))) {
    errors.push('DB_PORT must be a valid port number');
  }

  // Validate DB_HOST is not using default
  const dbHost = process.env.DB_HOST;
  if (dbHost === 'localhost' && process.env.NODE_ENV === 'production') {
    warnings.push('DB_HOST is set to localhost in production environment');
  }

  // Validate DB_USER is not using root in production
  const dbUser = process.env.DB_USER;
  if (dbUser === 'root' && process.env.NODE_ENV === 'production') {
    errors.push('DB_USER should not be root in production environment');
  }

  // Validate DB_PASSWORD is strong enough
  const dbPassword = process.env.DB_PASSWORD;
  if (dbPassword && dbPassword.length < 16 && process.env.NODE_ENV === 'production') {
    warnings.push('DB_PASSWORD should be at least 16 characters in production');
  }

  // Check for default/weak passwords
  const weakPasswords = ['password', '123456', 'admin', 'root', 'test'];
  if (dbPassword && weakPasswords.includes(dbPassword.toLowerCase())) {
    errors.push('DB_PASSWORD is too weak or is a default password');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate and throw error if validation fails
 * Use this for strict validation on service startup
 */
export function validateDatabaseConfigOrThrow(): void {
  const result = validateDatabaseConfig();

  if (result.warnings.length > 0) {
    console.warn('⚠️  Database Configuration Warnings:');
    result.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
  }

  if (!result.valid) {
    console.error('❌ Database Configuration Errors:');
    result.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });
    throw new Error('Database configuration validation failed. Service cannot start.');
  }

  console.log('✅ Database configuration validated successfully');
}

/**
 * Get database configuration from environment
 * Throws error if any required variable is missing
 */
export function getDatabaseConfig(): DatabaseConfig {
  validateDatabaseConfigOrThrow();

  return {
    DB_HOST: process.env.DB_HOST!,
    DB_PORT: process.env.DB_PORT!,
    DB_NAME: process.env.DB_NAME!,
    DB_USER: process.env.DB_USER!,
    DB_PASSWORD: process.env.DB_PASSWORD!
  };
}

/**
 * Validate database connection string format
 */
export function validateConnectionString(connectionString: string): boolean {
  // MySQL: mysql://user:password@host:port/database
  // PostgreSQL: postgres://user:password@host:port/database
  
  const mysqlPattern = /^mysql:\/\/.+:.+@.+:\d+\/.+$/;
  const postgresPattern = /^postgres(ql)?:\/\/.+:.+@.+:\d+\/.+$/;
  
  return mysqlPattern.test(connectionString) || postgresPattern.test(connectionString);
}

/**
 * Check if database type is supported
 */
export function isSupportedDatabaseType(type: string): boolean {
  const supportedTypes = ['mysql', 'postgresql', 'postgres', 'mongodb', 'timescaledb'];
  return supportedTypes.includes(type.toLowerCase());
}

/**
 * Get database type from environment or connection string
 */
export function getDatabaseType(): string {
  const dbType = process.env.DB_TYPE;
  if (dbType) {
    return dbType.toLowerCase();
  }

  // Infer from port
  const port = parseInt(process.env.DB_PORT || '3306');
  if (port === 3306) return 'mysql';
  if (port === 5432) return 'postgresql';
  if (port === 27017) return 'mongodb';

  return 'unknown';
}

export default {
  validateDatabaseConfig,
  validateDatabaseConfigOrThrow,
  getDatabaseConfig,
  validateConnectionString,
  isSupportedDatabaseType,
  getDatabaseType
};

