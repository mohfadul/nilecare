-- ============================================================================
-- NILECARE PAYMENT SYSTEM DATABASE SCHEMA
-- Database: payment_system (MySQL 8.0+)
-- Description: Complete payment processing schema for Sudan healthcare
-- Version: 2.0.0
-- ============================================================================

-- Set character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create database
CREATE DATABASE IF NOT EXISTS nilecare_payment_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nilecare_payment_system;

-- ============================================================================
-- 1. PAYMENT PROVIDERS CONFIGURATION
-- ============================================================================

CREATE TABLE payment_providers (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Provider Details
  name VARCHAR(100) NOT NULL UNIQUE,
  -- Values: 'bank_of_khartoum', 'faisal_islamic', 'omdurman_national',
  --         'zain_cash', 'mtn_money', 'sudani_cash', 'bankak',
  --         'visa', 'mastercard', 'cash', 'cheque', 'bank_transfer'
  
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
  api_config JSON,
  -- Structure: {
  --   "base_url": "https://api.provider.com",
  --   "api_key": "encrypted_key",
  --   "api_secret": "encrypted_secret",
  --   "merchant_id": "merchant_123",
  --   "webhook_url": "https://nilecare.sd/webhooks/payment",
  --   "timeout_seconds": 30
  -- }
  
  -- Supported Features
  supported_currencies JSON DEFAULT '["SDG", "USD"]',
  supports_refunds BOOLEAN DEFAULT TRUE,
  supports_partial_refunds BOOLEAN DEFAULT TRUE,
  supports_installments BOOLEAN DEFAULT FALSE,
  
  -- Fee Structure
  fee_structure JSON,
  -- Structure: {
  --   "percentage": 1.5,
  --   "fixed_amount": 0,
  --   "min_fee": 5,
  --   "max_fee": 1000,
  --   "currency": "SDG"
  -- }
  
  -- Transaction Limits
  min_transaction_amount DECIMAL(10, 2) DEFAULT 0,
  max_transaction_amount DECIMAL(10, 2),
  daily_transaction_limit DECIMAL(10, 2),
  
  -- Processing Times (in minutes)
  avg_processing_time INT DEFAULT 5,
  max_processing_time INT DEFAULT 30,
  
  -- Contact Information
  support_phone VARCHAR(20),
  support_email VARCHAR(255),
  support_url TEXT,
  
  -- Metadata
  metadata JSON,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_provider_type (provider_type),
  INDEX idx_is_active (is_active),
  INDEX idx_verification_type (verification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. PAYMENT TRANSACTIONS
-- ============================================================================

CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- References
  invoice_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  provider_id CHAR(36) NOT NULL,
  
  -- Payment Details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SDG',
  exchange_rate DECIMAL(10, 4) DEFAULT 1.0000,
  amount_in_sdg DECIMAL(10, 2) NOT NULL, -- Always store SDG equivalent
  
  -- Transaction References
  transaction_id VARCHAR(255), -- Provider's transaction reference
  merchant_reference VARCHAR(255) NOT NULL UNIQUE, -- Our internal reference
  external_reference VARCHAR(255), -- Customer's reference (e.g., cheque number)
  
  -- Status Tracking
  status ENUM(
    'pending',           -- Payment initiated
    'processing',        -- Being processed by provider
    'awaiting_verification', -- Waiting for manual verification
    'verified',          -- Verified but not yet confirmed
    'confirmed',         -- Payment confirmed and completed
    'rejected',          -- Payment rejected
    'failed',            -- Payment failed
    'cancelled',         -- Payment cancelled
    'refunded',          -- Payment refunded
    'partially_refunded' -- Partial refund issued
  ) DEFAULT 'pending',
  
  failure_reason TEXT,
  rejection_reason TEXT,
  
  -- Verification Information
  verification_method ENUM('manual', 'api', 'webhook', 'cash_receipt', 'bank_statement'),
  verified_by CHAR(36), -- Admin who manually verified
  verified_at TIMESTAMP NULL,
  verification_notes TEXT,
  
  -- Evidence (for manual verification)
  evidence_urls JSON, -- Array of S3 URLs for receipts, screenshots, etc.
  -- Structure: [
  --   {"type": "receipt", "url": "s3://...", "uploaded_at": "2024-10-08T10:00:00Z"},
  --   {"type": "screenshot", "url": "s3://...", "uploaded_at": "2024-10-08T10:05:00Z"}
  -- ]
  
  -- Payment Method Details
  payment_method_details JSON,
  -- Structure varies by provider type:
  -- Bank Card: {"card_last4": "1234", "card_brand": "Visa", "card_holder": "Ahmed Hassan"}
  -- Mobile Wallet: {"phone_number": "+249912345678", "wallet_name": "Zain Cash"}
  -- Cash: {"denomination_breakdown": {"1000": 5, "500": 2}, "received_by": "Staff Name"}
  -- Cheque: {"cheque_number": "123456", "bank": "Bank of Khartoum", "cheque_date": "2024-10-08"}
  
  -- Fraud Detection
  risk_score INT DEFAULT 0, -- 0-100
  fraud_flags JSON, -- Array of fraud detection flags
  is_flagged_suspicious BOOLEAN DEFAULT FALSE,
  
  -- Fees
  provider_fee DECIMAL(10, 2) DEFAULT 0,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  total_fees DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL, -- amount - total_fees
  
  -- Timestamps
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  confirmed_at TIMESTAMP NULL,
  failed_at TIMESTAMP NULL,
  
  -- Audit Trail
  created_by CHAR(36) NOT NULL, -- User who initiated the payment
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  
  -- Indexes
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_facility_id (facility_id),
  INDEX idx_provider_id (provider_id),
  INDEX idx_status (status),
  INDEX idx_merchant_reference (merchant_reference),
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_confirmed_at (confirmed_at DESC),
  INDEX idx_verification_status (status, verification_method),
  INDEX idx_fraud_flagged (is_flagged_suspicious, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. PAYMENT RECONCILIATION & AUDIT
-- ============================================================================

CREATE TABLE payment_reconciliation (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  payment_id CHAR(36) NOT NULL,
  
  -- External Transaction Details (from bank/provider statement)
  external_transaction_id VARCHAR(255),
  external_amount DECIMAL(10, 2),
  external_currency VARCHAR(3),
  external_fee DECIMAL(10, 2),
  transaction_date TIMESTAMP,
  
  -- Reconciliation Status
  reconciliation_status ENUM(
    'pending',       -- Not yet reconciled
    'matched',       -- Amounts match perfectly
    'mismatch',      -- Discrepancy found
    'investigating', -- Under investigation
    'resolved',      -- Discrepancy resolved
    'written_off'    -- Small discrepancy written off
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
  INDEX idx_payment_id (payment_id),
  INDEX idx_reconciliation_status (reconciliation_status),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_external_transaction_id (external_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. REFUND MANAGEMENT
-- ============================================================================

CREATE TABLE payment_refunds (
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
    'pending',      -- Refund requested
    'approved',     -- Approved by admin
    'processing',   -- Being processed by provider
    'completed',    -- Refund completed
    'failed',       -- Refund failed
    'rejected'      -- Refund rejected
  ) DEFAULT 'pending',
  
  failure_reason TEXT,
  
  -- Provider Details
  provider_refund_id VARCHAR(255), -- Provider's refund reference
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
  bank_account_details JSON,
  -- Structure: {
  --   "account_holder": "Ahmed Hassan",
  --   "bank_name": "Bank of Khartoum",
  --   "account_number": "1234567890",
  --   "iban": "SD12345678901234567890"
  -- }
  
  -- Timestamps
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  
  -- Indexes
  INDEX idx_payment_id (payment_id),
  INDEX idx_status (status),
  INDEX idx_refund_reference (refund_reference),
  INDEX idx_requested_at (requested_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. INVOICE PAYMENT ALLOCATION
-- ============================================================================

CREATE TABLE invoice_payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_id CHAR(36) NOT NULL,
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
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_payment_id (payment_id),
  INDEX idx_allocation_date (allocation_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. PAYMENT INSTALLMENT PLANS
-- ============================================================================

CREATE TABLE payment_installment_plans (
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
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_facility_id (facility_id),
  INDEX idx_status (status),
  INDEX idx_next_due_date (next_due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. INSTALLMENT SCHEDULE
-- ============================================================================

CREATE TABLE installment_schedule (
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
  INDEX idx_plan_id (plan_id),
  INDEX idx_due_date (due_date),
  INDEX idx_status (status),
  INDEX idx_payment_id (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. PAYMENT WEBHOOKS LOG
-- ============================================================================

CREATE TABLE payment_webhooks (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Webhook Details
  provider_id CHAR(36) NOT NULL,
  webhook_event VARCHAR(100) NOT NULL,
  webhook_id VARCHAR(255), -- Provider's webhook ID
  
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
  INDEX idx_provider_id (provider_id),
  INDEX idx_payment_id (payment_id),
  INDEX idx_webhook_event (webhook_event),
  INDEX idx_is_processed (is_processed),
  INDEX idx_received_at (received_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. PAYMENT DISPUTES
-- ============================================================================

CREATE TABLE payment_disputes (
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
  raised_by CHAR(36) NOT NULL, -- Patient or staff
  assigned_to CHAR(36),
  resolved_by CHAR(36),
  
  -- Timestamps
  raised_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  
  -- Foreign Keys
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  
  -- Indexes
  INDEX idx_payment_id (payment_id),
  INDEX idx_status (status),
  INDEX idx_raised_at (raised_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. PAYMENT ANALYTICS (Summary Table)
-- ============================================================================

CREATE TABLE payment_analytics_daily (
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
  
  success_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Unique constraint
  UNIQUE KEY unique_daily_analytics (date, facility_id, provider_id),
  
  -- Indexes
  INDEX idx_date (date DESC),
  INDEX idx_facility_id (facility_id),
  INDEX idx_provider_id (provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update payment status when refund is completed
DELIMITER //
CREATE TRIGGER trg_update_payment_on_refund
AFTER UPDATE ON payment_refunds
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Check if full refund
    DECLARE payment_amount DECIMAL(10, 2);
    DECLARE total_refunded DECIMAL(10, 2);
    
    SELECT amount INTO payment_amount 
    FROM payments 
    WHERE id = NEW.payment_id;
    
    SELECT COALESCE(SUM(refund_amount), 0) INTO total_refunded
    FROM payment_refunds
    WHERE payment_id = NEW.payment_id AND status = 'completed';
    
    IF total_refunded >= payment_amount THEN
      UPDATE payments 
      SET status = 'refunded'
      WHERE id = NEW.payment_id;
    ELSE
      UPDATE payments 
      SET status = 'partially_refunded'
      WHERE id = NEW.payment_id;
    END IF;
  END IF;
END//
DELIMITER ;

-- Trigger: Calculate net amount before insert
DELIMITER //
CREATE TRIGGER trg_calculate_net_amount_insert
BEFORE INSERT ON payments
FOR EACH ROW
BEGIN
  SET NEW.total_fees = NEW.provider_fee + NEW.platform_fee;
  SET NEW.net_amount = NEW.amount - NEW.total_fees;
  SET NEW.merchant_reference = CONCAT('PAY-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', SUBSTRING(NEW.id, 1, 8));
END//
DELIMITER ;

-- Trigger: Calculate net amount before update
DELIMITER //
CREATE TRIGGER trg_calculate_net_amount_update
BEFORE UPDATE ON payments
FOR EACH ROW
BEGIN
  SET NEW.total_fees = NEW.provider_fee + NEW.platform_fee;
  SET NEW.net_amount = NEW.amount - NEW.total_fees;
END//
DELIMITER ;

-- Trigger: Update installment plan status
DELIMITER //
CREATE TRIGGER trg_update_installment_plan_status
AFTER UPDATE ON installment_schedule
FOR EACH ROW
BEGIN
  DECLARE total_installments INT;
  DECLARE paid_installments INT;
  
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    SELECT COUNT(*) INTO total_installments
    FROM installment_schedule
    WHERE plan_id = NEW.plan_id;
    
    SELECT COUNT(*) INTO paid_installments
    FROM installment_schedule
    WHERE plan_id = NEW.plan_id AND status = 'paid';
    
    IF paid_installments >= total_installments THEN
      UPDATE payment_installment_plans
      SET status = 'completed'
      WHERE id = NEW.plan_id;
    END IF;
  END IF;
END//
DELIMITER ;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Process Payment
DELIMITER //
CREATE PROCEDURE sp_process_payment(
  IN p_invoice_id CHAR(36),
  IN p_patient_id CHAR(36),
  IN p_facility_id CHAR(36),
  IN p_provider_id CHAR(36),
  IN p_amount DECIMAL(10, 2),
  IN p_currency VARCHAR(3),
  IN p_created_by CHAR(36),
  OUT p_payment_id CHAR(36),
  OUT p_merchant_reference VARCHAR(255)
)
BEGIN
  DECLARE v_provider_fee DECIMAL(10, 2);
  DECLARE v_platform_fee DECIMAL(10, 2);
  DECLARE v_fee_percentage DECIMAL(5, 2);
  
  -- Get provider fee structure
  SELECT JSON_EXTRACT(fee_structure, '$.percentage') INTO v_fee_percentage
  FROM payment_providers
  WHERE id = p_provider_id;
  
  -- Calculate fees
  SET v_provider_fee = p_amount * (v_fee_percentage / 100);
  SET v_platform_fee = 0; -- Can be configured
  
  -- Create payment
  SET p_payment_id = UUID();
  
  INSERT INTO payments (
    id, invoice_id, patient_id, facility_id, provider_id,
    amount, currency, amount_in_sdg,
    provider_fee, platform_fee,
    status, created_by
  ) VALUES (
    p_payment_id, p_invoice_id, p_patient_id, p_facility_id, p_provider_id,
    p_amount, p_currency, p_amount, -- Assuming SDG
    v_provider_fee, v_platform_fee,
    'pending', p_created_by
  );
  
  -- Get merchant reference
  SELECT merchant_reference INTO p_merchant_reference
  FROM payments
  WHERE id = p_payment_id;
END//
DELIMITER ;

-- Procedure: Reconcile Payment
DELIMITER //
CREATE PROCEDURE sp_reconcile_payment(
  IN p_payment_id CHAR(36),
  IN p_external_transaction_id VARCHAR(255),
  IN p_external_amount DECIMAL(10, 2),
  IN p_transaction_date TIMESTAMP
)
BEGIN
  DECLARE v_payment_amount DECIMAL(10, 2);
  DECLARE v_reconciliation_status VARCHAR(20);
  DECLARE v_amount_difference DECIMAL(10, 2);
  
  -- Get payment amount
  SELECT amount INTO v_payment_amount
  FROM payments
  WHERE id = p_payment_id;
  
  -- Calculate difference
  SET v_amount_difference = v_payment_amount - p_external_amount;
  
  -- Determine status
  IF ABS(v_amount_difference) < 0.01 THEN
    SET v_reconciliation_status = 'matched';
  ELSE
    SET v_reconciliation_status = 'mismatch';
  END IF;
  
  -- Insert reconciliation record
  INSERT INTO payment_reconciliation (
    payment_id, external_transaction_id, external_amount,
    transaction_date, reconciliation_status, amount_difference
  ) VALUES (
    p_payment_id, p_external_transaction_id, p_external_amount,
    p_transaction_date, v_reconciliation_status, v_amount_difference
  );
END//
DELIMITER ;

-- Procedure: Generate Daily Analytics
DELIMITER //
CREATE PROCEDURE sp_generate_daily_payment_analytics(
  IN p_date DATE
)
BEGIN
  INSERT INTO payment_analytics_daily (
    date, facility_id, provider_id,
    total_transactions, successful_transactions, failed_transactions, pending_transactions,
    total_amount, total_fees, total_refunds,
    avg_transaction_amount, avg_processing_time_seconds, success_rate
  )
  SELECT
    DATE(p.created_at) as date,
    p.facility_id,
    p.provider_id,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN p.status = 'confirmed' THEN 1 ELSE 0 END) as successful_transactions,
    SUM(CASE WHEN p.status IN ('failed', 'rejected') THEN 1 ELSE 0 END) as failed_transactions,
    SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) as pending_transactions,
    SUM(p.amount) as total_amount,
    SUM(p.total_fees) as total_fees,
    COALESCE(SUM(r.refund_amount), 0) as total_refunds,
    AVG(p.amount) as avg_transaction_amount,
    AVG(TIMESTAMPDIFF(SECOND, p.initiated_at, p.confirmed_at)) as avg_processing_time_seconds,
    (SUM(CASE WHEN p.status = 'confirmed' THEN 1 ELSE 0 END) / COUNT(*) * 100) as success_rate
  FROM payments p
  LEFT JOIN payment_refunds r ON p.id = r.payment_id AND r.status = 'completed'
  WHERE DATE(p.created_at) = p_date
  GROUP BY DATE(p.created_at), p.facility_id, p.provider_id
  ON DUPLICATE KEY UPDATE
    total_transactions = VALUES(total_transactions),
    successful_transactions = VALUES(successful_transactions),
    failed_transactions = VALUES(failed_transactions),
    pending_transactions = VALUES(pending_transactions),
    total_amount = VALUES(total_amount),
    total_fees = VALUES(total_fees),
    total_refunds = VALUES(total_refunds),
    avg_transaction_amount = VALUES(avg_transaction_amount),
    avg_processing_time_seconds = VALUES(avg_processing_time_seconds),
    success_rate = VALUES(success_rate),
    updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Payment Summary by Provider
CREATE OR REPLACE VIEW v_payment_summary_by_provider AS
SELECT
  pp.name as provider_name,
  pp.display_name,
  pp.provider_type,
  COUNT(p.id) as total_transactions,
  SUM(CASE WHEN p.status = 'confirmed' THEN 1 ELSE 0 END) as successful_transactions,
  SUM(CASE WHEN p.status IN ('failed', 'rejected') THEN 1 ELSE 0 END) as failed_transactions,
  SUM(p.amount) as total_amount,
  SUM(p.total_fees) as total_fees,
  AVG(p.amount) as avg_transaction_amount,
  (SUM(CASE WHEN p.status = 'confirmed' THEN 1 ELSE 0 END) / COUNT(p.id) * 100) as success_rate
FROM payment_providers pp
LEFT JOIN payments p ON pp.id = p.provider_id
GROUP BY pp.id, pp.name, pp.display_name, pp.provider_type;

-- View: Pending Manual Verifications
CREATE OR REPLACE VIEW v_pending_manual_verifications AS
SELECT
  p.id as payment_id,
  p.merchant_reference,
  p.amount,
  p.currency,
  p.status,
  pp.display_name as provider_name,
  p.created_at,
  TIMESTAMPDIFF(MINUTE, p.created_at, NOW()) as minutes_pending
FROM payments p
JOIN payment_providers pp ON p.provider_id = pp.id
WHERE p.status = 'awaiting_verification'
  AND pp.requires_manual_approval = TRUE
ORDER BY p.created_at ASC;

-- View: Overdue Installments
CREATE OR REPLACE VIEW v_overdue_installments AS
SELECT
  iss.id as installment_id,
  ipp.id as plan_id,
  ipp.patient_id,
  ipp.facility_id,
  iss.installment_number,
  iss.due_date,
  iss.amount_due,
  iss.late_fee_applied,
  DATEDIFF(CURDATE(), iss.due_date) as days_overdue
FROM installment_schedule iss
JOIN payment_installment_plans ipp ON iss.plan_id = ipp.id
WHERE iss.status = 'overdue'
  AND ipp.status = 'active'
ORDER BY iss.due_date ASC;

-- ============================================================================
-- INITIAL DATA - SUDAN PAYMENT PROVIDERS
-- ============================================================================

INSERT INTO payment_providers (
  name, display_name, provider_type, verification_type,
  fee_structure, supported_currencies, is_active
) VALUES
-- Bank Cards
('visa', 'Visa', 'bank_card', 'api_auto', 
 '{"percentage": 2.5, "fixed_amount": 0, "currency": "SDG"}', 
 '["SDG", "USD"]', TRUE),

('mastercard', 'Mastercard', 'bank_card', 'api_auto',
 '{"percentage": 2.5, "fixed_amount": 0, "currency": "SDG"}',
 '["SDG", "USD"]', TRUE),

-- Local Banks
('bank_of_khartoum', 'Bank of Khartoum', 'local_bank', 'api_auto',
 '{"percentage": 1.5, "fixed_amount": 0, "currency": "SDG"}',
 '["SDG"]', TRUE),

('faisal_islamic', 'Faisal Islamic Bank', 'local_bank', 'api_auto',
 '{"percentage": 1.5, "fixed_amount": 0, "currency": "SDG"}',
 '["SDG"]', TRUE),

('omdurman_national', 'Omdurman National Bank', 'local_bank', 'api_auto',
 '{"percentage": 1.5, "fixed_amount": 0, "currency": "SDG"}',
 '["SDG"]', TRUE),

-- Mobile Wallets
('zain_cash', 'Zain Cash', 'mobile_wallet', 'api_auto',
 '{"percentage": 1.0, "fixed_amount": 0, "currency": "SDG"}',
 '["SDG"]', TRUE),

('mtn_money', 'MTN Mobile Money', 'mobile_wallet', 'api_auto',
 '{"percentage": 1.0, "fixed_amount": 0, "currency": "SDG"}',
 '["SDG"]', TRUE),

('sudani_cash', 'Sudani Cash', 'mobile_wallet', 'api_auto',
 '{"percentage": 1.0, "fixed_amount": 0, "currency": "SDG"}',
 '["SDG"]', TRUE),

('bankak', 'Bankak', 'digital_wallet', 'api_auto',
 '{"percentage": 1.5, "fixed_amount": 0, "currency": "SDG"}',
 '["SDG"]', TRUE),

-- Traditional Methods
('cash', 'Cash', 'cash', 'manual',
 '{"percentage": 0, "fixed_amount": 0, "currency": "SDG"}',
 '["SDG", "USD"]', TRUE),

('cheque', 'Cheque', 'cheque', 'manual',
 '{"percentage": 0, "fixed_amount": 0, "currency": "SDG"}',
 '["SDG"]', TRUE),

('bank_transfer', 'Bank Transfer', 'bank_transfer', 'hybrid',
 '{"percentage": 1.0, "fixed_amount": 0, "currency": "SDG"}',
 '["SDG", "USD"]', TRUE);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_payments_facility_status_date ON payments(facility_id, status, created_at DESC);
CREATE INDEX idx_payments_patient_status ON payments(patient_id, status);
CREATE INDEX idx_payments_provider_status_date ON payments(provider_id, status, created_at DESC);

-- ============================================================================
-- GRANTS (Adjust as needed)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE ON nilecare_payment_system.* TO 'payment_service'@'%';
-- GRANT EXECUTE ON PROCEDURE nilecare_payment_system.sp_process_payment TO 'payment_service'@'%';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
