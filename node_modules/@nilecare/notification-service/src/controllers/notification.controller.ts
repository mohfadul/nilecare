/**
 * Notification Controller
 * HTTP request handlers for notifications
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import NotificationService from '../services/NotificationService';
import { CreateNotificationDto } from '../models/Notification';

const notificationService = new NotificationService();

/**
 * List notifications for authenticated user
 */
export async function listNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

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

    const notifications = await notificationService.getByUserId(userId, limit, offset);
    const unreadCount = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    logger.error('Failed to list notifications', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'LIST_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Get notification by ID
 */
export async function getNotification(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const notification = await notificationService.getById(id);

    if (!notification) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    logger.error('Failed to get notification', { error: error.message });
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
 * Create and send notification
 */
export async function createNotification(req: Request, res: Response): Promise<void> {
  try {
    const data: CreateNotificationDto = {
      ...req.body,
      created_by: req.user?.userId,
    };

    const notification = await notificationService.create(data);

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created and queued for sending',
    });
  } catch (error: any) {
    logger.error('Failed to create notification', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Send notification (with template)
 */
export async function sendNotification(req: Request, res: Response): Promise<void> {
  try {
    const notification = {
      ...req.body,
      created_by: req.user?.userId,
    };

    const result = await notificationService.processNotification(notification);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Notification sent successfully',
    });
  } catch (error: any) {
    logger.error('Failed to send notification', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id);

    if (!notification) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    logger.error('Failed to mark notification as read', { error: error.message });
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
 * Get notification statistics
 */
export async function getStatistics(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.userId as string | undefined;

    const statistics = await notificationService.getStatistics(userId);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    logger.error('Failed to get statistics', { error: error.message });
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
  listNotifications,
  getNotification,
  createNotification,
  sendNotification,
  markAsRead,
  getStatistics,
};

