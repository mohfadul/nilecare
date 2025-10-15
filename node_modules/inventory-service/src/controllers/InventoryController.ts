import { Request, Response } from 'express';
import { InventoryService } from '../services/InventoryService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Inventory Controller
 * Handles HTTP requests for inventory operations
 */

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * RESERVE stock (Step 1 of dispensing)
   */
  reserveStock = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || 'system';
    const userRole = (req as any).user?.role || 'unknown';

    const reservation = await this.inventoryService.reserveStock({
      ...req.body,
      reservedBy: userId,
    });

    logger.info('Stock reservation created', {
      userId,
      userRole,
      reservationId: reservation.reservationId,
    });

    res.status(201).json({
      success: true,
      data: reservation,
      message: `Stock reserved successfully. Expires at ${reservation.expiresAt.toISOString()}`,
    });
  });

  /**
   * COMMIT reservation (Step 2a - success)
   */
  commitReservation = asyncHandler(async (req: Request, res: Response) => {
    const { reservationId } = req.params;
    const userId = (req as any).user?.userId || 'system';

    const result = await this.inventoryService.commitReservation({
      reservationId,
      actualQuantity: req.body.actualQuantity,
      performedBy: userId,
      notes: req.body.notes,
      facilityId: req.body.facilityId,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: `Reservation committed. ${result.quantityCommitted} units dispensed.`,
    });
  });

  /**
   * ROLLBACK reservation (Step 2b - failure)
   */
  rollbackReservation = asyncHandler(async (req: Request, res: Response) => {
    const { reservationId } = req.params;
    const userId = (req as any).user?.userId || 'system';

    const result = await this.inventoryService.rollbackReservation({
      reservationId,
      reason: req.body.reason,
      performedBy: userId,
      facilityId: req.body.facilityId,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: `Reservation rolled back. ${result.quantityReleased} units released.`,
    });
  });

  /**
   * Check stock availability
   */
  checkAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { itemId, quantity, facilityId, locationId } = req.query;

    const availability = await this.inventoryService.checkStockAvailability({
      itemId: itemId as string,
      quantity: parseInt(quantity as string),
      facilityId: facilityId as string,
      locationId: locationId as string | undefined,
    });

    res.status(200).json({
      success: true,
      data: availability,
    });
  });

  /**
   * Receive stock from purchase order
   */
  receiveStock = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || 'system';

    const result = await this.inventoryService.receiveStock({
      ...req.body,
      receivedBy: userId,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: `Stock received successfully. New quantity: ${result.newQuantityOnHand}`,
    });
  });

  /**
   * Get item stock levels
   */
  getItemStock = asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const { facilityId } = req.query;

    const stock = await this.inventoryService.getItemStockLevels(
      itemId,
      facilityId as string
    );

    res.status(200).json({
      success: true,
      data: stock,
    });
  });

  /**
   * Get low stock items
   */
  getLowStockItems = asyncHandler(async (req: Request, res: Response) => {
    const { facilityId } = req.query;

    const items = await this.inventoryService.checkLowStockItems(facilityId as string | undefined);

    res.status(200).json({
      success: true,
      data: {
        items,
        count: items.length,
      },
    });
  });

  /**
   * Get expiring batches
   */
  getExpiringBatches = asyncHandler(async (req: Request, res: Response) => {
    const { facilityId, days } = req.query;

    const batches = await this.inventoryService.checkExpiringBatches(
      facilityId as string | undefined,
      days ? parseInt(days as string) : 30
    );

    res.status(200).json({
      success: true,
      data: {
        batches,
        count: batches.length,
      },
    });
  });

  /**
   * Get stock movements
   */
  getStockMovements = asyncHandler(async (req: Request, res: Response) => {
    const { itemId, facilityId, startDate, endDate, movementType } = req.query;

    const movements = await this.inventoryService.getStockMovements({
      itemId: itemId as string | undefined,
      facilityId: facilityId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      movementType: movementType as any,
    });

    res.status(200).json({
      success: true,
      data: {
        movements,
        count: movements.length,
      },
    });
  });

  /**
   * Get stock valuation
   */
  getStockValuation = asyncHandler(async (req: Request, res: Response) => {
    const { facilityId } = req.query;

    const valuation = await this.inventoryService.getStockValuation(facilityId as string);

    res.status(200).json({
      success: true,
      data: valuation,
    });
  });

  /**
   * Adjust stock (damage, loss, count correction)
   */
  adjustStock = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || 'system';
    const userRole = (req as any).user?.role || 'unknown';

    const result = await this.inventoryService.adjustStock({
      ...req.body,
      performedBy: userId,
      userRole,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Stock adjusted successfully',
    });
  });

  /**
   * Transfer stock between locations
   */
  transferStock = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || 'system';
    const userRole = (req as any).user?.role || 'unknown';

    const result = await this.inventoryService.transferStock({
      ...req.body,
      performedBy: userId,
      userRole,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Stock transferred successfully',
    });
  });

  /**
   * Get pharmacy-specific stock report
   */
  getPharmacyStockReport = asyncHandler(async (req: Request, res: Response) => {
    const { facilityId, locationId } = req.query;

    const report = await this.inventoryService.getPharmacyStockReport(
      facilityId as string,
      locationId as string | undefined
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  });

  /**
   * Get medication-specific stock (pharmacy view)
   */
  getMedicationStock = asyncHandler(async (req: Request, res: Response) => {
    const { facilityId } = req.query;

    const medications = await this.inventoryService.getMedicationStock(facilityId as string);

    res.status(200).json({
      success: true,
      data: {
        medications,
        count: medications.length,
      },
    });
  });
}

export default InventoryController;

