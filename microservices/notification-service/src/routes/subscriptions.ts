/**
 * Subscription Routes
 * API endpoints for user notification preferences
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import subscriptionController from '../controllers/subscription.controller';

const router = Router();

/**
 * GET /api/v1/subscriptions
 * Get user notification subscriptions
 */
router.get(
  '/',
  subscriptionController.getUserSubscriptions
);

/**
 * GET /api/v1/subscriptions/check
 * Check if user is subscribed to specific notification
 */
router.get(
  '/check',
  subscriptionController.checkSubscription
);

/**
 * POST /api/v1/subscriptions
 * Create or update subscription
 */
router.post(
  '/',
  [
    body('channel').isIn(['email', 'sms', 'push', 'websocket']).withMessage('Invalid channel'),
    body('notification_type').notEmpty().withMessage('Notification type is required'),
    validateRequest,
  ],
  subscriptionController.upsertSubscription
);

/**
 * PUT /api/v1/subscriptions/:id
 * Update subscription by ID
 */
router.put(
  '/:id',
  subscriptionController.updateSubscription
);

/**
 * POST /api/v1/subscriptions/unsubscribe-all
 * Unsubscribe from all notifications
 */
router.post(
  '/unsubscribe-all',
  subscriptionController.unsubscribeAll
);

/**
 * POST /api/v1/subscriptions/subscribe-all
 * Subscribe to all notifications
 */
router.post(
  '/subscribe-all',
  subscriptionController.subscribeAll
);

export default router;

