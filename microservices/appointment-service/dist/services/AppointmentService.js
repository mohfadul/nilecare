"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
class AppointmentService {
    async getAppointments(params) {
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
        const queryParams = [];
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
        const countQuery = query.replace('SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name, u.first_name as provider_first_name, u.last_name as provider_last_name', 'SELECT COUNT(*) as total');
        const [countResult] = await database_1.pool.execute(countQuery, queryParams);
        const total = countResult[0].total;
        query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);
        const [appointments] = await database_1.pool.execute(query, queryParams);
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
    async getAppointmentById(id) {
        const [rows] = await database_1.pool.execute(`SELECT 
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
      WHERE a.id = ?`, [id]);
        const appointments = rows;
        if (appointments.length === 0) {
            throw new errorHandler_1.NotFoundError('Appointment not found');
        }
        return appointments[0];
    }
    async createAppointment(data) {
        const hasConflict = await this.checkAppointmentConflict(data.providerId, data.appointmentDate, data.appointmentTime, data.duration);
        if (hasConflict) {
            throw new errorHandler_1.ValidationError('Provider already has an appointment at this time');
        }
        const [result] = await database_1.pool.execute(`INSERT INTO appointments (
        patient_id, provider_id, appointment_date, appointment_time,
        duration, status, reason, notes
      ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?)`, [
            data.patientId,
            data.providerId,
            data.appointmentDate,
            data.appointmentTime,
            data.duration,
            data.reason || null,
            data.notes || null,
        ]);
        const insertId = result.insertId;
        return await this.getAppointmentById(insertId.toString());
    }
    async updateAppointment(id, data) {
        await this.getAppointmentById(id);
        if (data.provider_id || data.appointment_date || data.appointment_time) {
            const existing = await this.getAppointmentById(id);
            const providerId = data.provider_id || existing.provider_id;
            const appointmentDate = data.appointment_date || existing.appointment_date;
            const appointmentTime = data.appointment_time || existing.appointment_time;
            const duration = data.duration || existing.duration;
            const hasConflict = await this.checkAppointmentConflict(providerId, appointmentDate, appointmentTime, duration, id);
            if (hasConflict) {
                throw new errorHandler_1.ValidationError('Provider already has an appointment at this time');
            }
        }
        const updates = [];
        const params = [];
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
        await database_1.pool.execute(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, params);
        return await this.getAppointmentById(id);
    }
    async updateAppointmentStatus(id, status) {
        await this.getAppointmentById(id);
        await database_1.pool.execute('UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
        return await this.getAppointmentById(id);
    }
    async cancelAppointment(id) {
        return await this.updateAppointmentStatus(id, 'cancelled');
    }
    async checkAppointmentConflict(providerId, date, time, duration, excludeId) {
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
        const params = [
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
        const [rows] = await database_1.pool.execute(query, params);
        const count = rows[0].count;
        return count > 0;
    }
    async getTodayAppointments(providerId) {
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
        const params = [today];
        if (providerId) {
            query += ' AND a.provider_id = ?';
            params.push(providerId);
        }
        query += ' ORDER BY a.appointment_time ASC';
        const [appointments] = await database_1.pool.execute(query, params);
        return appointments;
    }
    async getUpcomingAppointments(patientId, limit = 5) {
        const today = new Date().toISOString().split('T')[0];
        const [appointments] = await database_1.pool.execute(`SELECT 
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
      LIMIT ?`, [patientId, today, limit]);
        return appointments;
    }
    async getAppointmentStats(params) {
        let query = 'SELECT status, COUNT(*) as count FROM appointments WHERE 1=1';
        const queryParams = [];
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
        const [stats] = await database_1.pool.execute(query, queryParams);
        return stats;
    }
}
exports.AppointmentService = AppointmentService;
exports.default = new AppointmentService();
//# sourceMappingURL=AppointmentService.js.map