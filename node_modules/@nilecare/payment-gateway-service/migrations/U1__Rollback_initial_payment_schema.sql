-- ============================================================================
-- Payment Gateway Service - Rollback Initial Schema
-- Version: U1
-- Description: Undo V1 - Drop payment tables
-- Author: Database Team
-- Date: 2025-10-15
-- ============================================================================

-- Drop tables in reverse order (respect foreign keys)
DROP TABLE IF EXISTS payment_analytics_daily;
DROP TABLE IF EXISTS payment_disputes;
DROP TABLE IF EXISTS payment_webhooks;
DROP TABLE IF EXISTS installment_schedule;
DROP TABLE IF EXISTS payment_installment_plans;
DROP TABLE IF EXISTS invoice_payments;
DROP TABLE IF EXISTS payment_refunds;
DROP TABLE IF EXISTS payment_reconciliation;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS payment_providers;

-- Log rollback completion
SELECT 'Rollback U1__Rollback_initial_payment_schema completed successfully' as status;

