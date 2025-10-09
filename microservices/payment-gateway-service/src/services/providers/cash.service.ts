/**
 * Cash Payment Provider Service
 * Handles cash payments with manual verification
 */

import { BasePaymentProvider, PaymentResult, VerificationResult, RefundResult } from './base-provider.service';
import { CreatePaymentDto } from '../../dtos/create-payment.dto';
import { PaymentEntity } from '../../entities/payment.entity';

export class CashService extends BasePaymentProvider {
  constructor(providerConfig: any) {
    super('cash', providerConfig);
  }

  /**
   * Process cash payment
   * Generates receipt and marks for manual verification
   */
  async processPayment(paymentData: CreatePaymentDto, _payment: PaymentEntity): Promise<PaymentResult> {
    try {
      this.validatePaymentData(paymentData);

      // Generate receipt number
      const receiptNumber = await this.generateReceiptNumber();

      const result: PaymentResult = {
        success: true,
        transactionId: receiptNumber,
        status: 'awaiting_verification',
        message: 'Cash payment recorded. Pending staff confirmation.',
        requiresManualVerification: true
      };

      this.logProviderInteraction('processPayment', paymentData, result);

      return result;

    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        message: error.message || 'Cash payment processing failed'
      };
    }
  }

  /**
   * Verify cash payment manually
   */
  async verifyPayment(payment: PaymentEntity, _verificationCode?: string): Promise<VerificationResult> {
    try {
      // Validate cash payment details
      if (!payment.paymentMethodDetails?.receivedBy) {
        throw new Error('Staff member name is required for cash payment verification');
      }

      // Optionally validate denomination breakdown
      if (payment.paymentMethodDetails?.denominationBreakdown) {
        const total = this.calculateDenominationTotal(
          payment.paymentMethodDetails.denominationBreakdown
        );

        if (Math.abs(total - payment.amount) > 0.01) {
          throw new Error(`Denomination breakdown (${total} SDG) does not match payment amount (${payment.amount} SDG)`);
        }
      }

      return {
        success: true,
        verified: true,
        verifiedAt: new Date(),
        message: 'Cash payment verified successfully'
      };

    } catch (error: any) {
      return {
        success: false,
        verified: false,
        message: error.message || 'Cash payment verification failed'
      };
    }
  }

  /**
   * Refund cash payment
   * Creates refund request for manual processing
   */
  async refundPayment(_payment: PaymentEntity, _amount: number, _reason: string): Promise<RefundResult> {
    try {
      // Cash refunds are processed manually
      const refundId = `CASH-REFUND-${Date.now()}`;

      return {
        success: true,
        refundId,
        status: 'pending',
        message: 'Cash refund request created. Please process manually at cash counter.'
      };

    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        message: error.message || 'Refund creation failed'
      };
    }
  }

  /**
   * Generate unique receipt number
   */
  private async generateReceiptNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = date.getTime();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `CASH-${year}${month}${day}-${timestamp}-${random}`;
  }

  /**
   * Calculate total from denomination breakdown
   */
  private calculateDenominationTotal(breakdown: Record<string, number>): number {
    let total = 0;
    
    for (const [denomination, count] of Object.entries(breakdown)) {
      const value = parseFloat(denomination);
      if (!isNaN(value) && count > 0) {
        total += value * count;
      }
    }

    return Math.round(total * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Validate denomination breakdown
   */
  validateDenominationBreakdown(breakdown: Record<string, number>, expectedAmount: number): {
    valid: boolean;
    total: number;
    difference: number;
  } {
    const total = this.calculateDenominationTotal(breakdown);
    const difference = Math.abs(total - expectedAmount);

    return {
      valid: difference < 0.01,
      total,
      difference
    };
  }

  /**
   * Generate cash receipt data for printing
   */
  generateReceiptData(payment: PaymentEntity): any {
    return {
      receiptNumber: payment.transactionId,
      date: payment.createdAt,
      amount: payment.amount,
      currency: payment.currency,
      patientId: payment.patientId,
      invoiceId: payment.invoiceId,
      facilityId: payment.facilityId,
      receivedBy: payment.paymentMethodDetails?.receivedBy,
      denominationBreakdown: payment.paymentMethodDetails?.denominationBreakdown,
      verifiedBy: payment.verifiedBy,
      verifiedAt: payment.verifiedAt
    };
  }
}

export default CashService;

