-- ============================================================
-- Billing Service - Initial Schema Migration
-- Version: 1
-- Description: Create core billing tables
-- Author: Database Team
-- Date: 2025-10-15
-- Ticket: DB-002
-- ============================================================

-- ============================================================
-- BILLING ACCOUNTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_accounts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id CHAR(36) NOT NULL COMMENT 'Reference to patient in clinical service',
  guarantor_id CHAR(36),
  account_type ENUM('patient', 'insurance', 'self_pay', 'charity_care', 'worker_comp', 'other') NOT NULL,
  status ENUM('active', 'inactive', 'collections', 'paid_in_full', 'written_off') DEFAULT 'active',
  balance_due DECIMAL(12,2) DEFAULT 0.00,
  total_charges DECIMAL(12,2) DEFAULT 0.00,
  total_payments DECIMAL(12,2) DEFAULT 0.00,
  total_adjustments DECIMAL(12,2) DEFAULT 0.00,
  last_statement_date DATE,
  last_payment_date DATE,
  last_payment_amount DECIMAL(12,2),
  payment_plan_active BOOLEAN DEFAULT FALSE,
  payment_plan_amount DECIMAL(12,2),
  payment_plan_frequency ENUM('weekly', 'biweekly', 'monthly', 'quarterly'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  INDEX idx_billing_accounts_patient (patient_id),
  INDEX idx_billing_accounts_account_number (account_number),
  INDEX idx_billing_accounts_status (status),
  INDEX idx_billing_accounts_balance (balance_due)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Patient billing accounts';

-- ============================================================
-- INVOICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  billing_account_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  amount_paid DECIMAL(12,2) DEFAULT 0.00,
  amount_due DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status ENUM('draft', 'sent', 'partial_payment', 'paid', 'overdue', 'cancelled', 'voided') DEFAULT 'draft',
  currency VARCHAR(3) DEFAULT 'SDG',
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE RESTRICT,
  INDEX idx_invoices_invoice_number (invoice_number),
  INDEX idx_invoices_billing_account (billing_account_id),
  INDEX idx_invoices_patient (patient_id),
  INDEX idx_invoices_facility (facility_id),
  INDEX idx_invoices_status (status),
  INDEX idx_invoices_due_date (due_date),
  INDEX idx_invoices_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Customer invoices';

-- ============================================================
-- INVOICE LINE ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_id CHAR(36) NOT NULL,
  line_number INT NOT NULL,
  service_code VARCHAR(50),
  service_description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  tax_percentage DECIMAL(5,2) DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  line_total DECIMAL(12,2) NOT NULL,
  service_date DATE,
  provider_id CHAR(36),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX idx_invoice_line_items_invoice (invoice_id),
  INDEX idx_invoice_line_items_service_code (service_code),
  INDEX idx_invoice_line_items_service_date (service_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Invoice line item details';

-- ============================================================
-- INVOICE PAYMENT ALLOCATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_payment_allocations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_id CHAR(36) NOT NULL,
  payment_id CHAR(36) NOT NULL COMMENT 'Reference to payment in payment service',
  allocated_amount DECIMAL(12,2) NOT NULL,
  allocation_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36),
  
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
  INDEX idx_invoice_payments_invoice (invoice_id),
  INDEX idx_invoice_payments_payment (payment_id),
  INDEX idx_invoice_payments_date (allocation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment allocation to invoices';

-- ============================================================
-- INSURANCE CLAIMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS insurance_claims (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id CHAR(36),
  billing_account_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  insurance_policy_id CHAR(36) NOT NULL COMMENT 'Reference to insurance policy',
  claim_type ENUM('primary', 'secondary', 'tertiary') NOT NULL,
  claim_format ENUM('CMS1500', 'UB04', 'EDI_837P', 'EDI_837I') NOT NULL,
  status ENUM('draft', 'ready_to_submit', 'submitted', 'accepted', 'rejected', 'pending', 'paid', 'denied', 'appealed') DEFAULT 'draft',
  submission_date DATETIME,
  received_date DATETIME,
  processed_date DATETIME,
  paid_date DATETIME,
  total_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  allowed_amount DECIMAL(12,2),
  paid_amount DECIMAL(12,2),
  patient_responsibility DECIMAL(12,2),
  adjustment_amount DECIMAL(12,2),
  denial_reason_code VARCHAR(50),
  denial_reason_description TEXT,
  remittance_advice_number VARCHAR(100),
  check_number VARCHAR(100),
  check_date DATE,
  resubmission_count INT DEFAULT 0,
  last_resubmission_date DATETIME,
  appeal_count INT DEFAULT 0,
  last_appeal_date DATETIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  INDEX idx_insurance_claims_claim_number (claim_number),
  INDEX idx_insurance_claims_invoice (invoice_id),
  INDEX idx_insurance_claims_billing_account (billing_account_id),
  INDEX idx_insurance_claims_patient (patient_id),
  INDEX idx_insurance_claims_status (status),
  INDEX idx_insurance_claims_submission_date (submission_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Insurance claim submissions';

-- ============================================================
-- CLAIM LINE ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS claim_line_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  claim_id CHAR(36) NOT NULL,
  line_number INT NOT NULL,
  service_date DATE NOT NULL,
  procedure_code VARCHAR(20) NOT NULL COMMENT 'CPT/HCPCS Code',
  procedure_description VARCHAR(255),
  diagnosis_codes JSON COMMENT 'Array of ICD-10 codes',
  modifiers VARCHAR(50),
  units INT DEFAULT 1,
  charge_amount DECIMAL(12,2) NOT NULL,
  allowed_amount DECIMAL(12,2),
  paid_amount DECIMAL(12,2),
  adjustment_amount DECIMAL(12,2),
  patient_responsibility DECIMAL(12,2),
  denial_reason_code VARCHAR(50),
  denial_reason_description TEXT,
  revenue_code VARCHAR(10),
  place_of_service VARCHAR(10),
  provider_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (claim_id) REFERENCES insurance_claims(id) ON DELETE CASCADE,
  INDEX idx_claim_line_items_claim (claim_id),
  INDEX idx_claim_line_items_service_date (service_date),
  INDEX idx_claim_line_items_procedure_code (procedure_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Claim line item details';

-- ============================================================
-- BILLING ADJUSTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_adjustments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  adjustment_number VARCHAR(50) UNIQUE NOT NULL,
  billing_account_id CHAR(36),
  invoice_id CHAR(36),
  adjustment_type ENUM('discount', 'write_off', 'correction', 'refund', 'charity_care', 'bad_debt', 'other') NOT NULL,
  adjustment_amount DECIMAL(12,2) NOT NULL,
  adjustment_date DATE NOT NULL,
  reason_code VARCHAR(50),
  reason_description TEXT NOT NULL,
  approved_by CHAR(36),
  approved_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36),
  
  FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  INDEX idx_billing_adjustments_account (billing_account_id),
  INDEX idx_billing_adjustments_invoice (invoice_id),
  INDEX idx_billing_adjustments_type (adjustment_type),
  INDEX idx_billing_adjustments_date (adjustment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Billing adjustments and write-offs';

-- ============================================================
-- CHARGE MASTER TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS charge_master (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  service_code VARCHAR(50) UNIQUE NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  service_category VARCHAR(100),
  service_description TEXT,
  cpt_code VARCHAR(20),
  hcpcs_code VARCHAR(20),
  revenue_code VARCHAR(10),
  unit_price DECIMAL(12,2) NOT NULL,
  cost DECIMAL(12,2),
  department VARCHAR(100),
  is_taxable BOOLEAN DEFAULT FALSE,
  tax_percentage DECIMAL(5,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  effective_date DATE,
  expiration_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  INDEX idx_charge_master_service_code (service_code),
  INDEX idx_charge_master_cpt_code (cpt_code),
  INDEX idx_charge_master_category (service_category),
  INDEX idx_charge_master_active (is_active),
  FULLTEXT idx_charge_master_search (service_name, service_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Service pricing master';

-- ============================================================
-- BILLING AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_audit_log (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  table_name VARCHAR(100) NOT NULL,
  record_id CHAR(36) NOT NULL,
  action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  user_id CHAR(36),
  user_email VARCHAR(255),
  ip_address VARCHAR(45),
  old_values JSON,
  new_values JSON,
  changed_fields JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_billing_audit_log_table_record (table_name, record_id),
  INDEX idx_billing_audit_log_user (user_id),
  INDEX idx_billing_audit_log_timestamp (timestamp),
  INDEX idx_billing_audit_log_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Billing audit trail for compliance';

-- Log migration completion
SELECT 'Migration V1__Initial_billing_schema completed successfully' as status;

