/**
 * Invoice Entity
 * Represents a billing invoice in the system
 */

export interface Invoice {
  id: string;
  invoiceNumber: string;
  
  // References
  patientId: string;
  facilityId: string;
  billingAccountId?: string;
  encounterId?: string;
  appointmentId?: string;
  
  // Type
  invoiceType: InvoiceType;
  
  // Financial
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  adjustmentAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
  exchangeRate: number;
  
  // Status
  status: InvoiceStatus;
  
  // Dates
  invoiceDate: Date;
  dueDate: Date;
  paidDate?: Date;
  lastPaymentDate?: Date;
  overdueDate?: Date;
  
  // Payment Terms
  paymentTerms: string;
  gracePeriodDays: number;
  lateFeePercentage: number;
  lateFeesApplied: number;
  
  // Insurance
  insurancePolicyId?: string;
  insuranceCompany?: string;
  insuranceClaimNumber?: string;
  insuranceAuthorizationNumber?: string;
  patientResponsibility?: number;
  insuranceResponsibility?: number;
  
  // Notes
  description?: string;
  internalNotes?: string;
  patientNotes?: string;
  
  // Audit
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  deletedBy?: string;
}

export enum InvoiceType {
  STANDARD = 'standard',
  INSURANCE = 'insurance',
  EMERGENCY = 'emergency',
  PHARMACY = 'pharmacy',
  LAB = 'lab',
  RADIOLOGY = 'radiology',
  SURGERY = 'surgery',
  CONSULTATION = 'consultation',
  OTHER = 'other'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  WRITTEN_OFF = 'written_off',
  IN_COLLECTIONS = 'in_collections'
}

export class InvoiceEntity implements Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  facilityId: string;
  billingAccountId?: string;
  encounterId?: string;
  appointmentId?: string;
  invoiceType: InvoiceType;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  adjustmentAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
  exchangeRate: number;
  status: InvoiceStatus;
  invoiceDate: Date;
  dueDate: Date;
  paidDate?: Date;
  lastPaymentDate?: Date;
  overdueDate?: Date;
  paymentTerms: string;
  gracePeriodDays: number;
  lateFeePercentage: number;
  lateFeesApplied: number;
  insurancePolicyId?: string;
  insuranceCompany?: string;
  insuranceClaimNumber?: string;
  insuranceAuthorizationNumber?: string;
  patientResponsibility?: number;
  insuranceResponsibility?: number;
  description?: string;
  internalNotes?: string;
  patientNotes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  deletedBy?: string;

  constructor(data: Partial<Invoice>) {
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
  }

  /**
   * Check if invoice is paid
   */
  isPaid(): boolean {
    return this.status === InvoiceStatus.PAID;
  }

  /**
   * Check if invoice is overdue
   */
  isOverdue(): boolean {
    return this.status === InvoiceStatus.OVERDUE ||
           (this.dueDate < new Date() && this.balanceDue > 0);
  }

  /**
   * Check if payment is pending
   */
  isPaymentPending(): boolean {
    return this.status === InvoiceStatus.PENDING && this.balanceDue > 0;
  }

  /**
   * Mark as paid
   */
  markAsPaid(paidDate?: Date): void {
    this.status = InvoiceStatus.PAID;
    this.paidDate = paidDate || new Date();
    this.paidAmount = this.totalAmount;
    this.balanceDue = 0;
    this.lastPaymentDate = this.paidDate;
    this.updatedAt = new Date();
  }

  /**
   * Apply partial payment
   */
  applyPartialPayment(amount: number, paymentDate?: Date): void {
    this.paidAmount += amount;
    this.balanceDue = this.totalAmount - this.paidAmount;
    this.lastPaymentDate = paymentDate || new Date();
    
    if (this.balanceDue <= 0) {
      this.status = InvoiceStatus.PAID;
      this.paidDate = this.lastPaymentDate;
    } else {
      this.status = InvoiceStatus.PARTIALLY_PAID;
    }
    
    this.updatedAt = new Date();
  }

  /**
   * Mark as overdue
   */
  markAsOverdue(): void {
    if (this.status !== InvoiceStatus.PAID && this.balanceDue > 0) {
      this.status = InvoiceStatus.OVERDUE;
      this.overdueDate = this.overdueDate || new Date();
      this.updatedAt = new Date();
    }
  }

  /**
   * Calculate days overdue
   */
  getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const now = new Date();
    const diffTime = now.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export default InvoiceEntity;

