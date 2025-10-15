import type mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { Staff, StaffQuery, PaginationResult } from '../types';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class StaffService {
  constructor(private db: mysql.Pool) {}

  async getAllStaff(
    query: StaffQuery,
    organizationId: string
  ): Promise<PaginationResult<Staff>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    // Note: organization_id column doesn't exist in current schema, using WHERE 1=1 as base
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (query.role) {
      whereClause += ` AND role = ?`;
      params.push(query.role);
    }

    if (query.status) {
      whereClause += ` AND status = ?`;
      params.push(query.status);
    }

    if (query.department) {
      whereClause += ` AND department = ?`;
      params.push(query.department);
    }

    if (query.specialization) {
      whereClause += ` AND specialization = ?`;
      params.push(query.specialization);
    }

    if (query.search) {
      whereClause += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${query.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    try {
      const countQuery = `SELECT COUNT(*) as count FROM staff ${whereClause}`;
      const [countRows] = await this.db.query(countQuery, params) as any;
      const total = parseInt(countRows[0].count);

      const dataQuery = `
        SELECT * FROM staff 
        ${whereClause}
        ORDER BY last_name, first_name
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, limit, offset];

      const [dataRows] = await this.db.query(dataQuery, dataParams) as any;

      // Parse JSON fields
      const staff = dataRows.map((row: any) => ({
        ...row,
        availability: typeof row.availability === 'string' ? JSON.parse(row.availability) : row.availability,
        credentials: typeof row.credentials === 'string' ? JSON.parse(row.credentials) : row.credentials
      }));

      return {
        data: staff,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Error fetching staff:', error);
      throw error;
    }
  }

  async getStaffById(id: string, organizationId: string): Promise<Staff> {
    try {
      const [rows] = await this.db.query(
        'SELECT * FROM staff WHERE id = ?',
        [id, organizationId]
      ) as any;

      if (rows.length === 0) {
        throw new NotFoundError('Staff member not found');
      }

      const staff = rows[0];
      staff.availability = typeof staff.availability === 'string' ? JSON.parse(staff.availability) : staff.availability;
      staff.credentials = typeof staff.credentials === 'string' ? JSON.parse(staff.credentials) : staff.credentials;

      return staff;
    } catch (error: any) {
      logger.error('Error fetching staff member:', error);
      throw error;
    }
  }

  async createStaff(
    data: Partial<Staff>,
    organizationId: string,
    userId: string
  ): Promise<Staff> {
    const id = uuidv4();

    // Check if email already exists
    const [existingStaff] = await this.db.query(
      'SELECT id FROM staff WHERE email = ?',
      [data.email, organizationId]
    ) as any;

    if (existingStaff.length > 0) {
      throw new ConflictError('Staff member with this email already exists');
    }

    try {
      await this.db.query(
        `INSERT INTO staff (
          id, first_name, last_name, email, phone,
          role, department, specialization, license_number, hire_date,
          status, availability, credentials,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          data.firstName,
          data.lastName,
          data.email,
          data.phone,
          data.role,
          data.department || null,
          data.specialization || null,
          data.licenseNumber || null,
          data.hireDate || new Date(),
          'active',
          JSON.stringify(data.availability || {}),
          JSON.stringify(data.credentials || []),
          userId
        ]
      );

      logger.info(`Staff member created: ${id}`);
      return await this.getStaffById(id, organizationId);
    } catch (error: any) {
      logger.error('Error creating staff member:', error);
      throw error;
    }
  }

  async updateStaff(
    id: string,
    data: Partial<Staff>,
    organizationId: string,
    userId: string
  ): Promise<Staff> {
    await this.getStaffById(id, organizationId);

    // Check email uniqueness if updating email
    if (data.email) {
      const [existingStaff] = await this.db.query(
        'SELECT id FROM staff WHERE email = ? AND id != ?',
        [data.email, organizationId, id]
      ) as any;

      if (existingStaff.length > 0) {
        throw new ConflictError('Staff member with this email already exists');
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.firstName) {
      updates.push(`first_name = ?`);
      params.push(data.firstName);
    }

    if (data.lastName) {
      updates.push(`last_name = ?`);
      params.push(data.lastName);
    }

    if (data.email) {
      updates.push(`email = ?`);
      params.push(data.email);
    }

    if (data.phone) {
      updates.push(`phone = ?`);
      params.push(data.phone);
    }

    if (data.role) {
      updates.push(`role = ?`);
      params.push(data.role);
    }

    if (data.department !== undefined) {
      updates.push(`department = ?`);
      params.push(data.department);
    }

    if (data.specialization !== undefined) {
      updates.push(`specialization = ?`);
      params.push(data.specialization);
    }

    if (data.licenseNumber !== undefined) {
      updates.push(`license_number = ?`);
      params.push(data.licenseNumber);
    }

    if (data.status) {
      updates.push(`status = ?`);
      params.push(data.status);
    }

    if (data.availability) {
      updates.push(`availability = ?`);
      params.push(JSON.stringify(data.availability));
    }

    if (data.credentials) {
      updates.push(`credentials = ?`);
      params.push(JSON.stringify(data.credentials));
    }

    if (updates.length === 0) {
      return await this.getStaffById(id, organizationId);
    }

    updates.push(`updated_by = ?`);
    params.push(userId);
    updates.push(`updated_at = NOW()`);

    params.push(id, organizationId);

    try {
      await this.db.query(
        `UPDATE staff SET ${updates.join(', ')} 
         WHERE id = ?`,
        params
      );

      logger.info(`Staff member updated: ${id}`);
      return await this.getStaffById(id, organizationId);
    } catch (error: any) {
      logger.error('Error updating staff member:', error);
      throw error;
    }
  }

  async deleteStaff(
    id: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    await this.getStaffById(id, organizationId);

    try {
      await this.db.query(
        `UPDATE staff 
         SET status = ?, termination_date = NOW(), updated_by = ?, updated_at = NOW()
         WHERE id = ?`,
        ['terminated', userId, id, organizationId]
      );

      logger.info(`Staff member terminated: ${id}`);
    } catch (error: any) {
      logger.error('Error terminating staff member:', error);
      throw error;
    }
  }

  async getStaffByRole(
    role: string,
    organizationId: string
  ): Promise<Staff[]> {
    try {
      const [rows] = await this.db.query(
        `SELECT * FROM staff 
         WHERE role = ? AND status = 'active'
         ORDER BY last_name, first_name`,
        [role, organizationId]
      ) as any;

      // Parse JSON fields
      const staff = rows.map((row: any) => ({
        ...row,
        availability: typeof row.availability === 'string' ? JSON.parse(row.availability) : row.availability,
        credentials: typeof row.credentials === 'string' ? JSON.parse(row.credentials) : row.credentials
      }));

      return staff;
    } catch (error: any) {
      logger.error('Error fetching staff by role:', error);
      throw error;
    }
  }

  async getStaffByDepartment(
    department: string,
    organizationId: string
  ): Promise<Staff[]> {
    try {
      const [rows] = await this.db.query(
        `SELECT * FROM staff 
         WHERE department = ? AND status = 'active'
         ORDER BY last_name, first_name`,
        [department, organizationId]
      ) as any;

      // Parse JSON fields
      const staff = rows.map((row: any) => ({
        ...row,
        availability: typeof row.availability === 'string' ? JSON.parse(row.availability) : row.availability,
        credentials: typeof row.credentials === 'string' ? JSON.parse(row.credentials) : row.credentials
      }));

      return staff;
    } catch (error: any) {
      logger.error('Error fetching staff by department:', error);
      throw error;
    }
  }
}
