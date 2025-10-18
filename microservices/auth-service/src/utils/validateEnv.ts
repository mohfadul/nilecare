/**
 * Environment Variable Validation Utility
 * Ensures all critical environment variables are present before app startup
 */

import dotenv from 'dotenv';

// Load .env file FIRST
dotenv.config();

/**
 * Validate that required environment variables exist
 * @param required - Array of required environment variable names
 * @throws Error if any required variables are missing or empty
 */
export function validateEnv(required: string[]): void {
  const missing = required.filter(key => !process.env[key] || process.env[key]?.trim() === '');
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('📝 Please check your .env file and ensure all values are set');
    throw new Error(`Missing critical env vars: ${missing.join(', ')}`);
  }
}

/**
 * Validate auth service environment
 * Call this at the very start of the application
 */
export function validateAuthServiceEnv(): void {
  const required = [
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
    'MFA_ENCRYPTION_KEY'
  ];

  validateEnv(required);

  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  console.log('✅ Environment validation passed');
}

/**
 * Get environment variable with default value
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

/**
 * Get optional environment variable
 */
export function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Check if SMTP is configured
 */
export function isSMTPConfigured(): boolean {
  const smtpEnabled = process.env.SMTP_ENABLED;
  if (smtpEnabled === 'false') {
    return false;
  }

  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

