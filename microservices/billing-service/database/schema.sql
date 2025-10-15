-- ============================================================================
-- NILECARE BILLING SERVICE DATABASE SCHEMA
-- Database: nilecare (SHARED DATABASE)
-- Service: Billing Service (Port 5003)
-- Version: 1.0.0
-- Date: October 14, 2025
-- ============================================================================
--
-- IMPORTANT: This service uses the SHARED 'nilecare' database
-- Tables are prefixed with 'billing_' to avoid conflicts
--
-- SEPARATION OF CONCERNS:
-- - Billing Service: Invoices, Claims, Billing Accounts (THIS SCHEMA)
-- - Payment Gateway: Payment transactions, providers (payment_system.sql)
-- - Business Service: Appointments, scheduling, staff
--
-- ============================================================================

USE nilecare;

-- ============================================================================
-- 1. INVOICES TABLE (Primary Billing Entity)
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Invoice Identification
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  -- Format: INV-YYYYMMDD-XXXXXX
  
  -- References
  patient_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  billing_account_id CHAR(36),
  encounter_id CHAR(36),  -- Link to medical encounter
  appointment_id CHAR(36),  -- Link to appointment
  
  -- Invoice Type
  invoice_type ENUM(
    'standard',       -- Regular service invoice
    'insurance',      -- Insurance claim invoice
    'emergency',      -- Emergency service
    'pharmacy',       -- Pharmacy only
    'lab',           -- Lab services only
    'radiology',     -- Radiology services
    'surgery',       -- Surgical procedure
    'consultation',  -- Consultation only
    'other'
  ) NOT NULL DEFAULT 'standard',
  
  -- Financial Details
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12, 2) DEFAULT 0.00,
  discount_amount DECIMAL(12, 2) DEFAULT 0.00,
  adjustment_amount DECIMAL(12, 2) DEFAULT 0.00,
  total_amount DECIMAL(12, 2) NOT NULL,
  -- total_amount = subtotal + tax_amount - discount_amount + adjustment_amount
  
  paid_amount DECIMAL(12, 2) DEFAULT 0.00,
  balance_due DECIMAL(12, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  
  currency VARCHAR(3) DEFAULT 'SDG',
  exchange_rate DECIMAL(10, 4) DEFAULT 1.0000,
  
  -- Status Tracking
  status ENUM(
    'draft',          -- Being created
    'pending',        -- Awaiting payment
    'partially_paid', -- Partial payment received
    'paid',          -- Fully paid
    'overdue',       -- Past due date
    'cancelled',     -- Cancelled
    'refunded',      -- Fully refunded
    'written_off',   -- Bad debt write-off
    'in_collections' -- Sent to collections
  ) DEFAULT 'draft',
  
  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  last_payment_date DATE,
  overdue_date DATE,  -- Date invoice became overdue
  
  -- Payment Terms
  payment_terms VARCHAR(100) DEFAULT 'Net 30',
  grace_period_days INT DEFAULT 7,
  late_fee_percentage DECIMAL(5, 2) DEFAULT 2.00,
  late_fees_applied DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Insurance Details (if applicable)
  insurance_policy_id CHAR(36),
  insurance_company VARCHAR(255),
  insurance_claim_number VARCHAR(100),
  insurance_authorization_number VARCHAR(100),
  patient_responsibility DECIMAL(12, 2),  -- Patient's portion
  insurance_responsibility DECIMAL(12, 2),  -- Insurance portion
  
  -- Notes & Description
  description TEXT,
  internal_notes TEXT,  -- Staff notes (not visible to patient)
  patient_notes TEXT,   -- Notes visible to patient
  
  -- Audit Trail
  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Soft Delete
  deleted_at TIMESTAMP NULL,
  deleted_by CHAR(36),
  
  -- Indexes
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_patient_id (patient_id),
  INDEX idx_facility_id (facility_id),
  INDEX idx_billing_account_id (billing_account_id),
  INDEX idx_status (status),
  INDEX idx_invoice_date (invoice_date DESC),
  INDEX idx_due_date (due_date),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_patient_status (patient_id, status),
  INDEX idx_overdue (status, due_date),
  
  -- Full-text search
  FULLTEXT idx_search (invoice_number, description, patient_notes)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. INVOICE LINE ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_id CHAR(36) NOT NULL,
  
  -- Line Details
  line_number INT NOT NULL,
  
  -- Service/Product Details
  item_type ENUM(
    'service',      -- Medical service
    'medication',   -- Medication/drug
    'supply',       -- Medical supply
    'equipment',    -- Equipment usage
    'room_charge',  -- Room/bed charge
    'lab_test',     -- Laboratory test
    'radiology',    -- Radiology procedure
    'procedure',    -- Medical procedure
    'consultation', -- Doctor consultation
    'other'
  ) NOT NULL,
  
  item_code VARCHAR(100),  -- CPT/HCPCS/internal code
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  
  -- Coding (for insurance)
  procedure_code VARCHAR(20),  -- CPT/HCPCS
  diagnosis_codes JSON,  -- ICD-10 codes array
  revenue_code VARCHAR(10),
  modifier_codes VARCHAR(50),
  
  -- Quantity & Pricing
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  unit_of_measure VARCHAR(50) DEFAULT 'each',
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  tax_percent DECIMAL(5, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  line_total DECIMAL(12, 2) NOT NULL,
  -- line_total = (quantity * unit_price) - discount_amount + tax_amount
  
  -- Service Details
  service_date DATE,
  service_provider_id CHAR(36),  -- Doctor/provider who performed service
  department_id CHAR(36),
  
  -- Reference
  reference_id CHAR(36),  -- Link to appointment, prescription, lab order, etc.
  reference_type ENUM('appointment', 'prescription', 'lab_order', 'procedure', 'admission', 'other'),
  
  -- Metadata
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_item_type (item_type),
  INDEX idx_procedure_code (procedure_code),
  INDEX idx_service_date (service_date),
  INDEX idx_service_provider (service_provider_id)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. INVOICE PAYMENTS ALLOCATION TABLE (Bridge to Payment Gateway)
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_payment_allocations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- References
  invoice_id CHAR(36) NOT NULL,
  payment_id CHAR(36) NOT NULL,  -- Payment Gateway transaction ID
  payment_gateway_reference VARCHAR(255),  -- Merchant reference from Payment Gateway
  
  -- Allocation Details
  allocated_amount DECIMAL(12, 2) NOT NULL,
  allocation_type ENUM(
    'full',          -- Full payment
    'partial',       -- Partial payment
    'installment',   -- Installment plan payment
    'overpayment',   -- Overpayment (credit)
    'insurance',     -- Insurance payment
    'patient'        -- Patient payment
  ) DEFAULT 'full',
  
  -- Payment Details (cached from Payment Gateway)
  payment_status VARCHAR(50),  -- pending, confirmed, failed
  payment_date DATE,
  payment_method VARCHAR(100),  -- Provider name (zain_cash, bank_of_khartoum, etc.)
  
  -- Allocation Tracking
  allocated_by CHAR(36) NOT NULL,
  allocation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_payment_id (payment_id),
  INDEX idx_payment_gateway_reference (payment_gateway_reference),
  INDEX idx_allocation_date (allocation_date DESC)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. BILLING ACCOUNTS TABLE (Patient Billing Summary)
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_accounts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Account Identification
  account_number VARCHAR(50) UNIQUE NOT NULL,
  -- Format: BA-YYYYMMDD-XXXXXX
  
  -- References
  patient_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  guarantor_id CHAR(36),  -- Responsible party (may be different from patient)
  
  -- Account Type
  account_type ENUM(
    'patient',        -- Direct patient account
    'insurance',      -- Insurance billed
    'self_pay',       -- Self-pay patient
    'charity_care',   -- Charity/free care
    'worker_comp',    -- Worker's compensation
    'government',     -- Government sponsored
    'other'
  ) NOT NULL DEFAULT 'patient',
  
  -- Financial Summary
  total_charges DECIMAL(12, 2) DEFAULT 0.00,
  total_payments DECIMAL(12, 2) DEFAULT 0.00,
  total_adjustments DECIMAL(12, 2) DEFAULT 0.00,
  balance_due DECIMAL(12, 2) GENERATED ALWAYS AS (
    total_charges - total_payments - total_adjustments
  ) STORED,
  
  -- Status
  status ENUM(
    'active',         -- Active account
    'inactive',       -- Inactive
    'collections',    -- In collections
    'paid_in_full',   -- Fully paid
    'written_off',    -- Bad debt write-off
    'suspended'       -- Suspended (don't bill)
  ) DEFAULT 'active',
  
  -- Payment Plan
  payment_plan_active BOOLEAN DEFAULT FALSE,
  payment_plan_amount DECIMAL(12, 2),
  payment_plan_frequency ENUM('weekly', 'biweekly', 'monthly', 'quarterly'),
  payment_plan_start_date DATE,
  payment_plan_end_date DATE,
  
  -- Statement History
  last_statement_date DATE,
  last_payment_date DATE,
  last_payment_amount DECIMAL(12, 2),
  statement_frequency ENUM('monthly', 'quarterly', 'on_demand') DEFAULT 'monthly',
  
  -- Contact Preferences
  preferred_contact_method ENUM('email', 'sms', 'phone', 'mail') DEFAULT 'email',
  send_electronic_statements BOOLEAN DEFAULT TRUE,
  
  -- Credit Information
  credit_limit DECIMAL(12, 2),
  credit_used DECIMAL(12, 2) DEFAULT 0.00,
  
  -- Audit Trail
  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_account_number (account_number),
  INDEX idx_patient_id (patient_id),
  INDEX idx_facility_id (facility_id),
  INDEX idx_status (status),
  INDEX idx_balance_due (balance_due DESC),
  INDEX idx_payment_plan (payment_plan_active)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. INSURANCE CLAIMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS insurance_claims (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Claim Identification
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  -- Format: CLM-YYYYMMDD-XXXXXX
  
  -- References
  invoice_id CHAR(36),
  patient_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  insurance_policy_id CHAR(36) NOT NULL,
  billing_account_id CHAR(36) NOT NULL,
  
  -- Claim Type
  claim_type ENUM(
    'professional',    -- CMS-1500 (Professional services)
    'institutional',   -- UB-04 (Hospital/institutional)
    'dental',         -- Dental services
    'pharmacy',       -- Pharmacy claims
    'vision'          -- Vision services
  ) NOT NULL,
  
  claim_format ENUM('CMS1500', 'UB04', 'EDI_837P', 'EDI_837I', 'manual') NOT NULL,
  
  -- Status
  status ENUM(
    'draft',          -- Being prepared
    'ready_to_submit', -- Ready for submission
    'submitted',      -- Submitted to payer
    'accepted',       -- Accepted by payer
    'rejected',       -- Rejected (needs correction)
    'pending',        -- Pending review
    'approved',       -- Approved (awaiting payment)
    'paid',          -- Payment received
    'denied',        -- Denied (final)
    'appealed',      -- Under appeal
    'partially_paid'  -- Partially paid
  ) DEFAULT 'draft',
  
  -- Dates
  service_date_from DATE NOT NULL,
  service_date_to DATE NOT NULL,
  submission_date DATETIME,
  received_date DATETIME,
  processed_date DATETIME,
  paid_date DATETIME,
  
  -- Financial
  total_charges DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  allowed_amount DECIMAL(12, 2),      -- Amount approved by insurance
  paid_amount DECIMAL(12, 2),         -- Amount paid by insurance
  patient_responsibility DECIMAL(12, 2),  -- Patient's portion
  adjustment_amount DECIMAL(12, 2),
  
  -- Denial/Rejection
  denial_reason_code VARCHAR(50),
  denial_reason_description TEXT,
  rejection_reason TEXT,
  
  -- Payment Information
  remittance_advice_number VARCHAR(100),  -- ERA number
  check_number VARCHAR(100),
  check_date DATE,
  electronic_payment_id VARCHAR(100),
  
  -- Resubmission & Appeal
  resubmission_count INT DEFAULT 0,
  last_resubmission_date DATETIME,
  appeal_count INT DEFAULT 0,
  last_appeal_date DATETIME,
  appeal_deadline DATE,
  
  -- Provider Information
  rendering_provider_id CHAR(36),
  billing_provider_id CHAR(36),
  referring_provider_id CHAR(36),
  
  -- EDI Information
  edi_transaction_id VARCHAR(100),
  edi_batch_id VARCHAR(100),
  payer_id VARCHAR(50),  -- Payer EDI ID
  
  -- Metadata
  claim_notes TEXT,
  attachments JSON,  -- Array of attachment URLs
  
  -- Audit Trail
  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36),
  submitted_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_claim_number (claim_number),
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_facility_id (facility_id),
  INDEX idx_insurance_policy_id (insurance_policy_id),
  INDEX idx_billing_account_id (billing_account_id),
  INDEX idx_status (status),
  INDEX idx_submission_date (submission_date DESC),
  INDEX idx_service_dates (service_date_from, service_date_to),
  INDEX idx_payer_status (payer_id, status)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. CLAIM LINE ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS claim_line_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  claim_id CHAR(36) NOT NULL,
  
  -- Line Details
  line_number INT NOT NULL,
  service_date DATE NOT NULL,
  
  -- Coding
  procedure_code VARCHAR(20) NOT NULL,  -- CPT/HCPCS
  procedure_description VARCHAR(255),
  diagnosis_codes JSON,  -- ICD-10 codes
  modifiers VARCHAR(50),
  
  -- Place of Service
  place_of_service_code VARCHAR(10),
  place_of_service_description VARCHAR(100),
  
  -- Quantity & Pricing
  units DECIMAL(10, 2) DEFAULT 1.00,
  unit_price DECIMAL(10, 2) NOT NULL,
  charge_amount DECIMAL(12, 2) NOT NULL,
  allowed_amount DECIMAL(12, 2),
  paid_amount DECIMAL(12, 2),
  adjustment_amount DECIMAL(12, 2),
  patient_responsibility DECIMAL(12, 2),
  
  -- Status
  line_status ENUM('submitted', 'approved', 'denied', 'adjusted') DEFAULT 'submitted',
  denial_reason_code VARCHAR(50),
  denial_reason_description TEXT,
  
  -- Provider
  rendering_provider_id CHAR(36),
  
  -- Revenue Code (for institutional claims)
  revenue_code VARCHAR(10),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (claim_id) REFERENCES insurance_claims(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_claim_id (claim_id),
  INDEX idx_line_number (claim_id, line_number),
  INDEX idx_procedure_code (procedure_code),
  INDEX idx_service_date (service_date)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. BILLING ADJUSTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_adjustments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- References
  invoice_id CHAR(36),
  billing_account_id CHAR(36),
  patient_id CHAR(36) NOT NULL,
  
  -- Adjustment Details
  adjustment_type ENUM(
    'discount',        -- Discount applied
    'write_off',       -- Bad debt write-off
    'contractual',     -- Contractual adjustment (insurance)
    'refund',         -- Refund issued
    'correction',     -- Billing correction
    'charity_care',   -- Charity care adjustment
    'late_fee',       -- Late fee applied
    'early_payment',  -- Early payment discount
    'other'
  ) NOT NULL,
  
  adjustment_reason VARCHAR(255) NOT NULL,
  adjustment_details TEXT,
  
  -- Financial
  adjustment_amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SDG',
  
  -- Adjustment Direction
  is_credit BOOLEAN NOT NULL,  -- TRUE = reduces balance, FALSE = increases balance
  
  -- Approval (for large adjustments)
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by CHAR(36),
  approved_at TIMESTAMP NULL,
  approval_notes TEXT,
  
  -- Audit Trail
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_billing_account_id (billing_account_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_adjustment_type (adjustment_type),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_approval (requires_approval, approved_by)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. BILLING STATEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_statements (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Statement Identification
  statement_number VARCHAR(50) UNIQUE NOT NULL,
  -- Format: STMT-YYYYMMDD-XXXXXX
  
  -- References
  billing_account_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  
  -- Statement Period
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  statement_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Financial Summary
  opening_balance DECIMAL(12, 2) DEFAULT 0.00,
  new_charges DECIMAL(12, 2) DEFAULT 0.00,
  payments_received DECIMAL(12, 2) DEFAULT 0.00,
  adjustments DECIMAL(12, 2) DEFAULT 0.00,
  closing_balance DECIMAL(12, 2) NOT NULL,
  
  currency VARCHAR(3) DEFAULT 'SDG',
  
  -- Status
  status ENUM('draft', 'finalized', 'sent', 'viewed', 'paid') DEFAULT 'draft',
  
  -- Delivery
  sent_date DATETIME,
  sent_method ENUM('email', 'sms', 'mail', 'portal') DEFAULT 'email',
  delivery_status ENUM('pending', 'delivered', 'failed', 'bounced'),
  
  -- Patient Interaction
  viewed_date DATETIME,
  viewed_count INT DEFAULT 0,
  
  -- Included Invoices
  invoice_ids JSON,  -- Array of invoice IDs included in this statement
  invoice_count INT DEFAULT 0,
  
  -- Statement File
  statement_file_url TEXT,  -- PDF URL
  
  -- Notes
  statement_notes TEXT,
  
  -- Audit Trail
  created_by CHAR(36) NOT NULL,
  finalized_by CHAR(36),
  finalized_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_statement_number (statement_number),
  INDEX idx_billing_account_id (billing_account_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_facility_id (facility_id),
  INDEX idx_statement_date (statement_date DESC),
  INDEX idx_due_date (due_date),
  INDEX idx_status (status)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. CHARGE MASTER TABLE (Service Pricing Catalog)
-- ============================================================================

CREATE TABLE IF NOT EXISTS charge_master (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Item Identification
  item_code VARCHAR(100) UNIQUE NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  
  -- Category
  item_category ENUM(
    'consultation',
    'procedure',
    'lab_test',
    'radiology',
    'medication',
    'supply',
    'equipment',
    'room_charge',
    'surgery',
    'therapy',
    'other'
  ) NOT NULL,
  
  -- Coding (for insurance billing)
  cpt_code VARCHAR(20),
  hcpcs_code VARCHAR(20),
  revenue_code VARCHAR(10),
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SDG',
  unit_of_measure VARCHAR(50) DEFAULT 'each',
  
  -- Insurance Rates
  insurance_rate_1 DECIMAL(10, 2),  -- Government insurance rate
  insurance_rate_2 DECIMAL(10, 2),  -- Private insurance rate
  cash_rate DECIMAL(10, 2),         -- Cash/self-pay rate
  
  -- Department
  department_id CHAR(36),
  facility_id CHAR(36),  -- NULL = applies to all facilities
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  
  -- Billing Rules
  requires_authorization BOOLEAN DEFAULT FALSE,
  taxable BOOLEAN DEFAULT FALSE,
  tax_percentage DECIMAL(5, 2) DEFAULT 0.00,
  
  -- Metadata
  notes TEXT,
  
  -- Audit Trail
  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_item_code (item_code),
  INDEX idx_item_category (item_category),
  INDEX idx_cpt_code (cpt_code),
  INDEX idx_is_active (is_active),
  INDEX idx_facility (facility_id),
  
  -- Full-text search
  FULLTEXT idx_item_search (item_name, item_description)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. BILLING AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_audit_log (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Action Details
  action VARCHAR(100) NOT NULL,
  -- Values: 'invoice_created', 'invoice_updated', 'payment_allocated',
  --         'adjustment_applied', 'claim_submitted', 'status_changed', etc.
  
  -- Resource
  resource_type ENUM('invoice', 'claim', 'billing_account', 'adjustment', 'statement', 'payment_allocation') NOT NULL,
  resource_id CHAR(36) NOT NULL,
  
  -- User Info
  user_id CHAR(36) NOT NULL,
  user_name VARCHAR(255),
  user_role VARCHAR(100),
  user_email VARCHAR(255),
  
  -- Request Info
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_method VARCHAR(10),
  request_url TEXT,
  
  -- Result
  result ENUM('success', 'failure', 'warning') NOT NULL,
  error_message TEXT,
  
  -- Changes (before/after)
  old_values JSON,
  new_values JSON,
  changes_summary TEXT,
  
  -- Metadata
  metadata JSON,
  
  -- Timestamp
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_timestamp (timestamp DESC),
  INDEX idx_result (result),
  INDEX idx_user_resource (user_id, resource_type, timestamp DESC)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. PAYMENT REMINDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_reminders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- References
  invoice_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  billing_account_id CHAR(36) NOT NULL,
  
  -- Reminder Details
  reminder_type ENUM(
    'upcoming_due',    -- Due in X days
    'due_today',       -- Due today
    'overdue',         -- Past due
    'final_notice',    -- Final notice before collections
    'payment_plan'     -- Payment plan reminder
  ) NOT NULL,
  
  -- Delivery
  delivery_method ENUM('email', 'sms', 'phone', 'mail', 'push') NOT NULL,
  delivery_status ENUM('pending', 'sent', 'delivered', 'failed', 'bounced'),
  
  -- Timing
  scheduled_date DATETIME NOT NULL,
  sent_date DATETIME,
  delivered_date DATETIME,
  
  -- Content
  subject VARCHAR(255),
  message_body TEXT,
  
  -- Response
  patient_responded BOOLEAN DEFAULT FALSE,
  response_date DATETIME,
  response_action ENUM('paid', 'scheduled_payment', 'requested_plan', 'disputed', 'no_action'),
  
  -- Metadata
  reminder_count INT DEFAULT 1,  -- Nth reminder for this invoice
  template_id VARCHAR(100),
  
  -- Audit
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_reminder_type (reminder_type),
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_delivery_status (delivery_status)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-update invoice totals when line items change
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_update_invoice_totals_after_line_insert
AFTER INSERT ON invoice_line_items
FOR EACH ROW
BEGIN
  UPDATE invoices
  SET 
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0) 
      FROM invoice_line_items 
      WHERE invoice_id = NEW.invoice_id
    ),
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  -- Recalculate total_amount
  UPDATE invoices
  SET total_amount = subtotal + tax_amount - discount_amount + adjustment_amount
  WHERE id = NEW.invoice_id;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_update_invoice_totals_after_line_update
AFTER UPDATE ON invoice_line_items
FOR EACH ROW
BEGIN
  UPDATE invoices
  SET 
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0) 
      FROM invoice_line_items 
      WHERE invoice_id = NEW.invoice_id
    ),
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  -- Recalculate total_amount
  UPDATE invoices
  SET total_amount = subtotal + tax_amount - discount_amount + adjustment_amount
  WHERE id = NEW.invoice_id;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_update_invoice_totals_after_line_delete
AFTER DELETE ON invoice_line_items
FOR EACH ROW
BEGIN
  UPDATE invoices
  SET 
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0) 
      FROM invoice_line_items 
      WHERE invoice_id = OLD.invoice_id
    ),
    updated_at = NOW()
  WHERE id = OLD.invoice_id;
  
  -- Recalculate total_amount
  UPDATE invoices
  SET total_amount = subtotal + tax_amount - discount_amount + adjustment_amount
  WHERE id = OLD.invoice_id;
END//
DELIMITER ;

-- Trigger: Auto-update billing account totals
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_update_billing_account_totals
AFTER UPDATE ON invoices
FOR EACH ROW
BEGIN
  IF NEW.billing_account_id IS NOT NULL THEN
    UPDATE billing_accounts
    SET 
      total_charges = (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM invoices
        WHERE billing_account_id = NEW.billing_account_id
          AND status NOT IN ('cancelled', 'refunded')
      ),
      total_payments = (
        SELECT COALESCE(SUM(paid_amount), 0)
        FROM invoices
        WHERE billing_account_id = NEW.billing_account_id
      ),
      last_payment_date = CASE 
        WHEN NEW.paid_date > OLD.paid_date THEN NEW.paid_date
        ELSE last_payment_date
      END,
      last_payment_amount = CASE 
        WHEN NEW.paid_date > OLD.paid_date THEN (NEW.paid_amount - OLD.paid_amount)
        ELSE last_payment_amount
      END,
      updated_at = NOW()
    WHERE id = NEW.billing_account_id;
  END IF;
END//
DELIMITER ;

-- Trigger: Check for overdue invoices
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_check_overdue_invoice
BEFORE UPDATE ON invoices
FOR EACH ROW
BEGIN
  -- Automatically mark as overdue if past due date and not paid
  IF NEW.due_date < CURDATE() 
     AND NEW.balance_due > 0 
     AND NEW.status NOT IN ('paid', 'cancelled', 'refunded', 'written_off')
     AND OLD.status != 'overdue' THEN
    SET NEW.status = 'overdue';
    SET NEW.overdue_date = CURDATE();
  END IF;
END//
DELIMITER ;

-- ============================================================================
-- VIEWS (For reporting and analytics)
-- ============================================================================

-- View: Outstanding Invoices
CREATE OR REPLACE VIEW v_outstanding_invoices AS
SELECT 
  i.id,
  i.invoice_number,
  i.patient_id,
  i.facility_id,
  i.billing_account_id,
  i.invoice_date,
  i.due_date,
  i.total_amount,
  i.paid_amount,
  i.balance_due,
  i.status,
  i.currency,
  DATEDIFF(CURDATE(), i.due_date) as days_overdue,
  ba.account_number,
  ba.account_type
FROM invoices i
LEFT JOIN billing_accounts ba ON i.billing_account_id = ba.id
WHERE i.status IN ('pending', 'partially_paid', 'overdue')
  AND i.balance_due > 0
  AND i.deleted_at IS NULL
ORDER BY i.due_date ASC;

-- View: Invoice Summary by Patient
CREATE OR REPLACE VIEW v_patient_invoice_summary AS
SELECT 
  i.patient_id,
  i.facility_id,
  COUNT(i.id) as total_invoices,
  SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
  SUM(CASE WHEN i.status IN ('pending', 'partially_paid', 'overdue') THEN 1 ELSE 0 END) as outstanding_invoices,
  SUM(i.total_amount) as total_billed,
  SUM(i.paid_amount) as total_paid,
  SUM(i.balance_due) as total_outstanding,
  MAX(i.invoice_date) as last_invoice_date,
  MAX(i.paid_date) as last_payment_date
FROM invoices i
WHERE i.deleted_at IS NULL
GROUP BY i.patient_id, i.facility_id;

-- View: Claims Needing Action
CREATE OR REPLACE VIEW v_claims_needing_action AS
SELECT 
  ic.id,
  ic.claim_number,
  ic.patient_id,
  ic.status,
  ic.submission_date,
  ic.total_charges,
  ic.denial_reason_code,
  ic.denial_reason_description,
  DATEDIFF(CURDATE(), ic.submission_date) as days_since_submission,
  CASE 
    WHEN ic.status = 'rejected' THEN 'Needs Correction'
    WHEN ic.status = 'denied' AND ic.appeal_deadline > CURDATE() THEN 'Can Appeal'
    WHEN ic.status = 'submitted' AND DATEDIFF(CURDATE(), ic.submission_date) > 30 THEN 'Follow Up'
    ELSE 'Review'
  END as action_required
FROM insurance_claims ic
WHERE ic.status IN ('rejected', 'denied', 'submitted')
  AND (
    ic.status = 'rejected'
    OR (ic.status = 'denied' AND ic.appeal_deadline > CURDATE())
    OR (ic.status = 'submitted' AND DATEDIFF(CURDATE(), ic.submission_date) > 30)
  )
ORDER BY 
  CASE 
    WHEN ic.status = 'rejected' THEN 1
    WHEN ic.status = 'denied' THEN 2
    ELSE 3
  END,
  ic.submission_date ASC;

-- View: Revenue by Service Category
CREATE OR REPLACE VIEW v_revenue_by_category AS
SELECT 
  ili.item_type,
  i.facility_id,
  DATE_FORMAT(i.invoice_date, '%Y-%m') as month,
  COUNT(DISTINCT i.id) as invoice_count,
  SUM(ili.line_total) as total_revenue,
  AVG(ili.line_total) as avg_revenue_per_item,
  SUM(ili.quantity) as total_quantity
FROM invoices i
JOIN invoice_line_items ili ON i.id = ili.invoice_id
WHERE i.status != 'cancelled'
  AND i.deleted_at IS NULL
GROUP BY ili.item_type, i.facility_id, DATE_FORMAT(i.invoice_date, '%Y-%m')
ORDER BY DATE_FORMAT(i.invoice_date, '%Y-%m') DESC, total_revenue DESC;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Generate invoice number
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_generate_invoice_number(
  IN p_facility_id CHAR(36),
  OUT p_invoice_number VARCHAR(50)
)
BEGIN
  DECLARE v_date_part VARCHAR(10);
  DECLARE v_sequence INT;
  
  SET v_date_part = DATE_FORMAT(CURDATE(), '%Y%m%d');
  
  -- Get next sequence for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number, -6) AS UNSIGNED)), 0) + 1
  INTO v_sequence
  FROM invoices
  WHERE invoice_number LIKE CONCAT('INV-', v_date_part, '-%');
  
  -- Format: INV-YYYYMMDD-000001
  SET p_invoice_number = CONCAT('INV-', v_date_part, '-', LPAD(v_sequence, 6, '0'));
