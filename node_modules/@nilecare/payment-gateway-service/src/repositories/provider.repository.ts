/**
 * Payment Provider Repository
 * Data access layer for payment provider configuration
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import DatabaseConfig from '../config/database.config';
import { PaymentProviderEntity, ProviderType, VerificationType } from '../entities/payment-provider.entity';

export class ProviderRepository {
  private db = DatabaseConfig;

  /**
   * Find provider by ID
   */
  async findById(id: string): Promise<PaymentProviderEntity | null> {
    const sql = `SELECT * FROM payment_providers WHERE id = ? LIMIT 1`;
    const rows = await this.db.query<RowDataPacket[]>(sql, [id]);
    
    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find provider by name
   */
  async findByName(name: string): Promise<PaymentProviderEntity | null> {
    const sql = `SELECT * FROM payment_providers WHERE name = ? LIMIT 1`;
    const rows = await this.db.query<RowDataPacket[]>(sql, [name]);
    
    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find all active providers
   */
  async findAllActive(): Promise<PaymentProviderEntity[]> {
    const sql = `
      SELECT * FROM payment_providers 
      WHERE is_active = TRUE 
      ORDER BY display_name ASC
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find providers by type
   */
  async findByType(type: ProviderType): Promise<PaymentProviderEntity[]> {
    const sql = `
      SELECT * FROM payment_providers 
      WHERE provider_type = ? AND is_active = TRUE 
      ORDER BY display_name ASC
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [type]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Update provider configuration
   */
  async update(provider: PaymentProviderEntity): Promise<void> {
    const sql = `
      UPDATE payment_providers SET
        display_name = ?,
        is_active = ?,
        is_test_mode = ?,
        api_config = ?,
        fee_structure = ?,
        min_transaction_amount = ?,
        max_transaction_amount = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      provider.displayName,
      provider.isActive,
      provider.isTestMode,
      provider.apiConfig ? JSON.stringify(provider.apiConfig) : null,
      provider.feeStructure ? JSON.stringify(provider.feeStructure) : null,
      provider.minTransactionAmount || null,
      provider.maxTransactionAmount || null,
      provider.id
    ];

    await this.db.query<ResultSetHeader>(sql, params);
  }

  /**
   * Map database row to entity
   */
  private mapRowToEntity(row: any): PaymentProviderEntity {
    return new PaymentProviderEntity({
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      providerType: row.provider_type as ProviderType,
      isActive: row.is_active,
      isTestMode: row.is_test_mode,
      verificationType: row.verification_type as VerificationType,
      requiresManualApproval: row.requires_manual_approval,
      apiConfig: row.api_config ? JSON.parse(row.api_config) : undefined,
      supportedCurrencies: row.supported_currencies ? JSON.parse(row.supported_currencies) : ['SDG'],
      supportsRefunds: row.supports_refunds,
      supportsPartialRefunds: row.supports_partial_refunds,
      supportsInstallments: row.supports_installments,
      feeStructure: row.fee_structure ? JSON.parse(row.fee_structure) : undefined,
      minTransactionAmount: row.min_transaction_amount ? parseFloat(row.min_transaction_amount) : undefined,
      maxTransactionAmount: row.max_transaction_amount ? parseFloat(row.max_transaction_amount) : undefined,
      dailyTransactionLimit: row.daily_transaction_limit ? parseFloat(row.daily_transaction_limit) : undefined,
      avgProcessingTime: row.avg_processing_time,
      maxProcessingTime: row.max_processing_time,
      supportPhone: row.support_phone,
      supportEmail: row.support_email,
      supportUrl: row.support_url,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }
}

export default ProviderRepository;

