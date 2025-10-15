/**
 * Webhook Validator Utility
 * Validates webhook signatures from payment providers
 */

import crypto from 'crypto';

export class WebhookValidator {
  /**
   * Validate HMAC-SHA256 signature
   * @param payload - The webhook payload (JSON string or object)
   * @param signature - The signature from webhook header
   * @param secret - The webhook secret key
   */
  static validateHmacSha256(
    payload: string | object,
    signature: string,
    secret: string
  ): boolean {
    try {
      if (!signature || !secret) {
        return false;
      }

      // Convert payload to string if object
      const payloadString = typeof payload === 'string' 
        ? payload 
        : JSON.stringify(payload);

      // Calculate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex');

      // Timing-safe comparison (prevents timing attacks)
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

    } catch (error: any) {
      console.error('Webhook validation error:', error);
      return false;
    }
  }

  /**
   * Validate signature with different formats
   * Some providers use different signature algorithms
   */
  static validateSignature(
    payload: string | object,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha512' | 'md5' = 'sha256'
  ): boolean {
    try {
      const payloadString = typeof payload === 'string' 
        ? payload 
        : JSON.stringify(payload);

      const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(payloadString)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

    } catch (error: any) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  /**
   * Validate timestamp to prevent replay attacks
   * @param timestamp - Unix timestamp from webhook
   * @param toleranceSeconds - How old the webhook can be (default: 300s = 5 minutes)
   */
  static validateTimestamp(timestamp: number, toleranceSeconds: number = 300): boolean {
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - timestamp);
    
    return diff <= toleranceSeconds;
  }

  /**
   * Extract signature from headers
   * Different providers use different header names
   */
  static extractSignature(headers: any): string | null {
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

export default WebhookValidator;

