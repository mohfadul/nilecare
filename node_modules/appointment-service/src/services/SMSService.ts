/**
 * SMS Service
 * Handles sending SMS messages via Twilio for appointment reminders
 */

import twilio from 'twilio';

export interface SMSOptions {
  to: string;
  message: string;
}

export class SMSService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Twilio client
   */
  private initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || null;

    // Only configure if credentials are provided
    if (accountSid && authToken && this.fromNumber) {
      try {
        this.client = twilio(accountSid, authToken);
        this.isConfigured = true;
        console.log('✅ SMS service configured');
      } catch (error: any) {
        console.warn('⚠️  SMS service not configured:', error.message);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️  SMS service not configured: Missing Twilio credentials');
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(options: SMSOptions): Promise<boolean> {
    if (!this.isConfigured || !this.client || !this.fromNumber) {
      console.log('📱 [SIMULATION] SMS would be sent:');
      console.log(`   To: ${options.to}`);
      console.log(`   Message: ${options.message}`);
      return true; // Simulate success in development
    }

    try {
      // Ensure phone number is in E.164 format (+249...)
      const formattedTo = this.formatPhoneNumber(options.to);

      const result = await this.client.messages.create({
        body: options.message,
        from: this.fromNumber,
        to: formattedTo,
      });

      console.log(`✅ SMS sent to ${options.to}: ${result.sid}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to send SMS to ${options.to}:`, error.message);
      return false;
    }
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If it starts with 0, replace with Sudan country code (+249)
    if (cleaned.startsWith('0')) {
      cleaned = '249' + cleaned.substring(1);
    }

    // If it doesn't start with country code, add it
    if (!cleaned.startsWith('249')) {
      cleaned = '249' + cleaned;
    }

    return '+' + cleaned;
  }

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminder(data: {
    patientName: string;
    patientPhone: string;
    appointmentDate: string;
    appointmentTime: string;
    providerName: string;
  }): Promise<boolean> {
    const message = `
NileCare Reminder: ${data.patientName}, you have an appointment on ${data.appointmentDate} at ${data.appointmentTime} with Dr. ${data.providerName}. Please arrive 15 minutes early.
    `.trim();

    return await this.sendSMS({
      to: data.patientPhone,
      message,
    });
  }

  /**
   * Send appointment confirmation SMS
   */
  async sendAppointmentConfirmation(data: {
    patientName: string;
    patientPhone: string;
    appointmentDate: string;
    appointmentTime: string;
  }): Promise<boolean> {
    const message = `NileCare: Your appointment on ${data.appointmentDate} at ${data.appointmentTime} is confirmed. Reply CANCEL to cancel.`;

    return await this.sendSMS({
      to: data.patientPhone,
      message,
    });
  }

  /**
   * Send appointment cancellation SMS
   */
  async sendAppointmentCancellation(data: {
    patientName: string;
    patientPhone: string;
    appointmentDate: string;
    appointmentTime: string;
  }): Promise<boolean> {
    const message = `NileCare: Your appointment on ${data.appointmentDate} at ${data.appointmentTime} has been cancelled. Call us to reschedule.`;

    return await this.sendSMS({
      to: data.patientPhone,
      message,
    });
  }

  /**
   * Verify SMS configuration
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

export default new SMSService();

