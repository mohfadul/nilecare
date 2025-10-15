import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { Facility, CreateFacilityDTO, UpdateFacilityDTO, FacilitySearchParams } from '../models/Facility';
import { NotFoundError, FacilityNotFoundError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

/**
 * Facility Repository
 * Data access layer for facilities
 */

export class FacilityRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPostgreSQLPool();
  }

  /**
   * Create new facility
   */
  async create(dto: CreateFacilityDTO): Promise<Facility> {
    const facilityId = uuidv4();
    
    const query = `
      INSERT INTO facilities (
        facility_id, organization_id, facility_code, name, type,
        address, contact, capacity, licensing, operating_hours,
        services, status, is_active, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', true, $12, NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      facilityId,
      dto.organizationId,
      dto.facilityCode,
      dto.name,
      dto.type,
      JSON.stringify(dto.address),
      JSON.stringify(dto.contact),
      JSON.stringify(dto.capacity || {}),
      JSON.stringify(dto.licensing || {}),
      JSON.stringify(dto.operatingHours || {}),
      JSON.stringify(dto.services || []),
      dto.createdBy,
    ]);

    return this.mapRowToFacility(result.rows[0]);
  }

  /**
   * Find facility by ID
   */
  async findById(facilityId: string): Promise<Facility | null> {
    const query = 'SELECT * FROM facilities WHERE facility_id = $1 AND is_active = true';
    const result = await this.pool.query(query, [facilityId]);
    return result.rows.length > 0 ? this.mapRowToFacility(result.rows[0]) : null;
  }

  /**
   * Find facilities by organization
   */
  async findByOrganization(organizationId: string): Promise<Facility[]> {
    const query = `
      SELECT * FROM facilities 
      WHERE organization_id = $1 AND is_active = true 
      ORDER BY name ASC
    `;
    const result = await this.pool.query(query, [organizationId]);
    return result.rows.map(row => this.mapRowToFacility(row));
  }

  /**
   * Search facilities with filters
   */
  async search(params: FacilitySearchParams): Promise<{ facilities: Facility[]; total: number }> {
    let query = 'SELECT * FROM facilities WHERE is_active = true';
    const values: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (params.organizationId) {
      query += ` AND organization_id = $${paramIndex}`;
      values.push(params.organizationId);
      paramIndex++;
    }

    if (params.type) {
      query += ` AND type = $${paramIndex}`;
      values.push(params.type);
      paramIndex++;
    }

    if (params.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(params.status);
      paramIndex++;
    }

    if (params.city) {
      query += ` AND address->>'city' ILIKE $${paramIndex}`;
      values.push(`%${params.city}%`);
      paramIndex++;
    }

    if (params.state) {
      query += ` AND address->>'state' ILIKE $${paramIndex}`;
      values.push(`%${params.state}%`);
      paramIndex++;
    }

    if (params.search) {
      query += ` AND (name ILIKE $${paramIndex} OR facility_code ILIKE $${paramIndex})`;
      values.push(`%${params.search}%`);
      paramIndex++;
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Sort
    const sortBy = params.sortBy || 'name';
    const sortOrder = params.sortOrder || 'asc';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Pagination
    const limit = params.limit || 50;
    const page = params.page || 1;
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    const facilities = result.rows.map(row => this.mapRowToFacility(row));

    return { facilities, total };
  }

  /**
   * Update facility
   */
  async update(facilityId: string, dto: UpdateFacilityDTO): Promise<Facility | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(dto.name);
      paramIndex++;
    }

    if (dto.type !== undefined) {
      updates.push(`type = $${paramIndex}`);
      values.push(dto.type);
      paramIndex++;
    }

    if (dto.address !== undefined) {
      updates.push(`address = $${paramIndex}`);
      values.push(JSON.stringify(dto.address));
      paramIndex++;
    }

    if (dto.contact !== undefined) {
      updates.push(`contact = $${paramIndex}`);
      values.push(JSON.stringify(dto.contact));
      paramIndex++;
    }

    if (dto.capacity !== undefined) {
      updates.push(`capacity = $${paramIndex}`);
      values.push(JSON.stringify(dto.capacity));
      paramIndex++;
    }

    if (dto.licensing !== undefined) {
      updates.push(`licensing = $${paramIndex}`);
      values.push(JSON.stringify(dto.licensing));
      paramIndex++;
    }

    if (dto.operatingHours !== undefined) {
      updates.push(`operating_hours = $${paramIndex}`);
      values.push(JSON.stringify(dto.operatingHours));
      paramIndex++;
    }

    if (dto.services !== undefined) {
      updates.push(`services = $${paramIndex}`);
      values.push(JSON.stringify(dto.services));
      paramIndex++;
    }

    if (dto.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(dto.status);
      paramIndex++;
    }

    if (dto.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(dto.isActive);
      paramIndex++;
    }

    if (dto.updatedBy) {
      updates.push(`updated_by = $${paramIndex}`);
      values.push(dto.updatedBy);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findById(facilityId);
    }

    updates.push('updated_at = NOW()');

    const query = `
      UPDATE facilities 
      SET ${updates.join(', ')} 
      WHERE facility_id = $${paramIndex} AND is_active = true
      RETURNING *
    `;
    values.push(facilityId);

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? this.mapRowToFacility(result.rows[0]) : null;
  }

  /**
   * Delete facility (soft delete)
   */
  async delete(facilityId: string): Promise<boolean> {
    const query = `
      UPDATE facilities 
      SET is_active = false, updated_at = NOW() 
      WHERE facility_id = $1
    `;
    const result = await this.pool.query(query, [facilityId]);
    return result.rowCount > 0;
  }

  /**
   * Get facility statistics
   */
  async getStatistics(facilityId: string): Promise<any> {
    const query = `
      SELECT 
        f.facility_id,
        f.name,
        f.type,
        COUNT(DISTINCT d.department_id) as department_count,
        COUNT(DISTINCT w.ward_id) as ward_count,
        COUNT(b.bed_id) as total_beds,
        COUNT(CASE WHEN b.bed_status = 'available' THEN 1 END) as available_beds,
        COUNT(CASE WHEN b.bed_status = 'occupied' THEN 1 END) as occupied_beds
      FROM facilities f
      LEFT JOIN departments d ON f.facility_id = d.facility_id AND d.is_active = true
      LEFT JOIN wards w ON d.department_id = w.department_id AND w.is_active = true
      LEFT JOIN beds b ON w.ward_id = b.ward_id AND b.is_active = true
      WHERE f.facility_id = $1 AND f.is_active = true
      GROUP BY f.facility_id, f.name, f.type
    `;

    const result = await this.pool.query(query, [facilityId]);
    return result.rows[0] || null;
  }

  /**
   * Map database row to Facility object
   */
  private mapRowToFacility(row: any): Facility {
    return {
      id: row.id,
      facilityId: row.facility_id,
      organizationId: row.organization_id,
      facilityCode: row.facility_code,
      name: row.name,
      type: row.type,
      address: typeof row.address === 'string' ? JSON.parse(row.address) : row.address,
      contact: typeof row.contact === 'string' ? JSON.parse(row.contact) : row.contact,
      capacity: typeof row.capacity === 'string' ? JSON.parse(row.capacity) : row.capacity,
      licensing: typeof row.licensing === 'string' ? JSON.parse(row.licensing) : row.licensing,
      operatingHours: typeof row.operating_hours === 'string' ? JSON.parse(row.operating_hours) : row.operating_hours,
      services: typeof row.services === 'string' ? JSON.parse(row.services) : row.services,
      status: row.status,
      isActive: row.is_active,
      metadata: row.metadata,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default FacilityRepository;

