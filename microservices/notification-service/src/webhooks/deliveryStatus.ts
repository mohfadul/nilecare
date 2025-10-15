/**
 * Delivery Status Webhooks
 * Handle delivery status updates from external providers
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import DeliveryService from '../services/DeliveryService';
import NotificationRepository from '../repositories/notification.repository';

const router = Router();
const deliveryService = new DeliveryService();
const notificationRepository = new NotificationRepository();

/**
 * Twilio SMS Status Webhook
 * POST /webhooks/twilio/status
 */
router.post('/twilio/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { MessageSid, MessageStatus, To, ErrorCode, ErrorMessage } = req.body;

    logger.info('Received Twilio webhook', {
      messageSid: MessageSid,
      status: MessageStatus,
      to: To,
    });

    // Find notification by provider message ID
    // Note: This would require adding a query method to find by provider_message_id
    // For now, log the webhook data

    // Map Twilio status to our status
    const statusMap: Record<string, string> = {
      'queued': 'queued',
      'sent': 'sent',
      'delivered': 'delivered',
      'failed': 'failed',
      'undelivered': 'failed',
    };

    const mappedStatus = statusMap[MessageStatus] || 'sent';

    logger.info('Twilio delivery status processed', {
      messageSid: MessageSid,
      originalStatus: MessageStatus,
      mappedStatus,
      errorCode: ErrorCode,
      errorMessage: ErrorMessage,
    });

    // Respond to Twilio
    res.status(200).send('OK');
  } catch (error: any) {
    logger.error('Failed to process Twilio webhook', { error: error.message });
    res.status(500).send('ERROR');
  }
});

/**
 * SendGrid Email Status Webhook
 * POST /webhooks/sendgrid/events
 */
router.post('/sendgrid/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    logger.info('Received SendGrid webhook', { eventCount: events.length });

    for (const event of events) {
      const { event: eventType, email, sg_message_id } = event;

      logger.info('Processing SendGrid event', {
        eventType,
        email,
        messageId: sg_message_id,
      });

      // Map SendGrid events to our status
      const statusMap: Record<string, string> = {
        'processed': 'queued',
        'delivered': 'delivered',
        'bounce': 'bounced',
        'dropped': 'failed',
        'deferred': 'queued',
        'open': 'opened',
        'click': 'clicked',
      };

      const mappedStatus = statusMap[eventType];

      if (mappedStatus) {
        // Update delivery status in database
        // This would require finding the tracking record by provider_message_id
        logger.info('SendGrid delivery status processed', {
          messageId: sg_message_id,
          status: mappedStatus,
        });
      }
    }

    res.status(200).send('OK');
  } catch (error: any) {
    logger.error('Failed to process SendGrid webhook', { error: error.message });
    res.status(500).send('ERROR');
  }
});

/**
 * Firebase FCM Status Webhook (if supported by provider)
 * POST /webhooks/firebase/status
 */
router.post('/firebase/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId, status, deviceToken } = req.body;

    logger.info('Received Firebase webhook', {
      messageId,
      status,
      deviceToken: deviceToken ? deviceToken.substring(0, 20) + '...' : undefined,
    });

    // Process Firebase delivery status
    // Note: Firebase doesn't have built-in webhooks, but custom implementations might

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Failed to process Firebase webhook', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generic delivery status webhook
 * POST /webhooks/delivery/status
 */
router.post('/delivery/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { notificationId, status, provider, providerMessageId } = req.body;

    if (!notificationId || !status) {
      res.status(400).json({ 
        error: 'Missing required fields: notificationId, status' 
      });
      return;
    }

    logger.info('Received generic delivery status webhook', {
      notificationId,
      status,
      provider,
    });

    // Update notification status
    await notificationRepository.update(notificationId, { status });

    // Track delivery
    await deliveryService.trackDelivery(
      notificationId,
      'email', // Default, should be determined from notification
      status,
      providerMessageId,
      provider
    );

    res.status(200).json({ success: true, message: 'Status updated' });
  } catch (error: any) {
    logger.error('Failed to process delivery status webhook', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook verification endpoint (for provider setup)
 * GET /webhooks/verify
 */
router.get('/verify', (_req: Request, res: Response): void => {
  // Some providers require GET verification during setup
  const verificationToken = process.env.WEBHOOK_VERIFICATION_TOKEN || 'nilecare-notifications';
  res.status(200).send(verificationToken);
});

export default router;

