/**
 * Delivery Controller
 * HTTP request handlers for delivery tracking
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import DeliveryService from '../services/DeliveryService';

const deliveryService = new DeliveryService();

/**
 * Get delivery status for notification
 */
export async function getDeliveryStatus(req: Request, res: Response): Promise<void> {
  try {
    const { notificationId } = req.params;

    const delivery = await deliveryService.getStatus(notificationId);

    if (!delivery) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Delivery tracking not found for this notification',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: delivery,
    });
  } catch (error: any) {
    logger.error('Failed to get delivery status', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Get all delivery tracking for notification
 */
export async function getDeliveryHistory(req: Request, res: Response): Promise<void> {
  try {
    const { notificationId } = req.params;

    const deliveries = await deliveryService.getAllByNotificationId(notificationId);

    res.json({
      success: true,
      data: deliveries,
      count: deliveries.length,
    });
  } catch (error: any) {
    logger.error('Failed to get delivery history', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Get delivery statistics
 */
export async function getDeliveryStatistics(req: Request, res: Response): Promise<void> {
  try {
    const channel = req.query.channel as string | undefined;

    const statistics = await deliveryService.getStatistics(channel);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    logger.error('Failed to get delivery statistics', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FAILED',
        message: error.message,
      },
    });
  }
}

export default {
  getDeliveryStatus,
  getDeliveryHistory,
  getDeliveryStatistics,
};

