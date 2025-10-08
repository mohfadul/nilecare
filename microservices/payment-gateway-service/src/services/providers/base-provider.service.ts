/**
 * Base Payment Provider Service
 * Abstract base class for all payment provider implementations
 */

import { CreatePaymentDto } from '../../dtos/create-payment.dto';
import { PaymentEntity } from '../../entities/payment.entity';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'awaiting_verification';
  paymentUrl?: string; // For redirect-based payments
  qrCode?: string; // For QR code-based payments
  message: string;
  requiresManualVerification?: boolean;
  providerResponse?: any;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  message?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  status: 'pending' | 'completed' | 'failed';
  message: string;
}

export abstract class BasePaymentProvider {
  protected baseURL: string;
  protected apiKey: string;
  protected apiSecret?: string;

  constructor(
    protected providerName: string,
    protected providerConfig: any
  ) {
    this.baseURL = providerConfig.baseURL;
    this.apiKey = providerConfig.apiKey;
    this.apiSecret = providerConfig.apiSecret;
  }

  /**
   * Process payment (must be implemented by each provider)
   */
  abstract processPayment(paymentData: CreatePaymentDto, payment: PaymentEntity): Promise<PaymentResult>;

  /**
   * Verify payment (must be implemented by each provider)
   */
  abstract verifyPayment(payment: PaymentEntity, verificationCode?: string): Promise<VerificationResult>;

  /**
   * Refund payment (optional, can be overridden)
   */
  async refundPayment(payment: PaymentEntity, amount: number, reason: string): Promise<RefundResult> {
    return {
      success: false,
      status: 'failed',
      message: 'Refunds not supported for this provider'
    };
  }

  /**
   * Get payment status from provider (optional)
   */
  async getPaymentStatus(transactionId: string): Promise<any> {
    return null;
  }

  /**
   * Handle webhook (optional)
   */
  async handleWebhook(webhookData: any): Promise<void> {
    // Override in providers that support webhooks
  }

  /**
   * Validate payment data before processing
   */
  protected validatePaymentData(paymentData: CreatePaymentDto): void {
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (!paymentData.invoiceId) {
      throw new Error('Invoice ID is required');
    }

    if (!paymentData.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!paymentData.facilityId) {
      throw new Error('Facility ID is required');
    }
  }

  /**
   * Generate unique transaction ID
   */
  protected generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${this.providerName.toUpperCase()}-${timestamp}-${random}`;
  }

  /**
   * Log provider interaction
   */
  protected logProviderInteraction(action: string, data: any, result: any): void {
    console.log(`[${this.providerName}] ${action}`, {
      data,
      result,
      timestamp: new Date().toISOString()
    });
  }
}

export default BasePaymentProvider;

