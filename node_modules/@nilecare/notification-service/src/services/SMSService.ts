/**
 * SMS Service
 * Send SMS via Twilio
 */

import { logger } from '../utils/logger';
import { getTwilioClient, getTwilioPhoneNumber } from '../config/sms.config';

export interface SMSData {
  to: string;
  message: string;
  from?: string;
}

export class SMSService {
  constructor() {
    logger.info('SMSService initialized');
  }

  /**
   * Send SMS
   */
  async sendSMS(smsData: SMSData): Promise<any> {
    try {
      const client = getTwilioClient();
      const fromNumber = smsData.from || getTwilioPhoneNumber();

      // Ensure phone number is in E.164 format
      const toNumber = smsData.to.startsWith('+') ? smsData.to : `+${smsData.to}`;

      logger.info('Sending SMS', { 
        to: toNumber,
        from: fromNumber,
        message: smsData.message.substring(0, 50) + '...'
      });

      const result = await client.messages.create({
        body: smsData.message,
        from: fromNumber,
        to: toNumber,
      });

      logger.info('✅ SMS sent successfully', {
        sid: result.sid,
        status: result.status,
        to: toNumber,
      });

      return {
        success: true,
        sid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from,
      };
    } catch (error: any) {
      logger.error('❌ Failed to send SMS', {
        error: error.message,
        to: smsData.to,
      });
      throw error;
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulk(messages: SMSData[]): Promise<any> {
    logger.info('Sending bulk SMS', { count: messages.length });

    const results = {
      total: messages.length,
      sent: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const sms of messages) {
      try {
        await this.sendSMS(sms);
        results.sent++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          to: sms.to,
          error: error.message,
        });
      }
    }

    logger.info('Bulk SMS sending complete', results);
    return results;
  }

  /**
   * Verify SMS configuration
   */
  async verify(): Promise<boolean> {
    try {
      const client = getTwilioClient();
      // Test by fetching account info
      await client.api.accounts.list({ limit: 1 });
      logger.info('✅ SMS configuration verified');
      return true;
    } catch (error: any) {
      logger.error('❌ SMS configuration verification failed', { error: error.message });
      return false;
    }
  }
}

export default SMSService;

