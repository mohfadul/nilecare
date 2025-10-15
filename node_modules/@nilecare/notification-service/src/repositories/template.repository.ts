/**
 * Template Repository
 * Database access layer for notification templates
 */

import { Pool } from 'pg';
import { dbPool } from '../config/database.config';
import { logger } from '../utils/logger';
import { NotificationTemplate, CreateTemplateDto, UpdateTemplateDto } from '../models/Template';

export class TemplateRepository {
  private pool: Pool;

  constructor() {
    this.pool = dbPool;
  }

  /**
   * Create a new template
   */
  async create(data: CreateTemplateDto): Promise<NotificationTemplate> {
    const query = `
      INSERT INTO notification_templates (
        name, type, channel, subject_template, body_template, 
        variables, is_active, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      data.name,
      data.type,
      data.channel,
      data.subject_template || null,
      data.body_template,
      JSON.stringify(data.variables),
      data.is_active !== undefined ? data.is_active : true,
      data.created_by || null,
    ];

    try {
      const result = await this.pool.query(query, values);
      logger.info('Template created', { id: result.rows[0].id, name: data.name });
      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to create template', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async findById(id: string): Promise<NotificationTemplate | null> {
    const query = 'SELECT * FROM notification_templates WHERE id = $1';

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to find template by ID', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Get template by name
   */
  async findByName(name: string): Promise<NotificationTemplate | null> {
    const query = 'SELECT * FROM notification_templates WHERE name = $1';

    try {
      const result = await this.pool.query(query, [name]);
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to find template by name', { error: error.message, name });
      throw error;
    }
  }

  /**
   * Get all active templates
   */
  async findActive(): Promise<NotificationTemplate[]> {
    const query = `
      SELECT * FROM notification_templates 
      WHERE is_active = true 
      ORDER BY name ASC
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to find active templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Get templates by channel
   */
  async findByChannel(channel: string): Promise<NotificationTemplate[]> {
    const query = `
      SELECT * FROM notification_templates 
      WHERE channel = $1 AND is_active = true
      ORDER BY name ASC
    `;

    try {
      const result = await this.pool.query(query, [channel]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to find templates by channel', { error: error.message, channel });
      throw error;
    }
  }

  /**
   * Get templates by type
   */
  async findByType(type: string): Promise<NotificationTemplate[]> {
    const query = `
      SELECT * FROM notification_templates 
      WHERE type = $1 AND is_active = true
      ORDER BY name ASC
    `;

    try {
      const result = await this.pool.query(query, [type]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to find templates by type', { error: error.message, type });
      throw error;
    }
  }

  /**
   * Update template
   */
  async update(id: string, data: UpdateTemplateDto): Promise<NotificationTemplate | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.subject_template !== undefined) {
      fields.push(`subject_template = $${paramIndex++}`);
      values.push(data.subject_template);
    }
    if (data.body_template !== undefined) {
      fields.push(`body_template = $${paramIndex++}`);
      values.push(data.body_template);
    }
    if (data.variables !== undefined) {
      fields.push(`variables = $${paramIndex++}`);
      values.push(JSON.stringify(data.variables));
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
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
      UPDATE notification_templates 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      logger.info('Template updated', { id });
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to update template', { error: error.message, id, data });
      throw error;
    }
  }

  /**
   * Delete template
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM notification_templates WHERE id = $1';

    try {
      const result = await this.pool.query(query, [id]);
      const deleted = (result.rowCount && result.rowCount > 0) ? true : false;
      logger.info('Template deleted', { id, deleted });
      return deleted;
    } catch (error: any) {
      logger.error('Failed to delete template', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Toggle template active status
   */
  async toggleActive(id: string): Promise<NotificationTemplate | null> {
    const query = `
      UPDATE notification_templates 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [id]);
      logger.info('Template active status toggled', { id });
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to toggle template status', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Get all templates with pagination
   */
  async findAll(limit: number = 50, offset: number = 0): Promise<NotificationTemplate[]> {
    const query = `
      SELECT * FROM notification_templates 
      ORDER BY name ASC 
      LIMIT $1 OFFSET $2
    `;

    try {
      const result = await this.pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to find all templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Count all templates
   */
  async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM notification_templates';

    try {
      const result = await this.pool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error: any) {
      logger.error('Failed to count templates', { error: error.message });
      throw error;
    }
  }
}

export default TemplateRepository;

