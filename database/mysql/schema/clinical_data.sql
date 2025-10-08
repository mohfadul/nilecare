-- =====================================================
-- NileCare Clinical Data Database Schema
-- Database: clinical_data (MySQL 8.0+)
-- Purpose: Highly structured clinical data with ACID compliance
-- =====================================================

CREATE DATABASE IF NOT EXISTS clinical_data
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clinical_data;

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE patients (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  mrn VARCHAR(50) UNIQUE NOT NULL COMMENT 'Medical Record Number',
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male', 'female', 'other', 'unknown') NOT NULL,
  sudan_national_id VARCHAR(20) COMMENT 'Sudan National ID (encrypted)',
  blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'),
  marital_status ENUM('single', 'married', 'divorced', 'widowed', 'separated', 'unknown'),
  race VARCHAR(50),
  ethnicity VARCHAR(50),
  primary_language VARCHAR(50) DEFAULT 'Arabic',
  email VARCHAR(255),
  phone VARCHAR(20) COMMENT 'Sudan mobile format: +249xxxxxxxxx',
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20) COMMENT 'Sudan mobile format: +249xxxxxxxxx',
  emergency_contact_relationship VARCHAR(50),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50) COMMENT 'Sudan State (e.g., Khartoum, Gezira, Red Sea)',
  postal_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'Sudan',
  is_active BOOLEAN DEFAULT TRUE,
  is_deceased BOOLEAN DEFAULT FALSE,
  deceased_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  INDEX idx_mrn (mrn),
  INDEX idx_name (last_name, first_name),
  INDEX idx_dob (date_of_birth),
  INDEX idx_active (is_active),
  FULLTEXT idx_fulltext_search (first_name, last_name, mrn)
) ENGINE=InnoDB;

-- =====================================================
-- ENCOUNTERS TABLE
-- =====================================================
CREATE TABLE encounters (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_number VARCHAR(50) UNIQUE NOT NULL,
  encounter_type ENUM('inpatient', 'outpatient', 'emergency', 'urgent_care', 'telehealth', 'home_health') NOT NULL,
  status ENUM('planned', 'arrived', 'in_progress', 'finished', 'cancelled', 'entered_in_error') NOT NULL,
  class ENUM('ambulatory', 'emergency', 'inpatient', 'observation', 'virtual') NOT NULL,
  priority ENUM('routine', 'urgent', 'emergent', 'elective') DEFAULT 'routine',
  admission_date DATETIME NOT NULL,
  discharge_date DATETIME,
  length_of_stay_hours INT GENERATED ALWAYS AS (TIMESTAMPDIFF(HOUR, admission_date, discharge_date)) STORED,
  facility_id CHAR(36) NOT NULL,
  department_id CHAR(36),
  ward_id CHAR(36),
  bed_id CHAR(36),
  attending_provider_id CHAR(36),
  referring_provider_id CHAR(36),
  chief_complaint TEXT,
  discharge_disposition ENUM('home', 'transfer', 'expired', 'left_ama', 'hospice', 'other'),
  discharge_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  INDEX idx_patient (patient_id),
  INDEX idx_encounter_number (encounter_number),
  INDEX idx_admission_date (admission_date),
  INDEX idx_status (status),
  INDEX idx_facility (facility_id),
  INDEX idx_provider (attending_provider_id)
) ENGINE=InnoDB;

-- =====================================================
-- DIAGNOSES TABLE
-- =====================================================
CREATE TABLE diagnoses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  diagnosis_code VARCHAR(20) NOT NULL COMMENT 'ICD-10 Code',
  diagnosis_system ENUM('ICD-10-CM', 'ICD-9-CM', 'SNOMED-CT') DEFAULT 'ICD-10-CM',
  diagnosis_description TEXT NOT NULL,
  diagnosis_type ENUM('primary', 'secondary', 'admitting', 'discharge', 'complication') NOT NULL,
  clinical_status ENUM('active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved') DEFAULT 'active',
  verification_status ENUM('confirmed', 'provisional', 'differential', 'refuted', 'entered_in_error') DEFAULT 'confirmed',
  severity ENUM('mild', 'moderate', 'severe', 'critical'),
  onset_date DATE,
  abatement_date DATE,
  diagnosed_by CHAR(36),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_encounter (encounter_id),
  INDEX idx_code (diagnosis_code),
  INDEX idx_status (clinical_status),
  FULLTEXT idx_description (diagnosis_description)
) ENGINE=InnoDB;

