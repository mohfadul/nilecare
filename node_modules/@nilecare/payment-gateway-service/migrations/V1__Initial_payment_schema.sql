-- ============================================================================
-- Payment Gateway Service - Initial Schema Migration
-- Version: 1
-- Description: Create payment processing tables for Sudan healthcare
-- Author: Database Team
-- Date: 2025-10-15
-- Ticket: DB-003
-- ============================================================================

-- ============================================================================
-- PAYMENT PROVIDERS CONFIGURATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_providers (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Provider Details
  name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Provider identifier: bank_of_khartoum, zain_cash, etc.',
  display_name VARCHAR(255) NOT NULL,
  provider_type ENUM(
    'bank_card',
    'local_bank',
    'mobile_wallet',
    'digital_wallet',
    'cash',
    'cheque',
    'bank_transfer'
  ) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_test_mode BOOLEAN DEFAULT FALSE,
  
  -- Verification Configuration
  verification_type ENUM('manual', 'api_auto', 'webhook', 'hybrid') NOT NULL,
  requires_manual_approval BOOLEAN DEFAULT FALSE,
  
  -- API Configuration (encrypted JSON)
  api_config JSON COMMENT 'Provider API configuration (encrypted)',
  
  -- Supported Features
  supported_currencies JSON DEFAULT '["SDG", "USD"]',
  supports_refunds BOOLEAN DEFAULT TRUE,
  supports_partial_refunds BOOLEAN DEFAULT TRUE,
  supports_installments BOOLEAN DEFAULT FALSE,
  
  -- Fee Structure
  fee_structure JSON COMMENT 'Fee structure: {percentage, fixed_amount, min_fee, max_fee}',
  
  -- Transaction Limits
  min_transaction_amount DECIMAL(10, 2) DEFAULT 0,
  max_transaction_amount DECIMAL(10, 2),
  daily_transaction_limit DECIMAL(10, 2),
  
  -- Processing Times (in minutes)
  avg_processing_time INT DEFAULT 5,
  max_processing_time INT DEFAULT 30,
  
  -- Contact Information
  support_phone VARCHAR(20) COMMENT 'Sudan format: +249xxxxxxxxx',
  support_email VARCHAR(255),
  support_url TEXT,
  
  -- Metadata
  metadata JSON,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_payment_providers_type (provider_type),
  INDEX idx_payment_providers_active (is_active),
  INDEX idx_payment_providers_verification (verification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment provider configuration';

-- ============================================================================
-- PAYMENT TRANSACTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- References (NO FK constraints - cross-service)
  invoice_id CHAR(36) NOT NULL COMMENT 'Reference to billing service invoice',
  patient_id CHAR(36) NOT NULL COMMENT 'Reference to clinical service patient',
  facility_id CHAR(36) NOT NULL COMMENT 'Reference to facility service',
  provider_id CHAR(36) NOT NULL,
  
  -- Payment Details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SDG',
  exchange_rate DECIMAL(10, 4) DEFAULT 1.0000,
  amount_in_sdg DECIMAL(10, 2) NOT NULL,
  
  -- Transaction References
  transaction_id VARCHAR(255) COMMENT 'Provider transaction reference',
  merchant_reference VARCHAR(255) NOT NULL UNIQUE COMMENT 'Our internal reference',
  external_reference VARCHAR(255) COMMENT 'Customer reference (cheque number, etc.)',
  
  -- Status Tracking
  status ENUM(
    'pending',
    'processing',
    'awaiting_verification',
    'verified',
    'confirmed',
    'rejected',
    'failed',
    'cancelled',
    'refunded',
    'partially_refunded'
  ) DEFAULT 'pending',
  
  failure_reason TEXT,
  rejection_reason TEXT,
  
  -- Verification Information
  verification_method ENUM('manual', 'api', 'webhook', 'cash_receipt', 'bank_statement'),
  verified_by CHAR(36),
  verified_at TIMESTAMP NULL,
  verification_notes TEXT,
  
  -- Evidence (for manual verification)
  evidence_urls JSON COMMENT 'Array of receipt/screenshot URLs',
  
  -- Payment Method Details
  payment_method_details JSON COMMENT 'Provider-specific payment details',
  
  -- Fraud Detection
  risk_score INT DEFAULT 0 COMMENT '0-100 risk score',
  fraud_flags JSON COMMENT 'Array of fraud detection flags',
  is_flagged_suspicious BOOLEAN DEFAULT FALSE,
  
  -- Fees
  provider_fee DECIMAL(10, 2) DEFAULT 0,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  total_fees DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  
  -- Timestamps
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  confirmed_at TIMESTAMP NULL,
  failed_at TIMESTAMP NULL,
  
  -- Audit Trail
  created_by CHAR(36) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys (only within service)
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  
  -- Indexes
  INDEX idx_payments_invoice (invoice_id),
  INDEX idx_payments_patient (patient_id),
  INDEX idx_payments_facility (facility_id),
  INDEX idx_payments_provider (provider_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_merchant_ref (merchant_reference),
  INDEX idx_payments_transaction_id (transaction_id),
  INDEX idx_payments_created_at (created_at DESC),
  INDEX idx_payments_confirmed_at (confirmed_at DESC),
  INDEX idx_payments_verification (status, verification_method),
  INDEX idx_payments_fraud (is_flagged_suspicious, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment transactions';

-- ============================================================================
-- PAYMENT RECONCILIATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_reconciliation (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  payment_id CHAR(36) NOT NULL,
  
  -- External Transaction Details
  external_transaction_id VARCHAR(255),
  external_amount DECIMAL(10, 2),
  external_currency VARCHAR(3),
  external_fee DECIMAL(10, 2),
  transaction_date TIMESTAMP,
  
  -- Reconciliation Status
  reconciliation_status ENUM(
    'pending',
    'matched',
    'mismatch',
    'investigating',
    'resolved',
    'written_off'
  ) DEFAULT 'pending',
  
  -- Discrepancy Details
  amount_difference DECIMAL(10, 2),
  discrepancy_reason TEXT,
  discrepancy_type ENUM('amount', 'timing', 'missing', 'duplicate', 'other'),
  
  -- Resolution
  resolved_by CHAR(36),
  resolved_at TIMESTAMP NULL,
  resolution_notes TEXT,
  resolution_action ENUM('adjust_payment', 'refund', 'write_off', 'contact_provider', 'none'),
  
  -- Bank Statement Reference
  bank_statement_id CHAR(36),
  statement_line_number INT,
  statement_file_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  
  -- Indexes
  INDEX idx_payment_reconciliation_payment (payment_id),
  INDEX idx_payment_reconciliation_status (reconciliation_status),
  INDEX idx_payment_reconciliation_date (transaction_date),
  INDEX idx_payment_reconciliation_external_tx (external_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment reconciliation tracking';

-- ============================================================================
-- PAYMENT REFUNDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_refunds (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  payment_id CHAR(36) NOT NULL,
  
  -- Refund Details
  refund_amount DECIMAL(10, 2) NOT NULL,
  refund_currency VARCHAR(3) DEFAULT 'SDG',
  refund_reason ENUM(
    'patient_request',
    'service_cancellation',
    'service_not_delivered',
    'overpayment',
    'duplicate_payment',
    'billing_error',
    'quality_issue',
    'system_error',
    'other'
  ) NOT NULL,
  refund_reason_details TEXT,
  
  -- Status
  status ENUM(
    'pending',
    'approved',
    'processing',
    'completed',
    'failed',
    'rejected'
  ) DEFAULT 'pending',
  
  failure_reason TEXT,
  
  -- Provider Details
  provider_refund_id VARCHAR(255),
  refund_method ENUM('original_payment_method', 'bank_transfer', 'cash', 'credit_note'),
  
  -- Approval Workflow
  requested_by CHAR(36) NOT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by CHAR(36),
  approved_at TIMESTAMP NULL,
  processed_by CHAR(36),
  processed_at TIMESTAMP NULL,
  
  -- Refund Reference
  refund_reference VARCHAR(255) UNIQUE,
  
  -- Bank Details (for bank transfer refunds)
  bank_account_details JSON COMMENT 'Bank account for refund transfer',
  
  -- Timestamps
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  
  -- Indexes
  INDEX idx_payment_refunds_payment (payment_id),
  INDEX idx_payment_refunds_status (status),
  INDEX idx_payment_refunds_reference (refund_reference),
  INDEX idx_payment_refunds_requested_at (requested_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment refund management';

-- ============================================================================
-- INVOICE PAYMENT ALLOCATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoice_payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_id CHAR(36) NOT NULL COMMENT 'Reference to billing service',
  payment_id CHAR(36) NOT NULL,
  
  -- Allocation Details
  allocated_amount DECIMAL(10, 2) NOT NULL,
  allocation_type ENUM('full', 'partial', 'installment', 'overpayment'),
  
  -- Timestamps
  allocation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  allocated_by CHAR(36),
  
  -- Metadata
  notes TEXT,
  
  -- Foreign Keys
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  
  -- Indexes
  INDEX idx_invoice_payments_invoice (invoice_id),
  INDEX idx_invoice_payments_payment (payment_id),
  INDEX idx_invoice_payments_date (allocation_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment allocation to invoices';

-- ============================================================================
-- PAYMENT INSTALLMENT PLANS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_installment_plans (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  
  -- Plan Details
  total_amount DECIMAL(10, 2) NOT NULL,
  down_payment DECIMAL(10, 2) DEFAULT 0,
  remaining_amount DECIMAL(10, 2) NOT NULL,
  
  number_of_installments INT NOT NULL,
  installment_amount DECIMAL(10, 2) NOT NULL,
  installment_frequency ENUM('weekly', 'biweekly', 'monthly', 'quarterly') DEFAULT 'monthly',
  
  -- Status
  status ENUM('active', 'completed', 'defaulted', 'cancelled') DEFAULT 'active',
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  next_due_date DATE,
  
  -- Late Payment
  late_fee_percentage DECIMAL(5, 2) DEFAULT 2.00,
  grace_period_days INT DEFAULT 7,
  
  -- Approval
  approved_by CHAR(36),
  approved_at TIMESTAMP NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_installment_plans_invoice (invoice_id),
  INDEX idx_installment_plans_patient (patient_id),
  INDEX idx_installment_plans_facility (facility_id),
  INDEX idx_installment_plans_status (status),
  INDEX idx_installment_plans_next_due (next_due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment installment plans';

-- ============================================================================
-- INSTALLMENT SCHEDULE
-- ============================================================================
CREATE TABLE IF NOT EXISTS installment_schedule (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  plan_id CHAR(36) NOT NULL,
  
  -- Installment Details
  installment_number INT NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status ENUM('pending', 'paid', 'overdue', 'waived') DEFAULT 'pending',
  
  -- Payment
  payment_id CHAR(36),
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  paid_at TIMESTAMP NULL,
  
  -- Late Fees
  late_fee_applied DECIMAL(10, 2) DEFAULT 0,
  days_overdue INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (plan_id) REFERENCES payment_installment_plans(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  
  -- Indexes
  INDEX idx_installment_schedule_plan (plan_id),
  INDEX idx_installment_schedule_due_date (due_date),
  INDEX idx_installment_schedule_status (status),
  INDEX idx_installment_schedule_payment (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Installment payment schedule';

-- ============================================================================
-- PAYMENT WEBHOOKS LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Webhook Details
  provider_id CHAR(36) NOT NULL,
  webhook_event VARCHAR(100) NOT NULL,
  webhook_id VARCHAR(255),
  
  -- Request Details
  request_method VARCHAR(10) DEFAULT 'POST',
  request_headers JSON,
  request_body JSON NOT NULL,
  request_signature VARCHAR(500),
  
  -- Processing
  is_verified BOOLEAN DEFAULT FALSE,
  is_processed BOOLEAN DEFAULT FALSE,
  processing_attempts INT DEFAULT 0,
  last_processing_error TEXT,
  
  -- Related Payment
  payment_id CHAR(36),
  
  -- Timestamps
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  
  -- Foreign Keys
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  
  -- Indexes
  INDEX idx_payment_webhooks_provider (provider_id),
  INDEX idx_payment_webhooks_payment (payment_id),
  INDEX idx_payment_webhooks_event (webhook_event),
  INDEX idx_payment_webhooks_processed (is_processed),
  INDEX idx_payment_webhooks_received (received_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment webhook log';

-- ============================================================================
-- PAYMENT DISPUTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_disputes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  payment_id CHAR(36) NOT NULL,
  
  -- Dispute Details
  dispute_type ENUM(
    'unauthorized',
    'amount_incorrect',
    'service_not_received',
    'quality_issue',
    'duplicate_charge',
    'other'
  ) NOT NULL,
  dispute_reason TEXT NOT NULL,
  
  -- Status
  status ENUM('open', 'investigating', 'resolved', 'closed') DEFAULT 'open',
  
  -- Resolution
  resolution ENUM('refund_issued', 'charge_reversed', 'no_action', 'partial_refund'),
  resolution_notes TEXT,
  
  -- Evidence
  evidence_urls JSON,
  
  -- Parties
  raised_by CHAR(36) NOT NULL,
  assigned_to CHAR(36),
  resolved_by CHAR(36),
  
  -- Timestamps
  raised_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  
  -- Foreign Keys
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  
  -- Indexes
  INDEX idx_payment_disputes_payment (payment_id),
  INDEX idx_payment_disputes_status (status),
  INDEX idx_payment_disputes_raised_at (raised_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment dispute management';

-- ============================================================================
-- PAYMENT ANALYTICS (SUMMARY TABLE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_analytics_daily (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Dimensions
  date DATE NOT NULL,
  facility_id CHAR(36) NOT NULL,
  provider_id CHAR(36) NOT NULL,
  
  -- Metrics
  total_transactions INT DEFAULT 0,
  successful_transactions INT DEFAULT 0,
  failed_transactions INT DEFAULT 0,
  pending_transactions INT DEFAULT 0,
  
  total_amount DECIMAL(12, 2) DEFAULT 0,
  total_fees DECIMAL(12, 2) DEFAULT 0,
  total_refunds DECIMAL(12, 2) DEFAULT 0,
  
  avg_transaction_amount DECIMAL(10, 2) DEFAULT 0,
  avg_processing_time_seconds INT DEFAULT 0,
  
  success_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Unique constraint
  UNIQUE KEY uk_daily_analytics (date, facility_id, provider_id),
  
  -- Indexes
  INDEX idx_payment_analytics_date (date DESC),
  INDEX idx_payment_analytics_facility (facility_id),
  INDEX idx_payment_analytics_provider (provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Daily payment analytics aggregation';

-- ============================================================================
-- SEED SUDAN PAYMENT PROVIDERS
-- ============================================================================
INSERT INTO payment_providers (name, display_name, provider_type, verification_type, fee_structure, supported_currencies, is_active) VALUES
-- Bank Cards
('visa', 'Visa', 'bank_card', 'api_auto', '{"percentage": 2.5, "fixed_amount": 0, "currency": "SDG"}', '["SDG", "USD"]', TRUE),
('mastercard', 'Mastercard', 'bank_card', 'api_auto', '{"percentage": 2.5, "fixed_amount": 0, "currency": "SDG"}', '["SDG", "USD"]', TRUE),

-- Local Banks
('bank_of_khartoum', 'Bank of Khartoum', 'local_bank', 'api_auto', '{"percentage": 1.5, "fixed_amount": 0, "currency": "SDG"}', '["SDG"]', TRUE),
('faisal_islamic', 'Faisal Islamic Bank', 'local_bank', 'api_auto', '{"percentage": 1.5, "fixed_amount": 0, "currency": "SDG"}', '["SDG"]', TRUE),
('omdurman_national', 'Omdurman National Bank', 'local_bank', 'api_auto', '{"percentage": 1.5, "fixed_amount": 0, "currency": "SDG"}', '["SDG"]', TRUE),

-- Mobile Wallets
('zain_cash', 'Zain Cash', 'mobile_wallet', 'api_auto', '{"percentage": 1.0, "fixed_amount": 0, "currency": "SDG"}', '["SDG"]', TRUE),
('mtn_money', 'MTN Mobile Money', 'mobile_wallet', 'api_auto', '{"percentage": 1.0, "fixed_amount": 0, "currency": "SDG"}', '["SDG"]', TRUE),
('sudani_cash', 'Sudani Cash', 'mobile_wallet', 'api_auto', '{"percentage": 1.0, "fixed_amount": 0, "currency": "SDG"}', '["SDG"]', TRUE),
('bankak', 'Bankak', 'digital_wallet', 'api_auto', '{"percentage": 1.5, "fixed_amount": 0, "currency": "SDG"}', '["SDG"]', TRUE),

-- Traditional Methods
('cash', 'Cash', 'cash', 'manual', '{"percentage": 0, "fixed_amount": 0, "currency": "SDG"}', '["SDG", "USD"]', TRUE),
('cheque', 'Cheque', 'cheque', 'manual', '{"percentage": 0, "fixed_amount": 0, "currency": "SDG"}', '["SDG"]', TRUE),
('bank_transfer', 'Bank Transfer', 'bank_transfer', 'hybrid', '{"percentage": 1.0, "fixed_amount": 0, "currency": "SDG"}', '["SDG", "USD"]', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Log migration completion
SELECT 'Migration V1__Initial_payment_schema completed successfully' as status;

