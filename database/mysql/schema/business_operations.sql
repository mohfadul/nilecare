-- =====================================================
-- NileCare Business Operations Database Schema
-- Database: business_operations (MySQL 8.0+)
-- Purpose: Business processes, scheduling, billing, inventory
-- =====================================================

CREATE DATABASE IF NOT EXISTS business_operations
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE business_operations;

-- =====================================================
-- FACILITIES TABLE
-- =====================================================
CREATE TABLE facilities (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  facility_code VARCHAR(50) UNIQUE NOT NULL,
  facility_name VARCHAR(255) NOT NULL,
  facility_type ENUM('hospital', 'clinic', 'lab', 'pharmacy', 'rehabilitation', 'urgent_care') NOT NULL,
  npi VARCHAR(10) COMMENT 'National Provider Identifier',
  tax_id VARCHAR(20),
  license_number VARCHAR(100),
  accreditation VARCHAR(100),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL COMMENT 'Sudan State (e.g., Khartoum, Gezira, Red Sea, North Darfur)',
  postal_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'Sudan',
  phone VARCHAR(20) NOT NULL COMMENT 'Sudan mobile format: +249xxxxxxxxx',
  fax VARCHAR(20) COMMENT 'Sudan format: +249xxxxxxxxx',
  email VARCHAR(255),
  website VARCHAR(255),
  total_beds INT DEFAULT 0,
  available_beds INT DEFAULT 0,
  icu_beds INT DEFAULT 0,
  emergency_beds INT DEFAULT 0,
  operating_hours JSON COMMENT 'Operating hours by day of week',
  services_offered JSON COMMENT 'Array of services',
  is_active BOOLEAN DEFAULT TRUE,
  is_24_7 BOOLEAN DEFAULT FALSE,
  timezone VARCHAR(50) DEFAULT 'Africa/Khartoum',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_facility_code (facility_code),
  INDEX idx_facility_type (facility_type),
  INDEX idx_active (is_active),
  FULLTEXT idx_facility_search (facility_name, city, state)
) ENGINE=InnoDB;

-- =====================================================
-- DEPARTMENTS TABLE
-- =====================================================
CREATE TABLE departments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL,
  department_code VARCHAR(50) NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  department_type ENUM('emergency', 'icu', 'surgery', 'radiology', 'laboratory', 'pharmacy', 'cardiology', 'oncology', 'pediatrics', 'obstetrics', 'other') NOT NULL,
  floor_number VARCHAR(10),
  building VARCHAR(100),
  phone_extension VARCHAR(20),
  manager_id CHAR(36),
  capacity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE RESTRICT,
  UNIQUE KEY uk_facility_dept_code (facility_id, department_code),
  INDEX idx_facility (facility_id),
  INDEX idx_dept_type (department_type),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- BEDS TABLE
-- =====================================================
CREATE TABLE beds (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  facility_id CHAR(36) NOT NULL,
  department_id CHAR(36),
  ward_id CHAR(36),
  bed_number VARCHAR(50) NOT NULL,
  bed_type ENUM('standard', 'icu', 'isolation', 'maternity', 'pediatric', 'bariatric') NOT NULL,
  room_number VARCHAR(50),
  floor_number VARCHAR(10),
  status ENUM('available', 'occupied', 'reserved', 'cleaning', 'maintenance', 'blocked') DEFAULT 'available',
  current_patient_id CHAR(36),
  current_encounter_id CHAR(36),
  admission_date DATETIME,
  features JSON COMMENT 'Special features like monitors, oxygen, etc',
  is_active BOOLEAN DEFAULT TRUE,
  last_cleaned DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  UNIQUE KEY uk_facility_bed (facility_id, bed_number),
  INDEX idx_facility (facility_id),
  INDEX idx_department (department_id),
  INDEX idx_status (status),
  INDEX idx_patient (current_patient_id)
) ENGINE=InnoDB;

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE appointments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  appointment_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id CHAR(36) NOT NULL,
  provider_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  department_id CHAR(36),
  appointment_type ENUM('consultation', 'follow_up', 'procedure', 'surgery', 'lab', 'radiology', 'therapy', 'vaccination', 'other') NOT NULL,
  status ENUM('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled') DEFAULT 'scheduled',
  priority ENUM('routine', 'urgent', 'emergent') DEFAULT 'routine',
  scheduled_start DATETIME NOT NULL,
  scheduled_end DATETIME NOT NULL,
  actual_start DATETIME,
  actual_end DATETIME,
  duration_minutes INT GENERATED ALWAYS AS (TIMESTAMPDIFF(MINUTE, scheduled_start, scheduled_end)) STORED,
  check_in_time DATETIME,
  check_out_time DATETIME,
  room_id CHAR(36),
  chief_complaint TEXT,
  appointment_notes TEXT,
  cancellation_reason TEXT,
  cancelled_by CHAR(36),
  cancelled_date DATETIME,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_date DATETIME,
  confirmation_sent BOOLEAN DEFAULT FALSE,
  confirmation_sent_date DATETIME,
  is_telehealth BOOLEAN DEFAULT FALSE,
  telehealth_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  INDEX idx_patient (patient_id),
  INDEX idx_provider (provider_id),
  INDEX idx_facility (facility_id),
  INDEX idx_scheduled_start (scheduled_start),
  INDEX idx_status (status),
  INDEX idx_appointment_number (appointment_number),
  INDEX idx_provider_date (provider_id, scheduled_start)
) ENGINE=InnoDB;

