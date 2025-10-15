/**
 * Delivery Service
 * Track notification delivery status
 */

import { dbPool } from '../config/database.config';
import { logger } from '../utils/logger';
import { DeliveryTracking, UpdateDeliveryTrackingDto } from '../models/Delivery';
import { Pool } from 'pg';

export class DeliveryService {
  private pool: Pool;

  constructor() {
    this.pool = dbPool;
    logger.info('DeliveryService initialized');
  }

  /**
   * Track delivery
   */
  async trackDelivery(
    notificationId: string, 
    channel: 'email' | 'sms' | 'push' | 'websocket',
    status: string,
    providerMessageId?: string,
    provider?: string
  ): Promise<DeliveryTracking> {
    const query = `
      INSERT INTO delivery_tracking (
        notification_id, channel, status, provider, provider_message_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [notificationId, channel, status, provider || null, providerMessageId || null];

    try {
      const result = await this.pool.query(query, values);
      logger.info('Delivery tracked', { 
        notificationId, 
        status,
        trackingId: result.rows[0].id 
      });
      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to track delivery', { error: error.message, notificationId });
      throw error;
    }
  }

  /**
   * Update delivery status
   */
  async updateStatus(
    trackingId: string,
    data: UpdateDeliveryTrackingDto
  ): Promise<DeliveryTracking | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.delivered_at !== undefined) {
      fields.push(`delivered_at = $${paramIndex++}`);
      values.push(data.delivered_at);
    }
    if (data.opened_at !== undefined) {
      fields.push(`opened_at = $${paramIndex++}`);
      values.push(data.opened_at);
    }
    if (data.clicked_at !== undefined) {
      fields.push(`clicked_at = $${paramIndex++}`);
      values.push(data.clicked_at);
    }
    if (data.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (fields.length === 0) {
      return this.getById(trackingId);
    }

    values.push(trackingId);

    const query = `
      UPDATE delivery_tracking 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      logger.info('Delivery status updated', { trackingId });
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to update delivery status', { error: error.message, trackingId });
      throw error;
    }
  }

  /**
   * Get delivery by ID
   */
  async getById(id: string): Promise<DeliveryTracking | null> {
    const query = 'SELECT * FROM delivery_tracking WHERE id = $1';

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to get delivery by ID', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Get delivery status by notification ID
   */
  async getStatus(notificationId: string): Promise<DeliveryTracking | null> {
    const query = `
      SELECT * FROM delivery_tracking 
      WHERE notification_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [notificationId]);
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to get delivery status', { error: error.message, notificationId });
      throw error;
    }
  }

  /**
   * Get all delivery tracking for notification
   */
  async getAllByNotificationId(notificationId: string): Promise<DeliveryTracking[]> {
    const query = `
      SELECT * FROM delivery_tracking 
      WHERE notification_id = $1 
      ORDER BY created_at DESC
    `;

    try {
      const result = await this.pool.query(query, [notificationId]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to get delivery tracking', { error: error.message, notificationId });
      throw error;
    }
  }

  /**
   * Get delivery statistics
   */
  async getStatistics(channel?: string): Promise<any> {
    let query = `
      SELECT 
        channel,
        status,
        COUNT(*) as count
      FROM delivery_tracking
    `;

    const values: any[] = [];

    if (channel) {
      query += ' WHERE channel = $1';
      values.push(channel);
    }

    query += ' GROUP BY channel, status';

    try {
      const result = await this.pool.query(query, values);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to get delivery statistics', { error: error.message });
      throw error;
    }
  }
}

export default DeliveryService;

