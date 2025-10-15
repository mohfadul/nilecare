import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { Department, CreateDepartmentDTO, UpdateDepartmentDTO, DepartmentSearchParams } from '../models/Department';
import { v4 as uuidv4 } from 'uuid';

export class DepartmentRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPostgreSQLPool();
  }

  async create(dto: CreateDepartmentDTO): Promise<Department> {
    const departmentId = uuidv4();
    
    const query = `
      INSERT INTO departments (
        department_id, facility_id, name, code, description, head_of_department,
        specialization, floor, building, contact_phone, contact_email,
        operating_hours, is_active, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      departmentId, dto.facilityId, dto.name, dto.code, dto.description,
      dto.headOfDepartment, dto.specialization, dto.floor, dto.building,
      dto.contactPhone, dto.contactEmail,
      JSON.stringify(dto.operatingHours || {}), dto.createdBy,
    ]);

    return this.mapRowToDepartment(result.rows[0]);
  }

  async findById(departmentId: string): Promise<Department | null> {
    const query = 'SELECT * FROM departments WHERE department_id = $1 AND is_active = true';
    const result = await this.pool.query(query, [departmentId]);
    return result.rows.length > 0 ? this.mapRowToDepartment(result.rows[0]) : null;
  }

  async findByFacility(facilityId: string): Promise<Department[]> {
    const query = `
      SELECT * FROM departments 
      WHERE facility_id = $1 AND is_active = true 
      ORDER BY name ASC
    `;
    const result = await this.pool.query(query, [facilityId]);
    return result.rows.map(row => this.mapRowToDepartment(row));
  }

  async search(params: DepartmentSearchParams): Promise<{ departments: Department[]; total: number }> {
    let query = 'SELECT * FROM departments WHERE is_active = true';
    const values: any[] = [];
    let paramIndex = 1;

    if (params.facilityId) {
      query += ` AND facility_id = $${paramIndex}`;
      values.push(params.facilityId);
      paramIndex++;
    }

    if (params.specialization) {
      query += ` AND specialization ILIKE $${paramIndex}`;
      values.push(`%${params.specialization}%`);
      paramIndex++;
    }

    if (params.search) {
      query += ` AND (name ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
      values.push(`%${params.search}%`);
      paramIndex++;
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
    const departments = result.rows.map(row => this.mapRowToDepartment(row));

    return { departments, total };
  }

  async update(departmentId: string, dto: UpdateDepartmentDTO): Promise<Department | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(dto.name);
    }
    if (dto.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(dto.description);
    }
    if (dto.headOfDepartment !== undefined) {
      updates.push(`head_of_department = $${paramIndex++}`);
      values.push(dto.headOfDepartment);
    }
    if (dto.specialization !== undefined) {
      updates.push(`specialization = $${paramIndex++}`);
      values.push(dto.specialization);
    }
    if (dto.floor !== undefined) {
      updates.push(`floor = $${paramIndex++}`);
      values.push(dto.floor);
    }
    if (dto.building !== undefined) {
      updates.push(`building = $${paramIndex++}`);
      values.push(dto.building);
    }
    if (dto.contactPhone !== undefined) {
      updates.push(`contact_phone = $${paramIndex++}`);
      values.push(dto.contactPhone);
    }
    if (dto.contactEmail !== undefined) {
      updates.push(`contact_email = $${paramIndex++}`);
      values.push(dto.contactEmail);
    }
    if (dto.operatingHours !== undefined) {
      updates.push(`operating_hours = $${paramIndex++}`);
      values.push(JSON.stringify(dto.operatingHours));
    }
    if (dto.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(dto.isActive);
    }
    if (dto.updatedBy) {
      updates.push(`updated_by = $${paramIndex++}`);
      values.push(dto.updatedBy);
    }

    if (updates.length === 0) return this.findById(departmentId);

    updates.push('updated_at = NOW()');

    const query = `UPDATE departments SET ${updates.join(', ')} WHERE department_id = $${paramIndex} RETURNING *`;
    values.push(departmentId);

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? this.mapRowToDepartment(result.rows[0]) : null;
  }

  async delete(departmentId: string): Promise<boolean> {
    const query = 'UPDATE departments SET is_active = false, updated_at = NOW() WHERE department_id = $1';
    const result = await this.pool.query(query, [departmentId]);
    return result.rowCount > 0;
  }

  private mapRowToDepartment(row: any): Department {
    return {
      id: row.id,
      departmentId: row.department_id,
      facilityId: row.facility_id,
      name: row.name,
      code: row.code,
      description: row.description,
      headOfDepartment: row.head_of_department,
      specialization: row.specialization,
      floor: row.floor,
      building: row.building,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      isActive: row.is_active,
      operatingHours: typeof row.operating_hours === 'string' ? JSON.parse(row.operating_hours) : row.operating_hours,
      staffCount: row.staff_count,
      metadata: row.metadata,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default DepartmentRepository;

