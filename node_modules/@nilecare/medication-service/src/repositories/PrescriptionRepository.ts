import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { logger } from '../utils/logger';
import { Prescription, CreatePrescriptionDTO, UpdatePrescriptionDTO } from '../models/Prescription';

/**
 * Prescription Repository
 * Data access layer for prescriptions
 */

export class PrescriptionRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPostgreSQLPool();
  }

  /**
   * Create new prescription
   */
  async create(dto: CreatePrescriptionDTO): Promise<Prescription> {
    // Generate prescription number
    const prescriptionNumber = await this.generatePrescriptionNumber();

    const query = `
      INSERT INTO prescriptions (
        id, prescription_number, patient_id, provider_id, medication_id,
        encounter_id, appointment_id, dosage, route, frequency, duration,
        quantity, refills_allowed, refills_remaining, instructions, indication,
        notes, status, prescribed_date, start_date, expiration_date,
        allergy_check_passed, interaction_check_passed, contraindication_check_passed,
        facility_id, organization_id, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, $13,
        $14, $15, 'pending', NOW(), $16, $17, true, true, true, $18, $19, $20, NOW(), NOW()
      )
      RETURNING *
    `;

    // Calculate expiration date (default 1 year from prescribed date)
    const expirationDate = new Date(dto.startDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    const values = [
      prescriptionNumber,
      dto.patientId,
      dto.providerId,
      dto.medicationId,
      dto.encounterId || null,
      dto.appointmentId || null,
      dto.dosage,
      dto.route,
      dto.frequency,
      dto.duration,
      dto.quantity,
      dto.refillsAllowed || 0,
      dto.instructions,
      dto.indication || null,
      dto.notes || null,
      dto.startDate,
      expirationDate,
      dto.facilityId,
      dto.organizationId,
      dto.createdBy,
    ];

    try {
      const result = await this.pool.query(query, values);
      logger.info(`Prescription created: ${result.rows[0].id}`, {
        prescriptionId: result.rows[0].id,
        prescriptionNumber,
        patientId: dto.patientId,
        facilityId: dto.facilityId,
      });
      return this.mapRowToPrescription(result.rows[0]);
    } catch (error: any) {
      logger.error(`Error creating prescription`, { error: error.message, dto });
      throw error;
    }
  }

  /**
   * Find prescription by ID
   */
  async findById(id: string, facilityId?: string): Promise<Prescription | null> {
    let query = 'SELECT * FROM prescriptions WHERE id = $1';
    const values: any[] = [id];

    if (facilityId) {
      query += ' AND facility_id = $2';
      values.push(facilityId);
    }

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length > 0 ? this.mapRowToPrescription(result.rows[0]) : null;
    } catch (error: any) {
      logger.error(`Error finding prescription by ID`, { error: error.message, id });
      throw error;
    }
  }

  /**
   * Find prescriptions by patient
   */
  async findByPatient(
    patientId: string,
    facilityId: string,
    filters?: { status?: string; active?: boolean }
  ): Promise<Prescription[]> {
    let query = 'SELECT * FROM prescriptions WHERE patient_id = $1 AND facility_id = $2';
    const values: any[] = [patientId, facilityId];
    let paramCount = 2;

    if (filters?.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters?.active) {
      query += ` AND status IN ('pending', 'active', 'dispensed') AND expiration_date > NOW()`;
    }

    query += ' ORDER BY prescribed_date DESC';

    try {
      const result = await this.pool.query(query, values);
      return result.rows.map((row) => this.mapRowToPrescription(row));
    } catch (error: any) {
      logger.error(`Error finding prescriptions by patient`, { error: error.message, patientId });
      throw error;
    }
  }

  /**
   * Update prescription
   */
  async update(id: string, dto: UpdatePrescriptionDTO, facilityId?: string): Promise<Prescription | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    const updateFields: Array<{ field: string; column: string }> = [
      { field: 'dosage', column: 'dosage' },
      { field: 'frequency', column: 'frequency' },
      { field: 'duration', column: 'duration' },
      { field: 'quantity', column: 'quantity' },
      { field: 'refillsAllowed', column: 'refills_allowed' },
      { field: 'instructions', column: 'instructions' },
      { field: 'notes', column: 'notes' },
      { field: 'status', column: 'status' },
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
    updates.push(`updated_by = $${paramCount}`);
    values.push(dto.updatedBy);

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
      UPDATE prescriptions
      SET ${updates.join(', ')}
      WHERE ${whereClause}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      logger.info(`Prescription updated: ${id}`, { prescriptionId: id, facilityId });
      return this.mapRowToPrescription(result.rows[0]);
    } catch (error: any) {
      logger.error(`Error updating prescription`, { error: error.message, id, dto });
      throw error;
    }
  }

  /**
   * Mark prescription as dispensed
   */
  async markAsDispensed(id: string, facilityId: string): Promise<Prescription | null> {
    const query = `
      UPDATE prescriptions
      SET status = 'dispensed',
          dispensed_date = NOW(),
          refills_remaining = refills_remaining - 1,
          updated_at = NOW()
      WHERE id = $1 AND facility_id = $2
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [id, facilityId]);
      if (result.rows.length === 0) {
        return null;
      }
      logger.info(`Prescription marked as dispensed: ${id}`, { prescriptionId: id, facilityId });
      return this.mapRowToPrescription(result.rows[0]);
    } catch (error: any) {
      logger.error(`Error marking prescription as dispensed`, { error: error.message, id });
      throw error;
    }
  }

  /**
   * Cancel prescription
   */
  async cancel(id: string, updatedBy: string, reason?: string, facilityId?: string): Promise<Prescription | null> {
    let query = `
      UPDATE prescriptions
      SET status = 'cancelled',
          notes = CONCAT(COALESCE(notes, ''), '\nCancelled by ', $1, ' at ', NOW()::text, '. Reason: ', $2),
          updated_by = $1,
          updated_at = NOW()
      WHERE id = $3
    `;
    const values: any[] = [updatedBy, reason || 'No reason provided', id];

    if (facilityId) {
      query += ' AND facility_id = $4';
      values.push(facilityId);
    }

    query += ' RETURNING *';

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      logger.info(`Prescription cancelled: ${id}`, { prescriptionId: id, reason, facilityId });
      return this.mapRowToPrescription(result.rows[0]);
    } catch (error: any) {
      logger.error(`Error cancelling prescription`, { error: error.message, id });
      throw error;
    }
  }

  /**
   * Generate prescription number
   */
  private async generatePrescriptionNumber(): Promise<string> {
    const prefix = 'RX';
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of prescriptions today
    const query = `
      SELECT COUNT(*) as count
      FROM prescriptions
      WHERE prescription_number LIKE $1
    `;

    const result = await this.pool.query(query, [`${prefix}-${dateStr}-%`]);
    const count = parseInt(result.rows[0].count) + 1;
    const sequence = count.toString().padStart(6, '0');

    return `${prefix}-${dateStr}-${sequence}`;
  }

  /**
   * Map database row to Prescription model
   */
  private mapRowToPrescription(row: any): Prescription {
    return {
      id: row.id,
      prescriptionNumber: row.prescription_number,
      patientId: row.patient_id,
      providerId: row.provider_id,
      medicationId: row.medication_id,
      encounterId: row.encounter_id,
      appointmentId: row.appointment_id,
      dosage: row.dosage,
      route: row.route,
      frequency: row.frequency,
      duration: row.duration,
      quantity: row.quantity,
      refillsAllowed: row.refills_allowed,
      refillsRemaining: row.refills_remaining,
      instructions: row.instructions,
      indication: row.indication,
      notes: row.notes,
      status: row.status,
      prescribedDate: row.prescribed_date,
      startDate: row.start_date,
      endDate: row.end_date,
      dispensedDate: row.dispensed_date,
      expirationDate: row.expiration_date,
      allergyCheckPassed: row.allergy_check_passed,
      interactionCheckPassed: row.interaction_check_passed,
      contraindicationCheckPassed: row.contraindication_check_passed,
      allergyOverride: row.allergy_override,
      allergyOverrideReason: row.allergy_override_reason,
      allergyOverrideBy: row.allergy_override_by,
      ePrescriptionId: row.e_prescription_id,
      transmittedToPharmacy: row.transmitted_to_pharmacy,
      transmittedDate: row.transmitted_date,
      pharmacyId: row.pharmacy_id,
      facilityId: row.facility_id,
      organizationId: row.organization_id,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default PrescriptionRepository;

