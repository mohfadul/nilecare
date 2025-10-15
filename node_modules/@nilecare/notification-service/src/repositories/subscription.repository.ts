/**
 * Subscription Repository
 * Database access layer for user notification subscriptions
 */

import { Pool } from 'pg';
import { dbPool } from '../config/database.config';
import { logger } from '../utils/logger';
import { UserNotificationSubscription, CreateSubscriptionDto, UpdateSubscriptionDto } from '../models/Subscription';

export class SubscriptionRepository {
  private pool: Pool;

  constructor() {
    this.pool = dbPool;
  }

  /**
   * Create or update subscription (upsert)
   */
  async upsert(data: CreateSubscriptionDto): Promise<UserNotificationSubscription> {
    const query = `
      INSERT INTO user_notification_subscriptions (
        user_id, channel, notification_type, is_enabled, preferences
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, channel, notification_type)
      DO UPDATE SET 
        is_enabled = EXCLUDED.is_enabled,
        preferences = EXCLUDED.preferences,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      data.user_id,
      data.channel,
      data.notification_type,
      data.is_enabled !== undefined ? data.is_enabled : true,
      data.preferences ? JSON.stringify(data.preferences) : null,
    ];

    try {
      const result = await this.pool.query(query, values);
      logger.info('Subscription upserted', { 
        userId: data.user_id, 
        channel: data.channel,
        type: data.notification_type 
      });
      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to upsert subscription', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Get subscriptions by user ID
   */
  async findByUserId(userId: string): Promise<UserNotificationSubscription[]> {
    const query = `
      SELECT * FROM user_notification_subscriptions 
      WHERE user_id = $1
      ORDER BY channel, notification_type
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to find subscriptions by user ID', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get subscription by user, channel, and type
   */
  async findByUserChannelType(
    userId: string, 
    channel: string, 
    notificationType: string
  ): Promise<UserNotificationSubscription | null> {
    const query = `
      SELECT * FROM user_notification_subscriptions 
      WHERE user_id = $1 AND channel = $2 AND notification_type = $3
    `;

    try {
      const result = await this.pool.query(query, [userId, channel, notificationType]);
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to find subscription', { 
        error: error.message, 
        userId, 
        channel, 
        notificationType 
      });
      throw error;
    }
  }

  /**
   * Get enabled subscriptions for user and channel
   */
  async findEnabledByUserChannel(userId: string, channel: string): Promise<UserNotificationSubscription[]> {
    const query = `
      SELECT * FROM user_notification_subscriptions 
      WHERE user_id = $1 AND channel = $2 AND is_enabled = true
    `;

    try {
      const result = await this.pool.query(query, [userId, channel]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to find enabled subscriptions', { error: error.message, userId, channel });
      throw error;
    }
  }

  /**
   * Check if user is subscribed to notification type
   */
  async isSubscribed(userId: string, channel: string, notificationType: string): Promise<boolean> {
    const query = `
      SELECT is_enabled FROM user_notification_subscriptions 
      WHERE user_id = $1 AND channel = $2 AND notification_type = $3
    `;

    try {
      const result = await this.pool.query(query, [userId, channel, notificationType]);
      
      // If no subscription exists, assume opted-in (default behavior)
      if (result.rows.length === 0) {
        return true;
      }
      
      return result.rows[0].is_enabled;
    } catch (error: any) {
      logger.error('Failed to check subscription', { error: error.message, userId, channel, notificationType });
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async update(id: string, data: UpdateSubscriptionDto): Promise<UserNotificationSubscription | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.is_enabled !== undefined) {
      fields.push(`is_enabled = $${paramIndex++}`);
      values.push(data.is_enabled);
    }
    if (data.preferences !== undefined) {
      fields.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(data.preferences));
    }

    if (fields.length === 0) {
      const findQuery = 'SELECT * FROM user_notification_subscriptions WHERE id = $1';
      const result = await this.pool.query(findQuery, [id]);
      return result.rows[0] || null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE user_notification_subscriptions 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      logger.info('Subscription updated', { id });
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to update subscription', { error: error.message, id, data });
      throw error;
    }
  }

  /**
   * Delete subscription
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM user_notification_subscriptions WHERE id = $1';

    try {
      const result = await this.pool.query(query, [id]);
      const deleted = (result.rowCount && result.rowCount > 0) ? true : false;
      logger.info('Subscription deleted', { id, deleted });
      return deleted;
    } catch (error: any) {
      logger.error('Failed to delete subscription', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Unsubscribe user from all notifications
   */
  async unsubscribeAll(userId: string): Promise<number> {
    const query = `
      UPDATE user_notification_subscriptions 
      SET is_enabled = false, updated_at = NOW()
      WHERE user_id = $1
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      const count = result.rowCount || 0;
      logger.info('User unsubscribed from all', { userId, count });
      return count;
    } catch (error: any) {
      logger.error('Failed to unsubscribe all', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Subscribe user to all notifications
   */
  async subscribeAll(userId: string): Promise<number> {
    const query = `
      UPDATE user_notification_subscriptions 
      SET is_enabled = true, updated_at = NOW()
      WHERE user_id = $1
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      const count = result.rowCount || 0;
      logger.info('User subscribed to all', { userId, count });
      return count;
    } catch (error: any) {
      logger.error('Failed to subscribe all', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get subscription count for user
   */
  async countByUser(userId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM user_notification_subscriptions WHERE user_id = $1';

    try {
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error: any) {
      logger.error('Failed to count subscriptions', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get enabled subscription count for user
   */
  async countEnabledByUser(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM user_notification_subscriptions 
      WHERE user_id = $1 AND is_enabled = true
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error: any) {
      logger.error('Failed to count enabled subscriptions', { error: error.message, userId });
      throw error;
    }
  }
}

export default SubscriptionRepository;

