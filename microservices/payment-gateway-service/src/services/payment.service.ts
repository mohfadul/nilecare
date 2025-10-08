/**
 * Payment Service
 * Core business logic for payment processing
 */

import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentEntity, PaymentStatus } from '../entities/payment.entity';
import { PaymentProviderEntity } from '../entities/payment-provider.entity';
import { PaymentResult } from './providers/base-provider.service';
import PaymentRepository from '../repositories/payment.repository';
import ProviderRepository from '../repositories/provider.repository';

// Import providers
import BankOfKhartoumService from './providers/bank-of-khartoum.service';
import ZainCashService from './providers/zain-cash.service';
import CashService from './providers/cash.service';

export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  averageAmount: number;
  paymentsByProvider: Record<string, number>;
  paymentsByStatus: Record<string, number>;
}

export class PaymentService {
  private providers: Map<string, any>;
  private paymentRepository: PaymentRepository;
  private providerRepository: ProviderRepository;

  constructor() {
    this.providers = new Map();
    this.paymentRepository = new PaymentRepository();
    this.providerRepository = new ProviderRepository();
    this.initializeProviders();
  }

  /**
   * Initialize payment providers
   */
  private initializeProviders(): void {
    // Load provider configurations (would come from database or config)
    const providerConfigs = {
      bank_of_khartoum: {
        baseURL: process.env.BANK_OF_KHARTOUM_API_URL || 'https://api.bankofkhartoum.com',
        apiKey: process.env.BANK_OF_KHARTOUM_API_KEY,
        apiSecret: process.env.BANK_OF_KHARTOUM_API_SECRET
      },
      zain_cash: {
        baseURL: process.env.ZAIN_CASH_API_URL || 'https://api.zaincash.sd',
        apiKey: process.env.ZAIN_CASH_API_KEY,
        apiSecret: process.env.ZAIN_CASH_API_SECRET,
        merchantId: process.env.ZAIN_CASH_MERCHANT_ID,
        callbackUrl: `${process.env.APP_URL}/api/v1/payments/webhook/zain-cash`
      },
      cash: {
        baseURL: '',
        apiKey: ''
      }
    };

    // Initialize providers
    this.providers.set('bank_of_khartoum', new BankOfKhartoumService(providerConfigs.bank_of_khartoum));
    this.providers.set('zain_cash', new ZainCashService(providerConfigs.zain_cash));
    this.providers.set('cash', new CashService(providerConfigs.cash));
  }

