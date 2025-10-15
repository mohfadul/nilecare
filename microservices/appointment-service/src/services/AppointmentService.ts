/**
 * Appointment Service
 * Business logic for appointment management
 */

import { pool } from '../config/database';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  status: string;
  reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export class AppointmentService {
  /**
   * Get all appointments with pagination
   */
  async getAppointments(params: {
    page?: number;
    limit?: number;
    status?: string;
    providerId?: string;
    patientId?: string;
    date?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        u.first_name as provider_first_name,
        u.last_name as provider_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (params.status) {
      query += ' AND a.status = ?';
      queryParams.push(params.status);
    }

    if (params.providerId) {
      query += ' AND a.provider_id = ?';
      queryParams.push(params.providerId);
    }

    if (params.patientId) {
      query += ' AND a.patient_id = ?';
      queryParams.push(params.patientId);
    }

    if (params.date) {
      query += ' AND a.appointment_date = ?';
      queryParams.push(params.date);
    }

    // Get total count
    const countQuery = query.replace(
      'SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name, u.first_name as provider_first_name, u.last_name as provider_last_name',
      'SELECT COUNT(*) as total'
    );
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = (countResult as any[])[0].total;

    // Get paginated results
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [appointments] = await pool.execute(query, queryParams);

    return {
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(id: string) {
    const [rows] = await pool.execute(
      `SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email,
        u.first_name as provider_first_name,
        u.last_name as provider_last_name,
        u.specialty as provider_specialty
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      WHERE a.id = ?`,
      [id]
    );

    const appointments = rows as any[];
    if (appointments.length === 0) {
      throw new NotFoundError('Appointment not found');
    }

    return appointments[0];
  }

  /**
   * Create new appointment
   */
  async createAppointment(data: {
    patientId: string;
    providerId: string;
    appointmentDate: string;
    appointmentTime: string;
    duration: number;
    reason?: string;
    notes?: string;
  }) {
    // Check for conflicts
    const hasConflict = await this.checkAppointmentConflict(
      data.providerId,
      data.appointmentDate,
      data.appointmentTime,
      data.duration
    );

    if (hasConflict) {
      throw new ValidationError('Provider already has an appointment at this time');
    }

    const [result] = await pool.execute(
      `INSERT INTO appointments (
        patient_id, provider_id, appointment_date, appointment_time,
        duration, status, reason, notes
      ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
      [
        data.patientId,
        data.providerId,
        data.appointmentDate,
        data.appointmentTime,
        data.duration,
        data.reason || null,
        data.notes || null,
      ]
    );

    const insertId = (result as any).insertId;
    return await this.getAppointmentById(insertId.toString());
  }

  /**
   * Update appointment
   */
  async updateAppointment(id: string, data: Partial<Appointment>) {
    // Check if appointment exists
    await this.getAppointmentById(id);

    // If changing time/provider, check for conflicts
    if (data.provider_id || data.appointment_date || data.appointment_time) {
      const existing = await this.getAppointmentById(id);
      const providerId = data.provider_id || existing.provider_id;
      const appointmentDate = data.appointment_date || existing.appointment_date;
      const appointmentTime = data.appointment_time || existing.appointment_time;
      const duration = data.duration || existing.duration;

      const hasConflict = await this.checkAppointmentConflict(
        providerId,
        appointmentDate,
        appointmentTime,
        duration,
        id
      );

      if (hasConflict) {
        throw new ValidationError('Provider already has an appointment at this time');
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) {
      return await this.getAppointmentById(id);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return await this.getAppointmentById(id);
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(id: string, status: string) {
    await this.getAppointmentById(id);

    await pool.execute(
      'UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    return await this.getAppointmentById(id);
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string) {
    return await this.updateAppointmentStatus(id, 'cancelled');
  }

  /**
   * Check for appointment conflicts
   */
  async checkAppointmentConflict(
    providerId: string,
    date: string,
    time: string,
    duration: number,
    excludeId?: string
  ): Promise<boolean> {
    let query = `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE provider_id = ?
        AND appointment_date = ?
        AND status NOT IN ('cancelled', 'no-show')
        AND (
          (appointment_time <= ? AND DATE_ADD(CONCAT(appointment_date, ' ', appointment_time), INTERVAL duration MINUTE) > ?)
          OR
          (appointment_time < DATE_ADD(?, INTERVAL ? MINUTE) AND appointment_time >= ?)
        )
    `;

    const params: any[] = [
      providerId,
      date,
      time,
      time,
      time,
      duration,
      time,
    ];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.execute(query, params);
    const count = (rows as any[])[0].count;

    return count > 0;
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(providerId?: string) {
    const today = new Date().toISOString().split('T')[0];

    let query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        u.first_name as provider_first_name,
        u.last_name as provider_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      WHERE a.appointment_date = ?
        AND a.status NOT IN ('cancelled', 'no-show')
    `;

    const params: any[] = [today];

    if (providerId) {
      query += ' AND a.provider_id = ?';
      params.push(providerId);
    }

    query += ' ORDER BY a.appointment_time ASC';

    const [appointments] = await pool.execute(query, params);
    return appointments;
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(patientId: string, limit: number = 5) {
    const today = new Date().toISOString().split('T')[0];

    const [appointments] = await pool.execute(
      `SELECT 
        a.*,
        u.first_name as provider_first_name,
        u.last_name as provider_last_name,
        u.specialty as provider_specialty
      FROM appointments a
      JOIN users u ON a.provider_id = u.id
      WHERE a.patient_id = ?
        AND a.appointment_date >= ?
        AND a.status NOT IN ('cancelled', 'no-show', 'completed')
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT ?`,
      [patientId, today, limit]
    );

    return appointments;
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(params?: {
    dateFrom?: string;
    dateTo?: string;
    providerId?: string;
  }) {
    let query = 'SELECT status, COUNT(*) as count FROM appointments WHERE 1=1';
    const queryParams: any[] = [];

    if (params?.dateFrom) {
      query += ' AND appointment_date >= ?';
      queryParams.push(params.dateFrom);
    }

    if (params?.dateTo) {
      query += ' AND appointment_date <= ?';
      queryParams.push(params.dateTo);
    }

    if (params?.providerId) {
      query += ' AND provider_id = ?';
      queryParams.push(params.providerId);
    }

    query += ' GROUP BY status';

    const [stats] = await pool.execute(query, queryParams);
    return stats;
  }
}

export default new AppointmentService();

