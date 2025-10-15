/**
 * Delivery Routes
 * API endpoints for delivery tracking
 */

import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/delivery/:notificationId
 * Get delivery status (to be implemented)
 */
router.get('/:notificationId', async (req, res) => {
  logger.info('GET /delivery/:notificationId', { 
    notificationId: req.params.notificationId,
    user: req.user?.userId 
  });
  res.json({
    success: true,
    data: null,
    message: 'Delivery tracking not yet implemented',
  });
});

/**
 * GET /api/v1/delivery/stats
 * Get delivery statistics (to be implemented)
 */
router.get('/stats', async (req, res) => {
  logger.info('GET /delivery/stats', { user: req.user?.userId });
  res.json({
    success: true,
    data: {},
    message: 'Delivery statistics not yet implemented',
  });
});

export default router;