-- =====================================================
-- MEDICATIONS TABLE
-- =====================================================
CREATE TABLE medications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  medication_code VARCHAR(50) COMMENT 'RxNorm Code',
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  brand_name VARCHAR(255),
  dosage VARCHAR(100) NOT NULL,
  dosage_unit VARCHAR(50),
  route ENUM('oral', 'IV', 'IM', 'subcutaneous', 'topical', 'inhalation', 'rectal', 'sublingual', 'transdermal', 'other') NOT NULL,
  frequency VARCHAR(100) NOT NULL COMMENT 'e.g., BID, TID, QID, PRN',
  duration_days INT,
  quantity DECIMAL(10,2),
  refills_allowed INT DEFAULT 0,
  refills_remaining INT DEFAULT 0,
  status ENUM('active', 'completed', 'entered_in_error', 'stopped', 'on_hold', 'cancelled', 'draft') DEFAULT 'active',
  intent ENUM('proposal', 'plan', 'order', 'original_order', 'reflex_order', 'filler_order', 'instance_order') DEFAULT 'order',
  priority ENUM('routine', 'urgent', 'asap', 'stat') DEFAULT 'routine',
  start_date DATETIME NOT NULL,
  end_date DATETIME,
  prescribed_by CHAR(36) NOT NULL,
  pharmacy_id CHAR(36),
  instructions TEXT,
  indication TEXT,
  notes TEXT,
  is_high_alert BOOLEAN DEFAULT FALSE,
  requires_monitoring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_encounter (encounter_id),
  INDEX idx_status (status),
  INDEX idx_prescribed_by (prescribed_by),
  INDEX idx_start_date (start_date),
  FULLTEXT idx_medication_search (medication_name, generic_name, brand_name)
) ENGINE=InnoDB;

-- =====================================================
-- ALLERGIES TABLE
-- =====================================================
CREATE TABLE allergies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  allergen_code VARCHAR(50),
  allergen_name VARCHAR(255) NOT NULL,
  allergen_type ENUM('medication', 'food', 'environment', 'biologic', 'other') NOT NULL,
  category ENUM('drug', 'food', 'environment', 'biologic') NOT NULL,
  criticality ENUM('low', 'high', 'unable_to_assess') DEFAULT 'low',
  clinical_status ENUM('active', 'inactive', 'resolved') DEFAULT 'active',
  verification_status ENUM('confirmed', 'unconfirmed', 'refuted', 'entered_in_error') DEFAULT 'confirmed',
  reaction_type ENUM('allergy', 'intolerance', 'adverse_reaction') NOT NULL,
  severity ENUM('mild', 'moderate', 'severe', 'life_threatening'),
  manifestations TEXT COMMENT 'JSON array of reaction manifestations',
  onset_date DATE,
  last_occurrence_date DATE,
  notes TEXT,
  recorded_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  INDEX idx_patient (patient_id),
  INDEX idx_allergen_type (allergen_type),
  INDEX idx_status (clinical_status),
  FULLTEXT idx_allergen_search (allergen_name)
) ENGINE=InnoDB;

-- =====================================================
-- VITAL SIGNS TABLE
-- =====================================================
CREATE TABLE vital_signs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  observation_time DATETIME NOT NULL,
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
  height DECIMAL(5,2) COMMENT 'centimeters',
  weight DECIMAL(6,2) COMMENT 'kilograms',
  bmi DECIMAL(5,2) GENERATED ALWAYS AS (weight / POWER(height/100, 2)) STORED,
  pain_score INT COMMENT '0-10 scale',
  glasgow_coma_scale INT COMMENT '3-15 scale',
  recorded_by CHAR(36),
  device_id CHAR(36),
  is_manual_entry BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_encounter (encounter_id),
  INDEX idx_observation_time (observation_time),
  INDEX idx_patient_time (patient_id, observation_time)
) ENGINE=InnoDB;

