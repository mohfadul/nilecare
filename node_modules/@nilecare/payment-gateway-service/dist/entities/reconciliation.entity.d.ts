/**
 * Reconciliation Entity
 * Represents payment reconciliation with bank statements
 */
export interface Reconciliation {
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
}
export declare enum ReconciliationStatus {
    PENDING = "pending",
    MATCHED = "matched",
    MISMATCH = "mismatch",
    INVESTIGATING = "investigating",
    RESOLVED = "resolved",
    WRITTEN_OFF = "written_off"
}
export declare enum DiscrepancyType {
    AMOUNT = "amount",
    TIMING = "timing",
    MISSING = "missing",
    DUPLICATE = "duplicate",
    OTHER = "other"
}
export declare enum ResolutionAction {
    ADJUST_PAYMENT = "adjust_payment",
    REFUND = "refund",
    WRITE_OFF = "write_off",
    CONTACT_PROVIDER = "contact_provider",
    NONE = "none"
}
export declare class ReconciliationEntity implements Reconciliation {
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
    constructor(data: Partial<Reconciliation>);
    /**
     * Check if reconciliation is matched
     */
    isMatched(): boolean;
    /**
     * Check if there's a discrepancy
     */
    hasDiscrepancy(): boolean;
    /**
     * Check if resolved
     */
    isResolved(): boolean;
    /**
     * Mark as matched
     */
    markAsMatched(): void;
    /**
     * Mark as mismatch
     */
    markAsMismatch(amountDifference: number, discrepancyType: DiscrepancyType, reason?: string): void;
    /**
     * Mark as resolved
     */
    markAsResolved(resolvedBy: string, action: ResolutionAction, notes?: string): void;
}
export default ReconciliationEntity;
//# sourceMappingURL=reconciliation.entity.d.ts.map