import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { FacilitySettings, CreateFacilitySettingsDTO, UpdateFacilitySettingsDTO } from '../models/FacilitySettings';
import { NotFoundError } from '../middleware/errorHandler';
import { cache } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Settings Service
 * Business logic for facility settings management
 */

export class SettingsService {
  private pool: Pool;

  constructor() {
    this.pool = getPostgreSQLPool();
  }

  /**
   * Create facility settings
   */
  async createSettings(dto: CreateFacilitySettingsDTO, user: any): Promise<FacilitySettings> {
    const settingsId = uuidv4();

    // Set default values
    const defaults = {
      timezone: 'Africa/Khartoum', // Sudan timezone
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h' as '24h',
      language: 'en',
      currency: 'SDG', // Sudanese Pound
      defaultAppointmentDuration: 30,
      allowWalkIns: true,
      maxAdvanceBookingDays: 90,
      cancellationNoticePeriod: 24,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: true,
      appointmentReminderHours: [24, 2], // 24 hours and 2 hours before
      automaticBedRelease: false,
      bedCleaningDuration: 30,
      requireInsurance: false,
      requireReferral: false,
      allowOnlineBooking: true,
    };

    const query = `
      INSERT INTO facility_settings (
        settings_id, facility_id, timezone, date_format, time_format,
        language, currency, default_appointment_duration, allow_walk_ins,
        max_advance_booking_days, cancellation_notice_period,
        email_notifications_enabled, sms_notifications_enabled,
        appointment_reminder_hours, automatic_bed_release, bed_cleaning_duration,
        require_insurance, require_referral, allow_online_booking,
        custom_settings, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      settingsId,
      dto.facilityId,
      dto.timezone || defaults.timezone,
      dto.dateFormat || defaults.dateFormat,
      dto.timeFormat || defaults.timeFormat,
      dto.language || defaults.language,
      dto.currency || defaults.currency,
      dto.defaultAppointmentDuration || defaults.defaultAppointmentDuration,
      dto.allowWalkIns !== undefined ? dto.allowWalkIns : defaults.allowWalkIns,
      dto.maxAdvanceBookingDays || defaults.maxAdvanceBookingDays,
      defaults.cancellationNoticePeriod,
      defaults.emailNotificationsEnabled,
      defaults.smsNotificationsEnabled,
      JSON.stringify(defaults.appointmentReminderHours),
      defaults.automaticBedRelease,
      defaults.bedCleaningDuration,
      defaults.requireInsurance,
      defaults.requireReferral,
      defaults.allowOnlineBooking,
      JSON.stringify({}),
      dto.createdBy,
    ]);

    return this.mapRowToSettings(result.rows[0]);
  }

  /**
   * Get settings by facility ID
   */
  async getSettingsByFacilityId(facilityId: string): Promise<FacilitySettings | null> {
    const cacheKey = `settings:facility:${facilityId}`;
    const cached = await cache.getJSON<FacilitySettings>(cacheKey);
    if (cached) return cached;

    const query = 'SELECT * FROM facility_settings WHERE facility_id = $1';
    const result = await this.pool.query(query, [facilityId]);

    if (result.rows.length === 0) {
      return null;
    }

    const settings = this.mapRowToSettings(result.rows[0]);

    // Cache for 10 minutes
    await cache.setJSON(cacheKey, settings, 600);

    return settings;
  }

  /**
   * Get settings or create with defaults
   */
  async getOrCreateSettings(facilityId: string, user: any): Promise<FacilitySettings> {
    let settings = await this.getSettingsByFacilityId(facilityId);

    if (!settings) {
      // Create with defaults
      settings = await this.createSettings({ facilityId, createdBy: user.userId }, user);
    }

    return settings;
  }

  /**
   * Update settings
   */
  async updateSettings(facilityId: string, dto: UpdateFacilitySettingsDTO, user: any): Promise<FacilitySettings> {
    const existing = await this.getSettingsByFacilityId(facilityId);

    if (!existing) {
      throw new NotFoundError(`Settings for facility ${facilityId} not found`);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.timezone) {
      updates.push(`timezone = $${paramIndex++}`);
      values.push(dto.timezone);
    }
    if (dto.dateFormat) {
      updates.push(`date_format = $${paramIndex++}`);
      values.push(dto.dateFormat);
    }
    if (dto.timeFormat) {
      updates.push(`time_format = $${paramIndex++}`);
      values.push(dto.timeFormat);
    }
    if (dto.language) {
      updates.push(`language = $${paramIndex++}`);
      values.push(dto.language);
    }
    if (dto.currency) {
      updates.push(`currency = $${paramIndex++}`);
      values.push(dto.currency);
    }
    if (dto.defaultAppointmentDuration !== undefined) {
      updates.push(`default_appointment_duration = $${paramIndex++}`);
      values.push(dto.defaultAppointmentDuration);
    }
    if (dto.allowWalkIns !== undefined) {
      updates.push(`allow_walk_ins = $${paramIndex++}`);
      values.push(dto.allowWalkIns);
    }
    if (dto.maxAdvanceBookingDays !== undefined) {
      updates.push(`max_advance_booking_days = $${paramIndex++}`);
      values.push(dto.maxAdvanceBookingDays);
    }
    if (dto.cancellationNoticePeriod !== undefined) {
      updates.push(`cancellation_notice_period = $${paramIndex++}`);
      values.push(dto.cancellationNoticePeriod);
    }
    if (dto.emailNotificationsEnabled !== undefined) {
      updates.push(`email_notifications_enabled = $${paramIndex++}`);
      values.push(dto.emailNotificationsEnabled);
    }
    if (dto.smsNotificationsEnabled !== undefined) {
      updates.push(`sms_notifications_enabled = $${paramIndex++}`);
      values.push(dto.smsNotificationsEnabled);
    }
    if (dto.appointmentReminderHours) {
      updates.push(`appointment_reminder_hours = $${paramIndex++}`);
      values.push(JSON.stringify(dto.appointmentReminderHours));
    }
    if (dto.automaticBedRelease !== undefined) {
      updates.push(`automatic_bed_release = $${paramIndex++}`);
      values.push(dto.automaticBedRelease);
    }
    if (dto.bedCleaningDuration !== undefined) {
      updates.push(`bed_cleaning_duration = $${paramIndex++}`);
      values.push(dto.bedCleaningDuration);
    }
    if (dto.requireInsurance !== undefined) {
      updates.push(`require_insurance = $${paramIndex++}`);
      values.push(dto.requireInsurance);
    }
    if (dto.requireReferral !== undefined) {
      updates.push(`require_referral = $${paramIndex++}`);
      values.push(dto.requireReferral);
    }
    if (dto.allowOnlineBooking !== undefined) {
      updates.push(`allow_online_booking = $${paramIndex++}`);
      values.push(dto.allowOnlineBooking);
    }
    if (dto.customSettings) {
      updates.push(`custom_settings = $${paramIndex++}`);
      values.push(JSON.stringify(dto.customSettings));
    }
    if (dto.updatedBy) {
      updates.push(`updated_by = $${paramIndex++}`);
      values.push(dto.updatedBy);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = NOW()');

    const query = `
      UPDATE facility_settings 
      SET ${updates.join(', ')} 
      WHERE facility_id = $${paramIndex}
      RETURNING *
    `;
    values.push(facilityId);

    const result = await this.pool.query(query, values);

    // Clear cache
    await cache.del(`settings:facility:${facilityId}`);

    return this.mapRowToSettings(result.rows[0]);
  }

  /**
   * Map database row to Settings object
   */
  private mapRowToSettings(row: any): FacilitySettings {
    return {
      id: row.id,
      settingsId: row.settings_id,
      facilityId: row.facility_id,
      timezone: row.timezone,
      dateFormat: row.date_format,
      timeFormat: row.time_format,
      language: row.language,
      currency: row.currency,
      defaultAppointmentDuration: row.default_appointment_duration,
      allowWalkIns: row.allow_walk_ins,
      maxAdvanceBookingDays: row.max_advance_booking_days,
      cancellationNoticePeriod: row.cancellation_notice_period,
      emailNotificationsEnabled: row.email_notifications_enabled,
      smsNotificationsEnabled: row.sms_notifications_enabled,
      appointmentReminderHours: typeof row.appointment_reminder_hours === 'string' 
        ? JSON.parse(row.appointment_reminder_hours) 
        : row.appointment_reminder_hours,
      automaticBedRelease: row.automatic_bed_release,
      bedCleaningDuration: row.bed_cleaning_duration,
      requireInsurance: row.require_insurance,
      requireReferral: row.require_referral,
      allowOnlineBooking: row.allow_online_booking,
      customSettings: typeof row.custom_settings === 'string' 
        ? JSON.parse(row.custom_settings) 
        : row.custom_settings,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default SettingsService;