-- =====================================================
-- LAB ORDERS TABLE
-- =====================================================
CREATE TABLE lab_orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_type ENUM('lab', 'radiology', 'pathology', 'microbiology', 'blood_bank') NOT NULL,
  test_code VARCHAR(50) NOT NULL COMMENT 'LOINC Code',
  test_name VARCHAR(255) NOT NULL,
  test_category VARCHAR(100),
  priority ENUM('routine', 'urgent', 'stat', 'asap') DEFAULT 'routine',
  status ENUM('draft', 'active', 'on_hold', 'completed', 'cancelled', 'entered_in_error') DEFAULT 'active',
  ordered_date DATETIME NOT NULL,
  scheduled_date DATETIME,
  collected_date DATETIME,
  received_date DATETIME,
  resulted_date DATETIME,
  ordered_by CHAR(36) NOT NULL,
  collected_by CHAR(36),
  specimen_type VARCHAR(100),
  specimen_source VARCHAR(100),
  clinical_indication TEXT,
  special_instructions TEXT,
  is_fasting_required BOOLEAN DEFAULT FALSE,
  is_critical BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_encounter (encounter_id),
  INDEX idx_order_number (order_number),
  INDEX idx_status (status),
  INDEX idx_ordered_date (ordered_date)
) ENGINE=InnoDB;

-- =====================================================
-- LAB RESULTS TABLE
-- =====================================================
CREATE TABLE lab_results (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  lab_order_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  result_code VARCHAR(50) COMMENT 'LOINC Code',
  result_name VARCHAR(255) NOT NULL,
  result_value VARCHAR(500),
  result_unit VARCHAR(50),
  reference_range VARCHAR(100),
  abnormal_flag ENUM('normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal'),
  result_status ENUM('preliminary', 'final', 'corrected', 'cancelled', 'entered_in_error') DEFAULT 'preliminary',
  result_date DATETIME NOT NULL,
  performed_by CHAR(36),
  verified_by CHAR(36),
  verified_date DATETIME,
  interpretation TEXT,
  notes TEXT,
  is_critical BOOLEAN DEFAULT FALSE,
  critical_notified BOOLEAN DEFAULT FALSE,
  critical_notified_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE RESTRICT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  INDEX idx_lab_order (lab_order_id),
  INDEX idx_patient (patient_id),
  INDEX idx_result_date (result_date),
  INDEX idx_abnormal (abnormal_flag),
  INDEX idx_critical (is_critical)
) ENGINE=InnoDB;

-- =====================================================
-- PROCEDURES TABLE
-- =====================================================
CREATE TABLE procedures (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  procedure_code VARCHAR(50) NOT NULL COMMENT 'CPT/HCPCS Code',
  procedure_name VARCHAR(255) NOT NULL,
  procedure_category VARCHAR(100),
  status ENUM('preparation', 'in_progress', 'completed', 'cancelled', 'entered_in_error', 'on_hold', 'stopped') NOT NULL,
  performed_date DATETIME NOT NULL,
  duration_minutes INT,
  performed_by CHAR(36) NOT NULL,
  assisting_staff TEXT COMMENT 'JSON array of staff IDs',
  location VARCHAR(255),
  indication TEXT,
  technique TEXT,
  findings TEXT,
  complications TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_instructions TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_encounter (encounter_id),
  INDEX idx_performed_date (performed_date),
  INDEX idx_performed_by (performed_by),
  FULLTEXT idx_procedure_search (procedure_name)
) ENGINE=InnoDB;

