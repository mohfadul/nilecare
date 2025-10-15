-- ============================================================================
-- Inventory Service - Database Schema (PostgreSQL)
-- Version: 1.0.0
-- Description: Authoritative schema for stock, batches, movements, reservations
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. INVENTORY_ITEMS TABLE (Stock Levels)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Item Identification
  item_id UUID NOT NULL, -- Reference to medication or supply catalog
  sku VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('medication', 'supply', 'equipment', 'consumable')),
  
  -- Stock Quantities (CRITICAL FIELDS)
  quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  
  -- Location
  location_id UUID NOT NULL,
  location_name VARCHAR(255),
  
  -- Reorder Settings
  reorder_level INTEGER NOT NULL DEFAULT 10,
  reorder_quantity INTEGER NOT NULL DEFAULT 50,
  max_stock_level INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'low_stock', 'out_of_stock', 'quarantined', 'discontinued')),
  
  -- Tracking
  last_restocked_date TIMESTAMP,
  last_dispensed_date TIMESTAMP,
  
  -- Optimistic Locking
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Multi-facility Support
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_item_location_facility UNIQUE (item_id, location_id, facility_id),
  CONSTRAINT check_reserved_not_exceed_onhand CHECK (quantity_reserved <= quantity_on_hand),
  
  -- Indexes
  INDEX idx_inventory_items_item (item_id),
  INDEX idx_inventory_items_sku (sku),
  INDEX idx_inventory_items_location (location_id),
  INDEX idx_inventory_items_facility (facility_id),
  INDEX idx_inventory_items_status (status),
  INDEX idx_inventory_items_low_stock (facility_id, status) WHERE quantity_available <= reorder_level,
  INDEX idx_inventory_items_available (facility_id, item_id, quantity_available)
);

-- ============================================================================
-- 2. STOCK_BATCHES TABLE (Batch Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  item_id UUID NOT NULL,
  location_id UUID NOT NULL,
  
  -- Batch Identification
  batch_number VARCHAR(100) NOT NULL,
  lot_number VARCHAR(100),
  
  -- Quantities
  quantity_received INTEGER NOT NULL,
  quantity_on_hand INTEGER NOT NULL,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  quantity_dispensed INTEGER NOT NULL DEFAULT 0,
  
  -- Dates
  manufacture_date DATE,
  expiry_date DATE NOT NULL,
  received_date TIMESTAMP NOT NULL,
  
  -- Supplier Information
  supplier_id UUID,
  supplier_name VARCHAR(255),
  purchase_order_reference VARCHAR(100),
  
  -- Cost
  unit_cost DECIMAL(12, 2),
  total_cost DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'SDG',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'quarantined', 'depleted', 'recalled')),
  quarantine_reason TEXT,
  recall_reason TEXT,
  quarantine_date TIMESTAMP,
  recall_date TIMESTAMP,
  
  -- Multi-facility Support
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_batch_location UNIQUE (batch_number, location_id, facility_id),
  
  -- Indexes
  INDEX idx_batches_item (item_id),
  INDEX idx_batches_batch_number (batch_number),
  INDEX idx_batches_expiry (expiry_date),
  INDEX idx_batches_facility (facility_id),
  INDEX idx_batches_status (status),
  INDEX idx_batches_expiring (facility_id, expiry_date) WHERE status = 'active' AND expiry_date > CURRENT_DATE,
  INDEX idx_batches_supplier (supplier_id)
);

-- ============================================================================
-- 3. STOCK_RESERVATIONS TABLE (Reservation Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  item_id UUID NOT NULL,
  batch_number VARCHAR(100),
  
  -- Reservation Details
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reservation_type VARCHAR(50) NOT NULL CHECK (reservation_type IN ('medication_dispense', 'procedure', 'transfer', 'other')),
  reference VARCHAR(255) NOT NULL, -- Prescription ID, etc.
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'committed', 'expired', 'rolled_back')),
  
  -- Timing
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  committed_at TIMESTAMP,
  rolled_back_at TIMESTAMP,
  
  -- User Tracking
  reserved_by UUID NOT NULL,
  committed_by UUID,
  rolled_back_by UUID,
  rollback_reason TEXT,
  
  -- Multi-facility Support
  facility_id UUID NOT NULL,
  location_id UUID NOT NULL,
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_reservations_item (item_id),
  INDEX idx_reservations_status (status),
  INDEX idx_reservations_facility (facility_id),
  INDEX idx_reservations_reference (reference),
  INDEX idx_reservations_active (facility_id, status, expires_at) WHERE status = 'active',
  INDEX idx_reservations_expires (expires_at) WHERE status = 'active'
);

