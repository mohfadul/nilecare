/**
 * Secrets Configuration and Validation
 * Ensures all required secrets are properly configured
 * 
 * IMPORTANT: Billing Service does NOT have JWT_SECRET
 * Authentication is delegated to Auth Service
 */

import crypto from 'crypto';

export class SecretsConfig {
  private static requiredSecrets = [
    'DB_PASSWORD',
    'AUTH_SERVICE_URL',
    'AUTH_SERVICE_API_KEY',
    'PAYMENT_GATEWAY_URL',
    'PAYMENT_GATEWAY_API_KEY'
  ];

  private static optionalSecrets = [
    'REDIS_PASSWORD',
    'SMTP_PASSWORD',
    'TWILIO_AUTH_TOKEN',
    'ENCRYPTION_KEY',
    'WEBHOOK_SECRET'
  ];

  /**
   * Validate all required secrets are present
   */
  static validateRequiredSecrets(): void {
    const missing: string[] = [];

    for (const secret of this.requiredSecrets) {
      if (!process.env[secret]) {
        // DB_PASSWORD can be empty for local development
        if (secret === 'DB_PASSWORD') {
          process.env.DB_PASSWORD = '';
          continue;
        }
        missing.push(secret);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `❌ Missing required environment variables: ${missing.join(', ')}\n` +
        `Please configure these before starting the service.\n` +
        `See .env.example for reference.`
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
   * Validate Auth Service configuration
   */
  static validateAuthServiceConfig(): void {
    const authUrl = process.env.AUTH_SERVICE_URL;
    const authKey = process.env.AUTH_SERVICE_API_KEY;
    
    if (!authUrl) {
      throw new Error('AUTH_SERVICE_URL is required');
    }

    if (!authKey) {
      throw new Error('AUTH_SERVICE_API_KEY is required');
    }

    if (!this.validateSecretStrength(authKey, 32)) {
      throw new Error(
        'AUTH_SERVICE_API_KEY is too weak. Must be at least 32 characters.\n' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }

    // Validate URL format
    try {
      new URL(authUrl);
    } catch {
      throw new Error(`Invalid AUTH_SERVICE_URL: ${authUrl}`);
    }

    console.log('✅ Auth Service configuration validated');
  }

  /**
   * Validate Payment Gateway configuration
   */
  static validatePaymentGatewayConfig(): void {
    const gatewayUrl = process.env.PAYMENT_GATEWAY_URL;
    const gatewayKey = process.env.PAYMENT_GATEWAY_API_KEY;
    
    if (!gatewayUrl) {
      throw new Error('PAYMENT_GATEWAY_URL is required');
    }

    if (!gatewayKey) {
      throw new Error('PAYMENT_GATEWAY_API_KEY is required');
    }

    if (!this.validateSecretStrength(gatewayKey, 32)) {
      throw new Error(
        'PAYMENT_GATEWAY_API_KEY is too weak. Must be at least 32 characters.'
      );
    }

    // Validate URL format
    try {
      new URL(gatewayUrl);
    } catch {
      throw new Error(`Invalid PAYMENT_GATEWAY_URL: ${gatewayUrl}`);
    }

    console.log('✅ Payment Gateway configuration validated');
  }

  /**
   * Validate encryption key (if provided)
   */
  static validateEncryptionKey(): void {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      console.warn('⚠️  ENCRYPTION_KEY not set - sensitive data will not be encrypted');
      return;
    }

    // Encryption key must be 64 hex characters (32 bytes)
    if (!/^[0-9a-f]{64}$/i.test(encryptionKey)) {
      throw new Error(
        'ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes).\n' +
        'Generate with: openssl rand -hex 32'
      );
    }

    console.log('✅ Encryption key validated');
  }

  /**
   * Validate all secrets on startup
   */
  static validateAll(): void {
    console.log('🔒 Validating secrets configuration...');
    
    this.validateRequiredSecrets();
    this.validateAuthServiceConfig();
    this.validatePaymentGatewayConfig();
    this.validateEncryptionKey();

    // Warn about missing optional secrets
    const missingOptional: string[] = [];
    for (const secret of this.optionalSecrets) {
      if (!process.env[secret]) {
        missingOptional.push(secret);
      }
    }

    if (missingOptional.length > 0) {
      console.warn(
        `ℹ️  Optional secrets not configured: ${missingOptional.join(', ')}\n` +
        `Some features may not be available.`
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
   * Encrypt sensitive data
   */
  static encryptData(plaintext: string): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      return plaintext; // Return as-is if encryption not configured
    }

    const algorithm = 'aes-256-gcm';
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv + authTag + encrypted
    return iv.toString('hex') + authTag.toString('hex') + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  static decryptData(encrypted: string): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      return encrypted; // Return as-is if encryption not configured
    }

    const algorithm = 'aes-256-gcm';
    const keyBuffer = Buffer.from(key, 'hex');

    const ivLength = 32; // 16 bytes in hex
    const authTagLength = 32; // 16 bytes in hex

    const iv = Buffer.from(encrypted.substring(0, ivLength), 'hex');
    const authTag = Buffer.from(encrypted.substring(ivLength, ivLength + authTagLength), 'hex');
    const ciphertext = encrypted.substring(ivLength + authTagLength);

    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export default SecretsConfig;

