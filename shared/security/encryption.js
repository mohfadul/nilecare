"use strict";
/**
 * Encryption utilities for NileCare platform
 * Implements AES-256-GCM encryption for sensitive data
 * Sudan-specific: Encrypts Sudan National ID and other PHI
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.encryptSudanNationalId = encryptSudanNationalId;
exports.decryptSudanNationalId = decryptSudanNationalId;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateSecureToken = generateSecureToken;
exports.generateEncryptionKey = generateEncryptionKey;
exports.rotateEncryptionKey = rotateEncryptionKey;
exports.encryptFile = encryptFile;
exports.decryptFile = decryptFile;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
// Get encryption key from environment (must be 64 hex characters = 32 bytes)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    : crypto_1.default.randomBytes(KEY_LENGTH);
/**
 * Encrypt sensitive data using AES-256-GCM
 * @param plaintext - Data to encrypt
 * @returns Encrypted data with IV and auth tag
 */
function encrypt(plaintext) {
    if (!plaintext) {
        throw new Error('Cannot encrypt empty data');
    }
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        version: '1' // For key rotation tracking
    };
}
/**
 * Decrypt data encrypted with AES-256-GCM
 * @param encryptedData - Encrypted data object
 * @returns Decrypted plaintext
 */
function decrypt(encryptedData) {
    if (!encryptedData || !encryptedData.encrypted) {
        throw new Error('Invalid encrypted data');
    }
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(encryptedData.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Encrypt Sudan National ID
 * @param nationalId - Sudan National ID to encrypt
 * @returns Encrypted National ID as JSON string
 */
function encryptSudanNationalId(nationalId) {
    if (!nationalId || nationalId.trim().length === 0) {
        throw new Error('Sudan National ID cannot be empty');
    }
    const encrypted = encrypt(nationalId.trim());
    return JSON.stringify(encrypted);
}
/**
 * Decrypt Sudan National ID
 * @param encryptedData - Encrypted National ID JSON string
 * @returns Decrypted Sudan National ID
 */
function decryptSudanNationalId(encryptedData) {
    if (!encryptedData) {
        throw new Error('Encrypted data cannot be empty');
    }
    try {
        const data = JSON.parse(encryptedData);
        return decrypt(data);
    }
    catch (error) {
        throw new Error('Failed to decrypt Sudan National ID: Invalid format');
    }
}
/**
 * Hash password using PBKDF2
 * @param password - Password to hash
 * @param salt - Optional salt (generated if not provided)
 * @returns Hashed password with salt
 */
function hashPassword(password, salt) {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto_1.default.randomBytes(SALT_LENGTH);
    const hash = crypto_1.default.pbkdf2Sync(password, saltBuffer, 100000, 64, 'sha512');
    return {
        hash: hash.toString('hex'),
        salt: saltBuffer.toString('hex')
    };
}
/**
 * Verify password against hash
 * @param password - Password to verify
 * @param hash - Stored hash
 * @param salt - Stored salt
 * @returns True if password matches
 */
function verifyPassword(password, hash, salt) {
    const { hash: newHash } = hashPassword(password, salt);
    return crypto_1.default.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(newHash, 'hex'));
}
/**
 * Generate secure random token
 * @param length - Length in bytes (default 32)
 * @returns Hex-encoded random token
 */
function generateSecureToken(length = 32) {
    return crypto_1.default.randomBytes(length).toString('hex');
}
/**
 * Generate encryption key (for initial setup)
 * @returns Hex-encoded encryption key
 */
function generateEncryptionKey() {
    return crypto_1.default.randomBytes(KEY_LENGTH).toString('hex');
}
/**
 * Rotate encryption key (re-encrypt data with new key)
 * @param encryptedData - Data encrypted with old key
 * @param oldKey - Old encryption key
 * @param newKey - New encryption key
 * @returns Data encrypted with new key
 */
function rotateEncryptionKey(encryptedData, oldKey, newKey) {
    // Decrypt with old key
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, oldKey, Buffer.from(encryptedData.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    // Encrypt with new key
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, newKey, iv);
    let encrypted = cipher.update(decrypted, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        version: (parseInt(encryptedData.version) + 1).toString()
    };
}
/**
 * Encrypt file data
 * @param fileBuffer - File buffer to encrypt
 * @returns Encrypted file data
 */
function encryptFile(fileBuffer) {
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();
    return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        version: '1'
    };
}
/**
 * Decrypt file data
 * @param encryptedData - Encrypted file data
 * @returns Decrypted file buffer
 */
function decryptFile(encryptedData) {
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(encryptedData.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
        decipher.final()
    ]);
    return decrypted;
}
exports.default = {
    encrypt,
    decrypt,
    encryptSudanNationalId,
    decryptSudanNationalId,
    hashPassword,
    verifyPassword,
    generateSecureToken,
    generateEncryptionKey,
    rotateEncryptionKey,
    encryptFile,
    decryptFile
};
//# sourceMappingURL=encryption.js.map