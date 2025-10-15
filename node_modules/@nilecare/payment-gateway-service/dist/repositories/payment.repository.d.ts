/**
 * Payment Repository
 * Data access layer for payment transactions
 */
import { PoolConnection } from 'mysql2/promise';
import { PaymentEntity } from '../entities/payment.entity';
export declare class PaymentRepository {
    private db;
    /**
     * Create new payment
     */
    create(payment: PaymentEntity): Promise<PaymentEntity>;
    /**
     * Find payment by ID
     */
    findById(id: string): Promise<PaymentEntity | null>;
    /**
     * Find payment by transaction ID
     */
    findByTransactionId(transactionId: string): Promise<PaymentEntity | null>;
    /**
     * Find payment by merchant reference
     */
    findByMerchantReference(merchantReference: string): Promise<PaymentEntity | null>;
    /**
     * Find payments by invoice ID
     */
    findByInvoiceId(invoiceId: string): Promise<PaymentEntity[]>;
    /**
     * Find pending verifications
     */
    findPendingVerifications(facilityId?: string): Promise<PaymentEntity[]>;
    /**
     * Find payments with filters and pagination
     */
    findWithFilters(filters: any, page?: number, limit?: number): Promise<{
        payments: PaymentEntity[];
        total: number;
    }>;
    /**
     * Update payment
     */
    update(payment: PaymentEntity, connection?: PoolConnection): Promise<void>;
    /**
     * Get payments by date range
     */
    findByDateRange(startDate: Date, endDate: Date, status?: string): Promise<PaymentEntity[]>;
    /**
     * Count payments by criteria
     */
    count(criteria: any): Promise<number>;
    /**
     * Map database row to entity
     */
    private mapRowToEntity;
}
export default PaymentRepository;
//# sourceMappingURL=payment.repository.d.ts.map