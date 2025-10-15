/**
 * Claim Repository
 * Data access layer for insurance claims
 */

import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import DatabaseConfig from '../config/database.config';
import { ClaimEntity, ClaimType, ClaimFormat, ClaimStatus } from '../entities/claim.entity';

export class ClaimRepository {
  private db = DatabaseConfig;

  /**
   * Create claim
   */
  async create(claim: ClaimEntity): Promise<ClaimEntity> {
    const sql = `
      INSERT INTO insurance_claims (
        id, claim_number, invoice_id, patient_id, facility_id,
        encounter_id, insurance_policy_id, billing_account_id,
        claim_type, claim_format, status,
        service_date_from, service_date_to,
        total_charges, resubmission_count, appeal_count,
        rendering_provider_id, billing_provider_id, referring_provider_id,
        payer_id, claim_notes,
        created_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, NOW(), NOW()
      )
    `;

    const params = [
      claim.id,
      claim.claimNumber,
      claim.invoiceId || null,
      claim.patientId,
      claim.facilityId,
      claim.encounterId || null,
      claim.insurancePolicyId,
      claim.billingAccountId,
      claim.claimType,
      claim.claimFormat,
      claim.status,
      claim.serviceDateFrom,
      claim.serviceDateTo,
      claim.totalCharges,
      claim.resubmissionCount,
      claim.appealCount,
      claim.renderingProviderId || null,
      claim.billingProviderId || null,
      claim.referringProviderId || null,
      claim.payerId || null,
      claim.claimNotes || null,
      claim.createdBy
    ];

    await this.db.query<ResultSetHeader>(sql, params);
    return claim;
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<ClaimEntity | null> {
    const sql = `SELECT * FROM insurance_claims WHERE id = ? LIMIT 1`;
    const rows = await this.db.query<RowDataPacket[]>(sql, [id]);
    
    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find by claim number
   */
  async findByClaimNumber(claimNumber: string): Promise<ClaimEntity | null> {
    const sql = `SELECT * FROM insurance_claims WHERE claim_number = ? LIMIT 1`;
    const rows = await this.db.query<RowDataPacket[]>(sql, [claimNumber]);
    
    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find by invoice ID
   */
  async findByInvoiceId(invoiceId: string): Promise<ClaimEntity[]> {
    const sql = `
      SELECT * FROM insurance_claims 
      WHERE invoice_id = ? 
      ORDER BY created_at DESC
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [invoiceId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find by status
   */
  async findByStatus(status: ClaimStatus): Promise<ClaimEntity[]> {
    const sql = `
      SELECT * FROM insurance_claims 
      WHERE status = ? 
      ORDER BY submission_date DESC
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [status]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Update claim
   */
  async update(claim: ClaimEntity): Promise<void> {
    const sql = `
      UPDATE insurance_claims SET
        status = ?,
        submission_date = ?,
        received_date = ?,
        processed_date = ?,
        paid_date = ?,
        allowed_amount = ?,
        paid_amount = ?,
        patient_responsibility = ?,
        adjustment_amount = ?,
        denial_reason_code = ?,
        denial_reason_description = ?,
        rejection_reason = ?,
        remittance_advice_number = ?,
        check_number = ?,
        check_date = ?,
        resubmission_count = ?,
        last_resubmission_date = ?,
        appeal_count = ?,
        last_appeal_date = ?,
        appeal_deadline = ?,
        claim_notes = ?,
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      claim.status,
      claim.submissionDate || null,
      claim.receivedDate || null,
      claim.processedDate || null,
      claim.paidDate || null,
      claim.allowedAmount || null,
      claim.paidAmount || null,
      claim.patientResponsibility || null,
      claim.adjustmentAmount || null,
      claim.denialReasonCode || null,
      claim.denialReasonDescription || null,
      claim.rejectionReason || null,
      claim.remittanceAdviceNumber || null,
      claim.checkNumber || null,
      claim.checkDate || null,
      claim.resubmissionCount,
      claim.lastResubmissionDate || null,
      claim.appealCount,
      claim.lastAppealDate || null,
      claim.appealDeadline || null,
      claim.claimNotes || null,
      claim.updatedBy || null,
      claim.id
    ];

    await this.db.query<ResultSetHeader>(sql, params);
  }

  /**
   * Generate claim number
   */
  async generateClaimNumber(): Promise<string> {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    const sql = `
      SELECT claim_number 
      FROM insurance_claims 
      WHERE claim_number LIKE ? 
      ORDER BY claim_number DESC 
      LIMIT 1
    `;
    
    const rows = await this.db.query<RowDataPacket[]>(sql, [`CLM-${datePart}-%`]);
    
    let sequence = 1;
    if (rows.length > 0) {
      const lastNumber = rows[0].claim_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    return `CLM-${datePart}-${sequence.toString().padStart(6, '0')}`;
  }

  /**
   * Map database row to entity
   */
  private mapRowToEntity(row: any): ClaimEntity {
    return new ClaimEntity({
      id: row.id,
      claimNumber: row.claim_number,
      invoiceId: row.invoice_id,
      patientId: row.patient_id,
      facilityId: row.facility_id,
      encounterId: row.encounter_id,
      insurancePolicyId: row.insurance_policy_id,
      billingAccountId: row.billing_account_id,
      claimType: row.claim_type as ClaimType,
      claimFormat: row.claim_format as ClaimFormat,
      status: row.status as ClaimStatus,
      serviceDateFrom: new Date(row.service_date_from),
      serviceDateTo: new Date(row.service_date_to),
      submissionDate: row.submission_date ? new Date(row.submission_date) : undefined,
      receivedDate: row.received_date ? new Date(row.received_date) : undefined,
      processedDate: row.processed_date ? new Date(row.processed_date) : undefined,
      paidDate: row.paid_date ? new Date(row.paid_date) : undefined,
      totalCharges: parseFloat(row.total_charges),
      allowedAmount: row.allowed_amount ? parseFloat(row.allowed_amount) : undefined,
      paidAmount: row.paid_amount ? parseFloat(row.paid_amount) : undefined,
      patientResponsibility: row.patient_responsibility ? parseFloat(row.patient_responsibility) : undefined,
      adjustmentAmount: row.adjustment_amount ? parseFloat(row.adjustment_amount) : undefined,
      denialReasonCode: row.denial_reason_code,
      denialReasonDescription: row.denial_reason_description,
      rejectionReason: row.rejection_reason,
      remittanceAdviceNumber: row.remittance_advice_number,
      checkNumber: row.check_number,
      checkDate: row.check_date ? new Date(row.check_date) : undefined,
      electronicPaymentId: row.electronic_payment_id,
      resubmissionCount: row.resubmission_count,
      lastResubmissionDate: row.last_resubmission_date ? new Date(row.last_resubmission_date) : undefined,
      appealCount: row.appeal_count,
      lastAppealDate: row.last_appeal_date ? new Date(row.last_appeal_date) : undefined,
      appealDeadline: row.appeal_deadline ? new Date(row.appeal_deadline) : undefined,
      renderingProviderId: row.rendering_provider_id,
      billingProviderId: row.billing_provider_id,
      referringProviderId: row.referring_provider_id,
      ediTransactionId: row.edi_transaction_id,
      ediBatchId: row.edi_batch_id,
      payerId: row.payer_id,
      claimNotes: row.claim_notes,
      attachments: row.attachments ? JSON.parse(row.attachments) : undefined,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      submittedBy: row.submitted_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }
}

export default ClaimRepository;

