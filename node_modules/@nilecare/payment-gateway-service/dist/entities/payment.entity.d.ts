/**
 * Payment Entity
 * Represents a payment transaction in the system
 */
export interface Payment {
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
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    AWAITING_VERIFICATION = "awaiting_verification",
    VERIFIED = "verified",
    CONFIRMED = "confirmed",
    REJECTED = "rejected",
    FAILED = "failed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded",
    PARTIALLY_REFUNDED = "partially_refunded"
}
export declare enum VerificationMethod {
    MANUAL = "manual",
    API = "api",
    WEBHOOK = "webhook",
    CASH_RECEIPT = "cash_receipt",
    BANK_STATEMENT = "bank_statement"
}
export interface Evidence {
    type: 'receipt' | 'screenshot' | 'bank_statement' | 'cheque_photo' | 'other';
    url: string;
    uploadedAt: Date;
    uploadedBy?: string;
}
export interface PaymentMethodDetails {
    cardLast4?: string;
    cardBrand?: string;
    cardHolder?: string;
    phoneNumber?: string;
    walletName?: string;
    denominationBreakdown?: Record<string, number>;
    receivedBy?: string;
    chequeNumber?: string;
    bank?: string;
    chequeDate?: Date;
    accountNumber?: string;
    bankName?: string;
    transferReference?: string;
}
export declare class PaymentEntity implements Payment {
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
    constructor(data: Partial<Payment>);
    /**
     * Check if payment is pending
     */
    isPending(): boolean;
    /**
     * Check if payment is completed
     */
    isCompleted(): boolean;
    /**
     * Check if payment failed
     */
    isFailed(): boolean;
    /**
     * Check if payment requires verification
     */
    requiresVerification(): boolean;
    /**
     * Mark as verified
     */
    markAsVerified(verifiedBy: string, notes?: string): void;
    /**
     * Mark as confirmed
     */
    markAsConfirmed(): void;
    /**
     * Mark as failed
     */
    markAsFailed(reason: string): void;
}
export default PaymentEntity;
//# sourceMappingURL=payment.entity.d.ts.map