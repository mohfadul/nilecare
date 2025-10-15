/**
 * Reconciliation Repository
 * Data access layer for payment reconciliation
 */

import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import DatabaseConfig from '../config/database.config';
import { ReconciliationEntity, ReconciliationStatus, DiscrepancyType, ResolutionAction } from '../entities/reconciliation.entity';

export class ReconciliationRepository {
  private db = DatabaseConfig;

  /**
   * Create reconciliation record
   */
  async create(reconciliation: ReconciliationEntity, connection?: PoolConnection): Promise<ReconciliationEntity> {
    const sql = `
      INSERT INTO payment_reconciliation (
        id, payment_id, external_transaction_id,
        external_amount, external_currency, external_fee,
        transaction_date, reconciliation_status,
        amount_difference, discrepancy_reason, discrepancy_type,
        bank_statement_id, statement_line_number, statement_file_url,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        NOW(), NOW()
      )
    `;

    const params = [
      reconciliation.id,
      reconciliation.paymentId || null,
      reconciliation.externalTransactionId || null,
      reconciliation.externalAmount || null,
      reconciliation.externalCurrency || null,
      reconciliation.externalFee || null,
      reconciliation.transactionDate || null,
      reconciliation.reconciliationStatus,
      reconciliation.amountDifference || null,
      reconciliation.discrepancyReason || null,
      reconciliation.discrepancyType || null,
      reconciliation.bankStatementId || null,
      reconciliation.statementLineNumber || null,
      reconciliation.statementFileUrl || null
    ];

    if (connection) {
      await connection.execute(sql, params);
    } else {
      await this.db.query<ResultSetHeader>(sql, params);
    }

    return reconciliation;
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<ReconciliationEntity | null> {
    const sql = `SELECT * FROM payment_reconciliation WHERE id = ? LIMIT 1`;
    const rows = await this.db.query<RowDataPacket[]>(sql, [id]);
    
    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find by payment ID
   */
  async findByPaymentId(paymentId: string): Promise<ReconciliationEntity[]> {
    const sql = `
      SELECT * FROM payment_reconciliation 
      WHERE payment_id = ? 
      ORDER BY created_at DESC
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [paymentId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find unresolved reconciliations
   */
  async findUnresolved(): Promise<ReconciliationEntity[]> {
    const sql = `
      SELECT * FROM payment_reconciliation 
      WHERE reconciliation_status IN (?, ?) 
      ORDER BY created_at ASC
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [
      ReconciliationStatus.MISMATCH,
      ReconciliationStatus.INVESTIGATING
    ]);

    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Update reconciliation
   */
  async update(reconciliation: ReconciliationEntity, connection?: PoolConnection): Promise<void> {
    const sql = `
      UPDATE payment_reconciliation SET
        reconciliation_status = ?,
        amount_difference = ?,
        discrepancy_reason = ?,
        discrepancy_type = ?,
        resolved_by = ?,
        resolved_at = ?,
        resolution_notes = ?,
        resolution_action = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      reconciliation.reconciliationStatus,
      reconciliation.amountDifference || null,
      reconciliation.discrepancyReason || null,
      reconciliation.discrepancyType || null,
      reconciliation.resolvedBy || null,
      reconciliation.resolvedAt || null,
      reconciliation.resolutionNotes || null,
      reconciliation.resolutionAction || null,
      reconciliation.id
    ];

    if (connection) {
      await connection.execute(sql, params);
    } else {
      await this.db.query<ResultSetHeader>(sql, params);
    }
  }

  /**
   * Map database row to entity
   */
  private mapRowToEntity(row: any): ReconciliationEntity {
    return new ReconciliationEntity({
      id: row.id,
      paymentId: row.payment_id,
      externalTransactionId: row.external_transaction_id,
      externalAmount: row.external_amount ? parseFloat(row.external_amount) : undefined,
      externalCurrency: row.external_currency,
      externalFee: row.external_fee ? parseFloat(row.external_fee) : undefined,
      transactionDate: row.transaction_date ? new Date(row.transaction_date) : undefined,
      reconciliationStatus: row.reconciliation_status as ReconciliationStatus,
      amountDifference: row.amount_difference ? parseFloat(row.amount_difference) : undefined,
      discrepancyReason: row.discrepancy_reason,
      discrepancyType: row.discrepancy_type as DiscrepancyType,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolutionNotes: row.resolution_notes,
      resolutionAction: row.resolution_action as ResolutionAction,
      bankStatementId: row.bank_statement_id,
      statementLineNumber: row.statement_line_number,
      statementFileUrl: row.statement_file_url,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }
}

export default ReconciliationRepository;

