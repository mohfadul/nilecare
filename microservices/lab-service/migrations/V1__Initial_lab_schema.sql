-- ============================================================================
-- Lab Service - Initial Schema Migration
-- Version: 1
-- Description: Create laboratory management tables
-- Author: Database Team
-- Date: 2025-10-15
-- Ticket: DB-005
-- ============================================================================

-- ============================================================================
-- LAB TESTS CATALOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lab_tests (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  test_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'LOINC Code',
  test_name VARCHAR(255) NOT NULL,
  test_category VARCHAR(100) COMMENT 'Hematology, Chemistry, Microbiology, etc.',
  test_description TEXT,
  
  -- Specimen Requirements
  specimen_type VARCHAR(100) COMMENT 'Blood, Urine, etc.',
  specimen_volume VARCHAR(50),
  specimen_container VARCHAR(100),
  
  -- Processing
  processing_time_hours INT DEFAULT 24,
  requires_fasting BOOLEAN DEFAULT FALSE,
  preparation_instructions TEXT,
  
  -- Pricing
  cost DECIMAL(10, 2),
  price DECIMAL(10, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_stat_available BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Indexes
  INDEX idx_lab_tests_code (test_code),
  INDEX idx_lab_tests_category (test_category),
  INDEX idx_lab_tests_active (is_active),
  FULLTEXT idx_lab_tests_search (test_name, test_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Laboratory test catalog';

-- ============================================================================
-- LAB ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lab_orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- References (No FK - cross-service)
  patient_id CHAR(36) NOT NULL COMMENT 'Reference to clinical service',
  encounter_id CHAR(36) COMMENT 'Reference to clinical service',
  facility_id CHAR(36) NOT NULL COMMENT 'Reference to facility service',
  
  -- Test Information
  test_id CHAR(36) NOT NULL,
  test_code VARCHAR(50) NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  priority ENUM('routine', 'urgent', 'stat', 'asap') DEFAULT 'routine',
  
  -- Status
  status ENUM('draft', 'active', 'on_hold', 'completed', 'cancelled', 'entered_in_error') DEFAULT 'active',
  
  -- Dates
  ordered_date DATETIME NOT NULL,
  scheduled_date DATETIME,
  collected_date DATETIME,
  received_date DATETIME,
  resulted_date DATETIME,
  
  -- Staff
  ordered_by CHAR(36) NOT NULL COMMENT 'Reference to auth service user',
  collected_by CHAR(36),
  
  -- Clinical Info
  clinical_indication TEXT,
  special_instructions TEXT,
  is_fasting_required BOOLEAN DEFAULT FALSE,
  is_critical BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Foreign Keys (only within service)
  FOREIGN KEY (test_id) REFERENCES lab_tests(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_lab_orders_patient (patient_id),
  INDEX idx_lab_orders_encounter (encounter_id),
  INDEX idx_lab_orders_facility (facility_id),
  INDEX idx_lab_orders_test (test_id),
  INDEX idx_lab_orders_order_number (order_number),
  INDEX idx_lab_orders_status (status),
  INDEX idx_lab_orders_ordered_date (ordered_date),
  INDEX idx_lab_orders_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Laboratory test orders';

-- ============================================================================
-- SAMPLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS samples (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sample_number VARCHAR(50) UNIQUE NOT NULL,
  lab_order_id CHAR(36) NOT NULL,
  
  -- Sample Information
  specimen_type VARCHAR(100) NOT NULL,
  specimen_source VARCHAR(100),
  collection_method VARCHAR(100),
  container_type VARCHAR(100),
  
  -- Collection
  collected_by CHAR(36),
  collection_date DATETIME NOT NULL,
  collection_site VARCHAR(100),
  
  -- Processing
  received_by CHAR(36),
  received_date DATETIME,
  processing_status ENUM('collected', 'in_transit', 'received', 'processing', 'completed', 'rejected') DEFAULT 'collected',
  rejection_reason TEXT,
  
  -- Quality
  volume_ml DECIMAL(10, 2),
  quality_status ENUM('acceptable', 'hemolyzed', 'clotted', 'insufficient', 'contaminated') DEFAULT 'acceptable',
  storage_location VARCHAR(100),
  storage_temperature VARCHAR(50),
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_samples_lab_order (lab_order_id),
  INDEX idx_samples_sample_number (sample_number),
  INDEX idx_samples_status (processing_status),
  INDEX idx_samples_collection_date (collection_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Specimen sample tracking';

-- ============================================================================
-- LAB RESULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lab_results (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  lab_order_id CHAR(36) NOT NULL,
  sample_id CHAR(36),
  
  -- References
  patient_id CHAR(36) NOT NULL COMMENT 'Reference to clinical service',
  
  -- Result Information
  result_code VARCHAR(50) COMMENT 'LOINC Code',
  result_name VARCHAR(255) NOT NULL,
  result_value VARCHAR(500),
  result_unit VARCHAR(50),
  reference_range VARCHAR(100),
  
  -- Interpretation
  abnormal_flag ENUM('normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal'),
  result_status ENUM('preliminary', 'final', 'corrected', 'cancelled', 'entered_in_error') DEFAULT 'preliminary',
  
  -- Dates
  result_date DATETIME NOT NULL,
  verified_date DATETIME,
  
  -- Staff
  performed_by CHAR(36),
  verified_by CHAR(36),
  
  -- Clinical
  interpretation TEXT,
  notes TEXT,
  is_critical BOOLEAN DEFAULT FALSE,
  critical_notified BOOLEAN DEFAULT FALSE,
  critical_notified_date DATETIME,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Foreign Keys
  FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE RESTRICT,
  FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_lab_results_lab_order (lab_order_id),
  INDEX idx_lab_results_sample (sample_id),
  INDEX idx_lab_results_patient (patient_id),
  INDEX idx_lab_results_result_date (result_date),
  INDEX idx_lab_results_abnormal (abnormal_flag),
  INDEX idx_lab_results_critical (is_critical)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Laboratory test results';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Pending Lab Orders View
CREATE OR REPLACE VIEW v_pending_lab_orders AS
SELECT 
  lo.*,
  lt.test_category,
  lt.processing_time_hours
FROM lab_orders lo
JOIN lab_tests lt ON lo.test_id = lt.id
WHERE lo.status IN ('active', 'on_hold')
  AND lo.resulted_date IS NULL
ORDER BY lo.priority DESC, lo.ordered_date ASC;

-- Critical Lab Results View
CREATE OR REPLACE VIEW v_critical_lab_results AS
SELECT 
  lr.*,
  lo.order_number,
  lo.test_name,
  lo.ordered_by
FROM lab_results lr
JOIN lab_orders lo ON lr.lab_order_id = lo.id
WHERE lr.is_critical = TRUE
  AND lr.critical_notified = FALSE
ORDER BY lr.result_date DESC;

-- Log migration completion
SELECT 'Migration V1__Initial_lab_schema completed successfully' as status;

