import { getPostgreSQLPool, withTransaction } from '../utils/database';
import { 
  logger, 
  logStockMovement, 
  logStockReservation, 
  logStockCommit, 
  logStockRollback,
  logLowStockAlert,
  logExpiryAlert
} from '../utils/logger';
import { 
  InsufficientStockError, 
  NotFoundError, 
  ConflictError,
  ReservationExpiredError 
} from '../middleware/errorHandler';
import { MedicationServiceClient } from './integrations/MedicationServiceClient';
import { BillingServiceClient } from './integrations/BillingServiceClient';

/**
 * Inventory Service
 * Core service handling stock reservations, movements, and availability
 * CRITICAL: Supports atomic reserve/commit/rollback pattern for dispensing
 */

export class InventoryService {
  private pool;
  private medicationClient: MedicationServiceClient;
  private billingClient: BillingServiceClient;

  constructor() {
    this.pool = getPostgreSQLPool();
    this.medicationClient = new MedicationServiceClient();
    this.billingClient = new BillingServiceClient();
  }

  /**
   * RESERVE STOCK (Step 1 of dispensing workflow)
   * Atomically reserves stock for later commitment
   * 
   * @returns reservationId for later commit or rollback
   */
  async reserveStock(params: {
    itemId: string;
    quantity: number;
    reservationType: 'medication_dispense' | 'procedure' | 'transfer' | 'other';
    reference: string; // Prescription ID, etc.
    expiresInMinutes?: number;
    batchNumber?: string;
    facilityId: string;
    locationId?: string;
    reservedBy: string;
  }): Promise<{
    reservationId: string;
    itemId: string;
    quantity: number;
    expiresAt: Date;
    batchNumber?: string;
  }> {
    const expiresInMinutes = params.expiresInMinutes || 30;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Use transaction for atomic operation
    return withTransaction(async (client) => {
      // 1. Lock the item row (pessimistic lock)
      const itemQuery = `
        SELECT * FROM inventory_items
        WHERE item_id = $1 AND facility_id = $2
        FOR UPDATE
      `;
      
      const itemResult = await client.query(itemQuery, [params.itemId, params.facilityId]);

      if (itemResult.rows.length === 0) {
        throw new NotFoundError(`Inventory item not found: ${params.itemId}`);
      }

      const item = itemResult.rows[0];
      const availableStock = item.quantity_on_hand - item.quantity_reserved;

      // 2. Check sufficient stock
      if (availableStock < params.quantity) {
        throw new InsufficientStockError(
          `Insufficient stock for ${item.item_name}. Available: ${availableStock}, Requested: ${params.quantity}`
        );
      }

      // 3. Create reservation
      const reservationQuery = `
        INSERT INTO stock_reservations (
          id, item_id, quantity, reservation_type, reference,
          status, reserved_at, expires_at, reserved_by,
          facility_id, location_id, batch_number,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 'active', NOW(), $5, $6, $7, $8, $9, NOW(), NOW()
        )
        RETURNING *
      `;

      const reservationResult = await client.query(reservationQuery, [
        params.itemId,
        params.quantity,
        params.reservationType,
        params.reference,
        expiresAt,
        params.reservedBy,
        params.facilityId,
        params.locationId || item.location_id,
        params.batchNumber || null,
      ]);

      const reservation = reservationResult.rows[0];

      // 4. Update inventory item (increase reserved quantity)
      const updateQuery = `
        UPDATE inventory_items
        SET quantity_reserved = quantity_reserved + $1,
            quantity_available = quantity_on_hand - (quantity_reserved + $1),
            updated_at = NOW(),
            version = version + 1
        WHERE item_id = $2 AND facility_id = $3
        RETURNING *
      `;

      await client.query(updateQuery, [params.quantity, params.itemId, params.facilityId]);

      // 5. Log reservation
      logStockReservation({
        userId: params.reservedBy,
        itemId: params.itemId,
        itemName: item.item_name,
        quantity: params.quantity,
        reservationType: params.reservationType,
        reference: params.reference,
        expiresAt,
        facilityId: params.facilityId,
      });

      logger.info('Stock reserved successfully', {
        reservationId: reservation.id,
        itemId: params.itemId,
        quantity: params.quantity,
        expiresAt,
      });

      return {
        reservationId: reservation.id,
        itemId: params.itemId,
        quantity: params.quantity,
        expiresAt,
        batchNumber: params.batchNumber,
      };
    });
  }

