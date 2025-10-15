-- ============================================================================
-- CDS Service - Initial Schema Migration (Clinical Decision Support)
-- Version: 1
-- Description: Create clinical decision support tables
-- Author: Database Team
-- Date: 2025-10-15
-- Ticket: DB-008
-- ============================================================================

-- ============================================================================
-- CLINICAL GUIDELINES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS clinical_guidelines (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  guideline_code VARCHAR(50) UNIQUE NOT NULL,
  guideline_name VARCHAR(255) NOT NULL,
  guideline_category VARCHAR(100),
  guideline_description TEXT,
  
  -- Source
  source_organization VARCHAR(255),
  publication_date DATE,
  version VARCHAR(50),
  
  -- Content
  recommendations JSON COMMENT 'Array of recommendations',
  evidence_level ENUM('A', 'B', 'C', 'D') COMMENT 'Evidence strength',
  
  -- Applicability
  condition_codes JSON COMMENT 'Array of ICD-10 codes',
  population_criteria JSON,
  exclusion_criteria JSON,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  effective_date DATE,
  expiration_date DATE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Indexes
  INDEX idx_clinical_guidelines_code (guideline_code),
  INDEX idx_clinical_guidelines_category (guideline_category),
  INDEX idx_clinical_guidelines_active (is_active),
  FULLTEXT idx_clinical_guidelines_search (guideline_name, guideline_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Clinical practice guidelines';

-- ============================================================================
-- DRUG INTERACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS drug_interactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Medications
  medication1_code VARCHAR(50) NOT NULL COMMENT 'RxNorm code',
  medication1_name VARCHAR(255) NOT NULL,
  medication2_code VARCHAR(50) NOT NULL,
  medication2_name VARCHAR(255) NOT NULL,
  
  -- Interaction Details
  interaction_severity ENUM('minor', 'moderate', 'major', 'contraindicated') NOT NULL,
  interaction_type ENUM('pharmacokinetic', 'pharmacodynamic', 'both') NOT NULL,
  interaction_description TEXT NOT NULL,
  clinical_effect TEXT,
  management_recommendation TEXT,
  
  -- Evidence
  evidence_level ENUM('established', 'probable', 'suspected', 'theoretical') DEFAULT 'established',
  references JSON COMMENT 'Array of reference sources',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_reviewed_date DATE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_drug_interactions_med1 (medication1_code),
  INDEX idx_drug_interactions_med2 (medication2_code),
  INDEX idx_drug_interactions_severity (interaction_severity),
  INDEX idx_drug_interactions_active (is_active),
  INDEX idx_drug_interactions_both_meds (medication1_code, medication2_code),
  FULLTEXT idx_drug_interactions_search (medication1_name, medication2_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Drug-drug interactions';

-- ============================================================================
-- ALLERGIES REFERENCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS allergy_cross_sensitivities (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  allergen1_code VARCHAR(50) NOT NULL,
  allergen1_name VARCHAR(255) NOT NULL,
  allergen2_code VARCHAR(50) NOT NULL,
  allergen2_name VARCHAR(255) NOT NULL,
  
  -- Cross-Sensitivity Details
  cross_sensitivity_type ENUM('certain', 'probable', 'possible') NOT NULL,
  description TEXT,
  clinical_significance ENUM('high', 'moderate', 'low') DEFAULT 'moderate',
  
  -- Recommendations
  recommendation TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_allergy_cross_allergen1 (allergen1_code),
  INDEX idx_allergy_cross_allergen2 (allergen2_code),
  INDEX idx_allergy_cross_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Allergy cross-sensitivities';

-- ============================================================================
-- CONTRAINDICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contraindications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Medication/Procedure
  medication_code VARCHAR(50),
  medication_name VARCHAR(255),
  procedure_code VARCHAR(50),
  procedure_name VARCHAR(255),
  
  -- Contraindication
  condition_code VARCHAR(50) NOT NULL COMMENT 'ICD-10 code',
  condition_name VARCHAR(255) NOT NULL,
  contraindication_type ENUM('absolute', 'relative') NOT NULL,
  severity ENUM('critical', 'major', 'moderate', 'minor') NOT NULL,
  
  -- Details
  description TEXT NOT NULL,
  mechanism TEXT,
  alternative_recommendations TEXT,
  
  -- Evidence
  evidence_level ENUM('A', 'B', 'C', 'D') DEFAULT 'B',
  references JSON,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_contraindications_medication (medication_code),
  INDEX idx_contraindications_procedure (procedure_code),
  INDEX idx_contraindications_condition (condition_code),
  INDEX idx_contraindications_severity (severity),
  INDEX idx_contraindications_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Clinical contraindications';

-- ============================================================================
-- THERAPEUTIC RANGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS therapeutic_ranges (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Lab Test/Medication
  test_code VARCHAR(50) COMMENT 'LOINC code',
  test_name VARCHAR(255) NOT NULL,
  medication_code VARCHAR(50) COMMENT 'RxNorm code',
  medication_name VARCHAR(255),
  
  -- Range Definition
  age_group ENUM('neonate', 'infant', 'child', 'adolescent', 'adult', 'elderly') NOT NULL,
  gender ENUM('male', 'female', 'all') DEFAULT 'all',
  
  -- Normal Range
  normal_min DECIMAL(10, 4),
  normal_max DECIMAL(10, 4),
  unit_of_measure VARCHAR(50),
  
  -- Therapeutic Range (for medications)
  therapeutic_min DECIMAL(10, 4),
  therapeutic_max DECIMAL(10, 4),
  toxic_level DECIMAL(10, 4),
  
  -- Critical Values
  critical_low DECIMAL(10, 4),
  critical_high DECIMAL(10, 4),
  
  -- Clinical Context
  interpretation_guidance TEXT,
  clinical_significance TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_therapeutic_ranges_test (test_code),
  INDEX idx_therapeutic_ranges_medication (medication_code),
  INDEX idx_therapeutic_ranges_age_gender (age_group, gender),
  INDEX idx_therapeutic_ranges_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Therapeutic and reference ranges';

-- ============================================================================
-- CDS ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cds_alerts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  alert_code VARCHAR(50) UNIQUE NOT NULL,
  alert_name VARCHAR(255) NOT NULL,
  alert_category ENUM('drug_interaction', 'allergy', 'contraindication', 'duplicate_therapy', 'dosing', 'lab_value', 'guideline', 'other') NOT NULL,
  
  -- Alert Definition
  alert_description TEXT NOT NULL,
  severity ENUM('critical', 'high', 'medium', 'low', 'info') NOT NULL,
  
  -- Trigger Conditions
  trigger_conditions JSON NOT NULL COMMENT 'Conditions that trigger this alert',
  
  -- Action Recommendations
  recommended_actions JSON COMMENT 'Array of recommended actions',
  override_allowed BOOLEAN DEFAULT TRUE,
  override_reason_required BOOLEAN DEFAULT TRUE,
  
  -- Display
  alert_message_template TEXT,
  alert_type ENUM('blocking', 'interruptive', 'passive') DEFAULT 'interruptive',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  
  -- Indexes
  INDEX idx_cds_alerts_code (alert_code),
  INDEX idx_cds_alerts_category (alert_category),
  INDEX idx_cds_alerts_severity (severity),
  INDEX idx_cds_alerts_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Clinical decision support alerts';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Critical Drug Interactions View
CREATE OR REPLACE VIEW v_critical_drug_interactions AS
SELECT 
  medication1_code,
  medication1_name,
  medication2_code,
  medication2_name,
  interaction_severity,
  interaction_description,
  management_recommendation
FROM drug_interactions
WHERE interaction_severity IN ('major', 'contraindicated')
  AND is_active = TRUE
ORDER BY interaction_severity DESC, medication1_name;

-- Active CDS Alerts View
CREATE OR REPLACE VIEW v_active_cds_alerts AS
SELECT 
  alert_code,
  alert_name,
  alert_category,
  severity,
  alert_description,
  override_allowed
FROM cds_alerts
WHERE is_active = TRUE
ORDER BY 
  FIELD(severity, 'critical', 'high', 'medium', 'low', 'info'),
  alert_name;

-- Log migration completion
SELECT 'Migration V1__Initial_cds_schema completed successfully' as status;

