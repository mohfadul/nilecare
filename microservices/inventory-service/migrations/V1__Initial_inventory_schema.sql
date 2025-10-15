-- ============================================================================
-- Inventory Service - Initial Schema Migration
-- Version: 1
-- Description: Create inventory management tables
-- Author: Database Team
-- Date: 2025-10-15
-- Ticket: DB-007
-- ============================================================================

-- ============================================================================
-- INVENTORY ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_category ENUM('medication', 'supply', 'equipment', 'implant', 'device', 'other') NOT NULL,
  item_type VARCHAR(100),
  manufacturer VARCHAR(255),
  
  -- Codes
  ndc_code VARCHAR(20) COMMENT 'National Drug Code for medications',
  upc_code VARCHAR(50),
  
  -- Pricing
  unit_of_measure VARCHAR(50) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(12,2),
  
  -- Reorder
  reorder_level INT NOT NULL,
  reorder_quantity INT NOT NULL,
  
  -- Special Handling
  is_controlled_substance BOOLEAN DEFAULT FALSE,
  dea_schedule ENUM('I', 'II', 'III', 'IV', 'V'),
  requires_refrigeration BOOLEAN DEFAULT FALSE,
  storage_requirements TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  discontinued_date DATE,
  replacement_item_id CHAR(36),
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Indexes
  INDEX idx_inventory_items_code (item_code),
  INDEX idx_inventory_items_category (item_category),
  INDEX idx_inventory_items_active (is_active),
  INDEX idx_inventory_items_ndc (ndc_code),
  FULLTEXT idx_inventory_items_search (item_name, manufacturer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Inventory item catalog';

-- ============================================================================
-- INVENTORY LOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_locations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  item_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL COMMENT 'Reference to facility service',
  department_id CHAR(36) COMMENT 'Reference to facility service',
  location_name VARCHAR(255) NOT NULL,
  
  -- Quantities
  quantity_on_hand INT NOT NULL DEFAULT 0,
  quantity_reserved INT DEFAULT 0,
  quantity_available INT GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  
  -- Thresholds
  min_quantity INT NOT NULL,
  max_quantity INT NOT NULL,
  
  -- Location Details
  bin_location VARCHAR(100),
  
  -- Tracking
  last_counted_date DATE,
  last_counted_by CHAR(36),
  last_reorder_date DATE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
  
  -- Indexes
  UNIQUE KEY uk_item_location (item_id, facility_id, department_id, location_name),
  INDEX idx_inventory_locations_item (item_id),
  INDEX idx_inventory_locations_facility (facility_id),
  INDEX idx_inventory_locations_department (department_id),
  INDEX idx_inventory_locations_quantity (quantity_on_hand)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Inventory stock locations';

-- ============================================================================
-- INVENTORY TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  item_id CHAR(36) NOT NULL,
  location_id CHAR(36) NOT NULL,
  
  -- Transaction Details
  transaction_type ENUM('receipt', 'issue', 'transfer', 'adjustment', 'return', 'waste', 'expired') NOT NULL,
  quantity INT NOT NULL,
  unit_cost DECIMAL(12,2),
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (ABS(quantity) * COALESCE(unit_cost, 0)) STORED,
  
  -- Dates
  transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Lot Tracking
  lot_number VARCHAR(100),
  expiration_date DATE,
  
  -- References
  reference_number VARCHAR(100),
  from_location_id CHAR(36),
  to_location_id CHAR(36),
  
  -- Justification
  reason TEXT,
  
  -- Approval
  performed_by CHAR(36) NOT NULL,
  approved_by CHAR(36),
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
  FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_inventory_transactions_number (transaction_number),
  INDEX idx_inventory_transactions_item (item_id),
  INDEX idx_inventory_transactions_location (location_id),
  INDEX idx_inventory_transactions_date (transaction_date),
  INDEX idx_inventory_transactions_type (transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Inventory stock movements';

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  supplier_code VARCHAR(50) UNIQUE NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  
  -- Contact
  contact_person VARCHAR(200),
  phone VARCHAR(20) COMMENT 'Sudan format: +249xxxxxxxxx',
  fax VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50) COMMENT 'Sudan State',
  postal_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'Sudan',
  
  -- Terms
  payment_terms VARCHAR(100),
  lead_time_days INT,
  minimum_order_amount DECIMAL(12,2),
  
  -- Rating
  is_preferred BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) COMMENT '0.00 to 5.00',
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Indexes
  INDEX idx_suppliers_code (supplier_code),
  INDEX idx_suppliers_active (is_active),
  INDEX idx_suppliers_preferred (is_preferred),
  FULLTEXT idx_suppliers_search (supplier_name, contact_person)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Supplier registry';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Low Stock Items View
CREATE OR REPLACE VIEW v_low_stock_items AS
SELECT 
  ii.id,
  ii.item_code,
  ii.item_name,
  ii.item_category,
  il.facility_id,
  il.location_name,
  il.quantity_on_hand,
  il.min_quantity,
  ii.reorder_level,
  ii.reorder_quantity,
  (il.min_quantity - il.quantity_on_hand) as shortage_amount
FROM inventory_items ii
JOIN inventory_locations il ON ii.id = il.item_id
WHERE il.quantity_on_hand <= il.min_quantity
  AND ii.is_active = TRUE
ORDER BY il.facility_id, il.quantity_on_hand ASC;

-- Log migration completion
SELECT 'Migration V1__Initial_inventory_schema completed successfully' as status;

