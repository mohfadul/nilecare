/**
 * SMS Configuration
 * Twilio setup for sending SMS
 */

import twilio from 'twilio';
import { logger } from '../utils/logger';
import SecretsConfig from './secrets.config';

let twilioClient: twilio.Twilio | null = null;

/**
 * Get Twilio client
 */
export function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    const config = SecretsConfig.getSMSConfig();

    if (!config.enabled) {
      logger.warn('SMS service is disabled');
      throw new Error('SMS service is not enabled');
    }

    if (!config.twilio.accountSid || !config.twilio.authToken) {
      logger.warn('SMS configuration incomplete');
      throw new Error('SMS configuration is incomplete');
    }

    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

    logger.info('✅ Twilio client initialized', {
      accountSid: config.twilio.accountSid.substring(0, 10) + '...',
    });
  }

  return twilioClient;
}

/**
 * Test SMS connection
 */
export async function testSMSConnection(): Promise<boolean> {
  try {
    const client = getTwilioClient();
    const config = SecretsConfig.getSMSConfig();
    
    // Verify account (fetch account details)
    const accountSid = config.twilio.accountSid;
    if (!accountSid) {
      throw new Error('Twilio account SID not configured');
    }
    const account = await client.api.accounts(accountSid).fetch();
    
    logger.info('✅ SMS connection test successful', { 
      status: account.status,
      accountSid: account.sid.substring(0, 10) + '...'
    });
    return true;
  } catch (error: any) {
    logger.error('❌ SMS connection test failed', { error: error.message });
    return false;
  }
}

/**
 * Get SMS configuration
 */
export function getSMSConfig() {
  return SecretsConfig.getSMSConfig();
}

/**
 * Get Twilio phone number
 */
export function getTwilioPhoneNumber(): string {
  const config = SecretsConfig.getSMSConfig();
  if (!config.twilio.phoneNumber) {
    throw new Error('Twilio phone number not configured');
  }
  return config.twilio.phoneNumber;
}

export default {
  getTwilioClient,
  testSMSConnection,
  getSMSConfig,
  getTwilioPhoneNumber,
};

