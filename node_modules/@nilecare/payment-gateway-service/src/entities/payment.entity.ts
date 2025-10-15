/**
 * Payment Entity
 * Represents a payment transaction in the system
 */

export interface Payment {
  id: string;
  
  // References
  invoiceId: string;
  patientId: string;
  facilityId: string;
  providerId: string;
  
  // Payment Details
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInSdg: number;
  
  // Transaction References
  transactionId?: string;
  merchantReference: string;
  externalReference?: string;
  
  // Status
  status: PaymentStatus;
  failureReason?: string;
  rejectionReason?: string;
  
  // Verification
  verificationMethod?: VerificationMethod;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  evidenceUrls?: Evidence[];
  
  // Payment Method Details
  paymentMethodDetails?: PaymentMethodDetails;
  
  // Fraud Detection
  riskScore: number;
  fraudFlags?: string[];
  isFlaggedSuspicious: boolean;
  
  // Fees
  providerFee: number;
  platformFee: number;
  totalFees: number;
  netAmount: number;
  
  // Timestamps
  initiatedAt: Date;
  processedAt?: Date;
  confirmedAt?: Date;
  failedAt?: Date;
  
  // Audit
  createdBy: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  AWAITING_VERIFICATION = 'awaiting_verification',
  VERIFIED = 'verified',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum VerificationMethod {
  MANUAL = 'manual',
  API = 'api',
  WEBHOOK = 'webhook',
  CASH_RECEIPT = 'cash_receipt',
  BANK_STATEMENT = 'bank_statement'
}

export interface Evidence {
  type: 'receipt' | 'screenshot' | 'bank_statement' | 'cheque_photo' | 'other';
  url: string;
  uploadedAt: Date;
  uploadedBy?: string;
}

export interface PaymentMethodDetails {
  // Bank Card
  cardLast4?: string;
  cardBrand?: string;
  cardHolder?: string;
  
  // Mobile Wallet
  phoneNumber?: string;
  walletName?: string;
  
  // Cash
  denominationBreakdown?: Record<string, number>;
  receivedBy?: string;
  
  // Cheque
  chequeNumber?: string;
  bank?: string;
  chequeDate?: Date;
  
  // Bank Transfer
  accountNumber?: string;
  bankName?: string;
  transferReference?: string;
}

export class PaymentEntity implements Payment {
  id: string;
  invoiceId: string;
  patientId: string;
  facilityId: string;
  providerId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInSdg: number;
  transactionId?: string;
  merchantReference: string;
  externalReference?: string;
  status: PaymentStatus;
  failureReason?: string;
  rejectionReason?: string;
  verificationMethod?: VerificationMethod;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  evidenceUrls?: Evidence[];
  paymentMethodDetails?: PaymentMethodDetails;
  riskScore: number;
  fraudFlags?: string[];
  isFlaggedSuspicious: boolean;
  providerFee: number;
  platformFee: number;
  totalFees: number;
  netAmount: number;
  initiatedAt: Date;
  processedAt?: Date;
  confirmedAt?: Date;
  failedAt?: Date;
  createdBy: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Payment>) {
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
  }

  /**
   * Check if payment is pending
   */
  isPending(): boolean {
    return this.status === PaymentStatus.PENDING || 
           this.status === PaymentStatus.PROCESSING;
  }

  /**
   * Check if payment is completed
   */
  isCompleted(): boolean {
    return this.status === PaymentStatus.CONFIRMED;
  }

  /**
   * Check if payment failed
   */
  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED || 
           this.status === PaymentStatus.REJECTED;
  }

  /**
   * Check if payment requires verification
   */
  requiresVerification(): boolean {
    return this.status === PaymentStatus.AWAITING_VERIFICATION;
  }

  /**
   * Mark as verified
   */
  markAsVerified(verifiedBy: string, notes?: string): void {
    this.status = PaymentStatus.VERIFIED;
    this.verifiedBy = verifiedBy;
    this.verifiedAt = new Date();
    this.verificationNotes = notes;
    this.updatedAt = new Date();
  }

  /**
   * Mark as confirmed
   */
  markAsConfirmed(): void {
    this.status = PaymentStatus.CONFIRMED;
    this.confirmedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Mark as failed
   */
  markAsFailed(reason: string): void {
    this.status = PaymentStatus.FAILED;
    this.failureReason = reason;
    this.failedAt = new Date();
    this.updatedAt = new Date();
  }
}

export default PaymentEntity;

