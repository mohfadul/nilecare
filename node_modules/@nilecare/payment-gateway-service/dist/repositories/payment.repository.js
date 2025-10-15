"use strict";
/**
 * Payment Repository
 * Data access layer for payment transactions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepository = void 0;
const database_config_1 = __importDefault(require("../config/database.config"));
const payment_entity_1 = require("../entities/payment.entity");
class PaymentRepository {
    constructor() {
        this.db = database_config_1.default;
    }
    /**
     * Create new payment
     */
    async create(payment) {
        const sql = `
      INSERT INTO payments (
        id, invoice_id, patient_id, facility_id, provider_id,
        amount, currency, exchange_rate, amount_in_sdg,
        merchant_reference, external_reference,
        status, payment_method_details,
        risk_score, fraud_flags, is_flagged_suspicious,
        provider_fee, platform_fee, total_fees, net_amount,
        initiated_at, created_by, ip_address, user_agent, device_fingerprint,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        NOW(), NOW()
      )
    `;
        const params = [
            payment.id,
            payment.invoiceId,
            payment.patientId,
            payment.facilityId,
            payment.providerId,
            payment.amount,
            payment.currency,
            payment.exchangeRate,
            payment.amountInSdg,
            payment.merchantReference,
            payment.externalReference || null,
            payment.status,
            payment.paymentMethodDetails ? JSON.stringify(payment.paymentMethodDetails) : null,
            payment.riskScore,
            payment.fraudFlags ? JSON.stringify(payment.fraudFlags) : null,
            payment.isFlaggedSuspicious,
            payment.providerFee,
            payment.platformFee,
            payment.totalFees,
            payment.netAmount,
            payment.initiatedAt,
            payment.createdBy,
            payment.ipAddress || null,
            payment.userAgent || null,
            payment.deviceFingerprint || null
        ];
        await this.db.query(sql, params);
        return payment;
    }
    /**
     * Find payment by ID
     */
    async findById(id) {
        const sql = `
      SELECT * FROM payments WHERE id = ? LIMIT 1
    `;
        const rows = await this.db.query(sql, [id]);
        if (rows.length === 0) {
            return null;
        }
        return this.mapRowToEntity(rows[0]);
    }
    /**
     * Find payment by transaction ID
     */
    async findByTransactionId(transactionId) {
        const sql = `
      SELECT * FROM payments WHERE transaction_id = ? LIMIT 1
    `;
        const rows = await this.db.query(sql, [transactionId]);
        if (rows.length === 0) {
            return null;
        }
        return this.mapRowToEntity(rows[0]);
    }
    /**
     * Find payment by merchant reference
     */
    async findByMerchantReference(merchantReference) {
        const sql = `
      SELECT * FROM payments WHERE merchant_reference = ? LIMIT 1
    `;
        const rows = await this.db.query(sql, [merchantReference]);
        if (rows.length === 0) {
            return null;
        }
        return this.mapRowToEntity(rows[0]);
    }
    /**
     * Find payments by invoice ID
     */
    async findByInvoiceId(invoiceId) {
        const sql = `
      SELECT * FROM payments 
      WHERE invoice_id = ? 
      ORDER BY created_at DESC
    `;
        const rows = await this.db.query(sql, [invoiceId]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    /**
     * Find pending verifications
     */
    async findPendingVerifications(facilityId) {
        let sql = `
      SELECT * FROM payments 
      WHERE status = ? 
    `;
        const params = [payment_entity_1.PaymentStatus.AWAITING_VERIFICATION];
        if (facilityId) {
            sql += ` AND facility_id = ?`;
            params.push(facilityId);
        }
        sql += ` ORDER BY created_at ASC`;
        const rows = await this.db.query(sql, params);
        return rows.map(row => this.mapRowToEntity(row));
    }
    /**
     * Find payments with filters and pagination
     */
    async findWithFilters(filters, page = 1, limit = 50) {
        let sql = `SELECT * FROM payments WHERE 1=1`;
        const params = [];
        let countSql = `SELECT COUNT(*) as total FROM payments WHERE 1=1`;
        // Apply filters
        if (filters.facilityId) {
            sql += ` AND facility_id = ?`;
            countSql += ` AND facility_id = ?`;
            params.push(filters.facilityId);
        }
        if (filters.patientId) {
            sql += ` AND patient_id = ?`;
            countSql += ` AND patient_id = ?`;
            params.push(filters.patientId);
        }
        if (filters.status) {
            sql += ` AND status = ?`;
            countSql += ` AND status = ?`;
            params.push(filters.status);
        }
        if (filters.providerName) {
            sql += ` AND provider_id = ?`;
            countSql += ` AND provider_id = ?`;
            params.push(filters.providerName);
        }
        if (filters.dateRange) {
            sql += ` AND created_at BETWEEN ? AND ?`;
            countSql += ` AND created_at BETWEEN ? AND ?`;
            params.push(filters.dateRange.start, filters.dateRange.end);
        }
        // Get total count
        const countRows = await this.db.query(countSql, params);
        const total = countRows[0].total;
        // Add pagination
        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, (page - 1) * limit);
        const rows = await this.db.query(sql, params);
        const payments = rows.map(row => this.mapRowToEntity(row));
        return { payments, total };
    }
    /**
     * Update payment
     */
    async update(payment, connection) {
        const sql = `
      UPDATE payments SET
        transaction_id = ?,
        status = ?,
        failure_reason = ?,
        rejection_reason = ?,
        verification_method = ?,
        verified_by = ?,
        verified_at = ?,
        verification_notes = ?,
        evidence_urls = ?,
        payment_method_details = ?,
        risk_score = ?,
        fraud_flags = ?,
        is_flagged_suspicious = ?,
        processed_at = ?,
        confirmed_at = ?,
        failed_at = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
        const params = [
            payment.transactionId || null,
            payment.status,
            payment.failureReason || null,
            payment.rejectionReason || null,
            payment.verificationMethod || null,
            payment.verifiedBy || null,
            payment.verifiedAt || null,
            payment.verificationNotes || null,
            payment.evidenceUrls ? JSON.stringify(payment.evidenceUrls) : null,
            payment.paymentMethodDetails ? JSON.stringify(payment.paymentMethodDetails) : null,
            payment.riskScore,
            payment.fraudFlags ? JSON.stringify(payment.fraudFlags) : null,
            payment.isFlaggedSuspicious,
            payment.processedAt || null,
            payment.confirmedAt || null,
            payment.failedAt || null,
            payment.id
        ];
        if (connection) {
            await connection.execute(sql, params);
        }
        else {
            await this.db.query(sql, params);
        }
    }
    /**
     * Get payments by date range
     */
    async findByDateRange(startDate, endDate, status) {
        let sql = `
      SELECT * FROM payments 
      WHERE created_at BETWEEN ? AND ?
    `;
        const params = [startDate, endDate];
        if (status) {
            sql += ` AND status = ?`;
            params.push(status);
        }
        sql += ` ORDER BY created_at DESC`;
        const rows = await this.db.query(sql, params);
        return rows.map(row => this.mapRowToEntity(row));
    }
    /**
     * Count payments by criteria
     */
    async count(criteria) {
        let sql = `SELECT COUNT(*) as total FROM payments WHERE 1=1`;
        const params = [];
        if (criteria.status) {
            sql += ` AND status = ?`;
            params.push(criteria.status);
        }
        if (criteria.facilityId) {
            sql += ` AND facility_id = ?`;
            params.push(criteria.facilityId);
        }
        if (criteria.providerId) {
            sql += ` AND provider_id = ?`;
            params.push(criteria.providerId);
        }
        const rows = await this.db.query(sql, params);
        return rows[0].total;
    }
    /**
     * Map database row to entity
     */
    mapRowToEntity(row) {
        return new payment_entity_1.PaymentEntity({
            id: row.id,
            invoiceId: row.invoice_id,
            patientId: row.patient_id,
            facilityId: row.facility_id,
            providerId: row.provider_id,
            amount: parseFloat(row.amount),
            currency: row.currency,
            exchangeRate: parseFloat(row.exchange_rate),
            amountInSdg: parseFloat(row.amount_in_sdg),
            transactionId: row.transaction_id,
            merchantReference: row.merchant_reference,
            externalReference: row.external_reference,
            status: row.status,
            failureReason: row.failure_reason,
            rejectionReason: row.rejection_reason,
            verificationMethod: row.verification_method,
            verifiedBy: row.verified_by,
            verifiedAt: row.verified_at,
            verificationNotes: row.verification_notes,
            evidenceUrls: row.evidence_urls ? JSON.parse(row.evidence_urls) : undefined,
            paymentMethodDetails: row.payment_method_details ? JSON.parse(row.payment_method_details) : undefined,
            riskScore: row.risk_score,
            fraudFlags: row.fraud_flags ? JSON.parse(row.fraud_flags) : undefined,
            isFlaggedSuspicious: row.is_flagged_suspicious,
            providerFee: parseFloat(row.provider_fee),
            platformFee: parseFloat(row.platform_fee),
            totalFees: parseFloat(row.total_fees),
            netAmount: parseFloat(row.net_amount),
            initiatedAt: new Date(row.initiated_at),
            processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
            confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : undefined,
            failedAt: row.failed_at ? new Date(row.failed_at) : undefined,
            createdBy: row.created_by,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            deviceFingerprint: row.device_fingerprint,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        });
    }
}
exports.PaymentRepository = PaymentRepository;
exports.default = PaymentRepository;
//# sourceMappingURL=payment.repository.js.map