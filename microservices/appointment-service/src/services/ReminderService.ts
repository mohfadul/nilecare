/**
 * Reminder Service
 * Manages appointment reminders and notifications
 */

import { pool } from '../config/database';
import EmailService from './EmailService';
import SMSService from './SMSService';

export interface Reminder {
  id: string;
  appointment_id: string;
  reminder_type: 'email' | 'sms' | 'push';
  scheduled_time: string;
  sent: boolean;
  sent_at?: string;
  created_at?: string;
}

export class ReminderService {
  /**
   * Create reminder for appointment
   */
  async createReminder(
    appointmentId: string,
    reminderType: 'email' | 'sms' | 'push',
    hoursBeforeAppointment: number = 24
  ) {
    // Get appointment details
    const [appointments] = await pool.execute(
      `SELECT appointment_date, appointment_time FROM appointments WHERE id = ?`,
      [appointmentId]
    );

    if ((appointments as any[]).length === 0) {
      throw new Error('Appointment not found');
    }

    const appointment = (appointments as any[])[0];
    
    // Calculate reminder time
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const reminderTime = new Date(appointmentDateTime.getTime() - (hoursBeforeAppointment * 60 * 60 * 1000));

    const [result] = await pool.execute(
      `INSERT INTO appointment_reminders (appointment_id, reminder_type, scheduled_time, sent)
       VALUES (?, ?, ?, FALSE)`,
      [appointmentId, reminderType, reminderTime.toISOString()]
    );

    return {
      id: (result as any).insertId,
      appointmentId,
      reminderType,
      scheduledTime: reminderTime.toISOString(),
      sent: false,
    };
  }

  /**
   * Get pending reminders (ready to send)
   */
  async getPendingReminders() {
    const now = new Date().toISOString();

    const [reminders] = await pool.execute(
      `SELECT 
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
      ORDER BY r.scheduled_time ASC`,
      [now]
    );

    return reminders;
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(reminderId: string) {
    await pool.execute(
      `UPDATE appointment_reminders SET sent = TRUE, sent_at = NOW() WHERE id = ?`,
      [reminderId]
    );
  }

  /**
   * Send reminder via appropriate channel (email/SMS/push)
   */
  async sendReminder(reminder: any) {
    console.log(`📧 Sending ${reminder.reminder_type} reminder for appointment ${reminder.appointment_id}`);
    console.log(`   To: ${reminder.patient_first_name} ${reminder.patient_last_name}`);
    console.log(`   Appointment: ${reminder.appointment_date} at ${reminder.appointment_time}`);
    console.log(`   Provider: Dr. ${reminder.provider_first_name} ${reminder.provider_last_name}`);

    let success = false;

    try {
      // Send based on reminder type
      switch (reminder.reminder_type) {
        case 'email':
          if (reminder.patient_email) {
            success = await EmailService.sendAppointmentReminder({
              patientName: `${reminder.patient_first_name} ${reminder.patient_last_name}`,
              patientEmail: reminder.patient_email,
              appointmentDate: reminder.appointment_date,
              appointmentTime: reminder.appointment_time,
              providerName: `${reminder.provider_first_name} ${reminder.provider_last_name}`,
              reason: reminder.reason,
            });
          } else {
            console.warn(`No email address for patient ${reminder.patient_id}`);
            success = false;
          }
          break;

        case 'sms':
          if (reminder.patient_phone) {
            success = await SMSService.sendAppointmentReminder({
              patientName: `${reminder.patient_first_name} ${reminder.patient_last_name}`,
              patientPhone: reminder.patient_phone,
              appointmentDate: reminder.appointment_date,
              appointmentTime: reminder.appointment_time,
              providerName: `${reminder.provider_first_name} ${reminder.provider_last_name}`,
            });
          } else {
            console.warn(`No phone number for patient ${reminder.patient_id}`);
            success = false;
          }
          break;

        case 'push':
          // TODO: Implement Firebase push notifications
          console.log('📱 Push notification not yet implemented');
          success = true; // Simulate success for now
          break;

        default:
          console.warn(`Unknown reminder type: ${reminder.reminder_type}`);
          success = false;
      }

      if (success) {
        await this.markReminderSent(reminder.id);
      }

      return {
        success,
        reminderId: reminder.id,
        type: reminder.reminder_type,
      };
    } catch (error: any) {
      console.error(`Failed to send ${reminder.reminder_type} reminder:`, error.message);
      return {
        success: false,
        reminderId: reminder.id,
        type: reminder.reminder_type,
        error: error.message,
      };
    }
  }

  /**
   * Process all pending reminders
   */
  async processPendingReminders() {
    const reminders = await this.getPendingReminders();
    console.log(`📬 Processing ${(reminders as any[]).length} pending reminders`);

    const results = [];
    for (const reminder of reminders as any[]) {
      try {
        const result = await this.sendReminder(reminder);
        results.push({ success: true, reminderId: reminder.id });
      } catch (error: any) {
        console.error(`Failed to send reminder ${reminder.id}:`, error.message);
        results.push({ success: false, reminderId: reminder.id, error: error.message });
      }
    }

    return results;
  }

  /**
   * Schedule reminders for appointment
   */
  async scheduleRemindersForAppointment(appointmentId: string) {
    // Schedule 24-hour reminder
    await this.createReminder(appointmentId, 'email', 24);
    
    // Schedule 2-hour reminder (if patient has phone)
    const [appointments] = await pool.execute(
      `SELECT p.phone FROM appointments a 
       JOIN patients p ON a.patient_id = p.id 
       WHERE a.id = ?`,
      [appointmentId]
    );

    if ((appointments as any[]).length > 0 && (appointments as any[])[0].phone) {
      await this.createReminder(appointmentId, 'sms', 2);
    }

    return { success: true };
  }
}

export default new ReminderService();

