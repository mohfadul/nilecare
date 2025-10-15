/**
 * Queue Processors
 * Bull queue job processors with retry logic
 */

import { Job } from 'bull';
import { logger } from '../utils/logger';
import NotificationService from '../services/NotificationService';
import EmailService, { EmailData } from '../services/EmailService';
import SMSService, { SMSData } from '../services/SMSService';
import PushService, { PushData } from '../services/PushService';
import DeliveryService from '../services/DeliveryService';

const notificationService = new NotificationService();
const emailService = new EmailService();
const smsService = new SMSService();
const pushService = new PushService();
const deliveryService = new DeliveryService();

/**
 * Process notification queue job
 */
export async function processNotificationJob(job: Job): Promise<any> {
  const { notification } = job.data;

  logger.info('Processing notification job', {
    jobId: job.id,
    notificationId: notification.id,
    attempt: job.attemptsMade + 1,
  });

  try {
    const result = await notificationService.processNotification(notification);

    logger.info('✅ Notification job processed successfully', {
      jobId: job.id,
      notificationId: result.id,
    });

    return result;
  } catch (error: any) {
    logger.error('❌ Notification job failed', {
      jobId: job.id,
      notificationId: notification.id,
      error: error.message,
      attempt: job.attemptsMade + 1,
    });

    // Re-throw to trigger Bull retry
    throw error;
  }
}

/**
 * Process email queue job
 */
export async function processEmailJob(job: Job): Promise<any> {
  const { emailData, notificationId } = job.data as { 
    emailData: EmailData; 
    notificationId: string 
  };

  logger.info('Processing email job', {
    jobId: job.id,
    notificationId,
    to: emailData.to,
    attempt: job.attemptsMade + 1,
  });

  try {
    const result = await emailService.sendEmail(emailData);

    // Track delivery
    if (notificationId) {
      await deliveryService.trackDelivery(
        notificationId,
        'email',
        'sent',
        result.messageId,
        'smtp'
      );
    }

    logger.info('✅ Email job processed successfully', {
      jobId: job.id,
      messageId: result.messageId,
    });

    return result;
  } catch (error: any) {
    logger.error('❌ Email job failed', {
      jobId: job.id,
      notificationId,
      error: error.message,
      attempt: job.attemptsMade + 1,
    });

    // Track failure
    if (notificationId) {
      await deliveryService.trackDelivery(
        notificationId,
        'email',
        'failed',
        undefined,
        'smtp'
      );
    }

    throw error;
  }
}

/**
 * Process SMS queue job
 */
export async function processSMSJob(job: Job): Promise<any> {
  const { smsData, notificationId } = job.data as { 
    smsData: SMSData; 
    notificationId: string 
  };

  logger.info('Processing SMS job', {
    jobId: job.id,
    notificationId,
    to: smsData.to,
    attempt: job.attemptsMade + 1,
  });

  try {
    const result = await smsService.sendSMS(smsData);

    // Track delivery
    if (notificationId) {
      await deliveryService.trackDelivery(
        notificationId,
        'sms',
        'sent',
        result.sid,
        'twilio'
      );
    }

    logger.info('✅ SMS job processed successfully', {
      jobId: job.id,
      sid: result.sid,
    });

    return result;
  } catch (error: any) {
    logger.error('❌ SMS job failed', {
      jobId: job.id,
      notificationId,
      error: error.message,
      attempt: job.attemptsMade + 1,
    });

    // Track failure
    if (notificationId) {
      await deliveryService.trackDelivery(
        notificationId,
        'sms',
        'failed',
        undefined,
        'twilio'
      );
    }

    throw error;
  }
}

/**
 * Process push notification queue job
 */
export async function processPushJob(job: Job): Promise<any> {
  const { pushData, notificationId } = job.data as { 
    pushData: PushData; 
    notificationId: string 
  };

  logger.info('Processing push job', {
    jobId: job.id,
    notificationId,
    deviceToken: Array.isArray(pushData.deviceToken) 
      ? pushData.deviceToken.length 
      : '1 device',
    attempt: job.attemptsMade + 1,
  });

  try {
    const result = await pushService.sendPush(pushData);

    // Track delivery
    if (notificationId) {
      await deliveryService.trackDelivery(
        notificationId,
        'push',
        'sent',
        result.messageIds?.[0] || 'bulk',
        result.platform
      );
    }

    logger.info('✅ Push job processed successfully', {
      jobId: job.id,
      successCount: result.successCount,
    });

    return result;
  } catch (error: any) {
    logger.error('❌ Push job failed', {
      jobId: job.id,
      notificationId,
      error: error.message,
      attempt: job.attemptsMade + 1,
    });

    // Track failure
    if (notificationId) {
      await deliveryService.trackDelivery(
        notificationId,
        'push',
        'failed',
        undefined,
        'firebase'
      );
    }

    throw error;
  }
}

/**
 * Job completion handler
 */
export function onJobComplete(job: Job, _result: any): void {
  logger.info('Job completed', {
    jobId: job.id,
    queue: job.queue.name,
    duration: Date.now() - job.processedOn!,
  });
}

/**
 * Job failure handler
 */
export function onJobFailed(job: Job, error: Error): void {
  logger.error('Job failed permanently', {
    jobId: job.id,
    queue: job.queue.name,
    attempts: job.attemptsMade,
    error: error.message,
  });
}

/**
 * Job stalled handler
 */
export function onJobStalled(job: Job): void {
  logger.warn('Job stalled (taking too long)', {
    jobId: job.id,
    queue: job.queue.name,
    startedAt: job.processedOn,
  });
}

export default {
  processNotificationJob,
  processEmailJob,
  processSMSJob,
  processPushJob,
  onJobComplete,
  onJobFailed,
  onJobStalled,
};