-- ============================================================================
-- 4. STOCK_MOVEMENTS TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  item_id UUID NOT NULL,
  batch_number VARCHAR(100),
  
  -- Movement Details
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('receipt', 'dispensing', 'adjustment', 'transfer', 'return', 'damage', 'expiry', 'quarantine', 'recall')),
  quantity_change INTEGER NOT NULL, -- Positive for increase, negative for decrease
  
  -- Before/After Quantities
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  
  -- Location
  from_location_id UUID,
  to_location_id UUID,
  
  -- References
  reference VARCHAR(255), -- Order ID, etc.
  medication_reference UUID,
  billing_reference UUID,
  purchase_order_reference VARCHAR(100),
  
  -- Reason/Notes
  reason VARCHAR(500) NOT NULL,
  notes TEXT,
  
  -- Performed By
  performed_by UUID NOT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Multi-facility Support
  facility_id UUID NOT NULL,
  location_id UUID,
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_movements_item (item_id),
  INDEX idx_movements_type (movement_type),
  INDEX idx_movements_facility (facility_id),
  INDEX idx_movements_location (location_id),
  INDEX idx_movements_reference (reference),
  INDEX idx_movements_performed_at (performed_at DESC),
  INDEX idx_movements_batch (batch_number)
);

-- ============================================================================
-- 5. LOCATIONS TABLE (Storage Locations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location Details
  location_code VARCHAR(50) UNIQUE NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  location_type VARCHAR(50) CHECK (location_type IN ('pharmacy', 'ward', 'storage', 'refrigerator', 'controlled_substances', 'quarantine', 'other')),
  
  -- Physical Details
  temperature_controlled BOOLEAN DEFAULT FALSE,
  temperature_min DECIMAL(5, 2),
  temperature_max DECIMAL(5, 2),
  humidity_controlled BOOLEAN DEFAULT FALSE,
  
  -- Access Control
  requires_authorization BOOLEAN DEFAULT FALSE,
  authorized_roles TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  
  -- Multi-facility Support
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_locations_code (location_code),
  INDEX idx_locations_facility (facility_id),
  INDEX idx_locations_type (location_type),
  INDEX idx_locations_status (status)
);

-- ============================================================================
-- 6. INVENTORY_AUDIT_LOG TABLE (Comprehensive Audit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action Details
  action VARCHAR(50) NOT NULL, -- reserve, commit, rollback, receive, adjust, transfer
  entity_type VARCHAR(50) NOT NULL, -- inventory_item, batch, reservation, movement
  entity_id UUID NOT NULL,
  
  -- User Context
  user_id UUID NOT NULL,
  user_role VARCHAR(50),
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  delta JSONB, -- Quantity changes, etc.
  
  -- Context
  item_id UUID,
  batch_number VARCHAR(100),
  facility_id UUID NOT NULL,
  location_id UUID,
  organization_id UUID NOT NULL,
  
  -- Additional Info
  reason TEXT,
  reference VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_inv_audit_entity (entity_type, entity_id),
  INDEX idx_inv_audit_user (user_id),
  INDEX idx_inv_audit_facility (facility_id),
  INDEX idx_inv_audit_item (item_id),
  INDEX idx_inv_audit_action (action),
  INDEX idx_inv_audit_created (created_at DESC)
);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_batches_updated_at
  BEFORE UPDATE ON stock_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_reservations_updated_at
  BEFORE UPDATE ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTO-EXPIRE RESERVATIONS (Scheduled Job)
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Find and expire old reservations
  WITH expired AS (
    UPDATE stock_reservations
    SET status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'active'
      AND expires_at < CURRENT_TIMESTAMP
    RETURNING id, item_id, quantity, facility_id
  )
  -- Release reserved quantities
  UPDATE inventory_items i
  SET quantity_reserved = quantity_reserved - e.quantity,
      updated_at = CURRENT_TIMESTAMP,
      version = version + 1
  FROM expired e
  WHERE i.item_id = e.item_id
    AND i.facility_id = e.facility_id;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Low stock view
CREATE OR REPLACE VIEW low_stock_items AS
SELECT 
  i.*,
  l.location_name,
  (i.reorder_level - i.quantity_available) as shortage
FROM inventory_items i
JOIN locations l ON i.location_id = l.id
WHERE i.quantity_available <= i.reorder_level
  AND i.status != 'discontinued'
ORDER BY (i.reorder_level - i.quantity_available) DESC;

-- Expiring batches view
CREATE OR REPLACE VIEW expiring_batches AS
SELECT 
  b.*,
  i.item_name,
  l.location_name,
  (b.expiry_date - CURRENT_DATE) as days_until_expiry
FROM stock_batches b
JOIN inventory_items i ON b.item_id = i.item_id AND b.facility_id = i.facility_id
JOIN locations l ON b.location_id = l.id
WHERE b.expiry_date > CURRENT_DATE
  AND b.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
  AND b.status = 'active'
  AND b.quantity_on_hand > 0
ORDER BY b.expiry_date ASC;

-- Active reservations view
CREATE OR REPLACE VIEW active_reservations AS
SELECT 
  r.*,
  i.item_name,
  i.sku,
  (r.expires_at - CURRENT_TIMESTAMP) as time_until_expiry
