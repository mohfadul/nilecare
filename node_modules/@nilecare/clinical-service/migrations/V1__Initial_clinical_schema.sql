-- ============================================================================
-- Clinical Service - Initial Schema Migration
-- Version: 1
-- Description: Create core clinical data tables
-- Author: Database Team
-- Date: 2025-10-15
-- Ticket: DB-010
-- ============================================================================

-- ============================================================================
-- PATIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  mrn VARCHAR(50) UNIQUE NOT NULL COMMENT 'Medical Record Number',
  
  -- Demographics
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male', 'female', 'other', 'unknown') NOT NULL,
  
  -- Sudan-Specific
  sudan_national_id VARCHAR(20) COMMENT 'Sudan National ID (encrypted)',
  blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'),
  marital_status ENUM('single', 'married', 'divorced', 'widowed', 'separated', 'unknown'),
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(20) COMMENT 'Sudan format: +249xxxxxxxxx',
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50) COMMENT 'Sudan State',
  postal_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'Sudan',
  
  -- Language
  primary_language VARCHAR(50) DEFAULT 'Arabic',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_deceased BOOLEAN DEFAULT FALSE,
  deceased_date DATETIME,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Indexes
  INDEX idx_patients_mrn (mrn),
  INDEX idx_patients_name (last_name, first_name),
  INDEX idx_patients_dob (date_of_birth),
  INDEX idx_patients_active (is_active),
  INDEX idx_patients_national_id (sudan_national_id),
  FULLTEXT idx_patients_search (first_name, last_name, mrn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Patient demographics and contact information';

-- ============================================================================
-- ENCOUNTERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS encounters (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_number VARCHAR(50) UNIQUE NOT NULL,
  encounter_type ENUM('inpatient', 'outpatient', 'emergency', 'urgent_care', 'telehealth', 'home_health') NOT NULL,
  status ENUM('planned', 'arrived', 'in_progress', 'finished', 'cancelled', 'entered_in_error') NOT NULL,
  class ENUM('ambulatory', 'emergency', 'inpatient', 'observation', 'virtual') NOT NULL,
  priority ENUM('routine', 'urgent', 'emergent', 'elective') DEFAULT 'routine',
  
  -- Dates
  admission_date DATETIME NOT NULL,
  discharge_date DATETIME,
  length_of_stay_hours INT GENERATED ALWAYS AS (TIMESTAMPDIFF(HOUR, admission_date, discharge_date)) STORED,
  
  -- Location (references to facility service)
  facility_id CHAR(36) NOT NULL COMMENT 'Reference to facility service',
  department_id CHAR(36),
  ward_id CHAR(36),
  bed_id CHAR(36),
  
  -- Providers (references to auth service)
  attending_provider_id CHAR(36),
  referring_provider_id CHAR(36),
  
  -- Clinical
  chief_complaint TEXT,
  discharge_disposition ENUM('home', 'transfer', 'expired', 'left_ama', 'hospice', 'other'),
  discharge_instructions TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Foreign Keys
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_encounters_patient (patient_id),
  INDEX idx_encounters_encounter_number (encounter_number),
  INDEX idx_encounters_admission_date (admission_date),
  INDEX idx_encounters_status (status),
  INDEX idx_encounters_facility (facility_id),
  INDEX idx_encounters_provider (attending_provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Patient encounters and visits';

-- ============================================================================
-- DIAGNOSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS diagnoses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  
  -- Diagnosis Code
  diagnosis_code VARCHAR(20) NOT NULL COMMENT 'ICD-10 Code',
  diagnosis_system ENUM('ICD-10-CM', 'ICD-9-CM', 'SNOMED-CT') DEFAULT 'ICD-10-CM',
  diagnosis_description TEXT NOT NULL,
  diagnosis_type ENUM('primary', 'secondary', 'admitting', 'discharge', 'complication') NOT NULL,
  
  -- Clinical Status
  clinical_status ENUM('active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved') DEFAULT 'active',
  verification_status ENUM('confirmed', 'provisional', 'differential', 'refuted', 'entered_in_error') DEFAULT 'confirmed',
  severity ENUM('mild', 'moderate', 'severe', 'critical'),
  
  -- Dates
  onset_date DATE,
  abatement_date DATE,
  
  -- Provider
  diagnosed_by CHAR(36),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_diagnoses_patient (patient_id),
  INDEX idx_diagnoses_encounter (encounter_id),
  INDEX idx_diagnoses_code (diagnosis_code),
  INDEX idx_diagnoses_status (clinical_status),
  FULLTEXT idx_diagnoses_description (diagnosis_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Patient diagnoses';

-- ============================================================================
-- ALLERGIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS allergies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  
  -- Allergen
  allergen_code VARCHAR(50),
  allergen_name VARCHAR(255) NOT NULL,
  allergen_type ENUM('medication', 'food', 'environment', 'biologic', 'other') NOT NULL,
  
  -- Reaction
  category ENUM('drug', 'food', 'environment', 'biologic') NOT NULL,
  criticality ENUM('low', 'high', 'unable_to_assess') DEFAULT 'low',
  clinical_status ENUM('active', 'inactive', 'resolved') DEFAULT 'active',
  verification_status ENUM('confirmed', 'unconfirmed', 'refuted', 'entered_in_error') DEFAULT 'confirmed',
  reaction_type ENUM('allergy', 'intolerance', 'adverse_reaction') NOT NULL,
  severity ENUM('mild', 'moderate', 'severe', 'life_threatening'),
  manifestations TEXT COMMENT 'JSON array of reaction manifestations',
  
  -- Dates
  onset_date DATE,
  last_occurrence_date DATE,
  
  -- Notes
  notes TEXT,
  recorded_by CHAR(36),
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_allergies_patient (patient_id),
  INDEX idx_allergies_allergen_type (allergen_type),
  INDEX idx_allergies_status (clinical_status),
  INDEX idx_allergies_criticality (criticality),
  FULLTEXT idx_allergies_search (allergen_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Patient allergies and intolerances';

-- ============================================================================
-- PROCEDURES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS procedures (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  
  -- Procedure
  procedure_code VARCHAR(50) NOT NULL COMMENT 'CPT/HCPCS Code',
  procedure_name VARCHAR(255) NOT NULL,
  procedure_category VARCHAR(100),
  
  -- Status
  status ENUM('preparation', 'in_progress', 'completed', 'cancelled', 'entered_in_error', 'on_hold', 'stopped') NOT NULL,
  
  -- Timing
  performed_date DATETIME NOT NULL,
  duration_minutes INT,
  
  -- Staff
  performed_by CHAR(36) NOT NULL,
  assisting_staff TEXT COMMENT 'JSON array of staff IDs',
  
  -- Clinical
  location VARCHAR(255),
  indication TEXT,
  technique TEXT,
  findings TEXT,
  complications TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_instructions TEXT,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_procedures_patient (patient_id),
  INDEX idx_procedures_encounter (encounter_id),
  INDEX idx_procedures_performed_date (performed_date),
  INDEX idx_procedures_performed_by (performed_by),
  INDEX idx_procedures_code (procedure_code),
  FULLTEXT idx_procedures_search (procedure_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Medical procedures performed';

-- ============================================================================
-- IMMUNIZATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS immunizations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  
  -- Vaccine
  vaccine_code VARCHAR(50) NOT NULL COMMENT 'CVX Code',
  vaccine_name VARCHAR(255) NOT NULL,
  vaccine_manufacturer VARCHAR(255),
  lot_number VARCHAR(100),
  expiration_date DATE,
  
  -- Dose
  dose_number INT,
  dose_quantity DECIMAL(10,2),
  dose_unit VARCHAR(50),
  route ENUM('IM', 'SC', 'PO', 'intranasal', 'ID', 'other') NOT NULL,
  site ENUM('left_arm', 'right_arm', 'left_thigh', 'right_thigh', 'other'),
  
  -- Administration
  status ENUM('completed', 'entered_in_error', 'not_done') DEFAULT 'completed',
  administered_date DATETIME NOT NULL,
  administered_by CHAR(36) NOT NULL,
  
  -- Consent & Education
  education_provided BOOLEAN DEFAULT TRUE,
  consent_obtained BOOLEAN DEFAULT TRUE,
  
  -- Response
  reaction TEXT,
  notes TEXT,
  next_due_date DATE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_immunizations_patient (patient_id),
  INDEX idx_immunizations_vaccine_code (vaccine_code),
  INDEX idx_immunizations_administered_date (administered_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Immunization records';

-- ============================================================================
-- VITAL SIGNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vital_signs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  observation_time DATETIME NOT NULL,
  
  -- Vitals
  temperature DECIMAL(4,1) COMMENT 'Celsius',
  temperature_site ENUM('oral', 'rectal', 'axillary', 'tympanic', 'temporal'),
  heart_rate INT COMMENT 'beats per minute',
  respiratory_rate INT COMMENT 'breaths per minute',
  blood_pressure_systolic INT COMMENT 'mmHg',
  blood_pressure_diastolic INT COMMENT 'mmHg',
  blood_pressure_position ENUM('sitting', 'standing', 'lying', 'supine'),
  oxygen_saturation DECIMAL(5,2) COMMENT 'percentage',
  oxygen_flow_rate DECIMAL(5,2) COMMENT 'liters per minute',
  oxygen_delivery_method ENUM('room_air', 'nasal_cannula', 'face_mask', 'non_rebreather', 'ventilator'),
  
  -- Measurements
  height DECIMAL(5,2) COMMENT 'centimeters',
  weight DECIMAL(6,2) COMMENT 'kilograms',
  bmi DECIMAL(5,2) GENERATED ALWAYS AS (weight / POWER(height/100, 2)) STORED,
  pain_score INT COMMENT '0-10 scale',
  glasgow_coma_scale INT COMMENT '3-15 scale',
  
  -- Recording
  recorded_by CHAR(36),
  device_id CHAR(36),
  is_manual_entry BOOLEAN DEFAULT TRUE,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_vital_signs_patient (patient_id),
  INDEX idx_vital_signs_encounter (encounter_id),
  INDEX idx_vital_signs_observation_time (observation_time),
  INDEX idx_vital_signs_patient_time (patient_id, observation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Patient vital signs';

-- ============================================================================
-- CLINICAL NOTES TABLE (Metadata - content in EHR service)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clinical_notes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  
  -- Note Type
  note_type ENUM('progress', 'admission', 'discharge', 'consultation', 'procedure', 'operative', 'history_physical', 'soap', 'other') NOT NULL,
  note_title VARCHAR(255) NOT NULL,
  note_status ENUM('draft', 'final', 'amended', 'entered_in_error') DEFAULT 'draft',
  
  -- Authorship
  author_id CHAR(36) NOT NULL,
  co_signers TEXT COMMENT 'JSON array of provider IDs',
  
  -- Dates
  service_date DATETIME NOT NULL,
  signed_date DATETIME,
  
  -- Reference
  ehr_document_id VARCHAR(100) COMMENT 'Reference to EHR service document',
  
  -- Security
  is_confidential BOOLEAN DEFAULT FALSE,
  requires_cosign BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_clinical_notes_patient (patient_id),
  INDEX idx_clinical_notes_encounter (encounter_id),
  INDEX idx_clinical_notes_note_type (note_type),
  INDEX idx_clinical_notes_service_date (service_date),
  INDEX idx_clinical_notes_author (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Clinical note metadata';

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id CHAR(36) NOT NULL,
  action ENUM('INSERT', 'UPDATE', 'DELETE', 'SELECT') NOT NULL,
  user_id CHAR(36) NOT NULL,
  user_role VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  old_values JSON,
  new_values JSON,
  changed_fields JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_audit_log_table_record (table_name, record_id),
  INDEX idx_audit_log_user (user_id),
  INDEX idx_audit_log_timestamp (timestamp),
  INDEX idx_audit_log_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Clinical data audit trail';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active Patients View
CREATE OR REPLACE VIEW v_active_patients AS
SELECT 
  p.*,
  COUNT(DISTINCT e.id) as total_encounters,
  MAX(e.admission_date) as last_encounter_date
FROM patients p
LEFT JOIN encounters e ON p.id = e.patient_id
WHERE p.is_active = TRUE AND p.is_deceased = FALSE
GROUP BY p.id;

-- Current Encounters View
CREATE OR REPLACE VIEW v_current_encounters AS
SELECT 
  e.*,
  p.mrn,
  p.first_name,
  p.last_name,
  p.date_of_birth,
  p.gender
FROM encounters e
JOIN patients p ON e.patient_id = p.id
WHERE e.status IN ('arrived', 'in_progress')
  AND e.discharge_date IS NULL;

-- Log migration completion
SELECT 'Migration V1__Initial_clinical_schema completed successfully' as status;

