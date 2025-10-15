/**
 * Email Service
 * Handles sending emails for appointment reminders and notifications
 */

import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  private initialize() {
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    };

    // Only configure if credentials are provided
    if (smtpConfig.auth) {
      try {
        this.transporter = nodemailer.createTransport(smtpConfig);
        this.isConfigured = true;
        console.log('✅ Email service configured');
      } catch (error: any) {
        console.warn('⚠️  Email service not configured:', error.message);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️  Email service not configured: Missing SMTP credentials');
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 [SIMULATION] Email would be sent:');
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Content: ${options.text || 'HTML content'}`);
      return true; // Simulate success in development
    }

    try {
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'nilecare@example.com',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(`✅ Email sent to ${options.to}: ${result.messageId}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${options.to}:`, error.message);
      return false;
    }
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(data: {
    patientName: string;
    patientEmail: string;
    appointmentDate: string;
    appointmentTime: string;
    providerName: string;
    reason?: string;
  }): Promise<boolean> {
    const subject = 'Appointment Reminder - NileCare';
    
    const text = `
Dear ${data.patientName},

This is a reminder about your upcoming appointment:

Date: ${data.appointmentDate}
Time: ${data.appointmentTime}
Provider: ${data.providerName}
${data.reason ? `Reason: ${data.reason}` : ''}

Please arrive 15 minutes early for check-in.

If you need to cancel or reschedule, please contact us as soon as possible.

Thank you,
NileCare Healthcare Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
    .appointment-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
    .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 NileCare</h1>
    </div>
    <div class="content">
      <h2>Appointment Reminder</h2>
      <p>Dear ${data.patientName},</p>
      <p>This is a reminder about your upcoming appointment:</p>
      
      <div class="appointment-details">
        <p><strong>📅 Date:</strong> ${data.appointmentDate}</p>
        <p><strong>🕐 Time:</strong> ${data.appointmentTime}</p>
        <p><strong>👨‍⚕️ Provider:</strong> Dr. ${data.providerName}</p>
        ${data.reason ? `<p><strong>📋 Reason:</strong> ${data.reason}</p>` : ''}
      </div>
      
      <p>Please arrive 15 minutes early for check-in.</p>
      <p>If you need to cancel or reschedule, please contact us as soon as possible.</p>
    </div>
    <div class="footer">
      <p>Thank you for choosing NileCare</p>
      <p>&copy; 2025 NileCare Healthcare Platform</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({
      to: data.patientEmail,
      subject,
      text,
      html,
    });
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(data: {
    patientName: string;
    patientEmail: string;
    appointmentDate: string;
    appointmentTime: string;
    providerName: string;
  }): Promise<boolean> {
    const subject = 'Appointment Confirmed - NileCare';
    
    const text = `
Dear ${data.patientName},

Your appointment has been confirmed:

Date: ${data.appointmentDate}
Time: ${data.appointmentTime}
Provider: ${data.providerName}

You will receive a reminder before your appointment.

Thank you,
NileCare Healthcare Team
    `.trim();

    return await this.sendEmail({
      to: data.patientEmail,
      subject,
      text,
    });
  }

  /**
   * Send appointment cancellation email
   */
  async sendAppointmentCancellation(data: {
    patientName: string;
    patientEmail: string;
    appointmentDate: string;
    appointmentTime: string;
  }): Promise<boolean> {
    const subject = 'Appointment Cancelled - NileCare';
    
    const text = `
Dear ${data.patientName},

Your appointment on ${data.appointmentDate} at ${data.appointmentTime} has been cancelled.

If you would like to reschedule, please contact us.

Thank you,
NileCare Healthcare Team
    `.trim();

    return await this.sendEmail({
      to: data.patientEmail,
      subject,
      text,
    });
  }

  /**
   * Verify email configuration
   */
  async verify(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error: any) {
      console.error('Email service verification failed:', error.message);
      return false;
    }
  }
}

export default new EmailService();

