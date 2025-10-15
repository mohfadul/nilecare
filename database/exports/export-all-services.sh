#!/bin/bash

# ============================================================================
# NileCare Phase 2 - Export All Services Data
# Version: 1.0.0
# Description: Export data from shared nilecare database for all services
# Date: 2025-10-15
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     NileCare Phase 2: Data Export from Shared Database        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Create exports directory
mkdir -p database/exports/phase2

# Get MySQL credentials
read -sp "Enter MySQL root password: " MYSQL_PASSWORD
echo ""

export MYSQL_PWD="$MYSQL_PASSWORD"

# ============================================================================
# 1. Auth Service
# ============================================================================
echo "📦 Exporting Auth Service data..."
mysqldump -u root nilecare \
  auth_users auth_refresh_tokens auth_devices \
  auth_roles auth_permissions auth_audit_logs auth_login_attempts \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/auth_data.sql

echo "✅ Auth Service exported ($(wc -l < database/exports/phase2/auth_data.sql) lines)"

# ============================================================================
# 2. Billing Service
# ============================================================================
echo "📦 Exporting Billing Service data..."
mysqldump -u root nilecare \
  invoices invoice_line_items invoice_payment_allocations \
  billing_accounts insurance_claims claim_line_items \
  billing_adjustments charge_master billing_audit_log insurance_policies \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/billing_data.sql

echo "✅ Billing Service exported ($(wc -l < database/exports/phase2/billing_data.sql) lines)"

# ============================================================================
# 3. Payment Gateway
# ============================================================================
echo "📦 Exporting Payment Gateway data..."
mysqldump -u root nilecare \
  payments payment_providers payment_reconciliation \
  payment_refunds invoice_payments payment_installment_plans \
  installment_schedule payment_webhooks payment_disputes \
  payment_analytics_daily \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/payment_data.sql

echo "✅ Payment Gateway exported ($(wc -l < database/exports/phase2/payment_data.sql) lines)"

# ============================================================================
# 4. Clinical Service
# ============================================================================
echo "📦 Exporting Clinical Service data..."
mysqldump -u root nilecare \
  patients encounters diagnoses allergies \
  procedures immunizations clinical_notes audit_log \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/clinical_data.sql

echo "✅ Clinical Service exported ($(wc -l < database/exports/phase2/clinical_data.sql) lines)"

# ============================================================================
# 5. Facility Service
# ============================================================================
echo "📦 Exporting Facility Service data..."
mysqldump -u root nilecare \
  facilities departments wards beds \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/facility_data.sql 2>/dev/null || echo "⚠️  Some facility tables may not exist in nilecare database"

echo "✅ Facility Service exported"

# ============================================================================
# 6. Lab Service
# ============================================================================
echo "📦 Exporting Lab Service data..."
mysqldump -u root nilecare \
  lab_orders lab_results \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/lab_data.sql 2>/dev/null || echo "⚠️  Some lab tables may not exist"

echo "✅ Lab Service exported"

# ============================================================================
# 7. Medication Service
# ============================================================================
echo "📦 Exporting Medication Service data..."
mysqldump -u root nilecare \
  medications \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/medication_data.sql 2>/dev/null || echo "⚠️  Medication tables may not exist"

echo "✅ Medication Service exported"

# ============================================================================
# 8. Inventory Service
# ============================================================================
echo "📦 Exporting Inventory Service data..."
mysqldump -u root nilecare \
  inventory_items inventory_locations inventory_transactions \
  suppliers \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/inventory_data.sql 2>/dev/null || echo "⚠️  Inventory tables may not exist"

echo "✅ Inventory Service exported"

# Cleanup
unset MYSQL_PWD

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                 🎉 Export Complete! 🎉                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Exported files:"
ls -lh database/exports/phase2/
echo ""
echo "Next steps:"
echo "1. Verify export files created"
echo "2. Run import scripts for each service"
echo "3. Verify record counts match"
echo "4. Test services with new databases"
echo ""

