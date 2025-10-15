-- ============================================================
-- Billing Service - Rollback Initial Schema
-- Version: U1
-- Description: Undo V1 - Drop billing tables
-- Author: Database Team
-- Date: 2025-10-15
-- ============================================================

-- Drop tables in reverse order (respect foreign keys)
DROP TABLE IF EXISTS billing_audit_log;
DROP TABLE IF EXISTS charge_master;
DROP TABLE IF EXISTS billing_adjustments;
DROP TABLE IF EXISTS claim_line_items;
DROP TABLE IF EXISTS insurance_claims;
DROP TABLE IF EXISTS invoice_payment_allocations;
DROP TABLE IF EXISTS invoice_line_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS billing_accounts;

-- Log rollback completion
SELECT 'Rollback U1__Rollback_initial_billing_schema completed successfully' as status;

