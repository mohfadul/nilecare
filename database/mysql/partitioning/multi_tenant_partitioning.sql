-- =====================================================
-- NileCare Multi-Tenant Data Partitioning Strategy
-- Database: MySQL 8.0+ with Partitioning Support
-- Purpose: Facility-based sharding and time-based partitioning
-- =====================================================

USE clinical_data;

-- =====================================================
-- MULTI-TENANT PARTITIONING SETUP
-- =====================================================

-- Drop existing patients table (backup first!)
-- CREATE TABLE patients_backup AS SELECT * FROM patients;

-- Recreate patients table with partitioning
DROP TABLE IF EXISTS patients_partitioned;

CREATE TABLE patients_partitioned (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL COMMENT 'Facility for data isolation',
  tenant_id CHAR(36) NOT NULL COMMENT 'Tenant organization ID',
  mrn VARCHAR(50) NOT NULL COMMENT 'Medical Record Number',
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
  PRIMARY KEY (id, facility_id, tenant_id),
  INDEX idx_tenant_facility (tenant_id, facility_id),
  INDEX idx_mrn (mrn),
  INDEX idx_name (last_name, first_name),
  INDEX idx_dob (date_of_birth),
  INDEX idx_active (is_active),
  INDEX idx_sudan_national_id (sudan_national_id),
  FULLTEXT idx_fulltext_search (first_name, last_name, mrn)
) ENGINE=InnoDB
PARTITION BY HASH(facility_id)
PARTITIONS 16;

-- =====================================================
-- ENCOUNTERS WITH FACILITY-BASED PARTITIONING
-- =====================================================

DROP TABLE IF EXISTS encounters_partitioned;

CREATE TABLE encounters_partitioned (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  encounter_number VARCHAR(50) NOT NULL,
  encounter_type ENUM('inpatient', 'outpatient', 'emergency', 'urgent_care', 'telehealth', 'home_health') NOT NULL,
  status ENUM('planned', 'arrived', 'in_progress', 'finished', 'cancelled', 'entered_in_error') NOT NULL,
  class ENUM('ambulatory', 'emergency', 'inpatient', 'observation', 'virtual') NOT NULL,
  priority ENUM('routine', 'urgent', 'emergent', 'elective') DEFAULT 'routine',
  admission_date DATETIME NOT NULL,
  discharge_date DATETIME,
  length_of_stay_hours INT GENERATED ALWAYS AS (TIMESTAMPDIFF(HOUR, admission_date, discharge_date)) STORED,
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
  PRIMARY KEY (id, facility_id, tenant_id),
  INDEX idx_tenant_facility (tenant_id, facility_id),
  INDEX idx_patient (patient_id),
  INDEX idx_encounter_number (encounter_number),
  INDEX idx_admission_date (admission_date),
  INDEX idx_status (status),
  INDEX idx_provider (attending_provider_id)
) ENGINE=InnoDB
PARTITION BY HASH(facility_id)
PARTITIONS 16;

-- =====================================================
-- TIME-BASED PARTITIONING FOR CLINICAL OBSERVATIONS
-- =====================================================

DROP TABLE IF EXISTS clinical_observations;

