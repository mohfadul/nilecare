"use strict";
/**
 * Webhook Validator Utility
 * Validates webhook signatures from payment providers
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookValidator = void 0;
const crypto_1 = __importDefault(require("crypto"));
class WebhookValidator {
    /**
     * Validate HMAC-SHA256 signature
     * @param payload - The webhook payload (JSON string or object)
     * @param signature - The signature from webhook header
     * @param secret - The webhook secret key
     */
    static validateHmacSha256(payload, signature, secret) {
        try {
            if (!signature || !secret) {
                return false;
            }
            // Convert payload to string if object
            const payloadString = typeof payload === 'string'
                ? payload
                : JSON.stringify(payload);
            // Calculate expected signature
            const expectedSignature = crypto_1.default
                .createHmac('sha256', secret)
                .update(payloadString)
                .digest('hex');
            // Timing-safe comparison (prevents timing attacks)
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            console.error('Webhook validation error:', error);
            return false;
        }
    }
    /**
     * Validate signature with different formats
     * Some providers use different signature algorithms
     */
    static validateSignature(payload, signature, secret, algorithm = 'sha256') {
        try {
            const payloadString = typeof payload === 'string'
                ? payload
                : JSON.stringify(payload);
            const expectedSignature = crypto_1.default
                .createHmac(algorithm, secret)
                .update(payloadString)
                .digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            console.error('Signature validation error:', error);
            return false;
        }
    }
    /**
     * Validate timestamp to prevent replay attacks
     * @param timestamp - Unix timestamp from webhook
     * @param toleranceSeconds - How old the webhook can be (default: 300s = 5 minutes)
     */
    static validateTimestamp(timestamp, toleranceSeconds = 300) {
        const now = Math.floor(Date.now() / 1000);
        const diff = Math.abs(now - timestamp);
        return diff <= toleranceSeconds;
    }
    /**
     * Extract signature from headers
     * Different providers use different header names
     */
    static extractSignature(headers) {
        // Try common signature header names
        const signatureHeaders = [
            'x-signature',
            'x-webhook-signature',
            'x-hub-signature',
            'x-signature-256',
            'signature'
        ];
        for (const headerName of signatureHeaders) {
            const value = headers[headerName] || headers[headerName.toLowerCase()];
            if (value) {
                // Some providers prefix with algorithm (e.g., "sha256=abc123")
                if (value.includes('=')) {
                    return value.split('=')[1];
                }
                return value;
            }
        }
        return null;
    }
}
exports.WebhookValidator = WebhookValidator;
exports.default = WebhookValidator;
//# sourceMappingURL=webhook-validator.js.map