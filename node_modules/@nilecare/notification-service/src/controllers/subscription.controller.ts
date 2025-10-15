/**
 * Subscription Controller  
 * HTTP request handlers for user notification preferences
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import SubscriptionRepository from '../repositories/subscription.repository';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '../models/Subscription';

const subscriptionRepository = new SubscriptionRepository();

/**
 * Get user subscriptions
 */
export async function getUserSubscriptions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        },
      });
      return;
    }

    const subscriptions = await subscriptionRepository.findByUserId(userId);

    res.json({
      success: true,
      data: subscriptions,
      count: subscriptions.length,
    });
  } catch (error: any) {
    logger.error('Failed to get user subscriptions', { error: error.message });
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
 * Create or update subscription
 */
export async function upsertSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        },
      });
      return;
    }

    const data: CreateSubscriptionDto = {
      user_id: userId,
      channel: req.body.channel,
      notification_type: req.body.notification_type,
      is_enabled: req.body.is_enabled,
      preferences: req.body.preferences,
    };

    const subscription = await subscriptionRepository.upsert(data);

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription preferences updated',
    });
  } catch (error: any) {
    logger.error('Failed to upsert subscription', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPSERT_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Update subscription by ID
 */
export async function updateSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data: UpdateSubscriptionDto = req.body;

    const subscription = await subscriptionRepository.update(id, data);

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Subscription not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update subscription', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Unsubscribe from all notifications
 */
export async function unsubscribeAll(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        },
      });
      return;
    }

    const count = await subscriptionRepository.unsubscribeAll(userId);

    res.json({
      success: true,
      message: `Unsubscribed from ${count} notification types`,
      data: { count },
    });
  } catch (error: any) {
    logger.error('Failed to unsubscribe all', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UNSUBSCRIBE_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Subscribe to all notifications
 */
export async function subscribeAll(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        },
      });
      return;
    }

    const count = await subscriptionRepository.subscribeAll(userId);

    res.json({
      success: true,
      message: `Subscribed to ${count} notification types`,
      data: { count },
    });
  } catch (error: any) {
    logger.error('Failed to subscribe all', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBSCRIBE_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Check if user is subscribed
 */
export async function checkSubscription(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { channel, type } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        },
      });
      return;
    }

    if (!channel || !type) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'Channel and type are required',
        },
      });
      return;
    }

    const isSubscribed = await subscriptionRepository.isSubscribed(
      userId,
      channel as string,
      type as string
    );

    res.json({
      success: true,
      data: { isSubscribed },
    });
  } catch (error: any) {
    logger.error('Failed to check subscription', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CHECK_FAILED',
        message: error.message,
      },
    });
  }
}

export default {
  getUserSubscriptions,
  upsertSubscription,
  updateSubscription,
  unsubscribeAll,
  subscribeAll,
  checkSubscription,
};