-- =====================================================
-- WAITLIST TABLE
-- =====================================================
CREATE TABLE waitlist (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  provider_id CHAR(36),
  facility_id CHAR(36) NOT NULL,
  department_id CHAR(36),
  appointment_type ENUM('consultation', 'follow_up', 'procedure', 'surgery', 'lab', 'radiology', 'therapy', 'other') NOT NULL,
  priority ENUM('routine', 'urgent', 'emergent') DEFAULT 'routine',
  preferred_dates JSON COMMENT 'Array of preferred date ranges',
  preferred_times JSON COMMENT 'Array of preferred time slots',
  status ENUM('active', 'scheduled', 'cancelled', 'expired') DEFAULT 'active',
  added_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scheduled_appointment_id CHAR(36),
  scheduled_date DATETIME,
  expiration_date DATE,
  notes TEXT,
  contact_attempts INT DEFAULT 0,
  last_contact_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patient (patient_id),
  INDEX idx_provider (provider_id),
  INDEX idx_facility (facility_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_added_date (added_date)
) ENGINE=InnoDB;

-- =====================================================
-- BILLING ACCOUNTS TABLE
-- =====================================================
CREATE TABLE billing_accounts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id CHAR(36) NOT NULL,
  guarantor_id CHAR(36),
  account_type ENUM('patient', 'insurance', 'self_pay', 'charity_care', 'worker_comp', 'other') NOT NULL,
  status ENUM('active', 'inactive', 'collections', 'paid_in_full', 'written_off') DEFAULT 'active',
  balance_due DECIMAL(12,2) DEFAULT 0.00,
  total_charges DECIMAL(12,2) DEFAULT 0.00,
  total_payments DECIMAL(12,2) DEFAULT 0.00,
  total_adjustments DECIMAL(12,2) DEFAULT 0.00,
  last_statement_date DATE,
  last_payment_date DATE,
  last_payment_amount DECIMAL(12,2),
  payment_plan_active BOOLEAN DEFAULT FALSE,
  payment_plan_amount DECIMAL(12,2),
  payment_plan_frequency ENUM('weekly', 'biweekly', 'monthly', 'quarterly'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_account_number (account_number),
  INDEX idx_patient (patient_id),
  INDEX idx_status (status),
  INDEX idx_balance (balance_due)
) ENGINE=InnoDB;

-- =====================================================
-- INSURANCE POLICIES TABLE
-- =====================================================
CREATE TABLE insurance_policies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  group_number VARCHAR(100),
  insurance_company VARCHAR(255) NOT NULL,
  insurance_type ENUM('primary', 'secondary', 'tertiary') NOT NULL,
  plan_name VARCHAR(255),
  plan_type ENUM('Government', 'Private', 'Military', 'Student', 'Employee', 'Other') NOT NULL COMMENT 'Sudan insurance types',
  subscriber_id CHAR(36),
  subscriber_relationship ENUM('self', 'spouse', 'child', 'other') NOT NULL,
  effective_date DATE NOT NULL,
  termination_date DATE,
  copay_amount DECIMAL(10,2),
  deductible_amount DECIMAL(10,2),
  deductible_met DECIMAL(10,2) DEFAULT 0.00,
  out_of_pocket_max DECIMAL(10,2),
  out_of_pocket_met DECIMAL(10,2) DEFAULT 0.00,
  payer_id VARCHAR(50) COMMENT 'EDI Payer ID',
  authorization_required BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  verification_date DATE,
  verification_status ENUM('verified', 'pending', 'failed', 'not_verified'),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patient (patient_id),
  INDEX idx_policy_number (policy_number),
  INDEX idx_insurance_type (insurance_type),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- CLAIMS TABLE
-- =====================================================
CREATE TABLE claims (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id CHAR(36) NOT NULL,
  encounter_id CHAR(36),
  insurance_policy_id CHAR(36) NOT NULL,
  billing_account_id CHAR(36) NOT NULL,
  claim_type ENUM('professional', 'institutional', 'dental', 'pharmacy') NOT NULL,
  claim_format ENUM('CMS1500', 'UB04', 'EDI_837P', 'EDI_837I') NOT NULL,
  status ENUM('draft', 'ready_to_submit', 'submitted', 'accepted', 'rejected', 'pending', 'paid', 'denied', 'appealed') DEFAULT 'draft',
  submission_date DATETIME,
  received_date DATETIME,
  processed_date DATETIME,
  paid_date DATETIME,
  total_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  allowed_amount DECIMAL(12,2),
  paid_amount DECIMAL(12,2),
  patient_responsibility DECIMAL(12,2),
  adjustment_amount DECIMAL(12,2),
  denial_reason_code VARCHAR(50),
  denial_reason_description TEXT,
  remittance_advice_number VARCHAR(100),
  check_number VARCHAR(100),
  check_date DATE,
  resubmission_count INT DEFAULT 0,
  last_resubmission_date DATETIME,
  appeal_count INT DEFAULT 0,
  last_appeal_date DATETIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  FOREIGN KEY (patient_id) REFERENCES clinical_data.patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (insurance_policy_id) REFERENCES insurance_policies(id) ON DELETE RESTRICT,
  FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE RESTRICT,
  INDEX idx_claim_number (claim_number),
  INDEX idx_patient (patient_id),
  INDEX idx_status (status),
  INDEX idx_submission_date (submission_date),
  INDEX idx_insurance (insurance_policy_id)
) ENGINE=InnoDB;

-- =====================================================
-- CLAIM LINE ITEMS TABLE
-- =====================================================
CREATE TABLE claim_line_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  claim_id CHAR(36) NOT NULL,
  line_number INT NOT NULL,
  service_date DATE NOT NULL,
  procedure_code VARCHAR(20) NOT NULL COMMENT 'CPT/HCPCS Code',
  procedure_description VARCHAR(255),
  diagnosis_codes JSON COMMENT 'Array of ICD-10 codes',
  modifiers VARCHAR(50),
  units INT DEFAULT 1,
  charge_amount DECIMAL(12,2) NOT NULL,
  allowed_amount DECIMAL(12,2),
  paid_amount DECIMAL(12,2),
  adjustment_amount DECIMAL(12,2),
  patient_responsibility DECIMAL(12,2),
  denial_reason_code VARCHAR(50),
  denial_reason_description TEXT,
  revenue_code VARCHAR(10),
  place_of_service VARCHAR(10),
  provider_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
  INDEX idx_claim (claim_id),
  INDEX idx_service_date (service_date),
  INDEX idx_procedure_code (procedure_code)
) ENGINE=InnoDB;

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  billing_account_id CHAR(36) NOT NULL,
  patient_id CHAR(36) NOT NULL,
  payment_type ENUM('patient', 'insurance', 'adjustment', 'refund', 'write_off') NOT NULL,
  payment_method ENUM('cash', 'check', 'credit_card', 'debit_card', 'ach', 'wire_transfer', 'online', 'other') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  received_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  transaction_id VARCHAR(100),
  check_number VARCHAR(100),
  credit_card_last4 VARCHAR(4),
  credit_card_type ENUM('Visa', 'MasterCard', 'Amex', 'Discover', 'Other'),
  authorization_code VARCHAR(50),
  status ENUM('pending', 'completed', 'failed', 'reversed', 'refunded') DEFAULT 'completed',
  applied_to_claims JSON COMMENT 'Array of {claim_id, amount}',
  notes TEXT,
  processed_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (patient_id) REFERENCES clinical_data.patients(id) ON DELETE RESTRICT,
  INDEX idx_payment_number (payment_number),
  INDEX idx_billing_account (billing_account_id),
  INDEX idx_patient (patient_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- INVENTORY ITEMS TABLE
-- =====================================================
CREATE TABLE inventory_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_category ENUM('medication', 'supply', 'equipment', 'implant', 'device', 'other') NOT NULL,
  item_type VARCHAR(100),
  manufacturer VARCHAR(255),
  ndc_code VARCHAR(20) COMMENT 'National Drug Code for medications',
  upc_code VARCHAR(50),
  unit_of_measure VARCHAR(50) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(12,2),
  reorder_level INT NOT NULL,
  reorder_quantity INT NOT NULL,
  is_controlled_substance BOOLEAN DEFAULT FALSE,
  dea_schedule ENUM('I', 'II', 'III', 'IV', 'V'),
  requires_refrigeration BOOLEAN DEFAULT FALSE,
  storage_requirements TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  discontinued_date DATE,
  replacement_item_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_item_code (item_code),
  INDEX idx_category (item_category),
  INDEX idx_active (is_active),
  FULLTEXT idx_item_search (item_name, manufacturer)
) ENGINE=InnoDB;

