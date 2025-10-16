-- ============================================================================
-- Clinical Service - Add Soft Delete Columns
-- Version: 2
-- Description: Add soft delete support to all tables
-- Author: Backend Team
-- Date: 2025-10-16
-- ============================================================================

-- ============================================================================
-- ADD SOFT DELETE COLUMNS TO ALL TABLES
-- ============================================================================

-- Patients
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by CHAR(36) NULL COMMENT 'User ID who soft-deleted';

-- Encounters
ALTER TABLE encounters
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by CHAR(36) NULL;

-- Diagnoses
ALTER TABLE diagnoses
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by CHAR(36) NULL;

-- Medications
ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by CHAR(36) NULL;

-- Allergies
ALTER TABLE allergies
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by CHAR(36) NULL;

-- Vital Signs
ALTER TABLE vital_signs
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by CHAR(36) NULL;

-- Immunizations
ALTER TABLE immunizations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by CHAR(36) NULL;

-- Lab Orders
ALTER TABLE lab_orders
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by CHAR(36) NULL;

-- Clinical Notes
ALTER TABLE clinical_notes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by CHAR(36) NULL;

-- Family History
ALTER TABLE family_history
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by CHAR(36) NULL;

-- Social History
ALTER TABLE social_history
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by CHAR(36) NULL;

-- ============================================================================
-- CREATE INDEXES FOR SOFT DELETE QUERIES
-- ============================================================================

-- These indexes optimize "WHERE deleted_at IS NULL" queries
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON patients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_encounters_deleted_at ON encounters(deleted_at);
CREATE INDEX IF NOT EXISTS idx_diagnoses_deleted_at ON diagnoses(deleted_at);
CREATE INDEX IF NOT EXISTS idx_medications_deleted_at ON medications(deleted_at);
CREATE INDEX IF NOT EXISTS idx_allergies_deleted_at ON allergies(deleted_at);
CREATE INDEX IF NOT EXISTS idx_vital_signs_deleted_at ON vital_signs(deleted_at);
CREATE INDEX IF NOT EXISTS idx_immunizations_deleted_at ON immunizations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_lab_orders_deleted_at ON lab_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_deleted_at ON clinical_notes(deleted_at);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

SELECT 
  TABLE_NAME,
  COUNT(*) as audit_columns_count
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME IN ('created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by')
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;

