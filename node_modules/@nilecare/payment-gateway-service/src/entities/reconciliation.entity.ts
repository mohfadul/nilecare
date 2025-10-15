/**
 * Reconciliation Entity
 * Represents payment reconciliation with bank statements
 */

export interface Reconciliation {
  id: string;
  paymentId: string;
  
  // External Transaction Details
  externalTransactionId?: string;
  externalAmount?: number;
  externalCurrency?: string;
  externalFee?: number;
  transactionDate?: Date;
  
  // Reconciliation Status
  reconciliationStatus: ReconciliationStatus;
  
  // Discrepancy Details
  amountDifference?: number;
  discrepancyReason?: string;
  discrepancyType?: DiscrepancyType;
  
  // Resolution
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  resolutionAction?: ResolutionAction;
  
  // Bank Statement Reference
  bankStatementId?: string;
  statementLineNumber?: number;
  statementFileUrl?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export enum ReconciliationStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  MISMATCH = 'mismatch',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  WRITTEN_OFF = 'written_off'
}

export enum DiscrepancyType {
  AMOUNT = 'amount',
  TIMING = 'timing',
  MISSING = 'missing',
  DUPLICATE = 'duplicate',
  OTHER = 'other'
}

export enum ResolutionAction {
  ADJUST_PAYMENT = 'adjust_payment',
  REFUND = 'refund',
  WRITE_OFF = 'write_off',
  CONTACT_PROVIDER = 'contact_provider',
  NONE = 'none'
}

export class ReconciliationEntity implements Reconciliation {
  id: string;
  paymentId: string;
  externalTransactionId?: string;
  externalAmount?: number;
  externalCurrency?: string;
  externalFee?: number;
  transactionDate?: Date;
  reconciliationStatus: ReconciliationStatus;
  amountDifference?: number;
  discrepancyReason?: string;
  discrepancyType?: DiscrepancyType;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  resolutionAction?: ResolutionAction;
  bankStatementId?: string;
  statementLineNumber?: number;
  statementFileUrl?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Reconciliation>) {
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
  }

  /**
   * Check if reconciliation is matched
   */
  isMatched(): boolean {
    return this.reconciliationStatus === ReconciliationStatus.MATCHED;
  }

  /**
   * Check if there's a discrepancy
   */
  hasDiscrepancy(): boolean {
    return this.reconciliationStatus === ReconciliationStatus.MISMATCH;
  }

  /**
   * Check if resolved
   */
  isResolved(): boolean {
    return this.reconciliationStatus === ReconciliationStatus.RESOLVED;
  }

  /**
   * Mark as matched
   */
  markAsMatched(): void {
    this.reconciliationStatus = ReconciliationStatus.MATCHED;
    this.updatedAt = new Date();
  }

  /**
   * Mark as mismatch
   */
  markAsMismatch(
    amountDifference: number,
    discrepancyType: DiscrepancyType,
    reason?: string
  ): void {
    this.reconciliationStatus = ReconciliationStatus.MISMATCH;
    this.amountDifference = amountDifference;
    this.discrepancyType = discrepancyType;
    this.discrepancyReason = reason;
    this.updatedAt = new Date();
  }

  /**
   * Mark as resolved
   */
  markAsResolved(
    resolvedBy: string,
    action: ResolutionAction,
    notes?: string
  ): void {
    this.reconciliationStatus = ReconciliationStatus.RESOLVED;
    this.resolvedBy = resolvedBy;
    this.resolvedAt = new Date();
    this.resolutionAction = action;
    this.resolutionNotes = notes;
    this.updatedAt = new Date();
  }
}

export default ReconciliationEntity;

