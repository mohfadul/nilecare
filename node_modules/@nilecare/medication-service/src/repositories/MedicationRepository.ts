import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { logger } from '../utils/logger';
import { Medication, CreateMedicationDTO, UpdateMedicationDTO } from '../models/Medication';

/**
 * Medication Repository
 * Data access layer for medication catalog
 */

export class MedicationRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPostgreSQLPool();
  }

  /**
   * Create new medication
   */
  async create(dto: CreateMedicationDTO): Promise<Medication> {
    const query = `
      INSERT INTO medications (
        id, name, generic_name, brand_name, dosage_form, strength, unit,
        manufacturer, description, category, is_high_alert, requires_refrigeration,
        is_controlled_substance, controlled_substance_schedule, facility_id,
        organization_id, status, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active', $16, NOW(), NOW()
      )
      RETURNING *
    `;

    const values = [
      dto.name,
      dto.genericName || null,
      dto.brandName || null,
      dto.dosageForm,
      dto.strength,
      dto.unit,
      dto.manufacturer || null,
      dto.description || null,
      dto.category || null,
      dto.isHighAlert || false,
      dto.requiresRefrigeration || false,
      dto.isControlledSubstance || false,
      dto.controlledSubstanceSchedule || null,
      dto.facilityId,
      dto.organizationId,
      dto.createdBy,
    ];

    try {
      const result = await this.pool.query(query, values);
      logger.info(`Medication created: ${result.rows[0].id}`, {
        medicationId: result.rows[0].id,
        name: dto.name,
        facilityId: dto.facilityId,
      });
      return this.mapRowToMedication(result.rows[0]);
    } catch (error: any) {
      logger.error(`Error creating medication`, { error: error.message, dto });
      throw error;
    }
  }

  /**
   * Find medication by ID
   */
  async findById(id: string, facilityId?: string): Promise<Medication | null> {
    let query = 'SELECT * FROM medications WHERE id = $1';
    const values: any[] = [id];

    // Apply facility filter if provided
    if (facilityId) {
      query += ' AND facility_id = $2';
      values.push(facilityId);
    }

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length > 0 ? this.mapRowToMedication(result.rows[0]) : null;
    } catch (error: any) {
      logger.error(`Error finding medication by ID`, { error: error.message, id, facilityId });
      throw error;
    }
  }

  /**
   * Find medications by facility
   */
  async findByFacility(
    facilityId: string,
    filters?: {
      status?: string;
      isHighAlert?: boolean;
      category?: string;
      search?: string;
    },
    pagination?: { page: number; limit: number }
  ): Promise<{ medications: Medication[]; total: number }> {
    let query = 'SELECT * FROM medications WHERE facility_id = $1';
    const values: any[] = [facilityId];
    let paramCount = 1;

    // Apply filters
    if (filters?.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters?.isHighAlert !== undefined) {
      paramCount++;
      query += ` AND is_high_alert = $${paramCount}`;
      values.push(filters.isHighAlert);
    }

    if (filters?.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      values.push(filters.category);
    }

    if (filters?.search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR generic_name ILIKE $${paramCount} OR brand_name ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    if (pagination) {
      const offset = (pagination.page - 1) * pagination.limit;
      query += ` ORDER BY name ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      values.push(pagination.limit, offset);
    } else {
      query += ' ORDER BY name ASC';
    }

    try {
      const result = await this.pool.query(query, values);
      const medications = result.rows.map((row) => this.mapRowToMedication(row));
      return { medications, total };
    } catch (error: any) {
      logger.error(`Error finding medications by facility`, { error: error.message, facilityId });
      throw error;
    }
  }

  /**
   * Update medication
   */
  async update(id: string, dto: UpdateMedicationDTO, facilityId?: string): Promise<Medication | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Build dynamic update query
    const updateFields: Array<{ field: string; column: string }> = [
      { field: 'name', column: 'name' },
      { field: 'genericName', column: 'generic_name' },
      { field: 'brandName', column: 'brand_name' },
      { field: 'dosageForm', column: 'dosage_form' },
      { field: 'strength', column: 'strength' },
      { field: 'unit', column: 'unit' },
      { field: 'manufacturer', column: 'manufacturer' },
      { field: 'description', column: 'description' },
      { field: 'category', column: 'category' },
      { field: 'isHighAlert', column: 'is_high_alert' },
      { field: 'requiresRefrigeration', column: 'requires_refrigeration' },
      { field: 'isControlledSubstance', column: 'is_controlled_substance' },
      { field: 'controlledSubstanceSchedule', column: 'controlled_substance_schedule' },
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

    // Add updated_by and updated_at
    paramCount++;
    updates.push(`updated_by = $${paramCount}`);
    values.push(dto.updatedBy);

    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    // Add WHERE conditions
    paramCount++;
    let whereClause = `id = $${paramCount}`;
    values.push(id);

    if (facilityId) {
      paramCount++;
      whereClause += ` AND facility_id = $${paramCount}`;
      values.push(facilityId);
    }

    const query = `
      UPDATE medications
      SET ${updates.join(', ')}
      WHERE ${whereClause}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      logger.info(`Medication updated: ${id}`, { medicationId: id, facilityId });
      return this.mapRowToMedication(result.rows[0]);
    } catch (error: any) {
      logger.error(`Error updating medication`, { error: error.message, id, dto });
      throw error;
    }
  }

  /**
   * Delete medication (soft delete by setting status to 'discontinued')
   */
  async delete(id: string, updatedBy: string, facilityId?: string): Promise<boolean> {
    let query = `
      UPDATE medications
      SET status = 'discontinued', updated_by = $1, updated_at = NOW()
      WHERE id = $2
    `;
    const values: any[] = [updatedBy, id];

    if (facilityId) {
      query += ' AND facility_id = $3';
      values.push(facilityId);
    }

    try {
      const result = await this.pool.query(query, values);
      logger.info(`Medication discontinued: ${id}`, { medicationId: id, facilityId });
      return result.rowCount > 0;
    } catch (error: any) {
      logger.error(`Error deleting medication`, { error: error.message, id, facilityId });
      throw error;
    }
  }

  /**
   * Search medications
   */
  async search(searchTerm: string, facilityId: string, limit: number = 20): Promise<Medication[]> {
    const query = `
      SELECT * FROM medications
      WHERE facility_id = $1
        AND status = 'active'
        AND (
          name ILIKE $2
          OR generic_name ILIKE $2
          OR brand_name ILIKE $2
        )
      ORDER BY name ASC
      LIMIT $3
    `;

    const values = [facilityId, `%${searchTerm}%`, limit];

    try {
      const result = await this.pool.query(query, values);
      return result.rows.map((row) => this.mapRowToMedication(row));
    } catch (error: any) {
      logger.error(`Error searching medications`, { error: error.message, searchTerm, facilityId });
      throw error;
    }
  }

  /**
   * Map database row to Medication model
   */
  private mapRowToMedication(row: any): Medication {
    return {
      id: row.id,
      name: row.name,
      genericName: row.generic_name,
      brandName: row.brand_name,
      dosageForm: row.dosage_form,
      strength: row.strength,
      unit: row.unit,
      manufacturer: row.manufacturer,
      description: row.description,
      category: row.category,
      isHighAlert: row.is_high_alert,
      requiresRefrigeration: row.requires_refrigeration,
      isControlledSubstance: row.is_controlled_substance,
      controlledSubstanceSchedule: row.controlled_substance_schedule,
      facilityId: row.facility_id,
      organizationId: row.organization_id,
      status: row.status,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default MedicationRepository;

