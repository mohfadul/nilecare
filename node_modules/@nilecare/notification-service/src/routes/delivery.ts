/**
 * Delivery Routes
 * API endpoints for delivery tracking
 */

import { Router } from 'express';
import deliveryController from '../controllers/delivery.controller';

const router = Router();

/**
 * GET /api/v1/delivery/stats
 * Get delivery statistics
 * NOTE: Must be before /:notificationId to avoid route conflict
 */
router.get(
  '/stats',
  deliveryController.getDeliveryStatistics
);

/**
 * GET /api/v1/delivery/:notificationId
 * Get delivery status for notification
 */
router.get(
  '/:notificationId',
  deliveryController.getDeliveryStatus
);

/**
 * GET /api/v1/delivery/:notificationId/history
 * Get full delivery history for notification
 */
router.get(
  '/:notificationId/history',
  deliveryController.getDeliveryHistory
);

export default router;

