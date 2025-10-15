/**
 * Billing Service - Environment Variable Validator
 * Validates all required environment variables on service startup
 */

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

  // Validate DB_NAME is for billing service
  const dbName = process.env.DB_NAME;
  if (dbName && !dbName.includes('billing')) {
    warnings.push(`DB_NAME should be 'nilecare_billing', got: ${dbName}`);
  }

  // Validate DB_USER is not root in production
  if (process.env.DB_USER === 'root' && process.env.NODE_ENV === 'production') {
    errors.push('DB_USER should not be root in production');
  }

  // ============================================================================
  // SERVICE CONFIGURATION (REQUIRED)
  // ============================================================================
  if (!process.env.PORT) {
    warnings.push('PORT not set, using default 7050');
  }

  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set, defaulting to development');
  }

  // ============================================================================
  // AUTH SERVICE INTEGRATION (REQUIRED)
  // ============================================================================
  if (!process.env.AUTH_SERVICE_URL) {
    errors.push('Missing required variable: AUTH_SERVICE_URL');
  }

  // ============================================================================
  // PAYMENT SERVICE INTEGRATION (OPTIONAL but recommended)
  // ============================================================================
  if (!process.env.PAYMENT_SERVICE_URL) {
    warnings.push('PAYMENT_SERVICE_URL not set - payment integration may not work');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate environment and throw error if validation fails
 */
export function validateEnvironmentOrThrow(): void {
  console.log('🔍 Validating environment configuration...');

  const result = validateEnvironment();

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment Configuration Warnings:');
    result.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
  }

  // Log errors and throw
  if (!result.valid) {
    console.error('❌ Environment Configuration Errors:');
    result.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });
    
    console.error('');
    console.error('Fix these errors in your .env file and restart the service');
    console.error('See .env.example for reference');
    
    throw new Error('Environment validation failed. Service cannot start.');
  }

  console.log('✅ Environment configuration validated successfully');
}

/**
 * Display current configuration (safe - no sensitive data)
 */
export function displayConfiguration(): void {
  console.log('📋 Current Configuration:');
  console.log(`   Node Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Service Port: ${process.env.PORT || '7050'}`);
  console.log(`   Database Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Database Port: ${process.env.DB_PORT || '3306'}`);
  console.log(`   Database Name: ${process.env.DB_NAME || 'nilecare_billing'}`);
  console.log(`   Database User: ${process.env.DB_USER || 'NOT SET'}`);
  console.log(`   Auth Service: ${process.env.AUTH_SERVICE_URL || 'NOT SET'}`);
  console.log(`   Payment Service: ${process.env.PAYMENT_SERVICE_URL || 'NOT SET'}`);
}

export default {
  validateEnvironment,
  validateEnvironmentOrThrow,
  displayConfiguration
};