END//
DELIMITER ;

-- Procedure: Apply payment to invoice
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_apply_payment_to_invoice(
  IN p_invoice_id CHAR(36),
  IN p_payment_id CHAR(36),
  IN p_payment_amount DECIMAL(12, 2),
  IN p_payment_gateway_reference VARCHAR(255),
  IN p_allocated_by CHAR(36)
)
BEGIN
  DECLARE v_current_paid DECIMAL(12, 2);
  DECLARE v_total_amount DECIMAL(12, 2);
  DECLARE v_new_paid DECIMAL(12, 2);
  DECLARE v_new_balance DECIMAL(12, 2);
  
  -- Get current invoice amounts
  SELECT paid_amount, total_amount
  INTO v_current_paid, v_total_amount
  FROM invoices
  WHERE id = p_invoice_id;
  
  -- Calculate new paid amount
  SET v_new_paid = v_current_paid + p_payment_amount;
  SET v_new_balance = v_total_amount - v_new_paid;
  
  -- Insert allocation record
  INSERT INTO invoice_payment_allocations (
    id, invoice_id, payment_id, payment_gateway_reference,
    allocated_amount, allocation_type, allocated_by
  ) VALUES (
    UUID(), p_invoice_id, p_payment_id, p_payment_gateway_reference,
    p_payment_amount,
    CASE 
      WHEN v_new_balance <= 0 THEN 'full'
      WHEN v_current_paid = 0 THEN 'partial'
      ELSE 'partial'
    END,
    p_allocated_by
  );
  
  -- Update invoice
  UPDATE invoices
  SET 
    paid_amount = v_new_paid,
    status = CASE
      WHEN v_new_balance <= 0 THEN 'paid'
      WHEN v_new_paid > 0 THEN 'partially_paid'
      ELSE status
    END,
    last_payment_date = CURDATE(),
    paid_date = CASE 
      WHEN v_new_balance <= 0 THEN CURDATE()
      ELSE paid_date
    END,
    updated_at = NOW()
  WHERE id = p_invoice_id;