-- =====================================================
-- INVENTORY LOCATIONS TABLE
-- =====================================================
CREATE TABLE inventory_locations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  item_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  department_id CHAR(36),
  location_name VARCHAR(255) NOT NULL,
  quantity_on_hand INT NOT NULL DEFAULT 0,
  quantity_reserved INT DEFAULT 0,
  quantity_available INT GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  min_quantity INT NOT NULL,
  max_quantity INT NOT NULL,
  bin_location VARCHAR(100),
  last_counted_date DATE,
  last_counted_by CHAR(36),
  last_reorder_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  UNIQUE KEY uk_item_location (item_id, facility_id, department_id, location_name),
  INDEX idx_item (item_id),
  INDEX idx_facility (facility_id),
  INDEX idx_quantity (quantity_on_hand)
) ENGINE=InnoDB;

-- =====================================================
-- INVENTORY TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE inventory_transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  item_id CHAR(36) NOT NULL,
  location_id CHAR(36) NOT NULL,
  transaction_type ENUM('receipt', 'issue', 'transfer', 'adjustment', 'return', 'waste', 'expired') NOT NULL,
  quantity INT NOT NULL,
  unit_cost DECIMAL(12,2),
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lot_number VARCHAR(100),
  expiration_date DATE,
  reference_number VARCHAR(100),
  from_location_id CHAR(36),
  to_location_id CHAR(36),
  reason TEXT,
  performed_by CHAR(36) NOT NULL,
  approved_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
  FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE RESTRICT,
  INDEX idx_transaction_number (transaction_number),
  INDEX idx_item (item_id),
  INDEX idx_location (location_id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_transaction_type (transaction_type)
) ENGINE=InnoDB;

