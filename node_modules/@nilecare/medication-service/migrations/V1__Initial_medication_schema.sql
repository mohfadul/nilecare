-- ============================================================================
-- Medication Service - Initial Schema Migration
-- Version: 1
-- Description: Create medication management tables
-- Author: Database Team
-- Date: 2025-10-15
-- Ticket: DB-006
-- ============================================================================

-- ============================================================================
-- MEDICATIONS CATALOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS medications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  medication_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'RxNorm or local code',
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  brand_name VARCHAR(255),
  
  -- Classification
  medication_class VARCHAR(100),
  therapeutic_class VARCHAR(100),
  drug_category ENUM('prescription', 'otc', 'controlled', 'investigational') DEFAULT 'prescription',
  
  -- Controlled Substance
  is_controlled_substance BOOLEAN DEFAULT FALSE,
  dea_schedule ENUM('I', 'II', 'III', 'IV', 'V'),
  
  -- Formulation
  dosage_form VARCHAR(100) COMMENT 'Tablet, Capsule, Injection, etc.',
  strength VARCHAR(100),
  unit_of_measure VARCHAR(50),
  
  -- Storage
  requires_refrigeration BOOLEAN DEFAULT FALSE,
  storage_requirements TEXT,
  
  -- Pricing
  unit_cost DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_formulary BOOLEAN DEFAULT TRUE,
  discontinued_date DATE,
  replacement_medication_id CHAR(36),
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Indexes
  INDEX idx_medications_code (medication_code),
  INDEX idx_medications_class (medication_class),
  INDEX idx_medications_category (drug_category),
  INDEX idx_medications_active (is_active),
  INDEX idx_medications_controlled (is_controlled_substance),
  FULLTEXT idx_medications_search (medication_name, generic_name, brand_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Medication catalog and formulary';

-- ============================================================================
-- PRESCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  prescription_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- References (No FK - cross-service)
  patient_id CHAR(36) NOT NULL COMMENT 'Reference to clinical service',
  encounter_id CHAR(36) COMMENT 'Reference to clinical service',
  facility_id CHAR(36) NOT NULL COMMENT 'Reference to facility service',
  
  -- Medication
  medication_id CHAR(36) NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  
  -- Dosage
  dosage VARCHAR(100) NOT NULL,
  dosage_unit VARCHAR(50),
  route ENUM('oral', 'IV', 'IM', 'subcutaneous', 'topical', 'inhalation', 'rectal', 'sublingual', 'transdermal', 'other') NOT NULL,
  frequency VARCHAR(100) NOT NULL COMMENT 'BID, TID, QID, PRN, etc.',
  duration_days INT,
  
  -- Quantity
  quantity DECIMAL(10, 2) NOT NULL,
  quantity_unit VARCHAR(50),
  refills_allowed INT DEFAULT 0,
  refills_remaining INT DEFAULT 0,
  
  -- Status
  status ENUM('active', 'completed', 'entered_in_error', 'stopped', 'on_hold', 'cancelled', 'draft') DEFAULT 'active',
  intent ENUM('proposal', 'plan', 'order') DEFAULT 'order',
  priority ENUM('routine', 'urgent', 'asap', 'stat') DEFAULT 'routine',
  
  -- Dates
  start_date DATETIME NOT NULL,
  end_date DATETIME,
  
  -- Prescriber
  prescribed_by CHAR(36) NOT NULL COMMENT 'Reference to auth service user',
  pharmacy_id CHAR(36) COMMENT 'Reference to facility service',
  
  -- Clinical
  instructions TEXT,
  indication TEXT,
  notes TEXT,
  
  -- Safety
  is_high_alert BOOLEAN DEFAULT FALSE,
  requires_monitoring BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Foreign Keys
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_prescriptions_patient (patient_id),
  INDEX idx_prescriptions_encounter (encounter_id),
  INDEX idx_prescriptions_facility (facility_id),
  INDEX idx_prescriptions_medication (medication_id),
  INDEX idx_prescriptions_prescription_number (prescription_number),
  INDEX idx_prescriptions_status (status),
  INDEX idx_prescriptions_prescribed_by (prescribed_by),
  INDEX idx_prescriptions_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Medication prescriptions';

-- ============================================================================
-- MAR ENTRIES TABLE (Medication Administration Record)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mar_entries (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  prescription_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  
  -- Scheduled Administration
  scheduled_time DATETIME NOT NULL,
  scheduled_dose VARCHAR(100),
  
  -- Actual Administration
  administered_time DATETIME,
  administered_dose VARCHAR(100),
  administered_route VARCHAR(50),
  administered_site VARCHAR(100),
  administered_by CHAR(36),
  
  -- Status
  status ENUM('scheduled', 'administered', 'missed', 'refused', 'held', 'not_applicable') DEFAULT 'scheduled',
  
  -- Reasons
  held_reason TEXT,
  refused_reason TEXT,
  missed_reason TEXT,
  
  -- Response
  patient_response TEXT,
  adverse_reaction TEXT,
  
  -- Witness (for controlled substances)
  witnessed_by CHAR(36),
  witness_signature TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_mar_entries_prescription (prescription_id),
  INDEX idx_mar_entries_patient (patient_id),
  INDEX idx_mar_entries_scheduled_time (scheduled_time),
  INDEX idx_mar_entries_status (status),
  INDEX idx_mar_entries_administered_by (administered_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Medication Administration Record';

-- ============================================================================
-- HIGH ALERT MEDICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS high_alert_medications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  medication_id CHAR(36) NOT NULL,
  alert_type ENUM('high_alert', 'look_alike_sound_alike', 'narrow_therapeutic_index', 'high_risk_elderly') NOT NULL,
  alert_description TEXT,
  precautions TEXT,
  monitoring_requirements TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_high_alert_medications_medication (medication_id),
  INDEX idx_high_alert_medications_type (alert_type),
  INDEX idx_high_alert_medications_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='High-alert medication tracking';

-- ============================================================================
-- MEDICATION RECONCILIATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS medication_reconciliation (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  
  -- Reconciliation Type
  reconciliation_type ENUM('admission', 'transfer', 'discharge') NOT NULL,
  reconciliation_date DATETIME NOT NULL,
  
  -- Medications
  home_medications JSON COMMENT 'List of home medications',
  hospital_medications JSON COMMENT 'List of hospital medications',
  changes_made JSON COMMENT 'List of changes',
  discrepancies JSON COMMENT 'Identified discrepancies',
  
  -- Status
  status ENUM('pending', 'in_progress', 'completed', 'reviewed') DEFAULT 'pending',
  
  -- Staff
  performed_by CHAR(36) NOT NULL,
  reviewed_by CHAR(36),
  reviewed_date DATETIME,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_medication_reconciliation_patient (patient_id),
  INDEX idx_medication_reconciliation_encounter (encounter_id),
  INDEX idx_medication_reconciliation_type (reconciliation_type),
  INDEX idx_medication_reconciliation_status (status),
  INDEX idx_medication_reconciliation_date (reconciliation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Medication reconciliation records';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active Prescriptions View
CREATE OR REPLACE VIEW v_active_prescriptions AS
SELECT 
  p.*,
  m.generic_name,
  m.medication_class
FROM prescriptions p
JOIN medications m ON p.medication_id = m.id
WHERE p.status = 'active'
  AND (p.end_date IS NULL OR p.end_date > NOW())
ORDER BY p.start_date DESC;

-- High Alert Prescriptions View
CREATE OR REPLACE VIEW v_high_alert_prescriptions AS
SELECT 
  p.*,
  m.medication_name,
  ham.alert_type,
  ham.precautions
FROM prescriptions p
JOIN medications m ON p.medication_id = m.id
JOIN high_alert_medications ham ON m.id = ham.medication_id
WHERE p.status = 'active'
  AND ham.is_active = TRUE;

-- Log migration completion
SELECT 'Migration V1__Initial_medication_schema completed successfully' as status;

