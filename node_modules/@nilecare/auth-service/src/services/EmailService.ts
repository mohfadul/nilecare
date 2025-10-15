import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

/**
 * Email Service
 * Handles all email notifications for the auth service
 * 
 * Supports:
 * - Password reset emails
 * - Email verification
 * - Welcome emails
 * - Security alerts
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  private initializeTransporter(): void {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    // Email is optional - service works without it
    if (!smtpHost || !smtpUser || !smtpPassword) {
      logger.warn('Email service not configured - emails will not be sent');
      logger.info('To enable emails, set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPassword
        }
      });

      this.isConfigured = true;
      logger.info('✅ Email service configured successfully');
    } catch (error: any) {
      logger.error('Failed to configure email service', {
        error: error.message
      });
      this.isConfigured = false;
    }
  }

  /**
   * Send email
   */
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn('Email not sent - service not configured', {
        to: options.to,
        subject: options.subject
      });
      return false;
    }

    try {
      const from = process.env.EMAIL_FROM || 'noreply@nilecare.sd';

      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      });

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    username: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const subject = 'Reset Your NileCare Password';
    
    const text = `
Hello ${username},

We received a request to reset your password for your NileCare account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email and your password will remain unchanged.

For security reasons, never share this link with anyone.

Best regards,
The NileCare Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 NileCare Password Reset</h1>
    </div>
    <div class="content">
      <h2>Hello ${username},</h2>
      <p>We received a request to reset your password for your NileCare account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p style="color: #666; font-size: 14px;">Or copy this link: ${resetUrl}</p>
      <div class="warning">
        <strong>⚠️ Security Notice:</strong>
        <ul>
          <li>This link will expire in 1 hour</li>
          <li>Never share this link with anyone</li>
          <li>If you didn't request this, ignore this email</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>© 2025 NileCare Healthcare Platform | Sudan</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Send email verification email
   */
  async sendEmailVerification(
    email: string,
    username: string,
    verificationToken: string
  ): Promise<boolean> {
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    const subject = 'Verify Your NileCare Email Address';
    
    const text = `
Hello ${username},

Thank you for registering with NileCare!

Please verify your email address by clicking the link below:
${verifyUrl}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
The NileCare Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ Verify Your Email</h1>
    </div>
    <div class="content">
      <h2>Welcome to NileCare, ${username}!</h2>
      <p>Thank you for joining the NileCare Healthcare Platform.</p>
      <p>Please verify your email address to complete your registration:</p>
      <div style="text-align: center;">
        <a href="${verifyUrl}" class="button">Verify Email Address</a>
      </div>
      <p style="color: #666; font-size: 14px;">Or copy this link: ${verifyUrl}</p>
      <p><strong>This link will expire in 24 hours.</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 NileCare Healthcare Platform | Sudan</p>
      <p>If you didn't create this account, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Send welcome email after registration
   */
  async sendWelcomeEmail(
    email: string,
    username: string,
    role: string
  ): Promise<boolean> {
    const subject = 'Welcome to NileCare Healthcare Platform';
    
    const text = `
Hello ${username},

Welcome to NileCare Healthcare Platform!

Your account has been successfully created with the role: ${role}

You can now access the platform at: ${process.env.CLIENT_URL || 'http://localhost:5173'}

If you have any questions or need assistance, please contact our support team.

Best regards,
The NileCare Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .info-box { background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to NileCare!</h1>
    </div>
    <div class="content">
      <h2>Hello ${username},</h2>
      <p>Your NileCare account has been successfully created!</p>
      <div class="info-box">
        <strong>Account Details:</strong>
        <ul>
          <li>Email: ${email}</li>
          <li>Username: ${username}</li>
          <li>Role: ${role}</li>
        </ul>
      </div>
      <p>You can now access the platform:</p>
      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="button">Access NileCare</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2025 NileCare Healthcare Platform | Sudan</p>
      <p>Need help? Contact support@nilecare.sd</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(
    email: string,
    username: string,
    alertType: string,
    details: string
  ): Promise<boolean> {
    const subject = `Security Alert - ${alertType}`;
    
    const text = `
Hello ${username},

We detected the following security event on your NileCare account:

${alertType}
${details}

If this was you, no action is needed.

If you did not perform this action, please:
1. Change your password immediately
2. Review your account activity
3. Contact our security team

Best regards,
NileCare Security Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .alert-box { background: #fecaca; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Security Alert</h1>
    </div>
    <div class="content">
      <h2>Hello ${username},</h2>
      <div class="alert-box">
        <strong>⚠️ ${alertType}</strong>
        <p>${details}</p>
      </div>
      <p><strong>If this was you:</strong> No action needed.</p>
      <p><strong>If this wasn't you:</strong></p>
      <ol>
        <li>Change your password immediately</li>
        <li>Review your recent account activity</li>
        <li>Contact our security team at security@nilecare.sd</li>
      </ol>
    </div>
    <div class="footer">
      <p>© 2025 NileCare Healthcare Platform | Sudan</p>
      <p>Security Team: security@nilecare.sd</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Send MFA setup email
   */
  async sendMFAEnabledEmail(
    email: string,
    username: string
  ): Promise<boolean> {
    const subject = 'Two-Factor Authentication Enabled';
    
    const text = `
Hello ${username},

Two-factor authentication has been successfully enabled on your NileCare account.

Your account is now more secure!

If you didn't enable MFA, please contact our security team immediately.

Best regards,
The NileCare Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 MFA Enabled</h1>
    </div>
    <div class="content">
      <h2>Hello ${username},</h2>
      <div class="success-box">
        <strong>✅ Success!</strong>
        <p>Two-factor authentication has been successfully enabled on your account.</p>
      </div>
      <p>Your account is now protected with an additional layer of security.</p>
      <p><strong>What this means:</strong></p>
      <ul>
        <li>You'll need your password AND authentication code to log in</li>
        <li>Your account is more secure against unauthorized access</li>
        <li>You have backup codes in case you lose access to your device</li>
      </ul>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If you didn't enable MFA, please contact our security team immediately at security@nilecare.sd
      </p>
    </div>
    <div class="footer">
      <p>© 2025 NileCare Healthcare Platform | Sudan</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Check if email service is configured
   */
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email configuration test successful');
      return true;
    } catch (error: any) {
      logger.error('Email configuration test failed', {
        error: error.message
      });
      return false;
    }
  }
}

export default EmailService;