  /**
   * Get provider by name
   */
  private getProvider(providerName: string): any {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found or not configured`);
    }
    return provider;
  }

  /**
   * Initiate payment
   */
  async initiatePayment(createPaymentDto: CreatePaymentDto, userId: string): Promise<any> {
    try {
      // Validate invoice exists and amount matches
      await this.validateInvoice(createPaymentDto.invoiceId, createPaymentDto.amount);

      // Get provider
      const provider = this.getProvider(createPaymentDto.providerName);

      // Create payment entity
      const payment = new PaymentEntity({
        invoiceId: createPaymentDto.invoiceId,
        patientId: createPaymentDto.patientId,
        facilityId: createPaymentDto.facilityId,
        providerId: '', // Would be fetched from provider configuration
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency || 'SDG',
        exchangeRate: 1.0,
        amountInSdg: createPaymentDto.amount,
        merchantReference: this.generateMerchantReference(),
        externalReference: createPaymentDto.externalReference,
        status: PaymentStatus.PENDING,
        paymentMethodDetails: createPaymentDto.paymentMethodDetails,
        riskScore: 0,
        isFlaggedSuspicious: false,
        providerFee: 0,
        platformFee: 0,
        totalFees: 0,
        netAmount: createPaymentDto.amount,
        initiatedAt: new Date(),
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Process payment with provider
      const result: PaymentResult = await provider.processPayment(createPaymentDto, payment);

      // Update payment with result
      payment.transactionId = result.transactionId;
      payment.status = this.mapStatusToPaymentStatus(result.status);

      // Calculate fees (would be based on provider configuration)
      payment.providerFee = this.calculateProviderFee(payment.amount, createPaymentDto.providerName);
      payment.platformFee = 0; // Configure as needed
      payment.totalFees = payment.providerFee + payment.platformFee;
      payment.netAmount = payment.amount - payment.totalFees;

      // Save payment
      await this.savePayment(payment);

      // Perform fraud detection
      await this.performFraudDetection(payment);

      // Send notification
      await this.sendPaymentNotification(payment, 'initiated');

      // Publish event
      await this.publishPaymentEvent('payment_initiated', payment);

      return {
        success: result.success,
        paymentId: payment.id,
        transactionId: result.transactionId,
        merchantReference: payment.merchantReference,
        status: result.status,
        paymentUrl: result.paymentUrl,
        qrCode: result.qrCode,
        requiresManualVerification: result.requiresManualVerification,
        message: result.message
      };

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<PaymentEntity | null> {
    return await this.paymentRepository.findById(paymentId);
  }

  /**
   * List payments with filters
   */
  async listPayments(filters: any, page: number = 1, limit: number = 50): Promise<any> {
    return await this.paymentRepository.findWithFilters(filters, page, limit);
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string, reason: string, userId: string): Promise<any> {
    const payment = await this.getPaymentById(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (![PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(payment.status)) {
      throw new Error('Payment cannot be cancelled in current status');
    }

    payment.status = PaymentStatus.CANCELLED;
    payment.rejectionReason = reason;
    payment.updatedAt = new Date();

    await this.paymentRepository.update(payment);

    // Publish event
    await this.publishPaymentEvent('payment_cancelled', payment);

    return {
      success: true,
      paymentId: payment.id,
      status: 'cancelled'
    };
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(filters: any): Promise<PaymentStatistics> {
    const { payments } = await this.paymentRepository.findWithFilters(filters, 1, 10000);
    
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const successfulPayments = payments.filter(p => p.status === PaymentStatus.CONFIRMED).length;
    const pendingPayments = payments.filter(p => 
      p.status === PaymentStatus.PENDING || 
      p.status === PaymentStatus.AWAITING_VERIFICATION
    ).length;
    const failedPayments = payments.filter(p => p.status === PaymentStatus.FAILED).length;

    const paymentsByProvider: Record<string, number> = {};
    const paymentsByStatus: Record<string, number> = {};

    for (const payment of payments) {
      paymentsByProvider[payment.providerId] = (paymentsByProvider[payment.providerId] || 0) + 1;
      paymentsByStatus[payment.status] = (paymentsByStatus[payment.status] || 0) + 1;
    }

    const stats: PaymentStatistics = {
      totalPayments,
      totalAmount,
      successfulPayments,
      pendingPayments,
      failedPayments,
      averageAmount: totalPayments > 0 ? totalAmount / totalPayments : 0,
      paymentsByProvider,
      paymentsByStatus
    };

    return stats;
  }

  /**
   * Handle provider webhook
   */
  async handleProviderWebhook(providerName: string, webhookData: any): Promise<void> {
    try {
      const provider = this.getProvider(providerName);

      // Process webhook
      const result = await provider.handleWebhook(webhookData);

      if (result && result.transactionId) {
        // Find payment by transaction ID
        const payment = await this.getPaymentByTransactionId(result.transactionId);

        if (payment) {
          // Update payment status
          payment.status = this.mapStatusToPaymentStatus(result.status);
          payment.verifiedAt = result.verifiedAt;
          payment.updatedAt = new Date();

          if (payment.status === PaymentStatus.CONFIRMED) {
            payment.confirmedAt = new Date();
          } else if (payment.status === PaymentStatus.FAILED) {
            payment.failedAt = new Date();
            payment.failureReason = result.message;
          }

          await this.paymentRepository.update(payment);

          // Update invoice status if payment confirmed
          if (payment.status === PaymentStatus.CONFIRMED) {
            await this.updateInvoiceStatus(payment.invoiceId);
          }

          // Publish event
          await this.publishPaymentEvent('payment_updated', payment);
        }
      }

    } catch (error: any) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Update invoice status based on payments
   */
  async updateInvoiceStatus(invoiceId: string): Promise<void> {
    // In production: Query all payments for invoice
    // const payments = await this.paymentRepository.find({
    //   where: { invoiceId, status: PaymentStatus.CONFIRMED }
    // });

    // const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    // const invoice = await this.invoiceService.getInvoice(invoiceId);

    // Determine new status
    // let newStatus: string;
    // if (totalPaid >= invoice.totalAmount) {
    //   newStatus = 'paid';
    // } else if (totalPaid > 0) {
    //   newStatus = 'partially_paid';
    // } else {
    //   newStatus = 'unpaid';
    // }

    // await this.invoiceService.updateStatus(invoiceId, newStatus, totalPaid);

    console.log('Invoice status updated for:', invoiceId);
  }

  /**
   * Private helper methods
   */

  private async validateInvoice(invoiceId: string, amount: number): Promise<void> {
    // In production: Validate invoice exists and amount matches
    // const invoice = await this.invoiceService.getInvoice(invoiceId);
    // if (!invoice) {
    //   throw new Error('Invoice not found');
    // }
    // if (invoice.status === 'paid') {
    //   throw new Error('Invoice already paid');
    // }
    // Validate amount logic...
  }

  private generateMerchantReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `NILE-${timestamp}-${random}`;
  }

  private calculateProviderFee(amount: number, providerName: string): number {
    // Fee structure (would come from provider configuration)
    const feeRates: Record<string, number> = {
      'bank_of_khartoum': 0.015,  // 1.5%
      'faisal_islamic': 0.015,    // 1.5%
      'zain_cash': 0.01,          // 1.0%
      'mtn_money': 0.01,          // 1.0%
      'sudani_cash': 0.01,        // 1.0%
      'cash': 0,                  // 0%
      'visa': 0.025,              // 2.5%
      'mastercard': 0.025         // 2.5%
    };

    const rate = feeRates[providerName] || 0;
    return Math.round(amount * rate * 100) / 100;
  }

  private mapStatusToPaymentStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'pending': PaymentStatus.PENDING,
      'processing': PaymentStatus.PROCESSING,
      'awaiting_verification': PaymentStatus.AWAITING_VERIFICATION,
      'confirmed': PaymentStatus.CONFIRMED,
      'failed': PaymentStatus.FAILED
    };

    return statusMap[status] || PaymentStatus.PENDING;
  }

  private async savePayment(payment: PaymentEntity): Promise<void> {
    await this.paymentRepository.create(payment);
    console.log('Payment saved:', payment.id);
  }

  private async getPaymentByTransactionId(transactionId: string): Promise<PaymentEntity | null> {
    return await this.paymentRepository.findByTransactionId(transactionId);
  }

  private async performFraudDetection(payment: PaymentEntity): Promise<void> {
    // Implement fraud detection logic
    // - Check unusual amounts
    // - Check velocity (multiple payments in short time)
    // - Check geographic anomalies
    // - Check device fingerprint
    // Update payment.riskScore and payment.fraudFlags
  }

  private async sendPaymentNotification(payment: PaymentEntity, eventType: string): Promise<void> {
    // Send notification to patient
    // await this.notificationService.sendPaymentNotification(payment.patientId, eventType, payment);
    console.log('Notification sent:', eventType);
  }

  private async publishPaymentEvent(eventType: string, payment: PaymentEntity): Promise<void> {
    // Publish to Kafka
    // await this.eventPublisher.publish('payment-events', {
    //   eventType,
    //   payment
    // });
    console.log('Event published:', eventType);
  }
}

export default PaymentService;

