/**
 * Reconciliation Repository
 * Data access layer for payment reconciliation
 */
import { PoolConnection } from 'mysql2/promise';
import { ReconciliationEntity } from '../entities/reconciliation.entity';
export declare class ReconciliationRepository {
    private db;
    /**
     * Create reconciliation record
     */
    create(reconciliation: ReconciliationEntity, connection?: PoolConnection): Promise<ReconciliationEntity>;
    /**
     * Find by ID
     */
    findById(id: string): Promise<ReconciliationEntity | null>;
    /**
     * Find by payment ID
     */
    findByPaymentId(paymentId: string): Promise<ReconciliationEntity[]>;
    /**
     * Find unresolved reconciliations
     */
    findUnresolved(): Promise<ReconciliationEntity[]>;
    /**
     * Update reconciliation
     */
    update(reconciliation: ReconciliationEntity, connection?: PoolConnection): Promise<void>;
    /**
     * Map database row to entity
     */
    private mapRowToEntity;
}
export default ReconciliationRepository;
//# sourceMappingURL=reconciliation.repository.d.ts.map