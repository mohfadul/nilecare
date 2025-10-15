import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { Bed, CreateBedDTO, UpdateBedDTO, BedSearchParams, AssignBedDTO, ReleaseBedDTO, BedHistory } from '../models/Bed';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bed Repository
 * Data access layer for hospital beds
 */

export class BedRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPostgreSQLPool();
  }

  /**
   * Create new bed
   */
  async create(dto: CreateBedDTO): Promise<Bed> {
    const bedId = uuidv4();
    
    const query = `
      INSERT INTO beds (
        bed_id, facility_id, department_id, ward_id, bed_number, bed_type,
        bed_status, location, has_oxygen, has_monitor, has_ventilator,
        isolation_capable, is_active, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'available', $7, $8, $9, $10, $11, true, $12, NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      bedId,
      dto.facilityId,
      dto.departmentId,
      dto.wardId,
      dto.bedNumber,
      dto.bedType,
      dto.location || null,
      dto.hasOxygen || false,
      dto.hasMonitor || false,
      dto.hasVentilator || false,
      dto.isolationCapable || false,
      dto.createdBy,
    ]);

    return this.mapRowToBed(result.rows[0]);
  }

  /**
   * Find bed by ID
   */
  async findById(bedId: string): Promise<Bed | null> {
    const query = 'SELECT * FROM beds WHERE bed_id = $1 AND is_active = true';
    const result = await this.pool.query(query, [bedId]);
    return result.rows.length > 0 ? this.mapRowToBed(result.rows[0]) : null;
  }

  /**
   * Find beds by ward
   */
  async findByWard(wardId: string): Promise<Bed[]> {
    const query = `
      SELECT * FROM beds 
      WHERE ward_id = $1 AND is_active = true 
      ORDER BY bed_number ASC
    `;
    const result = await this.pool.query(query, [wardId]);
    return result.rows.map(row => this.mapRowToBed(row));
  }

  /**
   * Search beds with filters
   */
  async search(params: BedSearchParams): Promise<{ beds: Bed[]; total: number }> {
    let query = 'SELECT * FROM beds WHERE is_active = true';
    const values: any[] = [];
    let paramIndex = 1;

    if (params.facilityId) {
      query += ` AND facility_id = $${paramIndex}`;
      values.push(params.facilityId);
      paramIndex++;
    }

    if (params.departmentId) {
      query += ` AND department_id = $${paramIndex}`;
      values.push(params.departmentId);
      paramIndex++;
    }

    if (params.wardId) {
      query += ` AND ward_id = $${paramIndex}`;
      values.push(params.wardId);
      paramIndex++;
    }

    if (params.bedType) {
      query += ` AND bed_type = $${paramIndex}`;
      values.push(params.bedType);
      paramIndex++;
    }

    if (params.bedStatus) {
      query += ` AND bed_status = $${paramIndex}`;
      values.push(params.bedStatus);
      paramIndex++;
    }

    if (params.isAvailable) {
      query += ` AND bed_status = 'available'`;
    }

    if (params.hasOxygen !== undefined) {
      query += ` AND has_oxygen = $${paramIndex}`;
      values.push(params.hasOxygen);
      paramIndex++;
    }

    if (params.hasMonitor !== undefined) {
      query += ` AND has_monitor = $${paramIndex}`;
      values.push(params.hasMonitor);
      paramIndex++;
    }

    if (params.hasVentilator !== undefined) {
      query += ` AND has_ventilator = $${paramIndex}`;
      values.push(params.hasVentilator);
      paramIndex++;
    }

    if (params.isolationCapable !== undefined) {
      query += ` AND isolation_capable = $${paramIndex}`;
      values.push(params.isolationCapable);
      paramIndex++;
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Pagination
    const limit = params.limit || 50;
    const page = params.page || 1;
    const offset = (page - 1) * limit;
    query += ` ORDER BY bed_number ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    const beds = result.rows.map(row => this.mapRowToBed(row));

    return { beds, total };
  }

  /**
   * Update bed
   */
  async update(bedId: string, dto: UpdateBedDTO): Promise<Bed | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.bedNumber !== undefined) {
      updates.push(`bed_number = $${paramIndex}`);
      values.push(dto.bedNumber);
      paramIndex++;
    }

    if (dto.bedType !== undefined) {
      updates.push(`bed_type = $${paramIndex}`);
      values.push(dto.bedType);
      paramIndex++;
    }

    if (dto.bedStatus !== undefined) {
      updates.push(`bed_status = $${paramIndex}`);
      values.push(dto.bedStatus);
      paramIndex++;
    }

    if (dto.location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      values.push(dto.location);
      paramIndex++;
    }

    if (dto.hasOxygen !== undefined) {
      updates.push(`has_oxygen = $${paramIndex}`);
      values.push(dto.hasOxygen);
      paramIndex++;
    }

    if (dto.hasMonitor !== undefined) {
      updates.push(`has_monitor = $${paramIndex}`);
      values.push(dto.hasMonitor);
      paramIndex++;
    }

    if (dto.hasVentilator !== undefined) {
      updates.push(`has_ventilator = $${paramIndex}`);
      values.push(dto.hasVentilator);
      paramIndex++;
    }

    if (dto.isolationCapable !== undefined) {
      updates.push(`isolation_capable = $${paramIndex}`);
      values.push(dto.isolationCapable);
      paramIndex++;
    }

    if (dto.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(dto.isActive);
      paramIndex++;
    }

    if (dto.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(dto.notes);
      paramIndex++;
    }

    if (dto.lastMaintenanceDate) {
      updates.push(`last_maintenance_date = $${paramIndex}`);
      values.push(dto.lastMaintenanceDate);
      paramIndex++;
    }

    if (dto.updatedBy) {
      updates.push(`updated_by = $${paramIndex}`);
      values.push(dto.updatedBy);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findById(bedId);
    }

    updates.push('updated_at = NOW()');

    const query = `
      UPDATE beds 
      SET ${updates.join(', ')} 
      WHERE bed_id = $${paramIndex} AND is_active = true
      RETURNING *
    `;
    values.push(bedId);

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? this.mapRowToBed(result.rows[0]) : null;
  }

  /**
   * Assign bed to patient
   */
  async assignBed(dto: AssignBedDTO): Promise<Bed | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update bed
      const updateQuery = `
        UPDATE beds 
        SET bed_status = 'occupied', 
            patient_id = $1, 
            assignment_date = $2,
            expected_discharge_date = $3,
            updated_at = NOW()
        WHERE bed_id = $4 AND bed_status = 'available' AND is_active = true
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [
        dto.patientId,
        dto.assignmentDate || new Date(),
        dto.expectedDischargeDate || null,
        dto.bedId,
      ]);

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      // Create history record
      const historyQuery = `
        INSERT INTO bed_history (
          bed_id, patient_id, assignment_date, reason, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `;
      
      await client.query(historyQuery, [
        dto.bedId,
        dto.patientId,
        dto.assignmentDate || new Date(),
        dto.notes || 'Bed assigned',
      ]);

      await client.query('COMMIT');
      return this.mapRowToBed(updateResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Release bed from patient
   */
  async releaseBed(dto: ReleaseBedDTO): Promise<Bed | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update bed
      const updateQuery = `
        UPDATE beds 
        SET bed_status = 'cleaning', 
            patient_id = NULL,
            assignment_date = NULL,
            expected_discharge_date = NULL,
            updated_at = NOW()
        WHERE bed_id = $1 AND bed_status = 'occupied' AND is_active = true
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [dto.bedId]);

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      // Update history record
      const historyQuery = `
        UPDATE bed_history 
        SET discharge_date = NOW(), reason = $1
        WHERE bed_id = $2 AND discharge_date IS NULL
      `;
      
      await client.query(historyQuery, [dto.releaseReason || 'Patient discharged', dto.bedId]);

      await client.query('COMMIT');
      return this.mapRowToBed(updateResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get bed history
   */
  async getBedHistory(bedId: string): Promise<BedHistory[]> {
    const query = `
      SELECT * FROM bed_history 
      WHERE bed_id = $1 
      ORDER BY assignment_date DESC
    `;
    const result = await this.pool.query(query, [bedId]);
    return result.rows;
  }

  /**
   * Get available beds count by ward
   */
  async getAvailableBedsCount(wardId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM beds 
      WHERE ward_id = $1 AND bed_status = 'available' AND is_active = true
    `;
    const result = await this.pool.query(query, [wardId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Map database row to Bed object
   */
  private mapRowToBed(row: any): Bed {
    return {
      id: row.id,
      bedId: row.bed_id,
      facilityId: row.facility_id,
      departmentId: row.department_id,
      wardId: row.ward_id,
      bedNumber: row.bed_number,
      bedType: row.bed_type,
      bedStatus: row.bed_status,
      patientId: row.patient_id,
      assignmentDate: row.assignment_date,
      expectedDischargeDate: row.expected_discharge_date,
      location: row.location,
      hasOxygen: row.has_oxygen,
      hasMonitor: row.has_monitor,
      hasVentilator: row.has_ventilator,
      isolationCapable: row.isolation_capable,
      isActive: row.is_active,
      notes: row.notes,
      lastMaintenanceDate: row.last_maintenance_date,
      metadata: row.metadata,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default BedRepository;

