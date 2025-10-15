-- ============================================================================
-- Facility Service - Initial Schema Migration
-- Version: 1
-- Description: Create facility management tables
-- Author: Database Team
-- Date: 2025-10-15
-- Ticket: DB-004
-- ============================================================================

-- ============================================================================
-- FACILITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS facilities (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  facility_code VARCHAR(50) UNIQUE NOT NULL,
  facility_name VARCHAR(255) NOT NULL,
  facility_type ENUM('hospital', 'clinic', 'lab', 'pharmacy', 'rehabilitation', 'urgent_care') NOT NULL,
  
  -- Registration & Licensing
  npi VARCHAR(10) COMMENT 'National Provider Identifier',
  tax_id VARCHAR(20),
  license_number VARCHAR(100),
  accreditation VARCHAR(100),
  
  -- Address
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL COMMENT 'Sudan State (Khartoum, Gezira, Red Sea, etc.)',
  postal_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'Sudan',
  
  -- Contact
  phone VARCHAR(20) NOT NULL COMMENT 'Sudan format: +249xxxxxxxxx',
  fax VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Capacity
  total_beds INT DEFAULT 0,
  available_beds INT DEFAULT 0,
  icu_beds INT DEFAULT 0,
  emergency_beds INT DEFAULT 0,
  
  -- Operations
  operating_hours JSON COMMENT 'Operating hours by day of week',
  services_offered JSON COMMENT 'Array of services',
  is_active BOOLEAN DEFAULT TRUE,
  is_24_7 BOOLEAN DEFAULT FALSE,
  timezone VARCHAR(50) DEFAULT 'Africa/Khartoum',
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Indexes
  INDEX idx_facilities_code (facility_code),
  INDEX idx_facilities_type (facility_type),
  INDEX idx_facilities_active (is_active),
  INDEX idx_facilities_city_state (city, state),
  FULLTEXT idx_facilities_search (facility_name, city, state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Healthcare facility registry';

-- ============================================================================
-- DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL,
  department_code VARCHAR(50) NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  department_type ENUM('emergency', 'icu', 'surgery', 'radiology', 'laboratory', 'pharmacy', 'cardiology', 'oncology', 'pediatrics', 'obstetrics', 'other') NOT NULL,
  
  -- Location
  floor_number VARCHAR(10),
  building VARCHAR(100),
  phone_extension VARCHAR(20),
  
  -- Management
  manager_id CHAR(36) COMMENT 'Reference to auth service user',
  capacity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Foreign Keys
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE RESTRICT,
  
  -- Indexes
  UNIQUE KEY uk_facility_dept_code (facility_id, department_code),
  INDEX idx_departments_facility (facility_id),
  INDEX idx_departments_type (department_type),
  INDEX idx_departments_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Department management within facilities';

-- ============================================================================
-- WARDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wards (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL,
  department_id CHAR(36),
  ward_code VARCHAR(50) NOT NULL,
  ward_name VARCHAR(255) NOT NULL,
  ward_type ENUM('general', 'icu', 'isolation', 'maternity', 'pediatric', 'surgical', 'medical') NOT NULL,
  
  -- Capacity
  total_beds INT DEFAULT 0,
  occupied_beds INT DEFAULT 0,
  available_beds INT GENERATED ALWAYS AS (total_beds - occupied_beds) STORED,
  
  -- Location
  floor_number VARCHAR(10),
  building VARCHAR(100),
  
  -- Staff
  head_nurse_id CHAR(36) COMMENT 'Reference to auth service user',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Foreign Keys
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Indexes
  UNIQUE KEY uk_facility_ward_code (facility_id, ward_code),
  INDEX idx_wards_facility (facility_id),
  INDEX idx_wards_department (department_id),
  INDEX idx_wards_type (ward_type),
  INDEX idx_wards_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Ward management within departments';

-- ============================================================================
-- BEDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS beds (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL,
  department_id CHAR(36),
  ward_id CHAR(36),
  bed_number VARCHAR(50) NOT NULL,
  bed_type ENUM('standard', 'icu', 'isolation', 'maternity', 'pediatric', 'bariatric') NOT NULL,
  
  -- Location
  room_number VARCHAR(50),
  floor_number VARCHAR(10),
  
  -- Status
  status ENUM('available', 'occupied', 'reserved', 'cleaning', 'maintenance', 'blocked') DEFAULT 'available',
  current_patient_id CHAR(36) COMMENT 'Reference to clinical service patient',
  current_encounter_id CHAR(36) COMMENT 'Reference to clinical service encounter',
  admission_date DATETIME,
  
  -- Features
  features JSON COMMENT 'Special features: monitors, oxygen, etc.',
  is_active BOOLEAN DEFAULT TRUE,
  last_cleaned DATETIME,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Foreign Keys
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE SET NULL,
  
  -- Indexes
  UNIQUE KEY uk_facility_bed (facility_id, bed_number),
  INDEX idx_beds_facility (facility_id),
  INDEX idx_beds_department (department_id),
  INDEX idx_beds_ward (ward_id),
  INDEX idx_beds_status (status),
  INDEX idx_beds_patient (current_patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bed management and tracking';

-- ============================================================================
-- FACILITY SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS facility_settings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36),
  
  -- Foreign Keys
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
  
  -- Indexes
  UNIQUE KEY uk_facility_setting (facility_id, setting_key),
  INDEX idx_facility_settings_facility (facility_id),
  INDEX idx_facility_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Facility-specific configuration settings';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Facility Bed Utilization View
CREATE OR REPLACE VIEW v_facility_bed_utilization AS
SELECT 
  f.id as facility_id,
  f.facility_name,
  f.facility_type,
  COUNT(b.id) as total_beds,
  SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
  SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) as available_beds,
  SUM(CASE WHEN b.status = 'cleaning' THEN 1 ELSE 0 END) as cleaning_beds,
  SUM(CASE WHEN b.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_beds,
  ROUND(SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(b.id), 0), 2) as occupancy_rate
FROM facilities f
LEFT JOIN beds b ON f.id = b.facility_id AND b.is_active = TRUE
WHERE f.is_active = TRUE
GROUP BY f.id, f.facility_name, f.facility_type;

-- Active Facilities View
CREATE OR REPLACE VIEW v_active_facilities AS
SELECT 
  f.*,
  COUNT(DISTINCT d.id) as department_count,
  COUNT(DISTINCT w.id) as ward_count,
  COUNT(DISTINCT b.id) as total_bed_count
FROM facilities f
LEFT JOIN departments d ON f.id = d.facility_id AND d.is_active = TRUE
LEFT JOIN wards w ON f.id = w.facility_id AND w.is_active = TRUE
LEFT JOIN beds b ON f.id = b.facility_id AND b.is_active = TRUE
WHERE f.is_active = TRUE
GROUP BY f.id;

-- Log migration completion
SELECT 'Migration V1__Initial_facility_schema completed successfully' as status;

