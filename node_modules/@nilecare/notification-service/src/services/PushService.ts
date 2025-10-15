/**
 * Push Notification Service
 * Send push notifications via Firebase/APN
 */

import { logger } from '../utils/logger';
import { getFirebaseMessaging, initializeAPN } from '../config/push.config';
import * as admin from 'firebase-admin';

export interface PushData {
  deviceToken: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  platform?: 'android' | 'ios' | 'auto';
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal';
  ttl?: number;
  imageUrl?: string;
}

export class PushService {
  constructor() {
    logger.info('PushService initialized');
  }

  /**
   * Send push notification
   */
  async sendPush(pushData: PushData): Promise<any> {
    try {
      const platform = pushData.platform || 'auto';
      const tokens = Array.isArray(pushData.deviceToken) 
        ? pushData.deviceToken 
        : [pushData.deviceToken];

      logger.info('Sending push notification', {
        platform,
        tokenCount: tokens.length,
        title: pushData.title,
      });

      // Determine platform and send accordingly
      if (platform === 'android' || (platform === 'auto' && this.isAndroidToken(tokens[0]))) {
        return await this.sendFirebase(pushData, tokens);
      } else if (platform === 'ios' || (platform === 'auto' && !this.isAndroidToken(tokens[0]))) {
        return await this.sendAPN(pushData, tokens);
      } else {
        // Try Firebase first (works for both platforms)
        return await this.sendFirebase(pushData, tokens);
      }
    } catch (error: any) {
      logger.error('❌ Failed to send push notification', {
        error: error.message,
        deviceToken: pushData.deviceToken,
      });
      throw error;
    }
  }

  /**
   * Send push via Firebase Cloud Messaging
   */
  private async sendFirebase(pushData: PushData, tokens: string[]): Promise<any> {
    try {
      const messaging = getFirebaseMessaging();

      // Build FCM message
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: pushData.title,
          body: pushData.body,
          imageUrl: pushData.imageUrl,
        },
        data: pushData.data || {},
        android: {
          priority: pushData.priority === 'high' ? 'high' : 'normal',
          ttl: pushData.ttl || 3600000, // 1 hour default
          notification: {
            sound: pushData.sound || 'default',
            priority: pushData.priority === 'high' ? 'high' : 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: pushData.title,
                body: pushData.body,
              },
              badge: pushData.badge,
              sound: pushData.sound || 'default',
            },
          },
        },
      };

      const result = await messaging.sendMulticast(message);

      logger.info('✅ Firebase push notification sent', {
        successCount: result.successCount,
        failureCount: result.failureCount,
        tokens: tokens.length,
      });

      // Log failed tokens
      if (result.failureCount > 0) {
        const failedTokens: string[] = [];
        result.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            logger.warn('Failed to send to token', {
              token: tokens[idx].substring(0, 20) + '...',
              error: resp.error?.message,
            });
          }
        });
      }

      return {
        success: true,
        platform: 'firebase',
        successCount: result.successCount,
        failureCount: result.failureCount,
        messageIds: result.responses
          .filter(r => r.success)
          .map(r => r.messageId),
        failedTokens: result.responses
          .map((r, idx) => (!r.success ? tokens[idx] : null))
          .filter(Boolean),
      };
    } catch (error: any) {
      logger.error('❌ Firebase push failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Send push via Apple Push Notification
   */
  private async sendAPN(pushData: PushData, tokens: string[]): Promise<any> {
    try {
      const provider = initializeAPN();
      
      // Dynamically require APN to build notification
      const apn = require('apn');

      // Build APN notification
      const notification = new apn.Notification();
      notification.alert = {
        title: pushData.title,
        body: pushData.body,
      };
      notification.badge = pushData.badge;
      notification.sound = pushData.sound || 'default';
      notification.topic = process.env.APN_BUNDLE_ID || '';
      notification.payload = pushData.data || {};
      notification.priority = pushData.priority === 'high' ? 10 : 5;
      notification.expiry = Math.floor(Date.now() / 1000) + (pushData.ttl || 3600);

      // Send to all tokens
      const results = await provider.send(notification, tokens);

      logger.info('✅ APN push notification sent', {
        sent: results.sent.length,
        failed: results.failed.length,
      });

      // Log failures
      if (results.failed.length > 0) {
        results.failed.forEach((failed: any) => {
          logger.warn('APN send failed', {
            device: failed.device,
            status: failed.status,
            response: failed.response,
          });
        });
      }

      return {
        success: true,
        platform: 'apn',
        successCount: results.sent.length,
        failureCount: results.failed.length,
        sent: results.sent,
        failed: results.failed,
      };
    } catch (error: any) {
      logger.error('❌ APN push failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Send bulk push notifications
   */
  async sendBulk(notifications: PushData[]): Promise<any> {
    logger.info('Sending bulk push notifications', { count: notifications.length });

    const results = {
      total: notifications.length,
      sent: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Process in batches of 500 (FCM limit)
    const batchSize = 500;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);

      for (const notification of batch) {
        try {
          await this.sendPush(notification);
          results.sent++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            deviceToken: notification.deviceToken,
            error: error.message,
          });
        }
      }
    }

    logger.info('Bulk push notifications complete', results);
    return results;
  }

  /**
   * Send to topic (Firebase only)
   */
  async sendToTopic(topic: string, pushData: Omit<PushData, 'deviceToken'>): Promise<any> {
    try {
      const messaging = getFirebaseMessaging();

      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: pushData.title,
          body: pushData.body,
          imageUrl: pushData.imageUrl,
        },
        data: pushData.data || {},
      };

      const messageId = await messaging.send(message);

      logger.info('✅ Topic push notification sent', {
        topic,
        messageId,
      });

      return {
        success: true,
        messageId,
        topic,
      };
    } catch (error: any) {
      logger.error('❌ Topic push failed', { error: error.message, topic });
      throw error;
    }
  }

  /**
   * Subscribe tokens to topic
   */
  async subscribeToTopic(tokens: string | string[], topic: string): Promise<any> {
    try {
      const messaging = getFirebaseMessaging();
      const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

      const result = await messaging.subscribeToTopic(tokenArray, topic);

      logger.info('✅ Subscribed to topic', {
        topic,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return result;
    } catch (error: any) {
      logger.error('❌ Topic subscription failed', { error: error.message, topic });
      throw error;
    }
  }

  /**
   * Unsubscribe tokens from topic
   */
  async unsubscribeFromTopic(tokens: string | string[], topic: string): Promise<any> {
    try {
      const messaging = getFirebaseMessaging();
      const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

      const result = await messaging.unsubscribeFromTopic(tokenArray, topic);

      logger.info('✅ Unsubscribed from topic', {
        topic,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return result;
    } catch (error: any) {
      logger.error('❌ Topic unsubscription failed', { error: error.message, topic });
      throw error;
    }
  }

  /**
   * Verify push notification setup
   */
  async verify(): Promise<boolean> {
    try {
      const messaging = getFirebaseMessaging();
      const app = messaging.app;
      if (app.name) {
        logger.info('✅ Push notification service verified');
        return true;
      }
      return false;
    } catch (error: any) {
      logger.error('❌ Push notification verification failed', { error: error.message });
      return false;
    }
  }

  /**
   * Determine if token is Android (basic heuristic)
   */
  private isAndroidToken(token: string): boolean {
    // FCM tokens are typically longer for Android
    // This is a simple heuristic; in practice, you'd track this in the database
    return token.length > 150;
  }
}

export default PushService;