FROM stock_reservations r
JOIN inventory_items i ON r.item_id = i.item_id AND r.facility_id = i.facility_id
WHERE r.status = 'active'
  AND r.expires_at > CURRENT_TIMESTAMP
ORDER BY r.expires_at ASC;

-- Stock valuation view
CREATE OR REPLACE VIEW stock_valuation AS
SELECT 
  i.item_id,
  i.item_name,
  i.facility_id,
  i.quantity_on_hand,
  SUM(b.quantity_on_hand * COALESCE(b.unit_cost, 0)) as total_value,
  AVG(b.unit_cost) as average_unit_cost,
  COUNT(DISTINCT b.id) as batch_count
FROM inventory_items i
LEFT JOIN stock_batches b ON i.item_id = b.item_id AND i.facility_id = b.facility_id
WHERE b.status = 'active'
GROUP BY i.item_id, i.item_name, i.facility_id, i.quantity_on_hand;

-- ============================================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================================

-- Sample Locations
INSERT INTO locations (location_code, location_name, location_type, facility_id, organization_id, created_by, status)
SELECT 
  'PHARM-01',
  'Main Pharmacy',
  'pharmacy',
  gen_random_uuid(),
  gen_random_uuid(),
  gen_random_uuid(),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_code = 'PHARM-01');

INSERT INTO locations (location_code, location_name, location_type, temperature_controlled, temperature_min, temperature_max, facility_id, organization_id, created_by, status)
SELECT 
  'FRIDGE-01',
  'Medication Refrigerator',
  'refrigerator',
  TRUE,
  2.0,
  8.0,
  (SELECT facility_id FROM locations WHERE location_code = 'PHARM-01'),
  (SELECT organization_id FROM locations WHERE location_code = 'PHARM-01'),
  gen_random_uuid(),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_code = 'FRIDGE-01');

-- Sample Inventory Items
INSERT INTO inventory_items (item_id, sku, item_name, item_type, quantity_on_hand, quantity_reserved, location_id, reorder_level, reorder_quantity, facility_id, organization_id, created_by, status)
SELECT 
  gen_random_uuid(),
  'MED-001-AMOX500',
  'Amoxicillin 500mg',
  'medication',
  100,
  0,
  (SELECT id FROM locations WHERE location_code = 'PHARM-01' LIMIT 1),
  20,
  100,
  (SELECT facility_id FROM locations WHERE location_code = 'PHARM-01' LIMIT 1),
  (SELECT organization_id FROM locations WHERE location_code = 'PHARM-01' LIMIT 1),
  gen_random_uuid(),
  'available'
WHERE EXISTS (SELECT 1 FROM locations WHERE location_code = 'PHARM-01');

INSERT INTO inventory_items (item_id, sku, item_name, item_type, quantity_on_hand, quantity_reserved, location_id, reorder_level, reorder_quantity, facility_id, organization_id, created_by, status)
SELECT 
  gen_random_uuid(),
  'MED-002-PARA500',
  'Paracetamol 500mg',
  'medication',
  200,
  0,
  (SELECT id FROM locations WHERE location_code = 'PHARM-01' LIMIT 1),
  50,
  200,
  (SELECT facility_id FROM locations WHERE location_code = 'PHARM-01' LIMIT 1),
  (SELECT organization_id FROM locations WHERE location_code = 'PHARM-01' LIMIT 1),
  gen_random_uuid(),
  'available'
WHERE EXISTS (SELECT 1 FROM locations WHERE location_code = 'PHARM-01');

-- Sample Stock Batch
INSERT INTO stock_batches (item_id, location_id, batch_number, quantity_received, quantity_on_hand, expiry_date, received_date, facility_id, organization_id, created_by, unit_cost, status)
SELECT 
  (SELECT item_id FROM inventory_items WHERE sku = 'MED-001-AMOX500' LIMIT 1),
  (SELECT id FROM locations WHERE location_code = 'PHARM-01' LIMIT 1),
  'BATCH-20250101-001',
  100,
  100,
  (CURRENT_DATE + INTERVAL '2 years'),
  CURRENT_TIMESTAMP,
  (SELECT facility_id FROM locations WHERE location_code = 'PHARM-01' LIMIT 1),
  (SELECT organization_id FROM locations WHERE location_code = 'PHARM-01' LIMIT 1),
  gen_random_uuid(),
  2.50,
  'active'
WHERE EXISTS (SELECT 1 FROM inventory_items WHERE sku = 'MED-001-AMOX500')
  AND NOT EXISTS (SELECT 1 FROM stock_batches WHERE batch_number = 'BATCH-20250101-001');

-- ============================================================================
-- SCHEDULED MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to cleanup expired reservations (call this periodically)
COMMENT ON FUNCTION expire_old_reservations() IS 'Automatically expires reservations past their expiry time and releases stock';

-- ============================================================================
-- GRANT PERMISSIONS (Adjust based on your user setup)
-- ============================================================================

-- Example: GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inventory_service_user;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

