/**
 * Email Service
 * Send emails via SMTP/SendGrid
 */

import { logger } from '../utils/logger';
import { getEmailTransporter, getEmailConfig } from '../config/email.config';

export interface EmailData {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: any[];
}

export class EmailService {
  constructor() {
    logger.info('EmailService initialized');
  }

  /**
   * Send email
   */
  async sendEmail(emailData: EmailData): Promise<any> {
    try {
      const transporter = getEmailTransporter();
      const config = getEmailConfig();

      const mailOptions = {
        from: emailData.from || `${config.from.name} <${config.from.email}>`,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.subject,
        text: emailData.body,
        html: emailData.html || emailData.body,
        cc: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc.join(', ') : emailData.cc) : undefined,
        bcc: emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc.join(', ') : emailData.bcc) : undefined,
        replyTo: emailData.replyTo,
        attachments: emailData.attachments,
      };

      logger.info('Sending email', { 
        to: mailOptions.to,
        subject: mailOptions.subject 
      });

      const result = await transporter.sendMail(mailOptions);

      logger.info('✅ Email sent successfully', {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
      });

      return {
        success: true,
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
      };
    } catch (error: any) {
      logger.error('❌ Failed to send email', {
        error: error.message,
        to: emailData.to,
        subject: emailData.subject,
      });
      throw error;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulk(emails: EmailData[]): Promise<any> {
    logger.info('Sending bulk emails', { count: emails.length });

    const results = {
      total: emails.length,
      sent: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const email of emails) {
      try {
        await this.sendEmail(email);
        results.sent++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          to: email.to,
          error: error.message,
        });
      }
    }

    logger.info('Bulk email sending complete', results);
    return results;
  }

  /**
   * Verify email configuration
   */
  async verify(): Promise<boolean> {
    try {
      const transporter = getEmailTransporter();
      await transporter.verify();
      logger.info('✅ Email configuration verified');
      return true;
    } catch (error: any) {
      logger.error('❌ Email configuration verification failed', { error: error.message });
      return false;
    }
  }
}

export default EmailService;

