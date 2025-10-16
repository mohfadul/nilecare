-- ============================================================================
-- Billing Service - Add Audit Columns
-- Version: 2
-- Description: Add comprehensive audit tracking to all billing tables
-- Date: 2025-10-16
-- ============================================================================

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- ============================================================================
-- INVOICE_ITEMS TABLE
-- ============================================================================
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- ============================================================================
-- INSURANCE_CLAIMS TABLE
-- ============================================================================
ALTER TABLE insurance_claims
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at);
CREATE INDEX IF NOT EXISTS idx_invoice_items_deleted_at ON invoice_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON payments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_deleted_at ON insurance_claims(deleted_at);

CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

