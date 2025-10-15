/**
 * Refund Repository
 * Data access layer for payment refunds
 */
import { PoolConnection } from 'mysql2/promise';
export interface RefundEntity {
    id: string;
    paymentId: string;
    refundAmount: number;
    refundCurrency: string;
    refundReason: string;
    refundReasonDetails?: string;
    status: string;
    failureReason?: string;
    providerRefundId?: string;
    refundMethod?: string;
    requestedBy: string;
    requestedAt: Date;
    approvedBy?: string;
    approvedAt?: Date;
    processedBy?: string;
    processedAt?: Date;
    refundReference?: string;
    bankAccountDetails?: any;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class RefundRepository {
    private db;
    /**
     * Create refund
     */
    create(refund: RefundEntity, connection?: PoolConnection): Promise<RefundEntity>;
    /**
     * Find by ID
     */
    findById(id: string): Promise<RefundEntity | null>;
    /**
     * Find refunds by payment ID
     */
    findByPaymentId(paymentId: string): Promise<RefundEntity[]>;
    /**
     * Find pending refunds
     */
    findPending(): Promise<RefundEntity[]>;
    /**
     * Update refund
     */
    update(refund: RefundEntity, connection?: PoolConnection): Promise<void>;
    /**
     * Get total refund amount for payment
     */
    getTotalRefundedAmount(paymentId: string): Promise<number>;
    /**
     * Map database row to entity
     */
    private mapRowToEntity;
}
export default RefundRepository;
//# sourceMappingURL=refund.repository.d.ts.map