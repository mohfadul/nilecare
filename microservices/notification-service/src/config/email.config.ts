/**
 * Email Configuration
 * Nodemailer setup for sending emails
 */

import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import SecretsConfig from './secrets.config';

let transporter: nodemailer.Transporter | null = null;

/**
 * Get email transporter
 */
export function getEmailTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const config = SecretsConfig.getEmailConfig();

    if (!config.enabled) {
      logger.warn('Email service is disabled');
      throw new Error('Email service is not enabled');
    }

    if (!config.host || !config.user || !config.password) {
      logger.warn('Email configuration incomplete');
      throw new Error('Email configuration is incomplete');
    }

    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.password,
      },
      pool: true, // Use pooled connections
      maxConnections: 5,
      maxMessages: 100,
    });

    // Verify connection
    if (transporter) {
      transporter.verify((error) => {
      if (error) {
        logger.error('Email transporter verification failed', { error: error.message });
      } else {
        logger.info('✅ Email transporter ready', {
          host: config.host,
          port: config.port,
          user: config.user,
        });
      }
      });
    }

    logger.info('Email transporter initialized', {
      host: config.host,
      port: config.port,
    });
  }

  return transporter;
}

/**
 * Test email connection
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    logger.info('✅ Email connection test successful');
    return true;
  } catch (error: any) {
    logger.error('❌ Email connection test failed', { error: error.message });
    return false;
  }
}

/**
 * Close email transporter
 */
export function closeEmailTransporter(): void {
  if (transporter) {
    transporter.close();
    transporter = null;
    logger.info('Email transporter closed');
  }
}

/**
 * Get email configuration
 */
export function getEmailConfig() {
  return SecretsConfig.getEmailConfig();
}

export default {
  getEmailTransporter,
  testEmailConnection,
  closeEmailTransporter,
  getEmailConfig,
};

