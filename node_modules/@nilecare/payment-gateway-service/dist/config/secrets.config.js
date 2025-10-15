"use strict";
/**
 * Secrets Configuration and Validation
 * Ensures all required secrets are properly configured
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretsConfig = void 0;
const crypto_1 = __importDefault(require("crypto"));
class SecretsConfig {
    /**
     * Validate all required secrets are present
     */
    static validateRequiredSecrets() {
        const missing = [];
        for (const secret of this.requiredSecrets) {
            if (!process.env[secret]) {
                missing.push(secret);
            }
        }
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}\n` +
                `Please configure these secrets before starting the service.`);
        }
        console.log('✅ All required secrets are configured');
    }
    /**
     * Validate secret strength
     */
    static validateSecretStrength(secret, minLength = 32) {
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
    static validateJwtSecret() {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is required');
        }
        if (!this.validateSecretStrength(jwtSecret, 32)) {
            throw new Error('JWT_SECRET is too weak. Must be at least 32 characters and not contain common patterns.');
        }
        console.log('✅ JWT secret validated');
    }
    /**
     * Validate encryption key
     */
    static validateEncryptionKey() {
        const encryptionKey = process.env.PAYMENT_ENCRYPTION_KEY;
        if (!encryptionKey) {
            throw new Error('PAYMENT_ENCRYPTION_KEY is required');
        }
        // Encryption key must be 64 hex characters (32 bytes)
        if (!/^[0-9a-f]{64}$/i.test(encryptionKey)) {
            throw new Error('PAYMENT_ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes).\n' +
                'Generate with: openssl rand -hex 32');
        }
        console.log('✅ Encryption key validated');
    }
    /**
     * Validate all secrets on startup
     */
    static validateAll() {
        console.log('Validating secrets configuration...');
        this.validateRequiredSecrets();
        this.validateJwtSecret();
        this.validateEncryptionKey();
        // Warn about missing optional provider secrets
        const missingProviders = [];
        for (const secret of this.optionalProviderSecrets) {
            if (!process.env[secret]) {
                missingProviders.push(secret);
            }
        }
        if (missingProviders.length > 0) {
            console.warn(`⚠️  Optional provider secrets not configured: ${missingProviders.join(', ')}\n` +
                `Some payment providers will not be available.`);
        }
        console.log('✅ Secrets validation complete');
    }
    /**
     * Get safe secret (masked for logging)
     */
    static getSafeSecret(secret) {
        if (!secret || secret.length < 8) {
            return '***';
        }
        return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
    }
    /**
     * Encrypt secret for storage
     */
    static encryptSecret(plaintext) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.PAYMENT_ENCRYPTION_KEY, 'hex');
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        // Return: iv + authTag + encrypted
        return iv.toString('hex') + authTag.toString('hex') + encrypted;
    }
    /**
     * Decrypt secret
     */
    static decryptSecret(encrypted) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.PAYMENT_ENCRYPTION_KEY, 'hex');
        const ivLength = 32; // 16 bytes in hex
        const authTagLength = 32; // 16 bytes in hex
        const iv = Buffer.from(encrypted.substring(0, ivLength), 'hex');
        const authTag = Buffer.from(encrypted.substring(ivLength, ivLength + authTagLength), 'hex');
        const ciphertext = encrypted.substring(ivLength + authTagLength);
        const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
exports.SecretsConfig = SecretsConfig;
SecretsConfig.requiredSecrets = [
    'DB_PASSWORD',
    'REDIS_PASSWORD',
    'JWT_SECRET',
    'PAYMENT_ENCRYPTION_KEY',
    'PAYMENT_WEBHOOK_SECRET'
];
SecretsConfig.optionalProviderSecrets = [
    'BANK_OF_KHARTOUM_API_KEY',
    'BANK_OF_KHARTOUM_API_SECRET',
    'ZAIN_CASH_API_KEY',
    'ZAIN_CASH_API_SECRET',
    'MTN_MONEY_API_KEY',
    'MTN_MONEY_API_SECRET',
    'SUDANI_CASH_API_KEY',
    'SUDANI_CASH_API_SECRET'
];
exports.default = SecretsConfig;
//# sourceMappingURL=secrets.config.js.map