/**
 * Invoice Repository
 * Data access layer for invoices
 * 
 * ✅ SECURITY: All queries use parameterized statements
 */

import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import DatabaseConfig from '../config/database.config';
import { InvoiceEntity, InvoiceStatus, InvoiceType } from '../entities/invoice.entity';

export class InvoiceRepository {
  private db = DatabaseConfig;

  /**
   * Create new invoice
   */
  async create(invoice: InvoiceEntity): Promise<InvoiceEntity> {
    const sql = `
      INSERT INTO invoices (
        id, invoice_number, patient_id, facility_id, billing_account_id,
        encounter_id, appointment_id, invoice_type,
        subtotal, tax_amount, discount_amount, adjustment_amount, total_amount,
        paid_amount, currency, exchange_rate,
        status, invoice_date, due_date,
        payment_terms, grace_period_days, late_fee_percentage, late_fees_applied,
        insurance_policy_id, insurance_company, insurance_claim_number,
        insurance_authorization_number, patient_responsibility, insurance_responsibility,
        description, internal_notes, patient_notes,
        created_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, NOW(), NOW()
      )
    `;

    const params = [
      invoice.id,
      invoice.invoiceNumber,
      invoice.patientId,
      invoice.facilityId,
      invoice.billingAccountId || null,
      invoice.encounterId || null,
      invoice.appointmentId || null,
      invoice.invoiceType,
      invoice.subtotal,
      invoice.taxAmount,
      invoice.discountAmount,
      invoice.adjustmentAmount,
      invoice.totalAmount,
      invoice.paidAmount,
      invoice.currency,
      invoice.exchangeRate,
      invoice.status,
      invoice.invoiceDate,
      invoice.dueDate,
      invoice.paymentTerms,
      invoice.gracePeriodDays,
      invoice.lateFeePercentage,
      invoice.lateFeesApplied,
      invoice.insurancePolicyId || null,
      invoice.insuranceCompany || null,
      invoice.insuranceClaimNumber || null,
      invoice.insuranceAuthorizationNumber || null,
      invoice.patientResponsibility || null,
      invoice.insuranceResponsibility || null,
      invoice.description || null,
      invoice.internalNotes || null,
      invoice.patientNotes || null,
      invoice.createdBy
    ];

    await this.db.query<ResultSetHeader>(sql, params);
    return invoice;
  }

  /**
   * Find invoice by ID
   */
  async findById(id: string): Promise<InvoiceEntity | null> {
    const sql = `
      SELECT * FROM invoices 
      WHERE id = ? AND deleted_at IS NULL 
      LIMIT 1
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [id]);
    
    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find invoice by invoice number
   */
  async findByInvoiceNumber(invoiceNumber: string): Promise<InvoiceEntity | null> {
    const sql = `
      SELECT * FROM invoices 
      WHERE invoice_number = ? AND deleted_at IS NULL 
      LIMIT 1
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [invoiceNumber]);
    
    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find invoices by patient ID
   */
  async findByPatientId(patientId: string, limit: number = 50): Promise<InvoiceEntity[]> {
    const sql = `
      SELECT * FROM invoices 
      WHERE patient_id = ? AND deleted_at IS NULL 
      ORDER BY invoice_date DESC, created_at DESC 
      LIMIT ?
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [patientId, limit]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find invoices with filters and pagination
   */
  async findWithFilters(filters: any, page: number = 1, limit: number = 50): Promise<{
    invoices: InvoiceEntity[];
    total: number;
  }> {
    let sql = `SELECT * FROM invoices WHERE deleted_at IS NULL`;
    const params: any[] = [];
    let countSql = `SELECT COUNT(*) as total FROM invoices WHERE deleted_at IS NULL`;

    // Apply filters
    if (filters.patientId) {
      sql += ` AND patient_id = ?`;
      countSql += ` AND patient_id = ?`;
      params.push(filters.patientId);
    }

    if (filters.facilityId) {
      sql += ` AND facility_id = ?`;
      countSql += ` AND facility_id = ?`;
      params.push(filters.facilityId);
    }

    if (filters.status) {
      sql += ` AND status = ?`;
      countSql += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters.invoiceType) {
      sql += ` AND invoice_type = ?`;
      countSql += ` AND invoice_type = ?`;
      params.push(filters.invoiceType);
    }

    if (filters.dateRange) {
      sql += ` AND invoice_date BETWEEN ? AND ?`;
      countSql += ` AND invoice_date BETWEEN ? AND ?`;
      params.push(filters.dateRange.start, filters.dateRange.end);
    }

    if (filters.minAmount) {
      sql += ` AND total_amount >= ?`;
      countSql += ` AND total_amount >= ?`;
      params.push(filters.minAmount);
    }

    if (filters.maxAmount) {
      sql += ` AND total_amount <= ?`;
      countSql += ` AND total_amount <= ?`;
      params.push(filters.maxAmount);
    }

    // Get total count
    const countRows = await this.db.query<RowDataPacket[]>(countSql, params);
    const total = countRows[0].total;

    // Add sorting and pagination
    sql += ` ORDER BY invoice_date DESC, created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const rows = await this.db.query<RowDataPacket[]>(sql, params);
    const invoices = rows.map(row => this.mapRowToEntity(row));

    return { invoices, total };
  }

