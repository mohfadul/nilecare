import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { db } from '../utils/database';

/**
 * Stats Controller
 * Provides statistics endpoints for the inventory service
 * Used by main-nilecare orchestrator for dashboard data
 */
export class StatsController {
  /**
   * Get low stock items count
   * GET /api/v1/stats/items/low-stock
   */
  async getLowStockItemsCount(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_REQUIRED',
            message: 'Organization context required',
          },
        });
      }

      const [result] = await db.query(
        `SELECT COUNT(*) as count 
         FROM inventory_items 
         WHERE organization_id = ? 
           AND current_stock <= reorder_level
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved low stock items count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting low stock items count:', error);
      next(error);
    }
  }

  /**
   * Get low stock items details
   * GET /api/v1/stats/items/low-stock/details
   */
  async getLowStockItems(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_REQUIRED',
            message: 'Organization context required',
          },
        });
      }

      const items = await db.query(
        `SELECT 
          id,
          name,
          sku,
          current_stock as currentStock,
          reorder_level as reorderLevel,
          unit,
          category,
          location,
          last_restock_date as lastRestockDate
         FROM inventory_items 
         WHERE organization_id = ?
           AND current_stock <= reorder_level
           AND deleted_at IS NULL
         ORDER BY (reorder_level - current_stock) DESC
         LIMIT ?`,
        [organizationId, limit]
      );

      logger.info(`Stats: Retrieved ${items.length} low stock items for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          items,
          count: items.length,
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting low stock items:', error);
      next(error);
    }
  }

  /**
   * Get out of stock items count
   * GET /api/v1/stats/items/out-of-stock
   */
  async getOutOfStockCount(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_REQUIRED',
            message: 'Organization context required',
          },
        });
      }

      const [result] = await db.query(
        `SELECT COUNT(*) as count 
         FROM inventory_items 
         WHERE organization_id = ? 
           AND current_stock = 0
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved out of stock items count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting out of stock items count:', error);
      next(error);
    }
  }

  /**
   * Get expiring items count (within 30 days)
   * GET /api/v1/stats/items/expiring
   */
  async getExpiringItemsCount(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_REQUIRED',
            message: 'Organization context required',
          },
        });
      }

      const [result] = await db.query(
        `SELECT COUNT(*) as count 
         FROM inventory_items 
         WHERE organization_id = ? 
           AND expiry_date IS NOT NULL
           AND expiry_date <= DATE_ADD(NOW(), INTERVAL 30 DAY)
           AND expiry_date >= NOW()
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved expiring items count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          period: '30 days',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting expiring items count:', error);
      next(error);
    }
  }

  /**
   * Get pending purchase orders count
   * GET /api/v1/stats/purchase-orders/pending
   */
  async getPendingPurchaseOrdersCount(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_REQUIRED',
            message: 'Organization context required',
          },
        });
      }

      const [result] = await db.query(
        `SELECT COUNT(*) as count 
         FROM purchase_orders 
         WHERE organization_id = ? 
           AND status IN ('pending', 'approved')
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved pending purchase orders count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting pending purchase orders count:', error);
      next(error);
    }
  }

  /**
   * Get all inventory stats (combined)
   * GET /api/v1/stats
   */
  async getAllStats(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_REQUIRED',
            message: 'Organization context required',
          },
        });
      }

      // Get all stats in parallel
      const [lowStockResult, outOfStockResult, expiringResult, pendingPOResult, totalItemsResult] = await Promise.all([
        db.query(
          `SELECT COUNT(*) as count FROM inventory_items 
           WHERE organization_id = ? AND current_stock <= reorder_level AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM inventory_items 
           WHERE organization_id = ? AND current_stock = 0 AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM inventory_items 
           WHERE organization_id = ? AND expiry_date IS NOT NULL 
           AND expiry_date <= DATE_ADD(NOW(), INTERVAL 30 DAY) 
           AND expiry_date >= NOW() AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM purchase_orders 
           WHERE organization_id = ? AND status IN ('pending', 'approved') AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM inventory_items 
           WHERE organization_id = ? AND deleted_at IS NULL`,
          [organizationId]
        ),
      ]);

      const stats = {
        items: {
          total: parseInt(totalItemsResult[0][0]?.count || 0, 10),
          lowStock: parseInt(lowStockResult[0][0]?.count || 0, 10),
          outOfStock: parseInt(outOfStockResult[0][0]?.count || 0, 10),
          expiringSoon: parseInt(expiringResult[0][0]?.count || 0, 10),
        },
        purchaseOrders: {
          pending: parseInt(pendingPOResult[0][0]?.count || 0, 10),
        },
        organizationId,
        timestamp: new Date().toISOString(),
      };

      logger.info(`Stats: Retrieved all inventory stats for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting all inventory stats:', error);
      next(error);
    }
  }
}

export const statsController = new StatsController();

