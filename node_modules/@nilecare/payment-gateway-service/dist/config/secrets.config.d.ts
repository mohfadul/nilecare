/**
 * Secrets Configuration and Validation
 * Ensures all required secrets are properly configured
 */
export declare class SecretsConfig {
    private static requiredSecrets;
    private static optionalProviderSecrets;
    /**
     * Validate all required secrets are present
     */
    static validateRequiredSecrets(): void;
    /**
     * Validate secret strength
     */
    static validateSecretStrength(secret: string, minLength?: number): boolean;
    /**
     * Validate JWT secret
     */
    static validateJwtSecret(): void;
    /**
     * Validate encryption key
     */
    static validateEncryptionKey(): void;
    /**
     * Validate all secrets on startup
     */
    static validateAll(): void;
    /**
     * Get safe secret (masked for logging)
     */
    static getSafeSecret(secret: string): string;
    /**
     * Encrypt secret for storage
     */
    static encryptSecret(plaintext: string): string;
    /**
     * Decrypt secret
     */
    static decryptSecret(encrypted: string): string;
}
export default SecretsConfig;
//# sourceMappingURL=secrets.config.d.ts.map