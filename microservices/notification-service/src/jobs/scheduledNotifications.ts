/**
 * Scheduled Notifications Job
 * Cron job to process scheduled notifications
 */

import cron from 'node-cron';
import { logger } from '../utils/logger';
import NotificationRepository from '../repositories/notification.repository';
import NotificationService from '../services/NotificationService';

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService();

/**
 * Process scheduled notifications that are due
 */
export async function processScheduledNotifications(): Promise<void> {
  try {
    logger.info('Starting scheduled notification processing');

    // Get all pending scheduled notifications that are due
    const dueNotifications = await notificationRepository.findScheduledDue();

    if (dueNotifications.length === 0) {
      logger.debug('No scheduled notifications due');
      return;
    }

    logger.info(`Processing ${dueNotifications.length} scheduled notifications`);

    let sent = 0;
    let failed = 0;

    for (const notification of dueNotifications) {
      try {
        await notificationService.send(notification.id);
        sent++;
      } catch (error: any) {
        failed++;
        logger.error('Failed to send scheduled notification', {
          notificationId: notification.id,
          error: error.message,
        });
      }
    }

    logger.info('Scheduled notification processing complete', {
      total: dueNotifications.length,
      sent,
      failed,
    });
  } catch (error: any) {
    logger.error('Scheduled notification job failed', {
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Retry failed notifications
 */
export async function retryFailedNotifications(): Promise<void> {
  try {
    logger.info('Starting failed notification retry');

    const maxRetries = parseInt(process.env.QUEUE_MAX_RETRY_ATTEMPTS || '3');
    const retried = await notificationService.retryFailed();

    logger.info('Failed notification retry complete', {
      maxRetries,
      retriedCount: retried,
    });
  } catch (error: any) {
    logger.error('Failed notification retry job failed', {
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Cleanup old notifications
 */
export async function cleanupOldNotifications(): Promise<void> {
  try {
    logger.info('Starting notification cleanup');

    const retentionDays = parseInt(process.env.OLD_NOTIFICATION_RETENTION_DAYS || '90');
    
    // This would require a new repository method
    // For now, just log the operation
    logger.info('Cleanup job executed', { retentionDays });
    
    // TODO: Implement cleanup logic in repository
    // const deleted = await notificationRepository.deleteOlderThan(retentionDays);
    // logger.info('Cleanup complete', { deleted });

  } catch (error: any) {
    logger.error('Notification cleanup job failed', {
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Setup all cron jobs
 */
export function setupCronJobs(): void {
  logger.info('Setting up cron jobs for scheduled notifications');

  // Process scheduled notifications (every 5 minutes)
  const scheduledCron = process.env.SCHEDULED_NOTIFICATIONS_CRON || '*/5 * * * *';
  cron.schedule(scheduledCron, async () => {
    await processScheduledNotifications();
  });
  logger.info(`✅ Scheduled notifications cron job configured: ${scheduledCron}`);

  // Retry failed notifications (every 6 hours)
  const retryCron = process.env.RETRY_FAILED_NOTIFICATIONS_CRON || '0 */6 * * *';
  cron.schedule(retryCron, async () => {
    await retryFailedNotifications();
  });
  logger.info(`✅ Retry failed notifications cron job configured: ${retryCron}`);

  // Cleanup old notifications (daily at 2 AM)
  const cleanupCron = process.env.CLEANUP_OLD_NOTIFICATIONS_CRON || '0 2 * * *';
  cron.schedule(cleanupCron, async () => {
    await cleanupOldNotifications();
  });
  logger.info(`✅ Cleanup old notifications cron job configured: ${cleanupCron}`);

  logger.info('✅ All cron jobs setup complete');
}

export default {
  processScheduledNotifications,
  retryFailedNotifications,
  cleanupOldNotifications,
  setupCronJobs,
};

