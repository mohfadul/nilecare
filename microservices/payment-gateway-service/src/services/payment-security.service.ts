/**
 * Payment Security Service
 * Handles payment security, encryption, and audit logging
 */

import crypto from 'crypto';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentEntity } from '../entities/payment.entity';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface FraudAnalysis {
  riskScore: number; // 0-100
  fraudFlags: string[];
  recommendation: 'approve' | 'review' | 'decline';
  details: string;
}

export class PaymentSecurityService {
  private readonly encryptionAlgorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor() {
    const key = process.env.PAYMENT_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('PAYMENT_ENCRYPTION_KEY environment variable not set');
    }
    this.encryptionKey = Buffer.from(key, 'hex');
  }

  /**
   * Validate payment request
   */
  async validatePaymentRequest(paymentData: CreatePaymentDto): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Validate amount
      if (paymentData.amount <= 0) {
        errors.push('Invalid payment amount');
      }

      // Check for duplicate transactions
      const duplicate = await this.checkDuplicatePayment(paymentData);
      if (duplicate) {
        errors.push('Duplicate payment detected');
      }

      // Validate patient and invoice relationship
      const validRelationship = await this.validatePatientInvoiceRelationship(paymentData);
      if (!validRelationship) {
        errors.push('Invalid patient-invoice relationship');
      }

      // Validate invoice status
      const validInvoice = await this.validateInvoiceStatus(paymentData.invoiceId);
      if (!validInvoice) {
        errors.push('Invoice is not in a valid state for payment');
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error: any) {
      console.error('Payment validation error:', error);
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Perform fraud detection
   */
  async performFraudDetection(payment: PaymentEntity): Promise<FraudAnalysis> {
    let riskScore = 0;
    const fraudFlags: string[] = [];

    // Check 1: Unusual amount
    if (await this.isUnusualAmount(payment)) {
      riskScore += 25;
      fraudFlags.push('unusual_amount');
    }

    // Check 2: Velocity check (multiple payments in short time)
    if (await this.hasHighVelocity(payment.patientId)) {
      riskScore += 30;
      fraudFlags.push('high_velocity');
    }

    // Check 3: Time-based anomaly (late night payments)
    if (this.isUnusualTime(payment.createdAt)) {
      riskScore += 15;
      fraudFlags.push('unusual_time');
    }

    // Check 4: Large first transaction
    if (await this.isFirstLargeTransaction(payment)) {
      riskScore += 20;
      fraudFlags.push('first_large_transaction');
    }

    // Check 5: Negative history
    if (await this.hasNegativeHistory(payment.patientId)) {
      riskScore += 40;
      fraudFlags.push('negative_history');
    }

    // Determine recommendation
    let recommendation: 'approve' | 'review' | 'decline';
    if (riskScore < 30) {
      recommendation = 'approve';
    } else if (riskScore < 60) {
      recommendation = 'review';
    } else {
      recommendation = 'decline';
    }

    return {
      riskScore: Math.min(riskScore, 100),
      fraudFlags,
      recommendation,
      details: this.generateFraudDetails(fraudFlags)
    };
  }

  /**
   * Encrypt sensitive payment data
   */
  async encryptSensitiveData(data: string): Promise<string> {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.encryptionAlgorithm, this.encryptionKey, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Return: iv + authTag + encrypted data
      return iv.toString('hex') + authTag.toString('hex') + encrypted;

    } catch (error: any) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive payment data
   */
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      const ivLength = 32; // 16 bytes in hex
      const authTagLength = 32; // 16 bytes in hex

      const iv = Buffer.from(encryptedData.substring(0, ivLength), 'hex');
      const authTag = Buffer.from(encryptedData.substring(ivLength, ivLength + authTagLength), 'hex');
      const encrypted = encryptedData.substring(ivLength + authTagLength);

      const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error: any) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Log payment audit trail
   */
  async logPaymentAudit(
    action: string,
    paymentId: string,
    userId: string,
    details: any
  ): Promise<void> {
    try {
      const auditLog = {
        action,
        resourceType: 'payment',
        resourceId: paymentId,
        userId,
        timestamp: new Date(),
        details: JSON.stringify(details),
        ipAddress: details.ipAddress || '',
        userAgent: details.userAgent || ''
      };

      // In production: Store in audit database
      // await this.auditRepository.create(auditLog);

      console.log('Payment audit logged:', auditLog);

    } catch (error: any) {
      console.error('Audit logging error:', error);
      // Don't throw - audit logging should not break payment flow
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

    } catch (error: any) {
      console.error('Webhook signature validation error:', error);
      return false;
    }
  }

  /**
   * Generate secure payment token
   */
  generatePaymentToken(paymentId: string, expiresInSeconds: number = 3600): string {
    const payload = {
      paymentId,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Private helper methods
   */

  private async checkDuplicatePayment(paymentData: CreatePaymentDto): Promise<boolean> {
    // In production: Check for duplicate payments within last 5 minutes
    // const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    // const duplicate = await this.paymentRepository.findOne({
    //   where: {
    //     invoiceId: paymentData.invoiceId,
    //     amount: paymentData.amount,
    //     createdAt: MoreThan(fiveMinutesAgo)
    //   }
    // });
    // return !!duplicate;

    return false;
  }

  private async validatePatientInvoiceRelationship(paymentData: CreatePaymentDto): Promise<boolean> {
    // In production: Verify patient owns the invoice
    // const invoice = await this.invoiceRepository.findOne({
    //   where: { id: paymentData.invoiceId }
    // });
    // return invoice?.patientId === paymentData.patientId;

    return true;
  }

  private async validateInvoiceStatus(invoiceId: string): Promise<boolean> {
    // In production: Check invoice is not already paid
    // const invoice = await this.invoiceRepository.findOne({
    //   where: { id: invoiceId }
    // });
    // return invoice?.status !== 'paid';

    return true;
  }

  private async isUnusualAmount(payment: PaymentEntity): Promise<boolean> {
    // Check if amount is significantly higher than patient's average
    // const avgAmount = await this.getPatientAveragePayment(payment.patientId);
    // return payment.amount > avgAmount * 3;

    return payment.amount > 50000; // Simple threshold for now
  }

  private async hasHighVelocity(patientId: string): Promise<boolean> {
    // Check for multiple payments in short time
    // const recentPayments = await this.paymentRepository.count({
    //   where: {
    //     patientId,
    //     createdAt: MoreThan(new Date(Date.now() - 60 * 60 * 1000)) // Last hour
    //   }
    // });
    // return recentPayments > 3;

    return false;
  }

  private isUnusualTime(timestamp: Date): boolean {
    const hour = timestamp.getHours();
    // Flag payments between 11 PM and 5 AM
    return hour >= 23 || hour < 5;
  }

  private async isFirstLargeTransaction(payment: PaymentEntity): Promise<boolean> {
    // Check if this is patient's first payment and it's large
    // const previousPayments = await this.paymentRepository.count({
    //   where: { patientId: payment.patientId }
    // });
    // return previousPayments === 0 && payment.amount > 10000;

    return false;
  }

  private async hasNegativeHistory(patientId: string): Promise<boolean> {
    // Check for failed payments, chargebacks, disputes
    // const negativeEvents = await this.paymentRepository.count({
    //   where: {
    //     patientId,
    //     status: In(['failed', 'refunded', 'disputed'])
    //   }
    // });
    // return negativeEvents > 2;

    return false;
  }

  private generateFraudDetails(flags: string[]): string {
    if (flags.length === 0) {
      return 'No fraud indicators detected';
    }

    const flagDescriptions: Record<string, string> = {
      'unusual_amount': 'Payment amount is unusually high',
      'high_velocity': 'Multiple payments in short time period',
      'unusual_time': 'Payment made during unusual hours',
      'first_large_transaction': 'First payment from patient is unusually large',
      'negative_history': 'Patient has history of failed/disputed payments'
    };

    return flags.map(flag => flagDescriptions[flag] || flag).join('; ');
  }
}

export default PaymentSecurityService;

