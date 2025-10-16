-- ============================================================================
-- Lab Service - Add Audit Columns (PostgreSQL)
-- Version: 2
-- Description: Add comprehensive audit tracking to all lab tables
-- Date: 2025-10-16
-- ============================================================================

-- ============================================================================
-- LAB_ORDERS TABLE
-- ============================================================================
ALTER TABLE lab_orders
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- Trigger for updated_at (PostgreSQL doesn't have ON UPDATE)
CREATE OR REPLACE FUNCTION update_lab_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lab_orders_updated_at_trigger
  BEFORE UPDATE ON lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_orders_updated_at();

-- ============================================================================
-- LAB_RESULTS TABLE
-- ============================================================================
ALTER TABLE lab_results
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

CREATE OR REPLACE FUNCTION update_lab_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lab_results_updated_at_trigger
  BEFORE UPDATE ON lab_results
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_results_updated_at();

-- ============================================================================
-- SPECIMENS TABLE
-- ============================================================================
ALTER TABLE specimens
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

CREATE OR REPLACE FUNCTION update_specimens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER specimens_updated_at_trigger
  BEFORE UPDATE ON specimens
  FOR EACH ROW
  EXECUTE FUNCTION update_specimens_updated_at();

-- ============================================================================
-- LAB_TESTS TABLE
-- ============================================================================
ALTER TABLE lab_tests
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

CREATE OR REPLACE FUNCTION update_lab_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lab_tests_updated_at_trigger
  BEFORE UPDATE ON lab_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_tests_updated_at();

-- ============================================================================
-- QUALITY_CONTROL TABLE
-- ============================================================================
ALTER TABLE quality_control
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL;

-- ============================================================================
-- CREATE INDEXES FOR SOFT DELETE QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_lab_orders_deleted_at ON lab_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_lab_results_deleted_at ON lab_results(deleted_at);
CREATE INDEX IF NOT EXISTS idx_specimens_deleted_at ON specimens(deleted_at);
CREATE INDEX IF NOT EXISTS idx_lab_tests_deleted_at ON lab_tests(deleted_at);
CREATE INDEX IF NOT EXISTS idx_quality_control_deleted_at ON quality_control(deleted_at);

-- Audit query indexes
CREATE INDEX IF NOT EXISTS idx_lab_orders_created_at ON lab_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_lab_orders_created_by ON lab_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_lab_results_created_at ON lab_results(created_at);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by')
ORDER BY table_name, column_name;