  /**
   * COMMIT RESERVATION (Step 2 - after successful dispensing)
   * Commits the reservation and decrements actual stock
   */
  async commitReservation(params: {
    reservationId: string;
    actualQuantity?: number; // Can be less than reserved if partial
    performedBy: string;
    notes?: string;
    facilityId: string;
  }): Promise<{
    success: boolean;
    quantityCommitted: number;
  }> {
    return withTransaction(async (client) => {
      // 1. Get and lock reservation
      const reservationQuery = `
        SELECT * FROM stock_reservations
        WHERE id = $1 AND facility_id = $2
        FOR UPDATE
      `;

      const reservationResult = await client.query(reservationQuery, [
        params.reservationId,
        params.facilityId,
      ]);

      if (reservationResult.rows.length === 0) {
        throw new NotFoundError(`Reservation not found: ${params.reservationId}`);
      }

      const reservation = reservationResult.rows[0];

      // 2. Validate reservation status
      if (reservation.status !== 'active') {
        throw new ConflictError(`Reservation already ${reservation.status}`);
      }

      if (new Date() > new Date(reservation.expires_at)) {
        throw new ReservationExpiredError('Reservation has expired');
      }

      const quantityToCommit = params.actualQuantity || reservation.quantity;

      if (quantityToCommit > reservation.quantity) {
        throw new ConflictError('Cannot commit more than reserved quantity');
      }

      // 3. Get and lock item
      const itemQuery = `
        SELECT * FROM inventory_items
        WHERE item_id = $1 AND facility_id = $2
        FOR UPDATE
      `;

      const itemResult = await client.query(itemQuery, [reservation.item_id, params.facilityId]);
      const item = itemResult.rows[0];

      // 4. Update reservation status
      const updateReservationQuery = `
        UPDATE stock_reservations
        SET status = 'committed',
            committed_at = NOW(),
            committed_by = $1,
            updated_at = NOW()
        WHERE id = $2
      `;

      await client.query(updateReservationQuery, [params.performedBy, params.reservationId]);

      // 5. Decrement stock (both on_hand and reserved)
      const updateStockQuery = `
        UPDATE inventory_items
        SET quantity_on_hand = quantity_on_hand - $1,
            quantity_reserved = quantity_reserved - $2,
            quantity_available = (quantity_on_hand - $1) - (quantity_reserved - $2),
            last_dispensed_date = NOW(),
            updated_at = NOW(),
            version = version + 1
        WHERE item_id = $3 AND facility_id = $4
        RETURNING *
      `;

      await client.query(updateStockQuery, [
        quantityToCommit,
        reservation.quantity,
        reservation.item_id,
        params.facilityId,
      ]);

      // 6. Create stock movement record
      const movementQuery = `
        INSERT INTO stock_movements (
          id, item_id, movement_type, quantity_change,
          quantity_before, quantity_after,
          reason, reference, performed_by, performed_at,
          facility_id, location_id, batch_number, notes,
          created_at
        ) VALUES (
          gen_random_uuid(), $1, 'dispensing', $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11, NOW()
        )
      `;

      await client.query(movementQuery, [
        reservation.item_id,
        -quantityToCommit, // Negative for decrease
        item.quantity_on_hand,
        item.quantity_on_hand - quantityToCommit,
        'Committed from reservation',
        reservation.reference,
        params.performedBy,
        params.facilityId,
        reservation.location_id,
        reservation.batch_number,
        params.notes || null,
      ]);

      // 7. Log commit
      logStockCommit({
        userId: params.performedBy,
        reservationId: params.reservationId,
        itemId: reservation.item_id,
        quantity: quantityToCommit,
        reference: reservation.reference,
        facilityId: params.facilityId,
      });

      logger.info('Reservation committed successfully', {
        reservationId: params.reservationId,
        quantityCommitted: quantityToCommit,
      });

      return {
        success: true,
        quantityCommitted: quantityToCommit,
      };
    });
  }

