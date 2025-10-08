/**
 * Refund Repository
 * Data access layer for payment refunds
 */

import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import DatabaseConfig from '../config/database.config';

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

export class RefundRepository {
  private db = DatabaseConfig;

  /**
   * Create refund
   */
  async create(refund: RefundEntity, connection?: PoolConnection): Promise<RefundEntity> {
    const sql = `
      INSERT INTO payment_refunds (
        id, payment_id, refund_amount, refund_currency,
        refund_reason, refund_reason_details, status,
        refund_method, requested_by, requested_at,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        NOW(), NOW()
      )
    `;

    const params = [
      refund.id,
      refund.paymentId,
      refund.refundAmount,
      refund.refundCurrency,
      refund.refundReason,
      refund.refundReasonDetails || null,
      refund.status,
      refund.refundMethod || null,
      refund.requestedBy,
      refund.requestedAt
    ];

    if (connection) {
      await connection.execute(sql, params);
    } else {
      await this.db.query<ResultSetHeader>(sql, params);
    }

    return refund;
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<RefundEntity | null> {
    const sql = `SELECT * FROM payment_refunds WHERE id = ? LIMIT 1`;
    const rows = await this.db.query<RowDataPacket[]>(sql, [id]);
    
    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find refunds by payment ID
   */
  async findByPaymentId(paymentId: string): Promise<RefundEntity[]> {
    const sql = `
      SELECT * FROM payment_refunds 
      WHERE payment_id = ? 
      ORDER BY created_at DESC
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [paymentId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find pending refunds
   */
  async findPending(): Promise<RefundEntity[]> {
    const sql = `
      SELECT * FROM payment_refunds 
      WHERE status = 'pending' 
      ORDER BY requested_at ASC
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Update refund
   */
  async update(refund: RefundEntity, connection?: PoolConnection): Promise<void> {
    const sql = `
      UPDATE payment_refunds SET
        status = ?,
        failure_reason = ?,
        provider_refund_id = ?,
        approved_by = ?,
        approved_at = ?,
        processed_by = ?,
        processed_at = ?,
        completed_at = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      refund.status,
      refund.failureReason || null,
      refund.providerRefundId || null,
      refund.approvedBy || null,
      refund.approvedAt || null,
      refund.processedBy || null,
      refund.processedAt || null,
      refund.completedAt || null,
      refund.id
    ];

    if (connection) {
      await connection.execute(sql, params);
    } else {
      await this.db.query<ResultSetHeader>(sql, params);
    }
  }

  /**
   * Get total refund amount for payment
   */
  async getTotalRefundedAmount(paymentId: string): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(refund_amount), 0) as total
      FROM payment_refunds
      WHERE payment_id = ? AND status = 'completed'
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [paymentId]);
    return parseFloat(rows[0].total);
  }

  /**
   * Map database row to entity
   */
  private mapRowToEntity(row: any): RefundEntity {
    return {
      id: row.id,
      paymentId: row.payment_id,
      refundAmount: parseFloat(row.refund_amount),
      refundCurrency: row.refund_currency,
      refundReason: row.refund_reason,
      refundReasonDetails: row.refund_reason_details,
      status: row.status,
      failureReason: row.failure_reason,
      providerRefundId: row.provider_refund_id,
      refundMethod: row.refund_method,
      requestedBy: row.requested_by,
      requestedAt: new Date(row.requested_at),
      approvedBy: row.approved_by,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      processedBy: row.processed_by,
      processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
      refundReference: row.refund_reference,
      bankAccountDetails: row.bank_account_details ? JSON.parse(row.bank_account_details) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export default RefundRepository;

