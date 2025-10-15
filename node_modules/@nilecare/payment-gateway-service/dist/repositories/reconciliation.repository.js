"use strict";
/**
 * Reconciliation Repository
 * Data access layer for payment reconciliation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationRepository = void 0;
const database_config_1 = __importDefault(require("../config/database.config"));
const reconciliation_entity_1 = require("../entities/reconciliation.entity");
class ReconciliationRepository {
    constructor() {
        this.db = database_config_1.default;
    }
    /**
     * Create reconciliation record
     */
    async create(reconciliation, connection) {
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
        }
        else {
            await this.db.query(sql, params);
        }
        return reconciliation;
    }
    /**
     * Find by ID
     */
    async findById(id) {
        const sql = `SELECT * FROM payment_reconciliation WHERE id = ? LIMIT 1`;
        const rows = await this.db.query(sql, [id]);
        if (rows.length === 0) {
            return null;
        }
        return this.mapRowToEntity(rows[0]);
    }
    /**
     * Find by payment ID
     */
    async findByPaymentId(paymentId) {
        const sql = `
      SELECT * FROM payment_reconciliation 
      WHERE payment_id = ? 
      ORDER BY created_at DESC
    `;
        const rows = await this.db.query(sql, [paymentId]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    /**
     * Find unresolved reconciliations
     */
    async findUnresolved() {
        const sql = `
      SELECT * FROM payment_reconciliation 
      WHERE reconciliation_status IN (?, ?) 
      ORDER BY created_at ASC
    `;
        const rows = await this.db.query(sql, [
            reconciliation_entity_1.ReconciliationStatus.MISMATCH,
            reconciliation_entity_1.ReconciliationStatus.INVESTIGATING
        ]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    /**
     * Update reconciliation
     */
    async update(reconciliation, connection) {
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
        }
        else {
            await this.db.query(sql, params);
        }
    }
    /**
     * Map database row to entity
     */
    mapRowToEntity(row) {
        return new reconciliation_entity_1.ReconciliationEntity({
            id: row.id,
            paymentId: row.payment_id,
            externalTransactionId: row.external_transaction_id,
            externalAmount: row.external_amount ? parseFloat(row.external_amount) : undefined,
            externalCurrency: row.external_currency,
            externalFee: row.external_fee ? parseFloat(row.external_fee) : undefined,
            transactionDate: row.transaction_date ? new Date(row.transaction_date) : undefined,
            reconciliationStatus: row.reconciliation_status,
            amountDifference: row.amount_difference ? parseFloat(row.amount_difference) : undefined,
            discrepancyReason: row.discrepancy_reason,
            discrepancyType: row.discrepancy_type,
            resolvedBy: row.resolved_by,
            resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
            resolutionNotes: row.resolution_notes,
            resolutionAction: row.resolution_action,
            bankStatementId: row.bank_statement_id,
            statementLineNumber: row.statement_line_number,
            statementFileUrl: row.statement_file_url,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        });
    }
}
exports.ReconciliationRepository = ReconciliationRepository;
exports.default = ReconciliationRepository;
//# sourceMappingURL=reconciliation.repository.js.map