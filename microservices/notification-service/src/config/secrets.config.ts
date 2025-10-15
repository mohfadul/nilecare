/**
 * Secrets Configuration
 * Validates all required environment variables on startup
 */

import { logger } from '../utils/logger';

export class SecretsConfig {
  /**
   * Validate all required environment variables
   * Throws error if any required variables are missing
   */
  static validateAll(): void {
    logger.info('Validating environment configuration...');

    const required = [
      // Database
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      
      // Redis
      'REDIS_HOST',
      'REDIS_PORT',
      
      // Authentication
      'AUTH_SERVICE_URL',
      'AUTH_SERVICE_API_KEY',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Validate optional but recommended
    const recommended = [
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASSWORD',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'FIREBASE_PROJECT_ID',
    ];

    const missingRecommended = recommended.filter(key => !process.env[key]);
    
    if (missingRecommended.length > 0) {
      logger.warn(`Missing recommended environment variables: ${missingRecommended.join(', ')}`);
      logger.warn('Some notification channels may not be available');
    }

    logger.info('✅ Environment configuration validated successfully');
  }

  /**
   * Get database configuration
   */
  static getDatabaseConfig() {
    return {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      ssl: process.env.DB_SSL === 'true',
    };
  }

  /**
   * Get Redis configuration
   */
  static getRedisConfig() {
    return {
      host: process.env.REDIS_HOST!,
      port: parseInt(process.env.REDIS_PORT!),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    };
  }

  /**
   * Get Auth Service configuration
   */
  static getAuthConfig() {
    return {
      url: process.env.AUTH_SERVICE_URL!,
      apiKey: process.env.AUTH_SERVICE_API_KEY!,
      serviceName: process.env.SERVICE_NAME || 'notification-service',
    };
  }

  /**
   * Get Email configuration
   */
  static getEmailConfig() {
    return {
      enabled: process.env.FEATURE_EMAIL_ENABLED !== 'false',
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from: {
        name: process.env.SMTP_FROM_NAME || 'NileCare Healthcare',
        email: process.env.SMTP_FROM_EMAIL || 'noreply@nilecare.com',
      },
    };
  }

  /**
   * Get SMS configuration
   */
  static getSMSConfig() {
    return {
      enabled: process.env.FEATURE_SMS_ENABLED !== 'false',
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      },
    };
  }

  /**
   * Get Push notification configuration
   */
  static getPushConfig() {
    return {
      enabled: process.env.FEATURE_PUSH_ENABLED !== 'false',
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      },
    };
  }
}

export default SecretsConfig;

