/**
 * Billing Account Entity
 * Represents a patient's billing account
 */

export interface BillingAccount {
  id: string;
  accountNumber: string;
  
  // References
  patientId: string;
  facilityId: string;
  guarantorId?: string;
  
  // Account Type
  accountType: AccountType;
  
  // Financial Summary
  totalCharges: number;
  totalPayments: number;
  totalAdjustments: number;
  balanceDue: number;
  
  // Status
  status: AccountStatus;
  
  // Payment Plan
  paymentPlanActive: boolean;
  paymentPlanAmount?: number;
  paymentPlanFrequency?: PaymentFrequency;
  paymentPlanStartDate?: Date;
  paymentPlanEndDate?: Date;
  
  // Statement History
  lastStatementDate?: Date;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  statementFrequency: StatementFrequency;
  
  // Contact Preferences
  preferredContactMethod: ContactMethod;
  sendElectronicStatements: boolean;
  
  // Credit
  creditLimit?: number;
  creditUsed: number;
  
  // Audit
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AccountType {
  PATIENT = 'patient',
  INSURANCE = 'insurance',
  SELF_PAY = 'self_pay',
  CHARITY_CARE = 'charity_care',
  WORKER_COMP = 'worker_comp',
  GOVERNMENT = 'government',
  OTHER = 'other'
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COLLECTIONS = 'collections',
  PAID_IN_FULL = 'paid_in_full',
  WRITTEN_OFF = 'written_off',
  SUSPENDED = 'suspended'
}

export enum PaymentFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

export enum StatementFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ON_DEMAND = 'on_demand'
}

export enum ContactMethod {
  EMAIL = 'email',
  SMS = 'sms',
  PHONE = 'phone',
  MAIL = 'mail'
}

export class BillingAccountEntity implements BillingAccount {
  id: string;
  accountNumber: string;
  patientId: string;
  facilityId: string;
  guarantorId?: string;
  accountType: AccountType;
  totalCharges: number;
  totalPayments: number;
  totalAdjustments: number;
  balanceDue: number;
  status: AccountStatus;
  paymentPlanActive: boolean;
  paymentPlanAmount?: number;
  paymentPlanFrequency?: PaymentFrequency;
  paymentPlanStartDate?: Date;
  paymentPlanEndDate?: Date;
  lastStatementDate?: Date;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  statementFrequency: StatementFrequency;
  preferredContactMethod: ContactMethod;
  sendElectronicStatements: boolean;
  creditLimit?: number;
  creditUsed: number;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<BillingAccount>) {
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
    this.totalCharges = this.totalCharges || 0;
    this.totalPayments = this.totalPayments || 0;
    this.totalAdjustments = this.totalAdjustments || 0;
    this.balanceDue = this.balanceDue || 0;
    this.creditUsed = this.creditUsed || 0;
    this.paymentPlanActive = this.paymentPlanActive || false;
    this.sendElectronicStatements = this.sendElectronicStatements !== false;
    this.statementFrequency = this.statementFrequency || StatementFrequency.MONTHLY;
    this.preferredContactMethod = this.preferredContactMethod || ContactMethod.EMAIL;
  }

  /**
   * Check if account is active
   */
  isActive(): boolean {
    return this.status === AccountStatus.ACTIVE;
  }

  /**
   * Check if account has outstanding balance
   */
  hasOutstandingBalance(): boolean {
    return this.balanceDue > 0;
  }

  /**
   * Check if account is in collections
   */
  isInCollections(): boolean {
    return this.status === AccountStatus.COLLECTIONS;
  }

  /**
   * Check if payment plan is active
   */
  hasActivePaymentPlan(): boolean {
    return this.paymentPlanActive &&
           this.paymentPlanEndDate &&
           this.paymentPlanEndDate > new Date();
  }

  /**
   * Apply charge to account
   */
  applyCharge(amount: number): void {
    this.totalCharges += amount;
    this.balanceDue = this.totalCharges - this.totalPayments - this.totalAdjustments;
    this.updatedAt = new Date();
  }

  /**
   * Apply payment to account
   */
  applyPayment(amount: number, paymentDate?: Date): void {
    this.totalPayments += amount;
    this.balanceDue = this.totalCharges - this.totalPayments - this.totalAdjustments;
    this.lastPaymentDate = paymentDate || new Date();
    this.lastPaymentAmount = amount;
    
    if (this.balanceDue <= 0) {
      this.status = AccountStatus.PAID_IN_FULL;
    }
    
    this.updatedAt = new Date();
  }

  /**
   * Apply adjustment to account
   */
  applyAdjustment(amount: number): void {
    this.totalAdjustments += amount;
    this.balanceDue = this.totalCharges - this.totalPayments - this.totalAdjustments;
    this.updatedAt = new Date();
  }
}

export default BillingAccountEntity;

