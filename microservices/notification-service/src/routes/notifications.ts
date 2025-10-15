/**
 * Notification Routes
 * API endpoints for notification management
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import notificationController from '../controllers/notification.controller';

const router = Router();

/**
 * GET /api/v1/notifications
 * List notifications for authenticated user
 */
router.get(
  '/',
  notificationController.listNotifications
);

/**
 * POST /api/v1/notifications
 * Create and send notification
 */
router.post(
  '/',
  [
    body('user_id').notEmpty().withMessage('User ID is required'),
    body('channel').isIn(['email', 'sms', 'push', 'websocket']).withMessage('Invalid channel'),
    body('type').notEmpty().withMessage('Notification type is required'),
    body('body').notEmpty().withMessage('Body is required'),
    validateRequest,
  ],
  notificationController.createNotification
);

/**
 * POST /api/v1/notifications/send
 * Send notification with template
 */
router.post(
  '/send',
  [
    body('user_id').notEmpty().withMessage('User ID is required'),
    body('channel').isIn(['email', 'sms', 'push', 'websocket']).withMessage('Invalid channel'),
    body('type').notEmpty().withMessage('Notification type is required'),
    validateRequest,
  ],
  notificationController.sendNotification
);

/**
 * GET /api/v1/notifications/stats
 * Get notification statistics
 */
router.get(
  '/stats',
  notificationController.getStatistics
);

/**
 * GET /api/v1/notifications/:id
 * Get notification by ID
 */
router.get(
  '/:id',
  notificationController.getNotification
);

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark notification as read
 */
router.patch(
  '/:id/read',
  notificationController.markAsRead
);

export default router;

