import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { InventoryItem, CreateInventoryItemDTO, UpdateInventoryItemDTO } from '../models/InventoryItem';
import { NotFoundError } from '../middleware/errorHandler';

/**
 * Inventory Repository
 * Data access layer for inventory items
 */

export class InventoryRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPostgreSQLPool();
  }

  /**
   * Create new inventory item
   */
  async create(dto: CreateInventoryItemDTO): Promise<InventoryItem> {
    const query = `
      INSERT INTO inventory_items (
        item_id, sku, item_name, item_type, location_id,
        reorder_level, reorder_quantity, max_stock_level,
        facility_id, organization_id, created_by,
        quantity_on_hand, quantity_reserved, status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0, 'available', NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      dto.itemId,
      dto.sku,
      dto.itemName,
      dto.itemType,
      dto.locationId,
      dto.reorderLevel,
      dto.reorderQuantity,
      dto.maxStockLevel || null,
      dto.facilityId,
      dto.organizationId,
      dto.createdBy,
    ]);

    return this.mapRowToItem(result.rows[0]);
  }

  /**
   * Find item by ID
   */
  async findById(itemId: string, facilityId?: string): Promise<InventoryItem | null> {
    let query = `SELECT * FROM inventory_items WHERE item_id = $1`;
    const values: any[] = [itemId];

    if (facilityId) {
      query += ' AND facility_id = $2';
      values.push(facilityId);
    }

    query += ' LIMIT 1';

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? this.mapRowToItem(result.rows[0]) : null;
  }

  /**
   * Find items by facility
   */
  async findByFacility(
    facilityId: string,
    filters?: {
      status?: string;
      itemType?: string;
      locationId?: string;
      lowStock?: boolean;
    }
  ): Promise<InventoryItem[]> {
    let query = `SELECT * FROM inventory_items WHERE facility_id = $1`;
    const values: any[] = [facilityId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters?.itemType) {
      query += ` AND item_type = $${paramIndex}`;
      values.push(filters.itemType);
      paramIndex++;
    }

    if (filters?.locationId) {
      query += ` AND location_id = $${paramIndex}`;
      values.push(filters.locationId);
      paramIndex++;
    }

    if (filters?.lowStock) {
      query += ` AND quantity_available <= reorder_level`;
    }

    query += ' ORDER BY item_name ASC';

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapRowToItem(row));
  }

  /**
   * Update inventory item
   */
  async update(itemId: string, dto: UpdateInventoryItemDTO, facilityId?: string): Promise<InventoryItem | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.reorderLevel !== undefined) {
      updates.push(`reorder_level = $${paramIndex}`);
      values.push(dto.reorderLevel);
      paramIndex++;
    }

    if (dto.reorderQuantity !== undefined) {
      updates.push(`reorder_quantity = $${paramIndex}`);
      values.push(dto.reorderQuantity);
      paramIndex++;
    }

    if (dto.maxStockLevel !== undefined) {
      updates.push(`max_stock_level = $${paramIndex}`);
      values.push(dto.maxStockLevel);
      paramIndex++;
    }

    if (dto.status) {
      updates.push(`status = $${paramIndex}`);
      values.push(dto.status);
      paramIndex++;
    }

    if (dto.updatedBy) {
      updates.push(`updated_by = $${paramIndex}`);
      values.push(dto.updatedBy);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findById(itemId, facilityId);
    }

    updates.push('updated_at = NOW()');

    let query = `UPDATE inventory_items SET ${updates.join(', ')} WHERE item_id = $${paramIndex}`;
    values.push(itemId);
    paramIndex++;

    if (facilityId) {
      query += ` AND facility_id = $${paramIndex}`;
      values.push(facilityId);
    }

    query += ' RETURNING *';

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? this.mapRowToItem(result.rows[0]) : null;
  }

  /**
   * Get stock summary for location
   */
  async getLocationStockSummary(locationId: string, facilityId: string): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity_on_hand) as total_quantity,
        COUNT(CASE WHEN quantity_available <= reorder_level THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN quantity_available = 0 THEN 1 END) as out_of_stock_count
      FROM inventory_items
      WHERE location_id = $1 AND facility_id = $2
    `;

    const result = await this.pool.query(query, [locationId, facilityId]);
    const row = result.rows[0];

    return {
      totalItems: parseInt(row.total_items || '0'),
      totalValue: parseFloat(row.total_value || '0'),
      lowStockCount: parseInt(row.low_stock_count || '0'),
      outOfStockCount: parseInt(row.out_of_stock_count || '0'),
    };
  }

  /**
   * Map database row to InventoryItem
   */
  private mapRowToItem(row: any): InventoryItem {
    return {
      id: row.id,
      itemId: row.item_id,
      sku: row.sku,
      itemName: row.item_name,
      itemType: row.item_type,
      quantityOnHand: row.quantity_on_hand,
      quantityReserved: row.quantity_reserved,
      quantityAvailable: row.quantity_available,
      locationId: row.location_id,
      locationName: row.location_name,
      reorderLevel: row.reorder_level,
      reorderQuantity: row.reorder_quantity,
      maxStockLevel: row.max_stock_level,
      status: row.status,
      lastRestockedDate: row.last_restocked_date,
      lastDispensedDate: row.last_dispensed_date,
      version: row.version,
      facilityId: row.facility_id,
      organizationId: row.organization_id,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default InventoryRepository;

