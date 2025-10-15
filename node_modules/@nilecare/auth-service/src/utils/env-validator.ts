/**
 * Auth Service - Environment Variable Validator
 * Validates all required environment variables on service startup
 */

import { logger } from './logger';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ============================================================================
  // DATABASE CONFIGURATION (REQUIRED)
  // ============================================================================
  const requiredDbVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  
  requiredDbVars.forEach((varName) => {
    if (!process.env[varName]) {
      errors.push(`Missing required database variable: ${varName}`);
    }
  });

  // Validate DB_PORT is a number
  const dbPort = process.env.DB_PORT;
  if (dbPort && isNaN(parseInt(dbPort))) {
    errors.push('DB_PORT must be a valid port number');
  }

  // Validate DB_NAME is for auth service
  const dbName = process.env.DB_NAME;
  if (dbName && !dbName.includes('auth')) {
    warnings.push(`DB_NAME should be 'nilecare_auth', got: ${dbName}`);
  }

  // Validate DB_USER is not root in production
  if (process.env.DB_USER === 'root' && process.env.NODE_ENV === 'production') {
    errors.push('DB_USER should not be root in production');
  }

  // Check password strength in production
  const dbPassword = process.env.DB_PASSWORD;
  if (dbPassword && dbPassword.length < 16 && process.env.NODE_ENV === 'production') {
    warnings.push('DB_PASSWORD should be at least 16 characters in production');
  }

  // ============================================================================
  // JWT CONFIGURATION (REQUIRED)
  // ============================================================================
  if (!process.env.JWT_SECRET) {
    errors.push('Missing required variable: JWT_SECRET');
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    errors.push('Missing required variable: JWT_REFRESH_SECRET');
  }

  // Validate JWT_EXPIRES_IN format
  const jwtExpires = process.env.JWT_EXPIRES_IN || '15m';
  if (!/^\d+[smhd]$/.test(jwtExpires)) {
    warnings.push('JWT_EXPIRES_IN should be in format: 15m, 1h, 1d');
  }

  // ============================================================================
  // SERVICE CONFIGURATION (REQUIRED)
  // ============================================================================
  if (!process.env.PORT) {
    warnings.push('PORT not set, using default 7020');
  }

  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set, defaulting to development');
  }

  // ============================================================================
  // REDIS CONFIGURATION (OPTIONAL - for session storage)
  // ============================================================================
  if (process.env.SESSION_STORE === 'redis') {
    if (!process.env.REDIS_HOST) {
      warnings.push('SESSION_STORE is redis but REDIS_HOST is not set');
    }
    if (!process.env.REDIS_PORT) {
      warnings.push('SESSION_STORE is redis but REDIS_PORT is not set');
    }
  }

  // ============================================================================
  // EMAIL CONFIGURATION (OPTIONAL - for email verification)
  // ============================================================================
  if (process.env.EMAIL_ENABLED === 'true') {
    const requiredEmailVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
    requiredEmailVars.forEach((varName) => {
      if (!process.env[varName]) {
        warnings.push(`Email enabled but missing: ${varName}`);
      }
    });
  }

  // ============================================================================
  // MFA CONFIGURATION (OPTIONAL)
  // ============================================================================
  if (process.env.MFA_ENABLED === 'true') {
    if (!process.env.MFA_ISSUER) {
      warnings.push('MFA enabled but MFA_ISSUER not set');
    }
  }

  // ============================================================================
  // OAUTH CONFIGURATION (OPTIONAL)
  // ============================================================================
  if (process.env.OAUTH_ENABLED === 'true') {
    if (!process.env.OAUTH_CLIENT_ID || !process.env.OAUTH_CLIENT_SECRET) {
      warnings.push('OAuth enabled but client credentials not set');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate environment and throw error if validation fails
 * Call this on service startup
 */
export function validateEnvironmentOrThrow(): void {
  logger.info('🔍 Validating environment configuration...');

  const result = validateEnvironment();

  // Log warnings
  if (result.warnings.length > 0) {
    logger.warn('⚠️  Environment Configuration Warnings:');
    result.warnings.forEach((warning) => {
      logger.warn(`   - ${warning}`);
    });
  }

  // Log errors and throw
  if (!result.valid) {
    logger.error('❌ Environment Configuration Errors:');
    result.errors.forEach((error) => {
      logger.error(`   - ${error}`);
    });
    
    logger.error('');
    logger.error('Fix these errors in your .env file and restart the service');
    logger.error('See .env.example for reference');
    
    throw new Error('Environment validation failed. Service cannot start.');
  }

  logger.info('✅ Environment configuration validated successfully');
}

/**
 * Display current configuration (safe - no sensitive data)
 */
export function displayConfiguration(): void {
  logger.info('📋 Current Configuration:');
  logger.info(`   Node Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`   Service Port: ${process.env.PORT || '7020'}`);
  logger.info(`   Database Host: ${process.env.DB_HOST || 'localhost'}`);
  logger.info(`   Database Port: ${process.env.DB_PORT || '3306'}`);
  logger.info(`   Database Name: ${process.env.DB_NAME || 'nilecare_auth'}`);
  logger.info(`   Database User: ${process.env.DB_USER || 'NOT SET'}`);
  logger.info(`   JWT Expires In: ${process.env.JWT_EXPIRES_IN || '15m'}`);
  logger.info(`   MFA Enabled: ${process.env.MFA_ENABLED || 'false'}`);
  logger.info(`   Email Enabled: ${process.env.EMAIL_ENABLED || 'false'}`);
  logger.info(`   OAuth Enabled: ${process.env.OAUTH_ENABLED || 'false'}`);
}

export default {
  validateEnvironment,
  validateEnvironmentOrThrow,
  displayConfiguration
};

