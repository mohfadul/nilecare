import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { logger } from '../utils/logger';
import { MAREntry, CreateMAREntryDTO, UpdateMAREntryDTO } from '../models/MAREntry';

/**
 * Medication Administration Record (MAR) Repository
 * Data access layer for medication administration records
 */

export class MARRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPostgreSQLPool();
  }

  /**
   * Create new MAR entry
   */
  async create(dto: CreateMAREntryDTO): Promise<MAREntry> {
    const query = `
      INSERT INTO mar_entries (
        id, patient_id, medication_id, prescription_id, encounter_id,
        dosage, route, site, scheduled_time, administered_time,
        administered_by, witnessed_by, barcode_verified, barcode_data,
        patient_identity_verified, verification_method, is_high_alert,
        allergy_check_performed, status, notes, batch_number, expiry_date,
        facility_id, organization_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, 'administered', $18, $19, $20, $21, $22, NOW(), NOW()
      )
      RETURNING *
    `;

    const values = [
      dto.patientId,
      dto.medicationId,
      dto.prescriptionId || null,
      dto.encounterId || null,
      dto.dosage,
      dto.route,
      dto.site || null,
      dto.scheduledTime || null,
      dto.administeredTime,
      dto.administeredBy,
      dto.witnessedBy || null,
      dto.barcodeVerified || false,
      dto.barcodeData || null,
      dto.patientIdentityVerified,
      dto.verificationMethod || 'manual',
      dto.isHighAlert || false,
      dto.allergyCheckPerformed,
      dto.notes || null,
      dto.batchNumber || null,
      dto.expiryDate || null,
      dto.facilityId,
      dto.organizationId,
    ];

    try {
      const result = await this.pool.query(query, values);
      logger.info(`MAR entry created: ${result.rows[0].id}`, {
        marEntryId: result.rows[0].id,
        patientId: dto.patientId,
        medicationId: dto.medicationId,
        facilityId: dto.facilityId,
      });
      return this.mapRowToMAREntry(result.rows[0]);
    } catch (error: any) {
      logger.error(`Error creating MAR entry`, { error: error.message, dto });
      throw error;
    }
  }

  /**
   * Find MAR entry by ID
   */
  async findById(id: string, facilityId?: string): Promise<MAREntry | null> {
    let query = 'SELECT * FROM mar_entries WHERE id = $1';
    const values: any[] = [id];

    if (facilityId) {
      query += ' AND facility_id = $2';
      values.push(facilityId);
    }

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length > 0 ? this.mapRowToMAREntry(result.rows[0]) : null;
    } catch (error: any) {
      logger.error(`Error finding MAR entry by ID`, { error: error.message, id });
      throw error;
    }
  }

  /**
   * Find MAR entries by patient
   */
  async findByPatient(
    patientId: string,
    facilityId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
    }
  ): Promise<MAREntry[]> {
    let query = 'SELECT * FROM mar_entries WHERE patient_id = $1 AND facility_id = $2';
    const values: any[] = [patientId, facilityId];
    let paramCount = 2;

    if (filters?.startDate) {
      paramCount++;
      query += ` AND administered_time >= $${paramCount}`;
      values.push(filters.startDate);
    }

    if (filters?.endDate) {
      paramCount++;
      query += ` AND administered_time <= $${paramCount}`;
      values.push(filters.endDate);
    }

    if (filters?.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    query += ' ORDER BY administered_time DESC';

    try {
      const result = await this.pool.query(query, values);
      return result.rows.map((row) => this.mapRowToMAREntry(row));
    } catch (error: any) {
      logger.error(`Error finding MAR entries by patient`, { error: error.message, patientId });
      throw error;
    }
  }

  /**
   * Find MAR entries by medication
   */
  async findByMedication(
    medicationId: string,
    facilityId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<MAREntry[]> {
    let query = 'SELECT * FROM mar_entries WHERE medication_id = $1 AND facility_id = $2';
    const values: any[] = [medicationId, facilityId];
    let paramCount = 2;

    if (filters?.startDate) {
      paramCount++;
      query += ` AND administered_time >= $${paramCount}`;
      values.push(filters.startDate);
    }

    if (filters?.endDate) {
      paramCount++;
      query += ` AND administered_time <= $${paramCount}`;
      values.push(filters.endDate);
    }

    query += ' ORDER BY administered_time DESC';

    try {
      const result = await this.pool.query(query, values);
      return result.rows.map((row) => this.mapRowToMAREntry(row));
    } catch (error: any) {
      logger.error(`Error finding MAR entries by medication`, { error: error.message, medicationId });
      throw error;
    }
  }

  /**
   * Update MAR entry
   */
  async update(id: string, dto: UpdateMAREntryDTO, facilityId?: string): Promise<MAREntry | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    const updateFields: Array<{ field: string; column: string }> = [
      { field: 'status', column: 'status' },
      { field: 'missedReason', column: 'missed_reason' },
      { field: 'refusedReason', column: 'refused_reason' },
      { field: 'heldReason', column: 'held_reason' },
      { field: 'omittedReason', column: 'omitted_reason' },
      { field: 'patientResponse', column: 'patient_response' },
      { field: 'adverseReaction', column: 'adverse_reaction' },
      { field: 'adverseReactionDetails', column: 'adverse_reaction_details' },
      { field: 'notes', column: 'notes' },
    ];

    updateFields.forEach(({ field, column }) => {
      if ((dto as any)[field] !== undefined) {
        paramCount++;
        updates.push(`${column} = $${paramCount}`);
        values.push((dto as any)[field]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    paramCount++;
    let whereClause = `id = $${paramCount}`;
    values.push(id);

    if (facilityId) {
      paramCount++;
      whereClause += ` AND facility_id = $${paramCount}`;
      values.push(facilityId);
    }

    const query = `
      UPDATE mar_entries
      SET ${updates.join(', ')}
      WHERE ${whereClause}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      logger.info(`MAR entry updated: ${id}`, { marEntryId: id, facilityId });
      return this.mapRowToMAREntry(result.rows[0]);
    } catch (error: any) {
      logger.error(`Error updating MAR entry`, { error: error.message, id, dto });
      throw error;
    }
  }

  /**
   * Get MAR statistics for a patient
   */
  async getPatientStatistics(
    patientId: string,
    facilityId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    administered: number;
    missed: number;
    refused: number;
    held: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'administered' THEN 1 ELSE 0 END) as administered,
        SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed,
        SUM(CASE WHEN status = 'refused' THEN 1 ELSE 0 END) as refused,
        SUM(CASE WHEN status = 'held' THEN 1 ELSE 0 END) as held
      FROM mar_entries
      WHERE patient_id = $1
        AND facility_id = $2
        AND administered_time BETWEEN $3 AND $4
    `;

    try {
      const result = await this.pool.query(query, [patientId, facilityId, startDate, endDate]);
      return {
        total: parseInt(result.rows[0].total) || 0,
        administered: parseInt(result.rows[0].administered) || 0,
        missed: parseInt(result.rows[0].missed) || 0,
        refused: parseInt(result.rows[0].refused) || 0,
        held: parseInt(result.rows[0].held) || 0,
      };
    } catch (error: any) {
      logger.error(`Error getting MAR statistics`, { error: error.message, patientId });
      throw error;
    }
  }

  /**
   * Map database row to MAREntry model
   */
  private mapRowToMAREntry(row: any): MAREntry {
    return {
      id: row.id,
      patientId: row.patient_id,
      medicationId: row.medication_id,
      prescriptionId: row.prescription_id,
      encounterId: row.encounter_id,
      dosage: row.dosage,
      route: row.route,
      site: row.site,
      scheduledTime: row.scheduled_time,
      administeredTime: row.administered_time,
      administeredBy: row.administered_by,
      witnessedBy: row.witnessed_by,
      barcodeVerified: row.barcode_verified,
      barcodeData: row.barcode_data,
      patientIdentityVerified: row.patient_identity_verified,
      verificationMethod: row.verification_method,
      isHighAlert: row.is_high_alert,
      highAlertVerified: row.high_alert_verified,
      allergyCheckPerformed: row.allergy_check_performed,
      vitalSignsChecked: row.vital_signs_checked,
      status: row.status,
      missedReason: row.missed_reason,
      refusedReason: row.refused_reason,
      heldReason: row.held_reason,
      omittedReason: row.omitted_reason,
      patientResponse: row.patient_response,
      adverseReaction: row.adverse_reaction,
      adverseReactionDetails: row.adverse_reaction_details,
      notes: row.notes,
      batchNumber: row.batch_number,
      expiryDate: row.expiry_date,
      lotNumber: row.lot_number,
      facilityId: row.facility_id,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default MARRepository;

