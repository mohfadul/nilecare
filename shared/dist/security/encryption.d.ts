/**
 * Encryption utilities for NileCare platform
 * Implements AES-256-GCM encryption for sensitive data
 * Sudan-specific: Encrypts Sudan National ID and other PHI
 */
export interface EncryptedData {
    encrypted: string;
    iv: string;
    authTag: string;
    version: string;
}
/**
 * Encrypt sensitive data using AES-256-GCM
 * @param plaintext - Data to encrypt
 * @returns Encrypted data with IV and auth tag
 */
export declare function encrypt(plaintext: string): EncryptedData;
/**
 * Decrypt data encrypted with AES-256-GCM
 * @param encryptedData - Encrypted data object
 * @returns Decrypted plaintext
 */
export declare function decrypt(encryptedData: EncryptedData): string;
/**
 * Encrypt Sudan National ID
 * @param nationalId - Sudan National ID to encrypt
 * @returns Encrypted National ID as JSON string
 */
export declare function encryptSudanNationalId(nationalId: string): string;
/**
 * Decrypt Sudan National ID
 * @param encryptedData - Encrypted National ID JSON string
 * @returns Decrypted Sudan National ID
 */
export declare function decryptSudanNationalId(encryptedData: string): string;
/**
 * Hash password using PBKDF2
 * @param password - Password to hash
 * @param salt - Optional salt (generated if not provided)
 * @returns Hashed password with salt
 */
export declare function hashPassword(password: string, salt?: string): {
    hash: string;
    salt: string;
};
/**
 * Verify password against hash
 * @param password - Password to verify
 * @param hash - Stored hash
 * @param salt - Stored salt
 * @returns True if password matches
 */
export declare function verifyPassword(password: string, hash: string, salt: string): boolean;
/**
 * Generate secure random token
 * @param length - Length in bytes (default 32)
 * @returns Hex-encoded random token
 */
export declare function generateSecureToken(length?: number): string;
/**
 * Generate encryption key (for initial setup)
 * @returns Hex-encoded encryption key
 */
export declare function generateEncryptionKey(): string;
/**
 * Rotate encryption key (re-encrypt data with new key)
 * @param encryptedData - Data encrypted with old key
 * @param oldKey - Old encryption key
 * @param newKey - New encryption key
 * @returns Data encrypted with new key
 */
export declare function rotateEncryptionKey(encryptedData: EncryptedData, oldKey: Buffer, newKey: Buffer): EncryptedData;
/**
 * Encrypt file data
 * @param fileBuffer - File buffer to encrypt
 * @returns Encrypted file data
 */
export declare function encryptFile(fileBuffer: Buffer): EncryptedData;
/**
 * Decrypt file data
 * @param encryptedData - Encrypted file data
 * @returns Decrypted file buffer
 */
export declare function decryptFile(encryptedData: EncryptedData): Buffer;
declare const _default: {
    encrypt: typeof encrypt;
    decrypt: typeof decrypt;
    encryptSudanNationalId: typeof encryptSudanNationalId;
    decryptSudanNationalId: typeof decryptSudanNationalId;
    hashPassword: typeof hashPassword;
    verifyPassword: typeof verifyPassword;
    generateSecureToken: typeof generateSecureToken;
    generateEncryptionKey: typeof generateEncryptionKey;
    rotateEncryptionKey: typeof rotateEncryptionKey;
    encryptFile: typeof encryptFile;
    decryptFile: typeof decryptFile;
};
export default _default;
//# sourceMappingURL=encryption.d.ts.map