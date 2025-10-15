import type mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { 
  Appointment, 
  AppointmentQuery, 
  PaginationResult,
  TimeSlot,
  AppointmentStatus 
} from '../types';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AppointmentService {
  constructor(private db: mysql.Pool) {}

  async getAllAppointments(
    query: AppointmentQuery,
    organizationId: string
  ): Promise<PaginationResult<Appointment>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    // Skip organization filter if table doesn't have organization_id column
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (query.patientId) {
      whereClause += ` AND patient_id = ?`;
      params.push(query.patientId);
    }

    if (query.providerId) {
      whereClause += ` AND provider_id = ?`;
      params.push(query.providerId);
    }

    if (query.status) {
      whereClause += ` AND status = ?`;
      params.push(query.status);
    }

    if (query.date) {
      whereClause += ` AND DATE(appointment_date) = ?`;
      params.push(query.date);
    }

    if (query.startDate && query.endDate) {
      whereClause += ` AND appointment_date BETWEEN ? AND ?`;
      params.push(query.startDate, query.endDate);
    }

    if (query.appointmentType) {
      whereClause += ` AND appointment_type = ?`;
      params.push(query.appointmentType);
    }

    if (query.priority) {
      whereClause += ` AND priority = ?`;
      params.push(query.priority);
    }

    try {
      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM appointments ${whereClause}`;
      const [countRows] = await this.db.query(countQuery, params) as any;
      const total = parseInt(countRows[0].count);

      // Get paginated data
      const dataQuery = `
        SELECT * FROM appointments 
        ${whereClause}
        ORDER BY appointment_date DESC
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
      logger.error('Error fetching appointments:', error);
      throw error;
    }
  }

  async getAppointmentById(id: string, organizationId: string): Promise<Appointment> {
    try {
      const [rows] = await this.db.query(
        'SELECT * FROM appointments WHERE id = ?',
        [id]
      ) as any;

      if (rows.length === 0) {
        throw new NotFoundError('Appointment not found');
      }

      return rows[0];
    } catch (error: any) {
      logger.error('Error fetching appointment:', error);
      throw error;
    }
  }

  async createAppointment(
    data: Partial<Appointment>,
    organizationId: string,
    userId: string
  ): Promise<Appointment> {
    const id = uuidv4();
    
    // Check for conflicts
    await this.checkAppointmentConflicts(
      data.providerId!,
      new Date(data.appointmentDate!),
      data.duration!,
      organizationId
    );

    try {
      await this.db.query(
        `INSERT INTO appointments (
          id, patient_id, provider_id, appointment_date,
          appointment_type, duration, status, reason, notes, location,
          priority, reminder_sent, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.patientId,
          data.providerId,
          data.appointmentDate,
          data.appointmentType,
          data.duration,
          'scheduled',
          data.reason || null,
          data.notes || null,
          data.location || null,
          data.priority || 'routine',
          false,
          userId
        ]
      );

      logger.info(`Appointment created: ${id}`);
      
      // Fetch and return the created appointment
      return await this.getAppointmentById(id, organizationId);
    } catch (error: any) {
      logger.error('Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(
    id: string,
    data: Partial<Appointment>,
    organizationId: string,
    userId: string
  ): Promise<Appointment> {
    // Check if appointment exists
    await this.getAppointmentById(id, organizationId);

    const updates: string[] = [];
    const params: any[] = [];

    if (data.appointmentDate) {
      updates.push(`appointment_date = ?`);
      params.push(data.appointmentDate);
    }

    if (data.appointmentType) {
      updates.push(`appointment_type = ?`);
      params.push(data.appointmentType);
    }

    if (data.duration) {
      updates.push(`duration = ?`);
      params.push(data.duration);
    }

    if (data.status) {
      updates.push(`status = ?`);
      params.push(data.status);
    }

    if (data.reason !== undefined) {
      updates.push(`reason = ?`);
      params.push(data.reason);
    }

    if (data.notes !== undefined) {
      updates.push(`notes = ?`);
      params.push(data.notes);
    }

    if (data.location !== undefined) {
      updates.push(`location = ?`);
      params.push(data.location);
    }

    if (data.priority) {
      updates.push(`priority = ?`);
      params.push(data.priority);
    }

    if (updates.length === 0) {
      return await this.getAppointmentById(id, organizationId);
    }

    updates.push(`updated_by = ?`);
    params.push(userId);
    updates.push(`updated_at = NOW()`);

    // Add WHERE clause parameters
    params.push(id);

    try {
      await this.db.query(
        `UPDATE appointments SET ${updates.join(', ')} 
         WHERE id = ?`,
        params
      );

      logger.info(`Appointment updated: ${id}`);
      return await this.getAppointmentById(id, organizationId);
    } catch (error: any) {
      logger.error('Error updating appointment:', error);
      throw error;
    }
  }

  async cancelAppointment(
    id: string,
    organizationId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    await this.getAppointmentById(id, organizationId);

    try {
      await this.db.query(
        `UPDATE appointments 
         SET status = ?, notes = ?, updated_by = ?, updated_at = NOW()
         WHERE id = ?`,
        ['cancelled', reason || null, userId, id]
      );

      logger.info(`Appointment cancelled: ${id}`);
    } catch (error: any) {
      logger.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  async confirmAppointment(
    id: string,
    organizationId: string,
    userId: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id, organizationId);

    if (appointment.status !== 'scheduled') {
      throw new BadRequestError('Only scheduled appointments can be confirmed');
    }

    return this.updateAppointment(id, { status: 'confirmed' }, organizationId, userId);
  }

  async completeAppointment(
    id: string,
    organizationId: string,
    userId: string,
    notes?: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id, organizationId);

    if (!['confirmed', 'in-progress'].includes(appointment.status)) {
      throw new BadRequestError('Only confirmed or in-progress appointments can be completed');
    }

    return this.updateAppointment(
      id, 
      { status: 'completed', notes: notes || appointment.notes },
      organizationId,
      userId
    );
  }

  async getProviderAvailability(
    providerId: string,
    date: Date,
    duration: number = 30
  ): Promise<TimeSlot[]> {
    try {
      // Get existing appointments for the provider on this date
      const [rows] = await this.db.query(
        `SELECT appointment_date, duration 
         FROM appointments 
         WHERE provider_id = ? 
         AND DATE(appointment_date) = DATE(?)
         AND status NOT IN ('cancelled', 'no-show')
         ORDER BY appointment_date`,
        [providerId, date]
      ) as any;

      // Define working hours (8 AM to 6 PM)
      const startHour = 8;
      const endHour = 18;
      const slots: TimeSlot[] = [];

      // Generate time slots
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += duration) {
          const slotStart = new Date(date);
          slotStart.setHours(hour, minute, 0, 0);
          
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + duration);

          // Check if this slot conflicts with any existing appointment
          const hasConflict = rows.some((appt: any) => {
            const apptStart = new Date(appt.appointment_date);
            const apptEnd = new Date(apptStart);
            apptEnd.setMinutes(apptEnd.getMinutes() + appt.duration);

            return (slotStart < apptEnd && slotEnd > apptStart);
          });

          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            available: !hasConflict
          });
        }
      }

      return slots;
    } catch (error: any) {
      logger.error('Error fetching provider availability:', error);
      throw error;
    }
  }

  private async checkAppointmentConflicts(
    providerId: string,
    appointmentDate: Date,
    duration: number,
    organizationId: string
  ): Promise<void> {
    const endTime = new Date(appointmentDate);
    endTime.setMinutes(endTime.getMinutes() + duration);

    // MySQL syntax for time interval checking
    const [rows] = await this.db.query(
      `SELECT id FROM appointments 
       WHERE provider_id = ?
       AND status NOT IN ('cancelled', 'no-show')
       AND (
         (appointment_date < ? AND DATE_ADD(appointment_date, INTERVAL duration MINUTE) > ?)
         OR (appointment_date >= ? AND appointment_date < ?)
       )`,
      [providerId, organizationId, endTime, appointmentDate, appointmentDate, endTime]
    ) as any;

    if (rows.length > 0) {
      throw new ConflictError('Provider already has an appointment at this time');
    }
  }
}
