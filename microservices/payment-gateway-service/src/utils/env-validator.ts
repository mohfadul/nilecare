/**
 * Payment Gateway Service - Environment Variable Validator
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

  // Validate DB_NAME is for payment service
  const dbName = process.env.DB_NAME;
  if (dbName && !dbName.includes('payment')) {
    warnings.push(`DB_NAME should be 'nilecare_payment', got: ${dbName}`);
  }

  // Validate DB_USER is not root in production
  if (process.env.DB_USER === 'root' && process.env.NODE_ENV === 'production') {
    errors.push('DB_USER should not be root in production');
  }

  // ============================================================================
  // SERVICE CONFIGURATION (REQUIRED)
  // ============================================================================
  if (!process.env.PORT) {
    warnings.push('PORT not set, using default 7030');
  }

  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set, defaulting to development');
  }

  // ============================================================================
  // PAYMENT PROVIDER CONFIGURATION (REQUIRED)
  // ============================================================================
  const requiredProviderVars = [
    'PAYMENT_ENCRYPTION_KEY',
    'PAYMENT_WEBHOOK_SECRET'
  ];

  requiredProviderVars.forEach((varName) => {
    if (!process.env[varName]) {
      errors.push(`Missing required payment variable: ${varName}`);
    }
  });

  // Validate encryption key length
  const encryptionKey = process.env.PAYMENT_ENCRYPTION_KEY;
  if (encryptionKey && encryptionKey.length < 32) {
    errors.push('PAYMENT_ENCRYPTION_KEY must be at least 32 characters');
  }

  // ============================================================================
  // AUTH SERVICE INTEGRATION (REQUIRED)
  // ============================================================================
  if (!process.env.AUTH_SERVICE_URL) {
    errors.push('Missing required variable: AUTH_SERVICE_URL');
  }

  // ============================================================================
  // BILLING SERVICE INTEGRATION (REQUIRED)
  // ============================================================================
  if (!process.env.BILLING_SERVICE_URL) {
    errors.push('Missing required variable: BILLING_SERVICE_URL');
  }

  // ============================================================================
  // AWS S3 CONFIGURATION (OPTIONAL - for receipt storage)
  // ============================================================================
  if (process.env.ENABLE_RECEIPT_STORAGE === 'true') {
    const requiredS3Vars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
    requiredS3Vars.forEach((varName) => {
      if (!process.env[varName]) {
        warnings.push(`Receipt storage enabled but missing: ${varName}`);
      }
    });
  }

  // ============================================================================
  // PAYMENT PROVIDER APIs (OPTIONAL but recommended)
  // ============================================================================
  const providerAPIs = [
    'BANK_OF_KHARTOUM_API_KEY',
    'ZAIN_CASH_MERCHANT_ID',
    'MTN_MONEY_API_KEY'
  ];

  const configuredProviders = providerAPIs.filter((api) => process.env[api]);
  if (configuredProviders.length === 0) {
    warnings.push('No payment provider APIs configured - only manual payments will work');
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
  console.log(`   Service Port: ${process.env.PORT || '7030'}`);
  console.log(`   Database Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Database Port: ${process.env.DB_PORT || '3306'}`);
  console.log(`   Database Name: ${process.env.DB_NAME || 'nilecare_payment'}`);
  console.log(`   Database User: ${process.env.DB_USER || 'NOT SET'}`);
  console.log(`   Auth Service: ${process.env.AUTH_SERVICE_URL || 'NOT SET'}`);
  console.log(`   Billing Service: ${process.env.BILLING_SERVICE_URL || 'NOT SET'}`);
  console.log(`   Receipt Storage: ${process.env.ENABLE_RECEIPT_STORAGE || 'false'}`);
}

export default {
  validateEnvironment,
  validateEnvironmentOrThrow,
  displayConfiguration
};

