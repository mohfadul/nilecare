/**
 * Notification Service
 * Core notification processing logic
 */

import { logger } from '../utils/logger';
import { Notification, CreateNotificationDto } from '../models/Notification';
import NotificationRepository from '../repositories/notification.repository';
import SubscriptionRepository from '../repositories/subscription.repository';
import TemplateService from './TemplateService';
import EmailService, { EmailData } from './EmailService';
import SMSService, { SMSData } from './SMSService';
import PushService, { PushData } from './PushService';
import DeliveryService from './DeliveryService';

export class NotificationService {
  private repository: NotificationRepository;
  private subscriptionRepository: SubscriptionRepository;
  private templateService: TemplateService;
  private emailService: EmailService;
  private smsService: SMSService;
  private pushService: PushService;
  private deliveryService: DeliveryService;

  constructor() {
    this.repository = new NotificationRepository();
    this.subscriptionRepository = new SubscriptionRepository();
    this.templateService = new TemplateService();
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushService = new PushService();
    this.deliveryService = new DeliveryService();
    logger.info('NotificationService initialized');
  }

  /**
   * Create and send notification
   */
  async create(data: CreateNotificationDto): Promise<Notification> {
    try {
      // Check if user is subscribed
      const isSubscribed = await this.subscriptionRepository.isSubscribed(
        data.user_id,
        data.channel,
        data.type
      );

      if (!isSubscribed) {
        logger.info('User not subscribed to this notification type', {
          userId: data.user_id,
          channel: data.channel,
          type: data.type,
        });
        throw new Error('User is not subscribed to this notification type');
      }

      // Create notification record
      const notification = await this.repository.create(data);

      // Send immediately if not scheduled
      if (!data.scheduled_at) {
        await this.send(notification.id);
      }

      return notification;
    } catch (error: any) {
      logger.error('Failed to create notification', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Send notification
   */
  async send(notificationId: string): Promise<void> {
    try {
      const notification = await this.repository.findById(notificationId);

      if (!notification) {
        throw new Error(`Notification not found: ${notificationId}`);
      }

      if (notification.status !== 'pending') {
        logger.warn('Notification already processed', { 
          id: notificationId, 
          status: notification.status 
        });
        return;
      }

      logger.info('Sending notification', {
        id: notificationId,
        channel: notification.channel,
        type: notification.type,
      });

      // Send via appropriate channel
      switch (notification.channel) {
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'sms':
          await this.sendSMS(notification);
          break;
        case 'push':
          await this.sendPush(notification);
          break;
        case 'websocket':
          // WebSocket handled differently (real-time)
          await this.repository.markAsSent(notificationId);
          break;
        default:
          throw new Error(`Unknown channel: ${notification.channel}`);
      }

      logger.info('✅ Notification sent successfully', { id: notificationId });
    } catch (error: any) {
      logger.error('❌ Failed to send notification', { 
        error: error.message, 
        notificationId 
      });
      
      // Mark as failed
      const notification = await this.repository.findById(notificationId);
      if (notification) {
        await this.repository.markAsFailed(
          notificationId,
          error.message,
          notification.retry_count + 1
        );
      }
      
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: Notification): Promise<void> {
    const emailData: EmailData = {
      to: notification.user_id, // Should be email address
      subject: notification.subject || 'Notification',
      body: notification.body,
      html: notification.body,
    };

    const result = await this.emailService.sendEmail(emailData);
    await this.repository.markAsSent(notification.id);
    await this.deliveryService.trackDelivery(notification.id, 'email', 'sent', result.messageId);
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(notification: Notification): Promise<void> {
    const smsData: SMSData = {
      to: notification.user_id, // Should be phone number
      message: notification.body,
    };

    const result = await this.smsService.sendSMS(smsData);
    await this.repository.markAsSent(notification.id);
    await this.deliveryService.trackDelivery(notification.id, 'sms', 'sent', result.sid);
  }

  /**
   * Send push notification
   */
  private async sendPush(notification: Notification): Promise<void> {
    const pushData: PushData = {
      deviceToken: notification.user_id, // Should be device token
      title: notification.subject || 'Notification',
      body: notification.body,
      data: notification.payload,
      priority: 'normal',
    };

    const result = await this.pushService.sendPush(pushData);
    await this.repository.markAsSent(notification.id);
    
    // Get the first message ID if multiple
    const messageId = result.messageIds?.[0] || result.messageId || 'push-sent';
    await this.deliveryService.trackDelivery(
      notification.id, 
      'push', 
      'sent', 
      messageId,
      result.platform || 'firebase'
    );
  }

  /**
   * Process notification (handles template rendering)
   */
  async processNotification(notification: Partial<Notification>): Promise<any> {
    try {
      logger.info('Processing notification', { notification });

      let body = notification.body || '';
      let subject = notification.subject;

      // Render template if template_id is provided
      if (notification.template_id && notification.payload) {
        const rendered = await this.templateService.render(
          notification.template_id,
          notification.payload
        );
        body = rendered.body;
        subject = rendered.subject;
      }

      // Create notification with rendered content
      const data: CreateNotificationDto = {
        user_id: notification.user_id!,
        channel: notification.channel!,
        type: notification.type!,
        template_id: notification.template_id,
        subject,
        body,
        payload: notification.payload,
        scheduled_at: notification.scheduled_at,
        created_by: notification.created_by,
      };

      return await this.create(data);
    } catch (error: any) {
      logger.error('Failed to process notification', { error: error.message });
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getById(id: string): Promise<Notification | null> {
    return this.repository.findById(id);
  }

  /**
   * Get notifications for user
   */
  async getByUserId(userId: string, limit?: number, offset?: number): Promise<Notification[]> {
    return this.repository.findByUserId(userId, limit, offset);
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.repository.countUnreadByUser(userId);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification | null> {
    return this.repository.markAsRead(id);
  }

  /**
   * Retry failed notifications
   */
  async retryFailed(): Promise<number> {
    try {
      const failed = await this.repository.findFailedForRetry(3);
      let retried = 0;

      for (const notification of failed) {
        try {
          await this.send(notification.id);
          retried++;
        } catch (error: any) {
          logger.error('Retry failed', { id: notification.id, error: error.message });
        }
      }

      logger.info('Retry completed', { total: failed.length, retried });
      return retried;
    } catch (error: any) {
      logger.error('Failed to retry notifications', { error: error.message });
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(userId?: string): Promise<any> {
    return this.repository.getStatistics(userId);
  }
}

export default NotificationService;

