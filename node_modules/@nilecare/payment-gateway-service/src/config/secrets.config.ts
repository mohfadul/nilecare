/**
 * Secrets Configuration and Validation
 * Ensures all required secrets are properly configured
 */

import crypto from 'crypto';

export class SecretsConfig {
  private static requiredSecrets = [
    'DB_PASSWORD',
    'REDIS_PASSWORD',
    'JWT_SECRET',
    'PAYMENT_ENCRYPTION_KEY',
    'PAYMENT_WEBHOOK_SECRET'
  ];

  private static optionalProviderSecrets = [
    'BANK_OF_KHARTOUM_API_KEY',
    'BANK_OF_KHARTOUM_API_SECRET',
    'ZAIN_CASH_API_KEY',
    'ZAIN_CASH_API_SECRET',
    'MTN_MONEY_API_KEY',
    'MTN_MONEY_API_SECRET',
    'SUDANI_CASH_API_KEY',
    'SUDANI_CASH_API_SECRET'
  ];

  /**
   * Validate all required secrets are present
   */
  static validateRequiredSecrets(): void {
    const missing: string[] = [];

    for (const secret of this.requiredSecrets) {
      if (!process.env[secret]) {
        missing.push(secret);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        `Please configure these secrets before starting the service.`
      );
    }

    console.log('✅ All required secrets are configured');
  }

  /**
   * Validate secret strength
   */
  static validateSecretStrength(secret: string, minLength: number = 32): boolean {
    if (!secret || secret.length < minLength) {
      return false;
    }

    // Check for weak patterns
    const weakPatterns = [
      /^123456/,
      /^password/i,
      /^admin/i,
      /^test/i
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(secret)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate JWT secret
   */
  static validateJwtSecret(): void {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required');
    }

    if (!this.validateSecretStrength(jwtSecret, 32)) {
      throw new Error(
        'JWT_SECRET is too weak. Must be at least 32 characters and not contain common patterns.'
      );
    }

    console.log('✅ JWT secret validated');
  }

  /**
   * Validate encryption key
   */
  static validateEncryptionKey(): void {
    const encryptionKey = process.env.PAYMENT_ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error('PAYMENT_ENCRYPTION_KEY is required');
    }

    // Encryption key must be 64 hex characters (32 bytes)
    if (!/^[0-9a-f]{64}$/i.test(encryptionKey)) {
      throw new Error(
        'PAYMENT_ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes).\n' +
        'Generate with: openssl rand -hex 32'
      );
    }

    console.log('✅ Encryption key validated');
  }

  /**
   * Validate all secrets on startup
   */
  static validateAll(): void {
    console.log('Validating secrets configuration...');
    
    this.validateRequiredSecrets();
    this.validateJwtSecret();
    this.validateEncryptionKey();

    // Warn about missing optional provider secrets
    const missingProviders: string[] = [];
    for (const secret of this.optionalProviderSecrets) {
      if (!process.env[secret]) {
        missingProviders.push(secret);
      }
    }

    if (missingProviders.length > 0) {
      console.warn(
        `⚠️  Optional provider secrets not configured: ${missingProviders.join(', ')}\n` +
        `Some payment providers will not be available.`
      );
    }

    console.log('✅ Secrets validation complete');
  }

  /**
   * Get safe secret (masked for logging)
   */
  static getSafeSecret(secret: string): string {
    if (!secret || secret.length < 8) {
      return '***';
    }
    return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
  }

  /**
   * Encrypt secret for storage
   */
  static encryptSecret(plaintext: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.PAYMENT_ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv + authTag + encrypted
    return iv.toString('hex') + authTag.toString('hex') + encrypted;
  }

  /**
   * Decrypt secret
   */
  static decryptSecret(encrypted: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.PAYMENT_ENCRYPTION_KEY!, 'hex');

    const ivLength = 32; // 16 bytes in hex
    const authTagLength = 32; // 16 bytes in hex

    const iv = Buffer.from(encrypted.substring(0, ivLength), 'hex');
    const authTag = Buffer.from(encrypted.substring(ivLength, ivLength + authTagLength), 'hex');
    const ciphertext = encrypted.substring(ivLength + authTagLength);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export default SecretsConfig;

