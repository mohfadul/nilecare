/**
 * Billing Account Repository
 * Data access layer for billing accounts
 */

import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import DatabaseConfig from '../config/database.config';
import {
  BillingAccountEntity,
  AccountType,
  AccountStatus,
  PaymentFrequency,
  StatementFrequency,
  ContactMethod
} from '../entities/billing-account.entity';

export class BillingAccountRepository {
  private db = DatabaseConfig;

  /**
   * Create billing account
   */
  async create(account: BillingAccountEntity): Promise<BillingAccountEntity> {
    const sql = `
      INSERT INTO billing_accounts (
        id, account_number, patient_id, facility_id, guarantor_id,
        account_type, total_charges, total_payments, total_adjustments,
        status, payment_plan_active, payment_plan_amount, payment_plan_frequency,
        payment_plan_start_date, payment_plan_end_date,
        statement_frequency, preferred_contact_method, send_electronic_statements,
        credit_limit, credit_used,
        created_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, NOW(), NOW()
      )
    `;

    const params = [
      account.id,
      account.accountNumber,
      account.patientId,
      account.facilityId,
      account.guarantorId || null,
      account.accountType,
      account.totalCharges,
      account.totalPayments,
      account.totalAdjustments,
      account.status,
      account.paymentPlanActive,
      account.paymentPlanAmount || null,
      account.paymentPlanFrequency || null,
      account.paymentPlanStartDate || null,
      account.paymentPlanEndDate || null,
      account.statementFrequency,
      account.preferredContactMethod,
      account.sendElectronicStatements,
      account.creditLimit || null,
      account.creditUsed,
      account.createdBy
    ];

    await this.db.query<ResultSetHeader>(sql, params);
    return account;
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<BillingAccountEntity | null> {
    const sql = `SELECT * FROM billing_accounts WHERE id = ? LIMIT 1`;
    const rows = await this.db.query<RowDataPacket[]>(sql, [id]);
    
    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find by account number
   */
  async findByAccountNumber(accountNumber: string): Promise<BillingAccountEntity | null> {
    const sql = `SELECT * FROM billing_accounts WHERE account_number = ? LIMIT 1`;
    const rows = await this.db.query<RowDataPacket[]>(sql, [accountNumber]);
    
    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find by patient ID
   */
  async findByPatientId(patientId: string): Promise<BillingAccountEntity[]> {
    const sql = `
      SELECT * FROM billing_accounts 
      WHERE patient_id = ? 
      ORDER BY created_at DESC
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [patientId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Update account
   */
  async update(account: BillingAccountEntity): Promise<void> {
    const sql = `
      UPDATE billing_accounts SET
        total_charges = ?,
        total_payments = ?,
        total_adjustments = ?,
        status = ?,
        payment_plan_active = ?,
        payment_plan_amount = ?,
        payment_plan_frequency = ?,
        payment_plan_start_date = ?,
        payment_plan_end_date = ?,
        last_statement_date = ?,
        last_payment_date = ?,
        last_payment_amount = ?,
        preferred_contact_method = ?,
        send_electronic_statements = ?,
        credit_used = ?,
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      account.totalCharges,
      account.totalPayments,
      account.totalAdjustments,
      account.status,
      account.paymentPlanActive,
      account.paymentPlanAmount || null,
      account.paymentPlanFrequency || null,
      account.paymentPlanStartDate || null,
      account.paymentPlanEndDate || null,
      account.lastStatementDate || null,
      account.lastPaymentDate || null,
      account.lastPaymentAmount || null,
      account.preferredContactMethod,
      account.sendElectronicStatements,
      account.creditUsed,
      account.updatedBy || null,
      account.id
    ];

    await this.db.query<ResultSetHeader>(sql, params);
  }

  /**
   * Generate account number
   */
  async generateAccountNumber(): Promise<string> {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    const sql = `
      SELECT account_number 
      FROM billing_accounts 
      WHERE account_number LIKE ? 
      ORDER BY account_number DESC 
      LIMIT 1
    `;
    
    const rows = await this.db.query<RowDataPacket[]>(sql, [`BA-${datePart}-%`]);
    
    let sequence = 1;
    if (rows.length > 0) {
      const lastNumber = rows[0].account_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    return `BA-${datePart}-${sequence.toString().padStart(6, '0')}`;
  }

  /**
   * Map database row to entity
   */
  private mapRowToEntity(row: any): BillingAccountEntity {
    return new BillingAccountEntity({
      id: row.id,
      accountNumber: row.account_number,
      patientId: row.patient_id,
      facilityId: row.facility_id,
      guarantorId: row.guarantor_id,
      accountType: row.account_type as AccountType,
      totalCharges: parseFloat(row.total_charges),
      totalPayments: parseFloat(row.total_payments),
      totalAdjustments: parseFloat(row.total_adjustments),
      balanceDue: parseFloat(row.balance_due),
      status: row.status as AccountStatus,
      paymentPlanActive: row.payment_plan_active,
      paymentPlanAmount: row.payment_plan_amount ? parseFloat(row.payment_plan_amount) : undefined,
      paymentPlanFrequency: row.payment_plan_frequency as PaymentFrequency,
      paymentPlanStartDate: row.payment_plan_start_date ? new Date(row.payment_plan_start_date) : undefined,
      paymentPlanEndDate: row.payment_plan_end_date ? new Date(row.payment_plan_end_date) : undefined,
      lastStatementDate: row.last_statement_date ? new Date(row.last_statement_date) : undefined,
      lastPaymentDate: row.last_payment_date ? new Date(row.last_payment_date) : undefined,
      lastPaymentAmount: row.last_payment_amount ? parseFloat(row.last_payment_amount) : undefined,
      statementFrequency: row.statement_frequency as StatementFrequency,
      preferredContactMethod: row.preferred_contact_method as ContactMethod,
      sendElectronicStatements: row.send_electronic_statements,
      creditLimit: row.credit_limit ? parseFloat(row.credit_limit) : undefined,
      creditUsed: parseFloat(row.credit_used),
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }
}

export default BillingAccountRepository;