END//
DELIMITER ;

-- Procedure: Mark invoice as overdue (cron job)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_mark_overdue_invoices()
BEGIN
  UPDATE invoices
  SET 
    status = 'overdue',
    overdue_date = CURDATE(),
    updated_at = NOW()
  WHERE status IN ('pending', 'partially_paid')
    AND due_date < CURDATE()
    AND balance_due > 0
    AND deleted_at IS NULL;
    
  SELECT ROW_COUNT() as invoices_marked_overdue;
END//
DELIMITER ;

-- Procedure: Apply late fees to overdue invoices
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_apply_late_fees(
  IN p_applied_by CHAR(36)
)
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_invoice_id CHAR(36);
  DECLARE v_balance_due DECIMAL(12, 2);
  DECLARE v_late_fee_percentage DECIMAL(5, 2);
  DECLARE v_late_fee_amount DECIMAL(10, 2);
  DECLARE v_days_overdue INT;
  
  DECLARE overdue_cursor CURSOR FOR
    SELECT id, balance_due, late_fee_percentage,
           DATEDIFF(CURDATE(), due_date) as days_overdue
    FROM invoices
    WHERE status = 'overdue'
      AND balance_due > 0
      AND DATEDIFF(CURDATE(), due_date) > grace_period_days
      AND deleted_at IS NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN overdue_cursor;
  
  read_loop: LOOP
    FETCH overdue_cursor INTO v_invoice_id, v_balance_due, v_late_fee_percentage, v_days_overdue;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Calculate late fee (monthly compounding)
    SET v_late_fee_amount = v_balance_due * (v_late_fee_percentage / 100) * (v_days_overdue / 30);
    
    IF v_late_fee_amount > 0 THEN
      -- Add late fee to invoice
      UPDATE invoices
      SET 
        late_fees_applied = late_fees_applied + v_late_fee_amount,
        total_amount = total_amount + v_late_fee_amount,
        updated_at = NOW()
      WHERE id = v_invoice_id;
      
      -- Create adjustment record
      INSERT INTO billing_adjustments (
        id, invoice_id, patient_id, adjustment_type,
        adjustment_reason, adjustment_amount, is_credit, created_by
      )
      SELECT 
        UUID(), v_invoice_id, patient_id, 'late_fee',
        CONCAT('Late fee for ', v_days_overdue, ' days overdue'),
        v_late_fee_amount, FALSE, p_applied_by
      FROM invoices WHERE id = v_invoice_id;
    END IF;
    
  END LOOP;
  
  CLOSE overdue_cursor;
  
  SELECT ROW_COUNT() as late_fees_applied;