CREATE TABLE clinical_observations (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  observation_date DATE NOT NULL,
  observation_time TIME NOT NULL,
  observation_type VARCHAR(100) NOT NULL COMMENT 'Type of observation (vital_signs, lab_result, etc.)',
  observation_code VARCHAR(50) COMMENT 'LOINC or SNOMED code',
  observation_value VARCHAR(500),
  observation_unit VARCHAR(50),
  reference_range VARCHAR(100),
  abnormal_flag ENUM('normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal'),
  status ENUM('preliminary', 'final', 'corrected', 'cancelled') DEFAULT 'preliminary',
  performer_id CHAR(36),
  device_id CHAR(36),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, observation_date),
  INDEX idx_patient (patient_id),
  INDEX idx_encounter (encounter_id),
  INDEX idx_observation_type (observation_type),
  INDEX idx_observation_date (observation_date),
  INDEX idx_facility (facility_id)
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(observation_date)) (
  PARTITION p2020 VALUES LESS THAN (2021),
  PARTITION p2021 VALUES LESS THAN (2022),
  PARTITION p2022 VALUES LESS THAN (2023),
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION p2027 VALUES LESS THAN (2028),
  PARTITION p2028 VALUES LESS THAN (2029),
  PARTITION p2029 VALUES LESS THAN (2030),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- =====================================================
-- VITAL SIGNS WITH TIME-BASED PARTITIONING
-- =====================================================

DROP TABLE IF EXISTS vital_signs_partitioned;

CREATE TABLE vital_signs_partitioned (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  observation_date DATE NOT NULL,
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
  PRIMARY KEY (id, observation_date),
  INDEX idx_patient (patient_id),
  INDEX idx_encounter (encounter_id),
  INDEX idx_observation_time (observation_time),
  INDEX idx_patient_time (patient_id, observation_time),
  INDEX idx_facility (facility_id)
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(observation_date)) (
  PARTITION p2020 VALUES LESS THAN (2021),
  PARTITION p2021 VALUES LESS THAN (2022),
  PARTITION p2022 VALUES LESS THAN (2023),
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION p2027 VALUES LESS THAN (2028),
  PARTITION p2028 VALUES LESS THAN (2029),
  PARTITION p2029 VALUES LESS THAN (2030),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- =====================================================
-- LAB RESULTS WITH TIME-BASED PARTITIONING
-- =====================================================

DROP TABLE IF EXISTS lab_results_partitioned;

CREATE TABLE lab_results_partitioned (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  lab_order_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  result_date DATE NOT NULL,
  result_code VARCHAR(50) COMMENT 'LOINC Code',
  result_name VARCHAR(255) NOT NULL,
  result_value VARCHAR(500),
  result_unit VARCHAR(50),
  reference_range VARCHAR(100),
  abnormal_flag ENUM('normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal'),
  result_status ENUM('preliminary', 'final', 'corrected', 'cancelled', 'entered_in_error') DEFAULT 'preliminary',
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
  PRIMARY KEY (id, result_date),
  INDEX idx_lab_order (lab_order_id),
  INDEX idx_patient (patient_id),
  INDEX idx_result_date (result_date),
  INDEX idx_abnormal (abnormal_flag),
  INDEX idx_critical (is_critical),
  INDEX idx_facility (facility_id)
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(result_date)) (
  PARTITION p2020 VALUES LESS THAN (2021),
  PARTITION p2021 VALUES LESS THAN (2022),
  PARTITION p2022 VALUES LESS THAN (2023),
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION p2027 VALUES LESS THAN (2028),
  PARTITION p2028 VALUES LESS THAN (2029),
  PARTITION p2029 VALUES LESS THAN (2030),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- =====================================================
-- MEDICATIONS WITH FACILITY PARTITIONING
-- =====================================================

DROP TABLE IF EXISTS medications_partitioned;

CREATE TABLE medications_partitioned (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
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
  PRIMARY KEY (id, facility_id, tenant_id),
  INDEX idx_patient (patient_id),
  INDEX idx_encounter (encounter_id),
  INDEX idx_status (status),
  INDEX idx_prescribed_by (prescribed_by),
  INDEX idx_start_date (start_date),
  INDEX idx_tenant_facility (tenant_id, facility_id),
  FULLTEXT idx_medication_search (medication_name, generic_name, brand_name)
) ENGINE=InnoDB
PARTITION BY HASH(facility_id)
PARTITIONS 16;

-- =====================================================
-- AUDIT LOG WITH TIME-BASED PARTITIONING
-- =====================================================

DROP TABLE IF EXISTS audit_log_partitioned;

CREATE TABLE audit_log_partitioned (
  id BIGINT AUTO_INCREMENT,
  facility_id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
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
  audit_date DATE NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, audit_date),
  INDEX idx_table_record (table_name, record_id),
  INDEX idx_user (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_action (action),
  INDEX idx_facility (facility_id)
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(audit_date)) (
  PARTITION p2020 VALUES LESS THAN (2021),
  PARTITION p2021 VALUES LESS THAN (2022),
  PARTITION p2022 VALUES LESS THAN (2023),
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION p2027 VALUES LESS THAN (2028),
  PARTITION p2028 VALUES LESS THAN (2029),
  PARTITION p2029 VALUES LESS THAN (2030),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- =====================================================
-- PARTITION MANAGEMENT PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure to add new year partition
CREATE PROCEDURE sp_add_year_partition(
  IN p_table_name VARCHAR(100),
  IN p_year INT
)
BEGIN
  DECLARE partition_name VARCHAR(20);
  DECLARE next_year INT;
  
  SET partition_name = CONCAT('p', p_year);
  SET next_year = p_year + 1;
  
  SET @sql = CONCAT(
    'ALTER TABLE ', p_table_name,
    ' REORGANIZE PARTITION p_future INTO (',
    'PARTITION ', partition_name, ' VALUES LESS THAN (', next_year, '),',
    'PARTITION p_future VALUES LESS THAN MAXVALUE)'
  );
  
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  
  SELECT CONCAT('Added partition ', partition_name, ' to ', p_table_name) as result;
END //

-- Procedure to drop old partitions (data archival)
CREATE PROCEDURE sp_drop_old_partition(
  IN p_table_name VARCHAR(100),
  IN p_year INT
)
BEGIN
  DECLARE partition_name VARCHAR(20);
  
  SET partition_name = CONCAT('p', p_year);
  
  SET @sql = CONCAT('ALTER TABLE ', p_table_name, ' DROP PARTITION ', partition_name);
  
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  
  SELECT CONCAT('Dropped partition ', partition_name, ' from ', p_table_name) as result;
END //

-- Procedure to get partition information
CREATE PROCEDURE sp_get_partition_info(IN p_table_name VARCHAR(100))
BEGIN
  SELECT 
    PARTITION_NAME,
    PARTITION_METHOD,
    PARTITION_EXPRESSION,
    PARTITION_DESCRIPTION,
    TABLE_ROWS,
    AVG_ROW_LENGTH,
    DATA_LENGTH,
    INDEX_LENGTH,
    CREATE_TIME,
    UPDATE_TIME
  FROM INFORMATION_SCHEMA.PARTITIONS
  WHERE TABLE_SCHEMA = 'clinical_data'
    AND TABLE_NAME = p_table_name
  ORDER BY PARTITION_ORDINAL_POSITION;
END //

-- Procedure to analyze partition usage
CREATE PROCEDURE sp_analyze_partition_usage(IN p_table_name VARCHAR(100))
BEGIN
  SELECT 
    PARTITION_NAME,
    TABLE_ROWS as row_count,
    ROUND(DATA_LENGTH / 1024 / 1024, 2) as data_size_mb,
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) as index_size_mb,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_size_mb,
    ROUND(TABLE_ROWS / NULLIF((DATA_LENGTH / 1024), 0), 2) as rows_per_kb
  FROM INFORMATION_SCHEMA.PARTITIONS
  WHERE TABLE_SCHEMA = 'clinical_data'
    AND TABLE_NAME = p_table_name
  ORDER BY PARTITION_ORDINAL_POSITION;
END //

DELIMITER ;

-- =====================================================
-- VIEWS FOR PARTITIONED TABLES
-- =====================================================

-- Active patients view (works with partitioned table)
CREATE OR REPLACE VIEW v_active_patients_partitioned AS
SELECT 
  p.*,
  COUNT(DISTINCT e.id) as total_encounters,
  MAX(e.admission_date) as last_encounter_date
FROM patients_partitioned p
LEFT JOIN encounters_partitioned e ON p.id = e.patient_id AND p.facility_id = e.facility_id
WHERE p.is_active = TRUE AND p.is_deceased = FALSE
GROUP BY p.id, p.facility_id, p.tenant_id;

-- Recent vital signs view
CREATE OR REPLACE VIEW v_recent_vital_signs AS
SELECT 
  vs.*,
  p.mrn,
  p.first_name,
  p.last_name
FROM vital_signs_partitioned vs
JOIN patients_partitioned p ON vs.patient_id = p.id AND vs.facility_id = p.facility_id
WHERE vs.observation_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);

-- Critical lab results view
CREATE OR REPLACE VIEW v_critical_lab_results_partitioned AS
SELECT 
  lr.*,
  p.mrn,
  p.first_name,
  p.last_name
FROM lab_results_partitioned lr
JOIN patients_partitioned p ON lr.patient_id = p.id AND lr.facility_id = p.facility_id
WHERE lr.is_critical = TRUE
  AND lr.critical_notified = FALSE
  AND lr.result_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);

-- =====================================================
-- PARTITION MAINTENANCE SCHEDULE
-- =====================================================

-- Event to automatically add new year partitions
DELIMITER //

CREATE EVENT IF NOT EXISTS evt_add_next_year_partitions
ON SCHEDULE EVERY 1 YEAR
STARTS CONCAT(YEAR(CURDATE()) + 1, '-01-01 00:00:00')
DO
BEGIN
  DECLARE next_year INT;
  SET next_year = YEAR(CURDATE()) + 1;
  
  -- Add partitions for time-based tables
  CALL sp_add_year_partition('clinical_observations', next_year);
  CALL sp_add_year_partition('vital_signs_partitioned', next_year);
  CALL sp_add_year_partition('lab_results_partitioned', next_year);
  CALL sp_add_year_partition('audit_log_partitioned', next_year);
END //

DELIMITER ;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON clinical_data.patients_partitioned TO 'nilecare_app'@'%';
GRANT SELECT, INSERT, UPDATE ON clinical_data.encounters_partitioned TO 'nilecare_app'@'%';
GRANT SELECT, INSERT, UPDATE ON clinical_data.clinical_observations TO 'nilecare_app'@'%';
GRANT SELECT, INSERT, UPDATE ON clinical_data.vital_signs_partitioned TO 'nilecare_app'@'%';
GRANT SELECT, INSERT, UPDATE ON clinical_data.lab_results_partitioned TO 'nilecare_app'@'%';
GRANT SELECT, INSERT, UPDATE ON clinical_data.medications_partitioned TO 'nilecare_app'@'%';
GRANT SELECT, INSERT ON clinical_data.audit_log_partitioned TO 'nilecare_app'@'%';

GRANT EXECUTE ON PROCEDURE clinical_data.sp_get_partition_info TO 'nilecare_app'@'%';
GRANT EXECUTE ON PROCEDURE clinical_data.sp_analyze_partition_usage TO 'nilecare_app'@'%';

FLUSH PRIVILEGES;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
-- Query specific facility (partition pruning)
SELECT * FROM patients_partitioned 
WHERE facility_id = 'facility-uuid-here'
  AND tenant_id = 'tenant-uuid-here';

-- Query specific time range (partition pruning)
SELECT * FROM vital_signs_partitioned
WHERE observation_date BETWEEN '2024-01-01' AND '2024-12-31';

-- Add new year partition
CALL sp_add_year_partition('clinical_observations', 2031);

-- Get partition information
CALL sp_get_partition_info('vital_signs_partitioned');

-- Analyze partition usage
CALL sp_analyze_partition_usage('lab_results_partitioned');

-- Drop old partition (after archival)
CALL sp_drop_old_partition('audit_log_partitioned', 2020);
*/
