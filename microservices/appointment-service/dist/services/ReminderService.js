"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const database_1 = require("../config/database");
class ReminderService {
    async createReminder(appointmentId, reminderType, hoursBeforeAppointment = 24) {
        const [appointments] = await database_1.pool.execute(`SELECT appointment_date, appointment_time FROM appointments WHERE id = ?`, [appointmentId]);
        if (appointments.length === 0) {
            throw new Error('Appointment not found');
        }
        const appointment = appointments[0];
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        const reminderTime = new Date(appointmentDateTime.getTime() - (hoursBeforeAppointment * 60 * 60 * 1000));
        const [result] = await database_1.pool.execute(`INSERT INTO appointment_reminders (appointment_id, reminder_type, scheduled_time, sent)
       VALUES (?, ?, ?, FALSE)`, [appointmentId, reminderType, reminderTime.toISOString()]);
        return {
            id: result.insertId,
            appointmentId,
            reminderType,
            scheduledTime: reminderTime.toISOString(),
            sent: false,
        };
    }
    async getPendingReminders() {
        const now = new Date().toISOString();
        const [reminders] = await database_1.pool.execute(`SELECT 
        r.*,
        a.patient_id,
        a.provider_id,
        a.appointment_date,
        a.appointment_time,
        a.reason,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        u.first_name as provider_first_name,
        u.last_name as provider_last_name
      FROM appointment_reminders r
      JOIN appointments a ON r.appointment_id = a.id
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      WHERE r.sent = FALSE
        AND r.scheduled_time <= ?
        AND a.status NOT IN ('cancelled', 'no-show', 'completed')
      ORDER BY r.scheduled_time ASC`, [now]);
        return reminders;
    }
    async markReminderSent(reminderId) {
        await database_1.pool.execute(`UPDATE appointment_reminders SET sent = TRUE, sent_at = NOW() WHERE id = ?`, [reminderId]);
    }
    async sendReminder(reminder) {
        console.log(`📧 Sending ${reminder.reminder_type} reminder for appointment ${reminder.appointment_id}`);
        console.log(`   To: ${reminder.patient_first_name} ${reminder.patient_last_name}`);
        console.log(`   Appointment: ${reminder.appointment_date} at ${reminder.appointment_time}`);
        console.log(`   Provider: Dr. ${reminder.provider_first_name} ${reminder.provider_last_name}`);
        await this.markReminderSent(reminder.id);
        return {
            success: true,
            reminderId: reminder.id,
            type: reminder.reminder_type,
        };
    }
    async processPendingReminders() {
        const reminders = await this.getPendingReminders();
        console.log(`📬 Processing ${reminders.length} pending reminders`);
        const results = [];
        for (const reminder of reminders) {
            try {
                const result = await this.sendReminder(reminder);
                results.push({ success: true, reminderId: reminder.id });
            }
            catch (error) {
                console.error(`Failed to send reminder ${reminder.id}:`, error.message);
                results.push({ success: false, reminderId: reminder.id, error: error.message });
            }
        }
        return results;
    }
    async scheduleRemindersForAppointment(appointmentId) {
        await this.createReminder(appointmentId, 'email', 24);
        const [appointments] = await database_1.pool.execute(`SELECT p.phone FROM appointments a 
       JOIN patients p ON a.patient_id = p.id 
       WHERE a.id = ?`, [appointmentId]);
        if (appointments.length > 0 && appointments[0].phone) {
            await this.createReminder(appointmentId, 'sms', 2);
        }
        return { success: true };
    }
}
exports.ReminderService = ReminderService;
exports.default = new ReminderService();
//# sourceMappingURL=ReminderService.js.map