-- =====================================================
-- IMMUNIZATIONS TABLE
-- =====================================================
CREATE TABLE immunizations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  vaccine_code VARCHAR(50) NOT NULL COMMENT 'CVX Code',
  vaccine_name VARCHAR(255) NOT NULL,
  vaccine_manufacturer VARCHAR(255),
  lot_number VARCHAR(100),
  expiration_date DATE,
  dose_number INT,
  dose_quantity DECIMAL(10,2),
  dose_unit VARCHAR(50),
  route ENUM('IM', 'SC', 'PO', 'intranasal', 'ID', 'other') NOT NULL,
  site ENUM('left_arm', 'right_arm', 'left_thigh', 'right_thigh', 'other'),
  status ENUM('completed', 'entered_in_error', 'not_done') DEFAULT 'completed',
  administered_date DATETIME NOT NULL,
  administered_by CHAR(36) NOT NULL,
  education_provided BOOLEAN DEFAULT TRUE,
  consent_obtained BOOLEAN DEFAULT TRUE,
  reaction TEXT,
  notes TEXT,
  next_due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_vaccine_code (vaccine_code),
  INDEX idx_administered_date (administered_date)
) ENGINE=InnoDB;

-- =====================================================
-- CLINICAL NOTES TABLE (Metadata only, content in MongoDB)
-- =====================================================
CREATE TABLE clinical_notes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  note_type ENUM('progress', 'admission', 'discharge', 'consultation', 'procedure', 'operative', 'history_physical', 'soap', 'other') NOT NULL,
  note_title VARCHAR(255) NOT NULL,
  note_status ENUM('draft', 'final', 'amended', 'entered_in_error') DEFAULT 'draft',
  author_id CHAR(36) NOT NULL,
  co_signers TEXT COMMENT 'JSON array of provider IDs',
  service_date DATETIME NOT NULL,
  signed_date DATETIME,
  mongodb_document_id VARCHAR(100) NOT NULL COMMENT 'Reference to MongoDB document',
  is_confidential BOOLEAN DEFAULT FALSE,
  requires_cosign BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL,
  INDEX idx_patient (patient_id),
  INDEX idx_encounter (encounter_id),
  INDEX idx_note_type (note_type),
  INDEX idx_service_date (service_date),
  INDEX idx_author (author_id)
) ENGINE=InnoDB;

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
CREATE TABLE audit_log (
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
  INDEX idx_table_record (table_name, record_id),
  INDEX idx_user (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_action (action)
) ENGINE=InnoDB;

-- =====================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

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

-- Active Medications View
CREATE OR REPLACE VIEW v_active_medications AS
SELECT 
  m.*,
  p.mrn,
  p.first_name,
  p.last_name
FROM medications m
JOIN patients p ON m.patient_id = p.id
WHERE m.status = 'active'
  AND (m.end_date IS NULL OR m.end_date > NOW());

-- Critical Lab Results View
CREATE OR REPLACE VIEW v_critical_lab_results AS
SELECT 
  lr.*,
  lo.order_number,
  lo.test_name,
  p.mrn,
  p.first_name,
  p.last_name
FROM lab_results lr
JOIN lab_orders lo ON lr.lab_order_id = lo.id
JOIN patients p ON lr.patient_id = p.id
WHERE lr.is_critical = TRUE
  AND lr.critical_notified = FALSE;

-- =====================================================
-- CREATE STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure to get patient summary
CREATE PROCEDURE sp_get_patient_summary(IN p_patient_id CHAR(36))
BEGIN
  -- Patient demographics
  SELECT * FROM patients WHERE id = p_patient_id;
  
  -- Active diagnoses
  SELECT * FROM diagnoses 
  WHERE patient_id = p_patient_id 
    AND clinical_status = 'active'
  ORDER BY onset_date DESC;
  
  -- Active medications
  SELECT * FROM medications 
  WHERE patient_id = p_patient_id 
    AND status = 'active'
  ORDER BY start_date DESC;
  
  -- Active allergies
  SELECT * FROM allergies 
  WHERE patient_id = p_patient_id 
    AND clinical_status = 'active'
  ORDER BY created_at DESC;
  
  -- Recent vital signs
  SELECT * FROM vital_signs 
  WHERE patient_id = p_patient_id 
  ORDER BY observation_time DESC 
  LIMIT 10;
  
  -- Recent encounters
  SELECT * FROM encounters 
  WHERE patient_id = p_patient_id 
  ORDER BY admission_date DESC 
  LIMIT 5;
END //

-- Procedure to record vital signs
CREATE PROCEDURE sp_record_vital_signs(
  IN p_patient_id CHAR(36),
  IN p_encounter_id CHAR(36),
  IN p_temperature DECIMAL(4,1),
  IN p_heart_rate INT,
  IN p_respiratory_rate INT,
  IN p_bp_systolic INT,
  IN p_bp_diastolic INT,
  IN p_oxygen_saturation DECIMAL(5,2),
  IN p_recorded_by CHAR(36)
)
BEGIN
  INSERT INTO vital_signs (
    patient_id, encounter_id, observation_time,
    temperature, heart_rate, respiratory_rate,
    blood_pressure_systolic, blood_pressure_diastolic,
    oxygen_saturation, recorded_by
  ) VALUES (
    p_patient_id, p_encounter_id, NOW(),
    p_temperature, p_heart_rate, p_respiratory_rate,
    p_bp_systolic, p_bp_diastolic,
    p_oxygen_saturation, p_recorded_by
  );
  
  SELECT LAST_INSERT_ID() as vital_sign_id;
END //

DELIMITER ;

-- =====================================================
-- CREATE TRIGGERS FOR AUDIT LOGGING
-- =====================================================

DELIMITER //

CREATE TRIGGER trg_patients_after_insert
AFTER INSERT ON patients
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, user_id, new_values)
  VALUES ('patients', NEW.id, 'INSERT', NEW.created_by, JSON_OBJECT(
    'mrn', NEW.mrn,
    'first_name', NEW.first_name,
    'last_name', NEW.last_name,
    'date_of_birth', NEW.date_of_birth,
    'sudan_national_id', NEW.sudan_national_id
  ));
