/**
 * Payment Provider Repository
 * Data access layer for payment provider configuration
 */
import { PaymentProviderEntity, ProviderType } from '../entities/payment-provider.entity';
export declare class ProviderRepository {
    private db;
    /**
     * Find provider by ID
     */
    findById(id: string): Promise<PaymentProviderEntity | null>;
    /**
     * Find provider by name
     */
    findByName(name: string): Promise<PaymentProviderEntity | null>;
    /**
     * Find all active providers
     */
    findAllActive(): Promise<PaymentProviderEntity[]>;
    /**
     * Find providers by type
     */
    findByType(type: ProviderType): Promise<PaymentProviderEntity[]>;
    /**
     * Update provider configuration
     */
    update(provider: PaymentProviderEntity): Promise<void>;
    /**
     * Map database row to entity
     */
    private mapRowToEntity;
}
export default ProviderRepository;
//# sourceMappingURL=provider.repository.d.ts.map