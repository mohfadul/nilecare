/**
 * Email Service
 * 
 * Handles sending emails via SMTP
 * Used for verification emails, password resets, notifications
 */

import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.FEATURE_EMAIL_ENABLED !== 'false';
    
    if (this.enabled) {
      this.initializeTransporter();
    } else {
      logger.warn('Email service is disabled (FEATURE_EMAIL_ENABLED=false)');
    }
  }

  /**
   * Initialize email transporter
   */
  private initializeTransporter() {
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;

      if (!smtpHost || !smtpUser || !smtpPassword) {
        logger.warn('SMTP configuration incomplete - email sending disabled');
        this.enabled = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          logger.error('Email transporter verification failed', { error: error.message });
          this.enabled = false;
        } else {
          logger.info('✅ Email transporter ready', {
            host: smtpHost,
            port: process.env.SMTP_PORT,
            user: smtpUser,
          });
        }
      });
    } catch (error: any) {
      logger.error('Failed to initialize email transporter', { error: error.message });
      this.enabled = false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      logger.warn('Email sending skipped - service disabled', {
        to: this.maskEmail(options.to),
        subject: options.subject,
      });
      return false;
    }

    try {
      const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@nilecare.sd';
      const fromName = process.env.SMTP_FROM_NAME || 'NileCare Healthcare';

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to: this.maskEmail(options.to),
        subject: options.subject,
        messageId: info.messageId,
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to send email', {
        to: this.maskEmail(options.to),
        subject: options.subject,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, firstName: string, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    const html = this.getVerificationEmailTemplate(firstName, verificationUrl);
    const subject = 'Verify Your NileCare Account';

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const html = this.getPasswordResetTemplate(firstName, resetUrl);
    const subject = 'Reset Your NileCare Password';

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send welcome email (after verification)
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const html = this.getWelcomeEmailTemplate(firstName);
    const subject = 'Welcome to NileCare Healthcare';

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Verification email template
   */
  private getVerificationEmailTemplate(firstName: string, verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 30px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 NileCare Healthcare</h1>
    </div>
    <div class="content">
      <h2>Welcome ${firstName}!</h2>
      <p>Thank you for registering with NileCare Healthcare. To complete your registration and activate your account, please verify your email address.</p>
      
      <p style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </p>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
        ${verificationUrl}
      </p>
      
      <div class="warning">
        <strong>⚠️ Security Notice:</strong>
        <ul>
          <li>This verification link will expire in 24 hours</li>
          <li>If you didn't create this account, please ignore this email</li>
          <li>Never share this link with anyone</li>
        </ul>
      </div>
      
      <p>If you have any questions, please contact our support team.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NileCare Healthcare. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Password reset email template
   */
  private getPasswordResetTemplate(firstName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 30px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .warning { background: #ffebee; border-left: 4px solid #f44336; padding: 10px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Hello ${firstName},</h2>
      <p>We received a request to reset your NileCare account password.</p>
      
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      
      <div class="warning">
        <strong>⚠️ Important:</strong>
        <ul>
          <li>This link expires in 1 hour</li>
          <li>If you didn't request this, please ignore this email</li>
          <li>Your password will not change unless you click the link above</li>
        </ul>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(firstName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Email Verified!</h1>
    </div>
    <div class="content">
      <h2>Welcome to NileCare, ${firstName}!</h2>
      <p>Your email has been successfully verified. Your account is now fully activated.</p>
      <p>You can now access all features of the NileCare Healthcare platform.</p>
      <p>Thank you for choosing NileCare!</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Mask email for logging
   */
  private maskEmail(email: string): string {
    if (!email) return '***';
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***';
    
    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : '***';
    
    return `${maskedLocal}@${domain}`;
  }
}

export default EmailService;