  /**
   * Find overdue invoices
   */
  async findOverdue(facilityId?: string): Promise<InvoiceEntity[]> {
    let sql = `
      SELECT * FROM invoices 
      WHERE status = 'overdue' 
        AND balance_due > 0 
        AND deleted_at IS NULL
    `;
    const params: any[] = [];

    if (facilityId) {
      sql += ` AND facility_id = ?`;
      params.push(facilityId);
    }

    sql += ` ORDER BY due_date ASC`;

    const rows = await this.db.query<RowDataPacket[]>(sql, params);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Update invoice
   */
  async update(invoice: InvoiceEntity, connection?: PoolConnection): Promise<void> {
    const sql = `
      UPDATE invoices SET
        subtotal = ?,
        tax_amount = ?,
        discount_amount = ?,
        adjustment_amount = ?,
        total_amount = ?,
        paid_amount = ?,
        status = ?,
        due_date = ?,
        paid_date = ?,
        last_payment_date = ?,
        overdue_date = ?,
        late_fees_applied = ?,
        insurance_policy_id = ?,
        insurance_company = ?,
        insurance_claim_number = ?,
        patient_responsibility = ?,
        insurance_responsibility = ?,
        description = ?,
        internal_notes = ?,
        patient_notes = ?,
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      invoice.subtotal,
      invoice.taxAmount,
      invoice.discountAmount,
      invoice.adjustmentAmount,
      invoice.totalAmount,
      invoice.paidAmount,
      invoice.status,
      invoice.dueDate,
      invoice.paidDate || null,
      invoice.lastPaymentDate || null,
      invoice.overdueDate || null,
      invoice.lateFeesApplied,
      invoice.insurancePolicyId || null,
      invoice.insuranceCompany || null,
      invoice.insuranceClaimNumber || null,
      invoice.patientResponsibility || null,
      invoice.insuranceResponsibility || null,
      invoice.description || null,
      invoice.internalNotes || null,
      invoice.patientNotes || null,
      invoice.updatedBy || null,
      invoice.id
    ];

    if (connection) {
      await connection.execute(sql, params);
    } else {
      await this.db.query<ResultSetHeader>(sql, params);
    }
  }

  /**
   * Soft delete invoice
   */
  async softDelete(id: string, deletedBy: string): Promise<void> {
    const sql = `
      UPDATE invoices 
      SET deleted_at = NOW(), deleted_by = ? 
      WHERE id = ?
    `;

    await this.db.query<ResultSetHeader>(sql, [deletedBy, id]);
  }

  /**
   * Get invoice statistics
   */
  async getStatistics(filters: any): Promise<any> {
    let sql = `
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_amount,
        SUM(paid_amount) as total_paid,
        SUM(balance_due) as total_outstanding,
        AVG(total_amount) as average_invoice_amount,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
        COUNT(CASE WHEN status = 'partially_paid' THEN 1 END) as partially_paid_count
      FROM invoices 
      WHERE deleted_at IS NULL
    `;
    const params: any[] = [];

    if (filters.facilityId) {
      sql += ` AND facility_id = ?`;
      params.push(filters.facilityId);
    }

    if (filters.dateRange) {
      sql += ` AND invoice_date BETWEEN ? AND ?`;
      params.push(filters.dateRange.start, filters.dateRange.end);
    }

    const rows = await this.db.query<RowDataPacket[]>(sql, params);
    return rows[0] || {};
  }

  /**
   * Map database row to entity
   */
  private mapRowToEntity(row: any): InvoiceEntity {
    return new InvoiceEntity({
      id: row.id,
      invoiceNumber: row.invoice_number,
      patientId: row.patient_id,
      facilityId: row.facility_id,
      billingAccountId: row.billing_account_id,
      encounterId: row.encounter_id,
      appointmentId: row.appointment_id,
      invoiceType: row.invoice_type as InvoiceType,
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      discountAmount: parseFloat(row.discount_amount),
      adjustmentAmount: parseFloat(row.adjustment_amount),
      totalAmount: parseFloat(row.total_amount),
      paidAmount: parseFloat(row.paid_amount),
      balanceDue: parseFloat(row.balance_due),
      currency: row.currency,
      exchangeRate: parseFloat(row.exchange_rate),
      status: row.status as InvoiceStatus,
      invoiceDate: new Date(row.invoice_date),
      dueDate: new Date(row.due_date),
      paidDate: row.paid_date ? new Date(row.paid_date) : undefined,
      lastPaymentDate: row.last_payment_date ? new Date(row.last_payment_date) : undefined,
      overdueDate: row.overdue_date ? new Date(row.overdue_date) : undefined,
      paymentTerms: row.payment_terms,
      gracePeriodDays: row.grace_period_days,
      lateFeePercentage: parseFloat(row.late_fee_percentage),
      lateFeesApplied: parseFloat(row.late_fees_applied),
      insurancePolicyId: row.insurance_policy_id,
      insuranceCompany: row.insurance_company,
      insuranceClaimNumber: row.insurance_claim_number,
      insuranceAuthorizationNumber: row.insurance_authorization_number,
      patientResponsibility: row.patient_responsibility ? parseFloat(row.patient_responsibility) : undefined,
      insuranceResponsibility: row.insurance_responsibility ? parseFloat(row.insurance_responsibility) : undefined,
      description: row.description,
      internalNotes: row.internal_notes,
      patientNotes: row.patient_notes,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      deletedBy: row.deleted_by
    });
  }

  /**
   * Generate next invoice number
   */
  async generateInvoiceNumber(facilityId?: string): Promise<string> {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    const sql = `
      SELECT invoice_number 
      FROM invoices 
      WHERE invoice_number LIKE ? 
      ORDER BY invoice_number DESC 
      LIMIT 1
    `;
    
    const rows = await this.db.query<RowDataPacket[]>(sql, [`INV-${datePart}-%`]);
    
    let sequence = 1;
    if (rows.length > 0) {
      const lastNumber = rows[0].invoice_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    return `INV-${datePart}-${sequence.toString().padStart(6, '0')}`;
  }
}

export default InvoiceRepository;