-- =====================================================
-- SUPPLIERS TABLE
-- =====================================================
CREATE TABLE suppliers (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  supplier_code VARCHAR(50) UNIQUE NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(200),
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50) COMMENT 'Sudan State',
  postal_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'Sudan',
  payment_terms VARCHAR(100),
  lead_time_days INT,
  minimum_order_amount DECIMAL(12,2),
  is_preferred BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) COMMENT '0.00 to 5.00',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_supplier_code (supplier_code),
  INDEX idx_active (is_active),
  FULLTEXT idx_supplier_search (supplier_name, contact_person)
) ENGINE=InnoDB;

-- =====================================================
-- PURCHASE ORDERS TABLE
-- =====================================================
CREATE TABLE purchase_orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status ENUM('draft', 'submitted', 'approved', 'ordered', 'partially_received', 'received', 'cancelled') DEFAULT 'draft',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  shipping_amount DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal + tax_amount + shipping_amount) STORED,
  ordered_by CHAR(36) NOT NULL,
  approved_by CHAR(36),
  approved_date DATETIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE RESTRICT,
  INDEX idx_po_number (po_number),
  INDEX idx_supplier (supplier_id),
  INDEX idx_facility (facility_id),
  INDEX idx_status (status),
  INDEX idx_order_date (order_date)
) ENGINE=InnoDB;