  /**
   * ROLLBACK RESERVATION (if dispensing fails)
   * Releases the reserved stock back to available
   */
  async rollbackReservation(params: {
    reservationId: string;
    reason: string;
    performedBy: string;
    facilityId: string;
  }): Promise<{
    success: boolean;
    quantityReleased: number;
  }> {
    return withTransaction(async (client) => {
      // 1. Get and lock reservation
      const reservationQuery = `
        SELECT * FROM stock_reservations
        WHERE id = $1 AND facility_id = $2
        FOR UPDATE
      `;

      const reservationResult = await client.query(reservationQuery, [
        params.reservationId,
        params.facilityId,
      ]);

      if (reservationResult.rows.length === 0) {
        throw new NotFoundError(`Reservation not found: ${params.reservationId}`);
      }

      const reservation = reservationResult.rows[0];

      if (reservation.status !== 'active') {
        throw new ConflictError(`Reservation already ${reservation.status}`);
      }

      // 2. Update reservation status
      const updateReservationQuery = `
        UPDATE stock_reservations
        SET status = 'rolled_back',
            rolled_back_at = NOW(),
            rolled_back_by = $1,
            rollback_reason = $2,
            updated_at = NOW()
        WHERE id = $3
      `;

      await client.query(updateReservationQuery, [
        params.performedBy,
        params.reason,
        params.reservationId,
      ]);

      // 3. Release reserved quantity
      const updateStockQuery = `
        UPDATE inventory_items
        SET quantity_reserved = quantity_reserved - $1,
            quantity_available = quantity_on_hand - (quantity_reserved - $1),
            updated_at = NOW(),
            version = version + 1
        WHERE item_id = $2 AND facility_id = $3
      `;

      await client.query(updateStockQuery, [
        reservation.quantity,
        reservation.item_id,
        params.facilityId,
      ]);

      // 4. Log rollback
      logStockRollback({
        userId: params.performedBy,
        reservationId: params.reservationId,
        itemId: reservation.item_id,
        quantity: reservation.quantity,
        reason: params.reason,
        facilityId: params.facilityId,
      });

      logger.info('Reservation rolled back successfully', {
        reservationId: params.reservationId,
        quantityReleased: reservation.quantity,
        reason: params.reason,
      });

      return {
        success: true,
        quantityReleased: reservation.quantity,
      };
    });
  }

  /**
   * Check stock availability (no reservation)
   */
  async checkStockAvailability(params: {
    itemId: string;
    quantity: number;
    facilityId: string;
    locationId?: string;
  }): Promise<{
    available: boolean;
    quantityOnHand: number;
    quantityReserved: number;
    quantityAvailable: number;
  }> {
    let query = `
      SELECT quantity_on_hand, quantity_reserved, quantity_available
      FROM inventory_items
      WHERE item_id = $1 AND facility_id = $2
    `;

    const values: any[] = [params.itemId, params.facilityId];

    if (params.locationId) {
      query += ' AND location_id = $3';
      values.push(params.locationId);
    }

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      return {
        available: false,
        quantityOnHand: 0,
        quantityReserved: 0,
        quantityAvailable: 0,
      };
    }

    const item = result.rows[0];

