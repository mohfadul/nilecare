import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { Ward, CreateWardDTO, UpdateWardDTO, WardSearchParams, WardOccupancy } from '../models/Ward';
import { v4 as uuidv4 } from 'uuid';

export class WardRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPostgreSQLPool();
  }

  async create(dto: CreateWardDTO): Promise<Ward> {
    const wardId = uuidv4();
    
    const query = `
      INSERT INTO wards (
        ward_id, facility_id, department_id, name, ward_code, ward_type,
        floor, total_beds, occupied_beds, available_beds, nurse_station_phone,
        status, specialty_type, gender_restriction, is_active, created_by,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 0, $8, $9, 'active', $10, $11, true, $12,
        NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      wardId, dto.facilityId, dto.departmentId, dto.name, dto.wardCode,
      dto.wardType, dto.floor, dto.totalBeds, dto.nurseStationPhone,
      dto.specialtyType, dto.genderRestriction, dto.createdBy,
    ]);

    return this.mapRowToWard(result.rows[0]);
  }

  async findById(wardId: string): Promise<Ward | null> {
    const query = 'SELECT * FROM wards WHERE ward_id = $1 AND is_active = true';
    const result = await this.pool.query(query, [wardId]);
    return result.rows.length > 0 ? this.mapRowToWard(result.rows[0]) : null;
  }

  async findByDepartment(departmentId: string): Promise<Ward[]> {
    const query = `SELECT * FROM wards WHERE department_id = $1 AND is_active = true ORDER BY name ASC`;
    const result = await this.pool.query(query, [departmentId]);
    return result.rows.map(row => this.mapRowToWard(row));
  }

  async search(params: WardSearchParams): Promise<{ wards: Ward[]; total: number }> {
    let query = 'SELECT * FROM wards WHERE is_active = true';
    const values: any[] = [];
    let paramIndex = 1;

    if (params.facilityId) {
      query += ` AND facility_id = $${paramIndex++}`;
      values.push(params.facilityId);
    }
    if (params.departmentId) {
      query += ` AND department_id = $${paramIndex++}`;
      values.push(params.departmentId);
    }
    if (params.wardType) {
      query += ` AND ward_type = $${paramIndex++}`;
      values.push(params.wardType);
    }
    if (params.status) {
      query += ` AND status = $${paramIndex++}`;
      values.push(params.status);
    }
    if (params.hasAvailableBeds) {
      query += ` AND available_beds > 0`;
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    const limit = params.limit || 50;
    const page = params.page || 1;
    const offset = (page - 1) * limit;
    query += ` ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    return { wards: result.rows.map(row => this.mapRowToWard(row)), total };
  }

  async update(wardId: string, dto: UpdateWardDTO): Promise<Ward | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.name) updates.push(`name = $${paramIndex++}`), values.push(dto.name);
    if (dto.wardType) updates.push(`ward_type = $${paramIndex++}`), values.push(dto.wardType);
    if (dto.floor !== undefined) updates.push(`floor = $${paramIndex++}`), values.push(dto.floor);
    if (dto.totalBeds !== undefined) updates.push(`total_beds = $${paramIndex++}`), values.push(dto.totalBeds);
    if (dto.nurseStationPhone) updates.push(`nurse_station_phone = $${paramIndex++}`), values.push(dto.nurseStationPhone);
    if (dto.status) updates.push(`status = $${paramIndex++}`), values.push(dto.status);
    if (dto.isActive !== undefined) updates.push(`is_active = $${paramIndex++}`), values.push(dto.isActive);
    if (dto.specialtyType) updates.push(`specialty_type = $${paramIndex++}`), values.push(dto.specialtyType);
    if (dto.genderRestriction) updates.push(`gender_restriction = $${paramIndex++}`), values.push(dto.genderRestriction);
    if (dto.updatedBy) updates.push(`updated_by = $${paramIndex++}`), values.push(dto.updatedBy);

    if (updates.length === 0) return this.findById(wardId);

    updates.push('updated_at = NOW()');
    const query = `UPDATE wards SET ${updates.join(', ')} WHERE ward_id = $${paramIndex} RETURNING *`;
    values.push(wardId);

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? this.mapRowToWard(result.rows[0]) : null;
  }

  async updateOccupancy(wardId: string): Promise<void> {
    const query = `
      UPDATE wards 
      SET occupied_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = $1 AND bed_status = 'occupied'),
          available_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = $1 AND bed_status = 'available'),
          updated_at = NOW()
      WHERE ward_id = $1
    `;
    await this.pool.query(query, [wardId]);
  }

  async getOccupancy(wardId: string): Promise<WardOccupancy | null> {
    const query = `
      SELECT 
        ward_id, name as ward_name, total_beds, occupied_beds, available_beds,
        ROUND((occupied_beds::numeric / total_beds::numeric) * 100, 2) as occupancy_rate,
        updated_at as last_updated
      FROM wards WHERE ward_id = $1
    `;
    const result = await this.pool.query(query, [wardId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async delete(wardId: string): Promise<boolean> {
    const query = 'UPDATE wards SET is_active = false, updated_at = NOW() WHERE ward_id = $1';
    const result = await this.pool.query(query, [wardId]);
    return result.rowCount > 0;
  }

  private mapRowToWard(row: any): Ward {
    return {
      id: row.id,
      wardId: row.ward_id,
      facilityId: row.facility_id,
      departmentId: row.department_id,
      name: row.name,
      wardCode: row.ward_code,
      wardType: row.ward_type,
      floor: row.floor,
      totalBeds: row.total_beds,
      occupiedBeds: row.occupied_beds,
      availableBeds: row.available_beds,
      nurseStationPhone: row.nurse_station_phone,
      status: row.status,
      isActive: row.is_active,
      specialtyType: row.specialty_type,
      genderRestriction: row.gender_restriction,
      metadata: row.metadata,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default WardRepository;

