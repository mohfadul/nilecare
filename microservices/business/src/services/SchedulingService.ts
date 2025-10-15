import type mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { Schedule, ScheduleQuery, PaginationResult, ScheduleConflict } from '../types';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class SchedulingService {
  constructor(private db: mysql.Pool) {}

  async getAllSchedules(
    query: ScheduleQuery,
    organizationId: string
  ): Promise<PaginationResult<Schedule>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    // Note: organization_id column doesn't exist in current schema, using WHERE 1=1 as base
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (query.staffId) {
      whereClause += ` AND staff_id = ?`;
      params.push(query.staffId);
    }

    if (query.scheduleType) {
      whereClause += ` AND schedule_type = ?`;
      params.push(query.scheduleType);
    }

    if (query.status) {
      whereClause += ` AND status = ?`;
      params.push(query.status);
    }

    if (query.startDate && query.endDate) {
      whereClause += ` AND start_time BETWEEN ? AND ?`;
      params.push(query.startDate, query.endDate);
    }

    if (query.location) {
      whereClause += ` AND location = ?`;
      params.push(query.location);
    }

    try {
      const countQuery = `SELECT COUNT(*) as count FROM schedules ${whereClause}`;
      const [countRows] = await this.db.query(countQuery, params) as any;
      const total = parseInt(countRows[0].count);

      const dataQuery = `
        SELECT * FROM schedules 
        ${whereClause}
        ORDER BY start_time DESC
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, limit, offset];

      const [dataRows] = await this.db.query(dataQuery, dataParams) as any;

      return {
        data: dataRows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Error fetching schedules:', error);
      throw error;
    }
  }

  async getScheduleById(id: string, organizationId: string): Promise<Schedule> {
    try {
      const [rows] = await this.db.query(
        'SELECT * FROM schedules WHERE id = ?',
        [id, organizationId]
      ) as any;

      if (rows.length === 0) {
        throw new NotFoundError('Schedule not found');
      }

      return rows[0];
    } catch (error: any) {
      logger.error('Error fetching schedule:', error);
      throw error;
    }
  }

  async createSchedule(
    data: Partial<Schedule>,
    organizationId: string,
    userId: string
  ): Promise<Schedule> {
    const id = uuidv4();

    // Check for conflicts
    const conflicts = await this.checkScheduleConflicts(
      data.staffId!,
      new Date(data.startTime!),
      new Date(data.endTime!),
      organizationId
    );

    if (conflicts.length > 0) {
      throw new ConflictError(`Schedule conflicts detected: ${conflicts[0].message}`);
    }

    try {
      await this.db.query(
        `INSERT INTO schedules (
          id, staff_id, start_time, end_time,
          schedule_type, location, notes, status,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          data.staffId,
          data.startTime,
          data.endTime,
          data.scheduleType,
          data.location || null,
          data.notes || null,
          'scheduled',
          userId
        ]
      );

      logger.info(`Schedule created: ${id}`);
      return await this.getScheduleById(id, organizationId);
    } catch (error: any) {
      logger.error('Error creating schedule:', error);
      throw error;
    }
  }

  async updateSchedule(
    id: string,
    data: Partial<Schedule>,
    organizationId: string,
    userId: string
  ): Promise<Schedule> {
    await this.getScheduleById(id, organizationId);

    const updates: string[] = [];
    const params: any[] = [];

    if (data.startTime) {
      updates.push(`start_time = ?`);
      params.push(data.startTime);
    }

    if (data.endTime) {
      updates.push(`end_time = ?`);
      params.push(data.endTime);
    }

    if (data.scheduleType) {
      updates.push(`schedule_type = ?`);
      params.push(data.scheduleType);
    }

    if (data.status) {
      updates.push(`status = ?`);
      params.push(data.status);
    }

    if (data.location !== undefined) {
      updates.push(`location = ?`);
      params.push(data.location);
    }

    if (data.notes !== undefined) {
      updates.push(`notes = ?`);
      params.push(data.notes);
    }

    if (updates.length === 0) {
      return await this.getScheduleById(id, organizationId);
    }

    updates.push(`updated_by = ?`);
    params.push(userId);
    updates.push(`updated_at = NOW()`);

    params.push(id, organizationId);

    try {
      await this.db.query(
        `UPDATE schedules SET ${updates.join(', ')} 
         WHERE id = ?`,
        params
      );

      logger.info(`Schedule updated: ${id}`);
      return await this.getScheduleById(id, organizationId);
    } catch (error: any) {
      logger.error('Error updating schedule:', error);
      throw error;
    }
  }

  async deleteSchedule(
    id: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    await this.getScheduleById(id, organizationId);

    try {
      await this.db.query(
        'UPDATE schedules SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        ['cancelled', userId, id, organizationId]
      );

      logger.info(`Schedule cancelled: ${id}`);
    } catch (error: any) {
      logger.error('Error cancelling schedule:', error);
      throw error;
    }
  }

  async getStaffSchedule(
    staffId: string,
    startDate: Date,
    endDate: Date,
    organizationId: string
  ): Promise<Schedule[]> {
    try {
      const [rows] = await this.db.query(
        `SELECT * FROM schedules 
         WHERE staff_id = ? 
         AND start_time BETWEEN ? AND ?
         AND status != 'cancelled'
         ORDER BY start_time`,
        [staffId, organizationId, startDate, endDate]
      ) as any;

      return rows;
    } catch (error: any) {
      logger.error('Error fetching staff schedule:', error);
      throw error;
    }
  }

  private async checkScheduleConflicts(
    staffId: string,
    startTime: Date,
    endTime: Date,
    organizationId: string,
    excludeId?: string
  ): Promise<ScheduleConflict[]> {
    let query = `
      SELECT * FROM schedules 
      WHERE staff_id = ?
      AND status != 'cancelled'
      AND (
        (start_time < ? AND end_time > ?)
        OR (start_time >= ? AND start_time < ?)
      )
    `;
    const params: any[] = [staffId, organizationId, endTime, startTime, startTime, endTime];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const [rows] = await this.db.query(query, params) as any;

    return rows.map((row: any) => ({
      existingSchedule: row,
      conflictType: 'overlap' as const,
      message: `Conflicts with existing ${row.schedule_type} from ${row.start_time} to ${row.end_time}`
    }));
  }
}