    return {
      available: item.quantity_available >= params.quantity,
      quantityOnHand: item.quantity_on_hand,
      quantityReserved: item.quantity_reserved,
      quantityAvailable: item.quantity_available,
    };
  }

  /**
   * Receive stock (from purchase order)
   */
  async receiveStock(params: {
    itemId: string;
    quantity: number;
    batchNumber: string;
    expiryDate: Date;
    locationId: string;
    supplierId?: string;
    purchaseOrderReference?: string;
    unitCost?: number;
    notes?: string;
    facilityId: string;
    receivedBy: string;
  }): Promise<{
    success: boolean;
    batchId: string;
    newQuantityOnHand: number;
  }> {
    return withTransaction(async (client) => {
      // 1. Create batch record
      const batchQuery = `
        INSERT INTO stock_batches (
          id, item_id, location_id, batch_number,
          quantity_received, quantity_on_hand, quantity_reserved, quantity_dispensed,
          expiry_date, received_date,
          supplier_id, purchase_order_reference, unit_cost,
          status, facility_id, organization_id, created_by,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $4, 0, 0, $5, NOW(), $6, $7, $8,
          'active', $9, $10, $11, NOW(), NOW()
        )
        RETURNING id
      `;

      const batchResult = await client.query(batchQuery, [
        params.itemId,
        params.locationId,
        params.batchNumber,
        params.quantity,
        params.expiryDate,
        params.supplierId || null,
        params.purchaseOrderReference || null,
        params.unitCost || null,
        params.facilityId,
        (await client.query('SELECT organization_id FROM inventory_items WHERE item_id = $1 LIMIT 1', [params.itemId])).rows[0]?.organization_id || null,
        params.receivedBy,
      ]);

      const batchId = batchResult.rows[0].id;

      // 2. Update inventory item quantities
      const updateQuery = `
        UPDATE inventory_items
        SET quantity_on_hand = quantity_on_hand + $1,
            quantity_available = quantity_available + $1,
            last_restocked_date = NOW(),
            status = CASE 
              WHEN (quantity_on_hand + $1) > reorder_level THEN 'available'
              ELSE status
            END,
            updated_at = NOW(),
            version = version + 1
        WHERE item_id = $2 AND facility_id = $3
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        params.quantity,
        params.itemId,
        params.facilityId,
      ]);

      const updatedItem = updateResult.rows[0];

      // 3. Create movement record
      const movementQuery = `
        INSERT INTO stock_movements (
          id, item_id, movement_type, quantity_change,
          quantity_before, quantity_after,
          to_location_id, reason, reference,
          performed_by, performed_at,
          facility_id, batch_number, notes,
          created_at
        ) VALUES (
          gen_random_uuid(), $1, 'receipt', $2, $3, $4, $5, 'Stock receipt', $6, $7, NOW(), $8, $9, $10, NOW()
        )
      `;

      await client.query(movementQuery, [
        params.itemId,
        params.quantity,
        updatedItem.quantity_on_hand - params.quantity,
        updatedItem.quantity_on_hand,
        params.locationId,
        params.purchaseOrderReference || null,
        params.receivedBy,
        params.facilityId,
        params.batchNumber,
        params.notes || null,
      ]);

      // 4. Log movement
      logStockMovement({
        userId: params.receivedBy,
        userRole: 'stock_manager',
        itemId: params.itemId,
        itemName: updatedItem.item_name,
        movementType: 'receipt',
        quantityChange: params.quantity,
        batchNumber: params.batchNumber,
        toLocation: params.locationId,
        reference: params.purchaseOrderReference,
        facilityId: params.facilityId,
      });

      logger.info('Stock received successfully', {
        itemId: params.itemId,
        quantity: params.quantity,
        batchNumber: params.batchNumber,
        newQuantityOnHand: updatedItem.quantity_on_hand,
      });

      return {
        success: true,
        batchId,
        newQuantityOnHand: updatedItem.quantity_on_hand,
      };
    });
  }

  /**
   * Check low stock items
   */
  async checkLowStockItems(facilityId?: string): Promise<any[]> {
    let query = `
      SELECT * FROM inventory_items
      WHERE quantity_available <= reorder_level
        AND status != 'discontinued'
    `;

    const values: any[] = [];

    if (facilityId) {
      query += ' AND facility_id = $1';
      values.push(facilityId);
    }

    query += ' ORDER BY (reorder_level - quantity_available) DESC';

    const result = await this.pool.query(query, values);

    // Log low stock alerts
    result.rows.forEach((item) => {
      logLowStockAlert({
        itemId: item.item_id,
        itemName: item.item_name,
        currentStock: item.quantity_available,
        reorderLevel: item.reorder_level,
        facilityId: item.facility_id,
        locationId: item.location_id,
      });
    });

    return result.rows;
  }

  /**
   * Check expiring batches
   */
  async checkExpiringBatches(facilityId?: string, daysUntilExpiry: number = 30): Promise<any[]> {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysUntilExpiry);

    let query = `
      SELECT b.*, i.item_name
      FROM stock_batches b
      JOIN inventory_items i ON b.item_id = i.item_id
      WHERE b.expiry_date <= $1
        AND b.expiry_date > NOW()
        AND b.status = 'active'
        AND b.quantity_on_hand > 0
    `;

    const values: any[] = [expiryThreshold];

    if (facilityId) {
      query += ' AND b.facility_id = $2';
      values.push(facilityId);
    }

    query += ' ORDER BY b.expiry_date ASC';

    const result = await this.pool.query(query, values);

    // Log expiry alerts
    result.rows.forEach((batch) => {
      const daysRemaining = Math.floor(
        (new Date(batch.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      logExpiryAlert({
        itemId: batch.item_id,
        itemName: batch.item_name,
        batchNumber: batch.batch_number,
        expiryDate: new Date(batch.expiry_date),
        quantityInBatch: batch.quantity_on_hand,
        facilityId: batch.facility_id,
        locationId: batch.location_id,
        daysUntilExpiry: daysRemaining,
      });
    });

    return result.rows;
  }

  /**
   * Get item stock levels
   */
  async getItemStockLevels(itemId: string, facilityId: string): Promise<any> {
    const query = `
      SELECT i.*, 
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'batchNumber', b.batch_number,
              'quantity', b.quantity_on_hand,
              'expiryDate', b.expiry_date,
              'status', b.status
            )
          ) FROM stock_batches b 
          WHERE b.item_id = i.item_id AND b.facility_id = i.facility_id AND b.status = 'active'
        ), '[]'::json) as batches
      FROM inventory_items i
      WHERE i.item_id = $1 AND i.facility_id = $2
    `;

    const result = await this.pool.query(query, [itemId, facilityId]);
    return result.rows[0] || null;
  }

  /**
   * Get stock movements
   */
  async getStockMovements(filters: {
    itemId?: string;
    facilityId: string;
    startDate?: Date;
    endDate?: Date;
    movementType?: string;
  }): Promise<any[]> {
    let query = `
      SELECT m.*, i.item_name
      FROM stock_movements m
      JOIN inventory_items i ON m.item_id = i.item_id AND m.facility_id = i.facility_id
      WHERE m.facility_id = $1
    `;

    const values: any[] = [filters.facilityId];
    let paramIndex = 2;

    if (filters.itemId) {
      query += ` AND m.item_id = $${paramIndex}`;
      values.push(filters.itemId);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND m.performed_at >= $${paramIndex}`;
      values.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND m.performed_at <= $${paramIndex}`;
      values.push(filters.endDate);
      paramIndex++;
    }

    if (filters.movementType) {
      query += ` AND m.movement_type = $${paramIndex}`;
      values.push(filters.movementType);
      paramIndex++;
    }

    query += ' ORDER BY m.performed_at DESC LIMIT 100';

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Get stock valuation
   */
  async getStockValuation(facilityId: string): Promise<any> {
    const query = `
      SELECT * FROM stock_valuation
      WHERE facility_id = $1
      ORDER BY total_value DESC
    `;

    const result = await this.pool.query(query, [facilityId]);
    
    const totalValue = result.rows.reduce((sum, row) => sum + parseFloat(row.total_value || '0'), 0);

    return {
      items: result.rows,
      summary: {
        totalItems: result.rows.length,
        totalValue,
        currency: 'SDG',
      },
    };
  }

  /**
   * Adjust stock (damage, loss, count correction)
   */
  async adjustStock(params: {
    itemId: string;
    quantityChange: number;
    reason: string;
    reasonDetails?: string;
    batchNumber?: string;
    locationId: string;
    facilityId: string;
    performedBy: string;
    userRole: string;
  }): Promise<any> {
    return withTransaction(async (client) => {
      // Lock item
      const itemQuery = `
        SELECT * FROM inventory_items
        WHERE item_id = $1 AND facility_id = $2
        FOR UPDATE
      `;

      const itemResult = await client.query(itemQuery, [params.itemId, params.facilityId]);
      if (itemResult.rows.length === 0) {
        throw new NotFoundError(`Item not found: ${params.itemId}`);
      }

      const item = itemResult.rows[0];

      // Check if negative adjustment would result in negative stock
      if (params.quantityChange < 0 && (item.quantity_on_hand + params.quantityChange) < 0) {
        throw new InsufficientStockError('Adjustment would result in negative stock');
      }

      // Update stock
      const updateQuery = `
        UPDATE inventory_items
        SET quantity_on_hand = quantity_on_hand + $1,
            updated_at = NOW(),
            version = version + 1
        WHERE item_id = $2 AND facility_id = $3
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        params.quantityChange,
        params.itemId,
        params.facilityId,
      ]);

      const updatedItem = updateResult.rows[0];

      // Create movement record
      const movementQuery = `
        INSERT INTO stock_movements (
          id, item_id, movement_type, quantity_change,
          quantity_before, quantity_after,
          reason, notes, performed_by, performed_at,
          facility_id, location_id, batch_number, organization_id,
          created_at
        ) VALUES (
          gen_random_uuid(), $1, 'adjustment', $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11, NOW()
        )
      `;

      await client.query(movementQuery, [
        params.itemId,
        params.quantityChange,
        item.quantity_on_hand,
        updatedItem.quantity_on_hand,
        params.reason,
        params.reasonDetails || null,
        params.performedBy,
        params.facilityId,
        params.locationId,
        params.batchNumber || null,
        item.organization_id,
      ]);

      // Log movement
      logStockMovement({
        userId: params.performedBy,
        userRole: params.userRole,
        itemId: params.itemId,
        itemName: item.item_name,
        movementType: 'adjustment',
        quantityChange: params.quantityChange,
        batchNumber: params.batchNumber,
        reference: params.reason,
        facilityId: params.facilityId,
      });

      return {
        success: true,
        quantityChange: params.quantityChange,
        newQuantity: updatedItem.quantity_on_hand,
      };
    });
  }

  /**
   * Transfer stock between locations
   */
  async transferStock(params: {
    itemId: string;
    quantity: number;
    fromLocationId: string;
    toLocationId: string;
    batchNumber?: string;
    notes?: string;
    facilityId: string;
    performedBy: string;
    userRole: string;
  }): Promise<any> {
    return withTransaction(async (client) => {
      // Reduce from source location
      const reduceQuery = `
        UPDATE inventory_items
        SET quantity_on_hand = quantity_on_hand - $1,
            updated_at = NOW(),
            version = version + 1
        WHERE item_id = $2 AND location_id = $3 AND facility_id = $4
        RETURNING *
      `;

      const reduceResult = await client.query(reduceQuery, [
        params.quantity,
        params.itemId,
        params.fromLocationId,
        params.facilityId,
      ]);

      if (reduceResult.rows.length === 0) {
        throw new NotFoundError('Source item not found');
      }

      // Increase at destination (create or update)
      const increaseQuery = `
        INSERT INTO inventory_items (
          item_id, sku, item_name, item_type, location_id,
          quantity_on_hand, quantity_reserved, reorder_level, reorder_quantity,
          facility_id, organization_id, created_by, status
        )
        SELECT item_id, sku, item_name, item_type, $1, $2, 0, reorder_level, reorder_quantity,
               facility_id, organization_id, $3, status
        FROM inventory_items
        WHERE item_id = $4 AND location_id = $5 AND facility_id = $6
        ON CONFLICT (item_id, location_id, facility_id)
        DO UPDATE SET
          quantity_on_hand = inventory_items.quantity_on_hand + $2,
          updated_at = NOW(),
          version = inventory_items.version + 1
        RETURNING *
      `;

      await client.query(increaseQuery, [
        params.toLocationId,
        params.quantity,
        params.performedBy,
        params.itemId,
        params.fromLocationId,
        params.facilityId,
      ]);

      // Create movement record
      const movementQuery = `
        INSERT INTO stock_movements (
          id, item_id, movement_type, quantity_change,
          quantity_before, quantity_after,
          from_location_id, to_location_id,
          reason, notes, performed_by, performed_at,
          facility_id, batch_number, organization_id,
          created_at
        ) VALUES (
          gen_random_uuid(), $1, 'transfer', $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, $12, NOW()
        )
      `;

      const item = reduceResult.rows[0];

      await client.query(movementQuery, [
        params.itemId,
        params.quantity,
        item.quantity_on_hand + params.quantity,
        item.quantity_on_hand,
        params.fromLocationId,
        params.toLocationId,
        'Stock transfer',
        params.notes || null,
        params.performedBy,
        params.facilityId,
        params.batchNumber || null,
        item.organization_id,
      ]);

      // Log transfer
      logStockMovement({
        userId: params.performedBy,
        userRole: params.userRole,
        itemId: params.itemId,
        itemName: item.item_name,
        movementType: 'transfer',
        quantityChange: params.quantity,
        fromLocation: params.fromLocationId,
        toLocation: params.toLocationId,
        batchNumber: params.batchNumber,
        facilityId: params.facilityId,
      });

      return {
        success: true,
        quantity: params.quantity,
      };
    });
  }

  /**
   * Get pharmacy stock report (medication-focused)
   */
  async getPharmacyStockReport(facilityId: string, locationId?: string): Promise<any> {
    let query = `
      SELECT 
        i.item_id,
        i.sku,
        i.item_name,
        i.item_type,
        i.quantity_on_hand,
        i.quantity_reserved,
        i.quantity_available,
        i.reorder_level,
        i.status,
        l.location_name,
        l.location_type,
        COALESCE(
          (SELECT COUNT(*) FROM stock_batches b 
           WHERE b.item_id = i.item_id AND b.facility_id = i.facility_id AND b.status = 'active'),
          0
        ) as active_batch_count,
        COALESCE(
          (SELECT MIN(b.expiry_date) FROM stock_batches b 
           WHERE b.item_id = i.item_id AND b.facility_id = i.facility_id AND b.status = 'active'),
          NULL
        ) as earliest_expiry
      FROM inventory_items i
      JOIN locations l ON i.location_id = l.id
      WHERE i.facility_id = $1
    `;

    const values: any[] = [facilityId];

    if (locationId) {
      query += ' AND i.location_id = $2';
      values.push(locationId);
    }

    query += ` AND l.location_type IN ('pharmacy', 'ward')`;
    query += ' ORDER BY i.item_name ASC';

    const result = await this.pool.query(query, values);

    const summary = {
      totalMedications: result.rows.length,
      lowStock: result.rows.filter(r => r.quantity_available <= r.reorder_level).length,
      outOfStock: result.rows.filter(r => r.quantity_available === 0).length,
      expiringSoon: result.rows.filter(r => {
        if (!r.earliest_expiry) return false;
        const daysUntil = Math.floor((new Date(r.earliest_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 30;
      }).length,
    };

    return {
      items: result.rows,
      summary,
    };
  }

  /**
   * Get medication stock (pharmacy-specific view)
   */
  async getMedicationStock(facilityId: string): Promise<any[]> {
    const query = `
      SELECT 
        i.*,
        l.location_name,
        l.location_type,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'batchNumber', b.batch_number,
              'quantity', b.quantity_on_hand,
              'expiryDate', b.expiry_date,
              'unitCost', b.unit_cost,
              'status', b.status
            ) ORDER BY b.expiry_date ASC
          ) FROM stock_batches b 
          WHERE b.item_id = i.item_id AND b.facility_id = i.facility_id AND b.status = 'active'
        ), '[]'::json) as batches
      FROM inventory_items i
      JOIN locations l ON i.location_id = l.id
      WHERE i.facility_id = $1 
        AND i.item_type = 'medication'
        AND i.status != 'discontinued'
      ORDER BY i.item_name ASC
    `;

    const result = await this.pool.query(query, [facilityId]);
    return result.rows;
  }

  /**
   * Auto-reserve from prescription (called by Medication Service)
   */
  async autoReserveForPrescription(params: {
    prescriptionId: string;
    medicationId: string;
    quantity: number;
    facilityId: string;
    prescribedBy: string;
  }): Promise<{
    reserved: boolean;
    reservationId?: string;
    reason?: string;
  }> {
    try {
      const reservation = await this.reserveStock({
        itemId: params.medicationId,
        quantity: params.quantity,
        reservationType: 'medication_dispense',
        reference: params.prescriptionId,
        expiresInMinutes: 60, // Longer expiry for prescriptions
        facilityId: params.facilityId,
        reservedBy: params.prescribedBy,
      });

      // Notify medication service
      await this.medicationClient.notifyStockUpdate({
        medicationId: params.medicationId,
        facilityId: params.facilityId,
        quantityAvailable: 0, // Will be updated
        lowStock: false,
      });

      return {
        reserved: true,
        reservationId: reservation.reservationId,
      };
    } catch (error: any) {
      logger.error('Auto-reserve failed', { error: error.message, prescriptionId: params.prescriptionId });
      return {
        reserved: false,
        reason: error.message,
      };
    }
  }

  /**
   * Auto-release if prescription canceled
   */
  async autoReleaseForCanceledPrescription(params: {
    prescriptionId: string;
    facilityId: string;
    canceledBy: string;
  }): Promise<boolean> {
    try {
      // Find active reservation for this prescription
      const query = `
        SELECT id FROM stock_reservations
        WHERE reference = $1 AND facility_id = $2 AND status = 'active'
        LIMIT 1
      `;

      const result = await this.pool.query(query, [params.prescriptionId, params.facilityId]);

      if (result.rows.length === 0) {
        logger.warn('No active reservation found for canceled prescription', {
          prescriptionId: params.prescriptionId,
        });
        return false;
      }

      // Rollback the reservation
      await this.rollbackReservation({
        reservationId: result.rows[0].id,
        reason: 'Prescription canceled',
        performedBy: params.canceledBy,
        facilityId: params.facilityId,
      });

      return true;
    } catch (error: any) {
      logger.error('Auto-release failed', { error: error.message });
      return false;
    }
  }
}

export default InventoryService;