-- =====================================================
-- PURCHASE ORDER LINE ITEMS TABLE
-- =====================================================
CREATE TABLE purchase_order_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  purchase_order_id CHAR(36) NOT NULL,
  line_number INT NOT NULL,
  item_id CHAR(36) NOT NULL,
  quantity_ordered INT NOT NULL,
  quantity_received INT DEFAULT 0,
  unit_cost DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) GENERATED ALWAYS AS (quantity_ordered * unit_cost) STORED,
  expected_delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
  INDEX idx_po (purchase_order_id),
  INDEX idx_item (item_id)
) ENGINE=InnoDB;

-- =====================================================
-- CREATE VIEWS
-- =====================================================

-- Available Appointments View
CREATE OR REPLACE VIEW v_available_appointment_slots AS
SELECT 
  a.provider_id,
  a.facility_id,
  a.scheduled_start,
  a.scheduled_end,
  a.duration_minutes
FROM appointments a
WHERE a.status = 'scheduled'
  AND a.scheduled_start > NOW();

-- Low Stock Items View
CREATE OR REPLACE VIEW v_low_stock_items AS
SELECT 
  ii.id,
  ii.item_code,
  ii.item_name,
  ii.item_category,
  il.facility_id,
  il.quantity_on_hand,
  il.min_quantity,
  il.reorder_level,
  ii.reorder_quantity
FROM inventory_items ii
JOIN inventory_locations il ON ii.id = il.item_id
WHERE il.quantity_on_hand <= il.min_quantity
  AND ii.is_active = TRUE;

-- Outstanding Claims View
CREATE OR REPLACE VIEW v_outstanding_claims AS
SELECT 
  c.*,
  p.mrn,
  p.first_name,
  p.last_name,
  ip.insurance_company,
  DATEDIFF(NOW(), c.submission_date) as days_outstanding
FROM claims c
JOIN clinical_data.patients p ON c.patient_id = p.id
JOIN insurance_policies ip ON c.insurance_policy_id = ip.id
WHERE c.status IN ('submitted', 'pending')
  AND c.submission_date IS NOT NULL;

-- Facility Bed Utilization View
CREATE OR REPLACE VIEW v_facility_bed_utilization AS
SELECT 
  f.id as facility_id,
  f.facility_name,
  COUNT(b.id) as total_beds,
  SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
  SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) as available_beds,
  ROUND(SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) * 100.0 / COUNT(b.id), 2) as occupancy_rate
FROM facilities f
LEFT JOIN beds b ON f.id = b.facility_id AND b.is_active = TRUE
WHERE f.is_active = TRUE
GROUP BY f.id, f.facility_name;

-- =====================================================
-- CREATE STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure to check appointment availability
CREATE PROCEDURE sp_check_appointment_availability(
  IN p_provider_id CHAR(36),
  IN p_start_time DATETIME,
  IN p_end_time DATETIME
)
BEGIN
  SELECT COUNT(*) as conflicting_appointments
  FROM appointments
  WHERE provider_id = p_provider_id
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      (scheduled_start BETWEEN p_start_time AND p_end_time)
      OR (scheduled_end BETWEEN p_start_time AND p_end_time)
      OR (scheduled_start <= p_start_time AND scheduled_end >= p_end_time)
    );
END //

-- Procedure to process inventory reorder
CREATE PROCEDURE sp_process_inventory_reorder()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_item_id CHAR(36);
  DECLARE v_facility_id CHAR(36);
  DECLARE v_reorder_qty INT;
  
  DECLARE reorder_cursor CURSOR FOR
    SELECT il.item_id, il.facility_id, ii.reorder_quantity
    FROM inventory_locations il
    JOIN inventory_items ii ON il.item_id = ii.id
    WHERE il.quantity_on_hand <= il.min_quantity
      AND ii.is_active = TRUE;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN reorder_cursor;
  
  read_loop: LOOP
    FETCH reorder_cursor INTO v_item_id, v_facility_id, v_reorder_qty;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Create purchase order logic here
    -- This is a placeholder for the actual PO creation
    SELECT v_item_id, v_facility_id, v_reorder_qty;
  END LOOP;
  
  CLOSE reorder_cursor;
END //

DELIMITER ;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON business_operations.* TO 'nilecare_app'@'%';
GRANT SELECT ON business_operations.* TO 'nilecare_readonly'@'%';

FLUSH PRIVILEGES;
