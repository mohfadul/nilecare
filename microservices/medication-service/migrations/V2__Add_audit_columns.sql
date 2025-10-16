-- ============================================================================
-- Medication Service - Add Audit Columns (PostgreSQL)
-- Version: 2
-- Description: Add comprehensive audit tracking to all medication tables
-- Date: 2025-10-16
-- ============================================================================

-- ============================================================================
-- PRESCRIPTIONS TABLE
-- ============================================================================
ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

CREATE OR REPLACE FUNCTION update_prescriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prescriptions_updated_at_trigger
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_prescriptions_updated_at();

-- ============================================================================
-- MEDICATION_ADMINISTRATIONS TABLE
-- ============================================================================
ALTER TABLE medication_administrations
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

CREATE OR REPLACE FUNCTION update_med_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER med_admin_updated_at_trigger
  BEFORE UPDATE ON medication_administrations
  FOR EACH ROW
  EXECUTE FUNCTION update_med_admin_updated_at();

-- ============================================================================
-- MEDICATION_ALERTS TABLE
-- ============================================================================
ALTER TABLE medication_alerts
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

CREATE OR REPLACE FUNCTION update_med_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER med_alerts_updated_at_trigger
  BEFORE UPDATE ON medication_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_med_alerts_updated_at();

-- ============================================================================
-- MEDICATIONS TABLE (Master List)
-- ============================================================================
ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

CREATE OR REPLACE FUNCTION update_medications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medications_updated_at_trigger
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_medications_updated_at();

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_prescriptions_deleted_at ON prescriptions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_med_admin_deleted_at ON medication_administrations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_med_alerts_deleted_at ON medication_alerts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_medications_deleted_at ON medications(deleted_at);

CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON prescriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_by ON prescriptions(created_by);

