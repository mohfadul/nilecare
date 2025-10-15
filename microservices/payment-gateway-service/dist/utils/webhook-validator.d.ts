/**
 * Webhook Validator Utility
 * Validates webhook signatures from payment providers
 */
export declare class WebhookValidator {
    /**
     * Validate HMAC-SHA256 signature
     * @param payload - The webhook payload (JSON string or object)
     * @param signature - The signature from webhook header
     * @param secret - The webhook secret key
     */
    static validateHmacSha256(payload: string | object, signature: string, secret: string): boolean;
    /**
     * Validate signature with different formats
     * Some providers use different signature algorithms
     */
    static validateSignature(payload: string | object, signature: string, secret: string, algorithm?: 'sha256' | 'sha512' | 'md5'): boolean;
    /**
     * Validate timestamp to prevent replay attacks
     * @param timestamp - Unix timestamp from webhook
     * @param toleranceSeconds - How old the webhook can be (default: 300s = 5 minutes)
     */
    static validateTimestamp(timestamp: number, toleranceSeconds?: number): boolean;
    /**
     * Extract signature from headers
     * Different providers use different header names
     */
    static extractSignature(headers: any): string | null;
}
export default WebhookValidator;
//# sourceMappingURL=webhook-validator.d.ts.map