END //

CREATE TRIGGER trg_patients_after_update
AFTER UPDATE ON patients
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, user_id, old_values, new_values)
  VALUES ('patients', NEW.id, 'UPDATE', NEW.updated_by,
    JSON_OBJECT('first_name', OLD.first_name, 'last_name', OLD.last_name),
    JSON_OBJECT('first_name', NEW.first_name, 'last_name', NEW.last_name)
  );
END //

DELIMITER ;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_patient_encounter_date ON encounters(patient_id, admission_date DESC);
CREATE INDEX idx_patient_medication_active ON medications(patient_id, status, start_date DESC);
CREATE INDEX idx_patient_diagnosis_active ON diagnoses(patient_id, clinical_status, onset_date DESC);
CREATE INDEX idx_patient_vitals_time ON vital_signs(patient_id, observation_time DESC);
CREATE INDEX idx_lab_patient_date ON lab_results(patient_id, result_date DESC);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Create application user
CREATE USER IF NOT EXISTS 'nilecare_app'@'%' IDENTIFIED BY 'nilecare_app_password';
GRANT SELECT, INSERT, UPDATE ON clinical_data.* TO 'nilecare_app'@'%';
GRANT DELETE ON clinical_data.audit_log TO 'nilecare_app'@'%';
GRANT EXECUTE ON PROCEDURE clinical_data.sp_get_patient_summary TO 'nilecare_app'@'%';
GRANT EXECUTE ON PROCEDURE clinical_data.sp_record_vital_signs TO 'nilecare_app'@'%';

-- Create read-only user for analytics
CREATE USER IF NOT EXISTS 'nilecare_readonly'@'%' IDENTIFIED BY 'nilecare_readonly_password';
GRANT SELECT ON clinical_data.* TO 'nilecare_readonly'@'%';

FLUSH PRIVILEGES;
