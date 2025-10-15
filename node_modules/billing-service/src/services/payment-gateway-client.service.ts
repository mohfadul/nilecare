/**
 * Payment Gateway Client Service
 * Integration with Payment Gateway Service
 * 
 * ✅ Separation of Concerns:
 * - Billing Service: Manages invoices and billing records
 * - Payment Gateway: Processes payments and transactions
 * - This client: Queries payment status and links payments to invoices
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../config/logger.config';

const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || 'http://localhost:7030';
const PAYMENT_GATEWAY_API_KEY = process.env.PAYMENT_GATEWAY_API_KEY;

export interface PaymentInfo {
  id: string;
  invoiceId: string;
  patientId: string;
  facilityId: string;
  amount: number;
  currency: string;
  status: string;
  merchantReference: string;
  transactionId?: string;
  providerName?: string;
  initiatedAt: Date;
  confirmedAt?: Date;
  createdBy: string;
}

export class PaymentGatewayClient {
  private client: AxiosInstance;

  constructor() {
    if (!PAYMENT_GATEWAY_API_KEY) {
      logger.warn('⚠️  PAYMENT_GATEWAY_API_KEY not configured - payment queries will fail');
    }

    this.client = axios.create({
      baseURL: PAYMENT_GATEWAY_URL,
      headers: {
        'X-Service-Key': PAYMENT_GATEWAY_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        logger.error('Payment Gateway request failed', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message
        });
        throw error;
      }
    );
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<PaymentInfo | null> {
    try {
      const response = await this.client.get(`/api/v1/payments/${paymentId}`);
      
      if (!response.data.success) {
        return null;
      }

      return this.mapPaymentResponse(response.data.data);

    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get payments for an invoice
   */
  async getPaymentsForInvoice(invoiceId: string): Promise<PaymentInfo[]> {
    try {
      const response = await this.client.get('/api/v1/payments', {
        params: { invoiceId }
      });

      if (!response.data.success) {
        return [];
      }

      const payments = response.data.data || [];
      return payments.map((p: any) => this.mapPaymentResponse(p));

    } catch (error: any) {
      logger.error('Failed to fetch payments for invoice', {
        invoiceId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get payments by merchant reference
   */
  async getPaymentByMerchantReference(merchantReference: string): Promise<PaymentInfo | null> {
    try {
      const response = await this.client.get('/api/v1/payments', {
        params: { merchantReference }
      });

      if (!response.data.success || !response.data.data || response.data.data.length === 0) {
        return null;
      }

      return this.mapPaymentResponse(response.data.data[0]);

    } catch (error: any) {
      logger.error('Failed to fetch payment by merchant reference', {
        merchantReference,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get payment statistics for facility
   */
  async getPaymentStatistics(facilityId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const response = await this.client.get('/api/v1/payments/stats', {
        params: {
          facilityId,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        }
      });

      if (!response.data.success) {
        return null;
      }

      return response.data.data;

    } catch (error: any) {
      logger.error('Failed to fetch payment statistics', {
        facilityId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Check if invoice has confirmed payments
   */
  async hasConfirmedPayments(invoiceId: string): Promise<boolean> {
    const payments = await this.getPaymentsForInvoice(invoiceId);
    return payments.some(p => p.status === 'confirmed');
  }

  /**
   * Get total confirmed payment amount for invoice
   */
  async getTotalConfirmedAmount(invoiceId: string): Promise<number> {
    const payments = await this.getPaymentsForInvoice(invoiceId);
    return payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  /**
   * Notify Payment Gateway about invoice (optional)
   * This could be used if Payment Gateway needs to know about invoice creation
   */
  async notifyInvoiceCreated(invoiceId: string, patientId: string, amount: number): Promise<void> {
    try {
      // This is optional - Payment Gateway might not need this
      // Keeping for future webhook integration
      logger.info('Invoice created notification (not implemented in Payment Gateway yet)', {
        invoiceId,
        patientId,
        amount
      });

    } catch (error: any) {
      // Non-critical - just log
      logger.warn('Failed to notify Payment Gateway about invoice', {
        invoiceId,
        error: error.message
      });
    }
  }

  /**
   * Map Payment Gateway response to our format
   */
  private mapPaymentResponse(paymentData: any): PaymentInfo {
    return {
      id: paymentData.id,
      invoiceId: paymentData.invoiceId || paymentData.invoice_id,
      patientId: paymentData.patientId || paymentData.patient_id,
      facilityId: paymentData.facilityId || paymentData.facility_id,
      amount: parseFloat(paymentData.amount),
      currency: paymentData.currency,
      status: paymentData.status,
      merchantReference: paymentData.merchantReference || paymentData.merchant_reference,
      transactionId: paymentData.transactionId || paymentData.transaction_id,
      providerName: paymentData.providerName || paymentData.provider_name,
      initiatedAt: new Date(paymentData.initiatedAt || paymentData.initiated_at),
      confirmedAt: paymentData.confirmedAt || paymentData.confirmed_at 
        ? new Date(paymentData.confirmedAt || paymentData.confirmed_at) 
        : undefined,
      createdBy: paymentData.createdBy || paymentData.created_by
    };
  }

  /**
   * Health check - verify Payment Gateway is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new PaymentGatewayClient();

