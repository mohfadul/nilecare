-- ============================================================================
-- Facility Service - Add Audit Columns (PostgreSQL)
-- Version: 2
-- Description: Add comprehensive audit tracking to all facility tables
-- Date: 2025-10-16
-- ============================================================================

-- ============================================================================
-- FACILITIES TABLE
-- ============================================================================
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

CREATE OR REPLACE FUNCTION update_facilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER facilities_updated_at_trigger
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_facilities_updated_at();

-- ============================================================================
-- DEPARTMENTS TABLE
-- ============================================================================
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER departments_updated_at_trigger
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_departments_updated_at();

-- ============================================================================
-- WARDS TABLE
-- ============================================================================
ALTER TABLE wards
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

CREATE OR REPLACE FUNCTION update_wards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wards_updated_at_trigger
  BEFORE UPDATE ON wards
  FOR EACH ROW
  EXECUTE FUNCTION update_wards_updated_at();

-- ============================================================================
-- BEDS TABLE
-- ============================================================================
ALTER TABLE beds
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

CREATE OR REPLACE FUNCTION update_beds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER beds_updated_at_trigger
  BEFORE UPDATE ON beds
  FOR EACH ROW
  EXECUTE FUNCTION update_beds_updated_at();

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_facilities_deleted_at ON facilities(deleted_at);
CREATE INDEX IF NOT EXISTS idx_departments_deleted_at ON departments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_wards_deleted_at ON wards(deleted_at);
CREATE INDEX IF NOT EXISTS idx_beds_deleted_at ON beds(deleted_at);

CREATE INDEX IF NOT EXISTS idx_facilities_created_at ON facilities(created_at);
CREATE INDEX IF NOT EXISTS idx_beds_updated_at ON beds(updated_at);

