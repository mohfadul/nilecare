/**
 * Inventory Item Model (PostgreSQL)
 * Represents stock items with quantities and batches
 */

export interface InventoryItem {
  id: string;
  
  // Item identification
  itemId: string; // Reference to medication or supply catalog
  sku: string; // Stock Keeping Unit
  itemName: string;
  itemType: 'medication' | 'supply' | 'equipment' | 'consumable';
  
  // Stock quantities
  quantityOnHand: number; // Physical stock
  quantityReserved: number; // Reserved for dispensing
  quantityAvailable: number; // Available = OnHand - Reserved
  
  // Location
  locationId: string;
  locationName: string;
  
  // Reorder settings
  reorderLevel: number;
  reorderQuantity: number;
  maxStockLevel?: number;
  
  // Status
  status: 'available' | 'low_stock' | 'out_of_stock' | 'quarantined' | 'discontinued';
  
  // Tracking
  lastRestockedDate?: Date;
  lastDispensedDate?: Date;
  
  // Version for optimistic locking
  version: number;
  
  // Multi-facility support
  facilityId: string;
  organizationId: string;
  
  // Audit fields
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockBatch {
  id: string;
  
  // References
  itemId: string;
  locationId: string;
  
  // Batch information
  batchNumber: string;
  lotNumber?: string;
  
  // Quantities
  quantityReceived: number;
  quantityOnHand: number;
  quantityReserved: number;
  quantityDispensed: number;
  
  // Dates
  manufactureDate?: Date;
  expiryDate: Date;
  receivedDate: Date;
  
  // Supplier info
  supplierId?: string;
  supplierName?: string;
  purchaseOrderReference?: string;
  
  // Cost
  unitCost?: number;
  totalCost?: number;
  currency?: string;
  
  // Status
  status: 'active' | 'expired' | 'quarantined' | 'depleted' | 'recalled';
  quarantineReason?: string;
  recallReason?: string;
  
  // Multi-facility support
  facilityId: string;
  organizationId: string;
  
  // Audit fields
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockReservation {
  id: string;
  
  // References
  itemId: string;
  batchNumber?: string;
  
  // Reservation details
  quantity: number;
  reservationType: 'medication_dispense' | 'procedure' | 'transfer' | 'other';
  reference: string; // Prescription ID, procedure ID, etc.
  
  // Status
  status: 'active' | 'committed' | 'expired' | 'rolled_back';
  
  // Timing
  reservedAt: Date;
  expiresAt: Date;
  committedAt?: Date;
  rolledBackAt?: Date;
  
  // User tracking
  reservedBy: string;
  committedBy?: string;
  rolledBackBy?: string;
  rollbackReason?: string;
  
  // Multi-facility support
  facilityId: string;
  locationId: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  
  // References
  itemId: string;
  batchNumber?: string;
  
  // Movement details
  movementType: 'receipt' | 'dispensing' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'expiry' | 'quarantine' | 'recall';
  quantityChange: number; // Positive for increase, negative for decrease
  
  // Before/after
  quantityBefore: number;
  quantityAfter: number;
  
  // Location
  fromLocationId?: string;
  toLocationId?: string;
  
  // References
  reference?: string; // Order ID, prescription ID, etc.
  medicationReference?: string;
  billingReference?: string;
  purchaseOrderReference?: string;
  
  // Reason/notes
  reason: string;
  notes?: string;
  
  // Performed by
  performedBy: string;
  performedAt: Date;
  
  // Multi-facility support
  facilityId: string;
  organizationId: string;
  
  // Audit fields
  createdAt: Date;
}

export interface CreateInventoryItemDTO {
  itemId: string;
  sku: string;
  itemName: string;
  itemType: string;
  locationId: string;
  reorderLevel: number;
  reorderQuantity: number;
  maxStockLevel?: number;
  facilityId: string;
  organizationId?: string;
  createdBy: string;
}

export interface UpdateInventoryItemDTO {
  reorderLevel?: number;
  reorderQuantity?: number;
  maxStockLevel?: number;
  status?: string;
  updatedBy: string;
}

export default InventoryItem;

