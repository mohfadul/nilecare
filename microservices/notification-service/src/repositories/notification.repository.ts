/**
 * Notification Repository
 * Database access layer for notifications
 */

import { Pool } from 'pg';
import { dbPool } from '../config/database.config';
import { logger } from '../utils/logger';
import { Notification, CreateNotificationDto, UpdateNotificationDto } from '../models/Notification';

export class NotificationRepository {
  private pool: Pool;

  constructor() {
    this.pool = dbPool;
  }

  /**
   * Create a new notification
   */
  async create(data: CreateNotificationDto): Promise<Notification> {
    const query = `
      INSERT INTO notifications (
        user_id, channel, type, template_id, subject, body, 
        payload, scheduled_at, created_by, status, retry_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 0)
      RETURNING *
    `;

    const values = [
      data.user_id,
      data.channel,
      data.type,
      data.template_id || null,
      data.subject || null,
      data.body,
      data.payload ? JSON.stringify(data.payload) : null,
      data.scheduled_at || null,
      data.created_by || null,
    ];

    try {
      const result = await this.pool.query(query, values);
      logger.info('Notification created', { id: result.rows[0].id });
      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to create notification', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async findById(id: string): Promise<Notification | null> {
    const query = 'SELECT * FROM notifications WHERE id = $1';

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to find notification by ID', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Get notifications by user ID
   */
  async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await this.pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to find notifications by user ID', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get notifications by status
   */
  async findByStatus(status: string, limit: number = 100): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications 
      WHERE status = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;

    try {
      const result = await this.pool.query(query, [status, limit]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to find notifications by status', { error: error.message, status });
      throw error;
    }
  }

  /**
   * Get scheduled notifications that are due
   */
  async findScheduledDue(): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications 
      WHERE status = 'pending' 
        AND scheduled_at IS NOT NULL 
        AND scheduled_at <= NOW()
      ORDER BY scheduled_at ASC
      LIMIT 100
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to find scheduled notifications', { error: error.message });
      throw error;
    }
  }

  /**
   * Update notification
   */
  async update(id: string, data: UpdateNotificationDto): Promise<Notification | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.sent_at !== undefined) {
      fields.push(`sent_at = $${paramIndex++}`);
      values.push(data.sent_at);
    }
    if (data.read_at !== undefined) {
      fields.push(`read_at = $${paramIndex++}`);
      values.push(data.read_at);
    }
    if (data.error_message !== undefined) {
      fields.push(`error_message = $${paramIndex++}`);
      values.push(data.error_message);
    }
    if (data.retry_count !== undefined) {
      fields.push(`retry_count = $${paramIndex++}`);
      values.push(data.retry_count);
    }
    if (data.updated_by !== undefined) {
      fields.push(`updated_by = $${paramIndex++}`);
      values.push(data.updated_by);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE notifications 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      logger.info('Notification updated', { id });
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to update notification', { error: error.message, id, data });
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM notifications WHERE id = $1';

    try {
      const result = await this.pool.query(query, [id]);
      const deleted = (result.rowCount && result.rowCount > 0) ? true : false;
      logger.info('Notification deleted', { id, deleted });
      return deleted;
    } catch (error: any) {
      logger.error('Failed to delete notification', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Get notification count by user
   */
  async countByUser(userId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1';

    try {
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error: any) {
      logger.error('Failed to count notifications', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get unread notification count for user
   */
  async countUnreadByUser(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND status != 'read'
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error: any) {
      logger.error('Failed to count unread notifications', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification | null> {
    return this.update(id, { status: 'read', read_at: new Date() });
  }

  /**
   * Mark notification as sent
   */
  async markAsSent(id: string): Promise<Notification | null> {
    return this.update(id, { status: 'sent', sent_at: new Date() });
  }

  /**
   * Mark notification as failed
   */
  async markAsFailed(id: string, errorMessage: string, retryCount: number): Promise<Notification | null> {
    return this.update(id, { 
      status: 'failed', 
      error_message: errorMessage,
      retry_count: retryCount
    });
  }

  /**
   * Get failed notifications for retry
   */
  async findFailedForRetry(maxRetries: number = 3): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications 
      WHERE status = 'failed' 
        AND retry_count < $1
      ORDER BY created_at ASC
      LIMIT 50
    `;

    try {
      const result = await this.pool.query(query, [maxRetries]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to find notifications for retry', { error: error.message });
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getStatistics(userId?: string): Promise<any> {
    let query = `
      SELECT 
        channel,
        status,
        COUNT(*) as count
      FROM notifications
    `;

    const values: any[] = [];
    
    if (userId) {
      query += ' WHERE user_id = $1';
      values.push(userId);
    }

    query += ' GROUP BY channel, status';

    try {
      const result = await this.pool.query(query, values);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to get statistics', { error: error.message });
      throw error;
    }
  }
}

export default NotificationRepository;