END//
DELIMITER ;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default charge master items (sample)
INSERT IGNORE INTO charge_master (
  id, item_code, item_name, item_category, cpt_code, base_price, currency, is_active, effective_date, created_by
) VALUES
(UUID(), 'CONS-GEN', 'General Consultation', 'consultation', '99213', 150.00, 'SDG', TRUE, CURDATE(), 'system'),
(UUID(), 'CONS-SPEC', 'Specialist Consultation', 'consultation', '99214', 250.00, 'SDG', TRUE, CURDATE(), 'system'),
(UUID(), 'LAB-CBC', 'Complete Blood Count (CBC)', 'lab_test', '85025', 80.00, 'SDG', TRUE, CURDATE(), 'system'),
(UUID(), 'LAB-CHEM', 'Basic Metabolic Panel', 'lab_test', '80048', 120.00, 'SDG', TRUE, CURDATE(), 'system'),
(UUID(), 'RAD-XRAY', 'X-Ray (Single View)', 'radiology', '71010', 200.00, 'SDG', TRUE, CURDATE(), 'system'),
(UUID(), 'RAD-CT', 'CT Scan', 'radiology', '70450', 1500.00, 'SDG', TRUE, CURDATE(), 'system'),
(UUID(), 'ROOM-STD', 'Standard Room (Per Day)', 'room_charge', '99999', 500.00, 'SDG', TRUE, CURDATE(), 'system'),
(UUID(), 'ROOM-ICU', 'ICU Room (Per Day)', 'room_charge', '99999', 2000.00, 'SDG', TRUE, CURDATE(), 'system'),
(UUID(), 'PROC-MINOR', 'Minor Procedure', 'procedure', '10060', 300.00, 'SDG', TRUE, CURDATE(), 'system'),
(UUID(), 'PROC-MAJOR', 'Major Procedure', 'procedure', '47562', 5000.00, 'SDG', TRUE, CURDATE(), 'system');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_patient_status_date 
  ON invoices(patient_id, status, invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_facility_status_date 
  ON invoices(facility_id, status, invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_claims_patient_status 
  ON insurance_claims(patient_id, status);

CREATE INDEX IF NOT EXISTS idx_claims_submission_status 
  ON insurance_claims(submission_date DESC, status);

-- ============================================================================
-- GRANTS (Optional - for dedicated user)
-- ============================================================================

-- CREATE USER IF NOT EXISTS 'billing_service'@'%' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE ON nilecare.invoices TO 'billing_service'@'%';
-- GRANT SELECT, INSERT, UPDATE ON nilecare.invoice_line_items TO 'billing_service'@'%';
-- GRANT SELECT, INSERT, UPDATE ON nilecare.billing_accounts TO 'billing_service'@'%';
-- GRANT SELECT, INSERT, UPDATE ON nilecare.insurance_claims TO 'billing_service'@'%';
-- GRANT SELECT, INSERT, UPDATE ON nilecare.claim_line_items TO 'billing_service'@'%';
-- GRANT SELECT, INSERT, UPDATE ON nilecare.billing_adjustments TO 'billing_service'@'%';
-- GRANT SELECT, INSERT ON nilecare.billing_audit_log TO 'billing_service'@'%';
-- GRANT EXECUTE ON PROCEDURE nilecare.sp_generate_invoice_number TO 'billing_service'@'%';
-- GRANT EXECUTE ON PROCEDURE nilecare.sp_apply_payment_to_invoice TO 'billing_service'@'%';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- SCHEMA VALIDATION QUERIES (For testing)
-- ============================================================================

-- Check all billing tables exist
SELECT 
  TABLE_NAME, 
  TABLE_ROWS, 
  DATA_LENGTH,
  INDEX_LENGTH
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'nilecare'
  AND TABLE_NAME IN (
    'invoices',
    'invoice_line_items',
    'invoice_payment_allocations',
    'billing_accounts',
    'insurance_claims',
    'claim_line_items',
    'billing_adjustments',
    'billing_statements',
    'charge_master',
    'billing_audit_log',
    'payment_reminders'
  )
ORDER BY TABLE_NAME;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

