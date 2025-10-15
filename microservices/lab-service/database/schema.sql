-- ============================================================================
-- Lab Service - Database Schema (PostgreSQL)
-- Version: 1.0.0
-- Description: Schema for laboratory management, orders, samples, and results
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. LAB TESTS TABLE (Test Catalog)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Test Identification
  test_code VARCHAR(50) UNIQUE NOT NULL, -- LOINC code
  test_name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('hematology', 'chemistry', 'microbiology', 'immunology', 'pathology', 'molecular', 'toxicology', 'other')),
  
  -- Specimen
  specimen_type VARCHAR(100) NOT NULL, -- blood, urine, tissue, etc.
  methodology VARCHAR(255), -- e.g., "PCR", "ELISA"
  
  -- Turnaround Time
  tat INTEGER NOT NULL, -- in hours or days
  tat_unit VARCHAR(20) DEFAULT 'hours' CHECK (tat_unit IN ('hours', 'days')),
  
  -- Reference Ranges (stored as JSONB for flexibility)
  reference_ranges JSONB, -- Array of age/gender-specific ranges
  
  -- Critical Values
  critical_value_low DECIMAL(12, 4),
  critical_value_high DECIMAL(12, 4),
  critical_value_unit VARCHAR(50),
  
  -- Requirements
  fasting_required BOOLEAN DEFAULT FALSE,
  special_instructions TEXT,
  
  -- Pricing
  base_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'SDG',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  
  -- Multi-facility Support
  facility_id UUID, -- NULL = available to all facilities
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_lab_tests_code (test_code),
  INDEX idx_lab_tests_name (test_name),
  INDEX idx_lab_tests_category (category),
  INDEX idx_lab_tests_facility (facility_id),
  INDEX idx_lab_tests_status (status)
);

-- ============================================================================
-- 2. LAB PANELS TABLE (Test Panels/Profiles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Panel Identification
  panel_code VARCHAR(50) UNIQUE NOT NULL,
  panel_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Tests Included (stored as array)
  test_ids UUID[] NOT NULL,
  
  -- Pricing
  base_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'SDG',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Multi-facility Support
  facility_id UUID,
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_lab_panels_code (panel_code),
  INDEX idx_lab_panels_facility (facility_id),
  INDEX idx_lab_panels_status (status)
);

-- ============================================================================
-- 3. LAB ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order Identification
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Format: LAB-YYYYMMDD-XXXXXX
  
  -- References
  patient_id UUID NOT NULL,
  provider_id UUID NOT NULL, -- Ordering physician
  appointment_id UUID,
  encounter_id UUID,
  
  -- Tests Ordered (stored as JSONB)
  tests JSONB NOT NULL, -- Array of {testId, testName, priority, status, notes}
  
  -- Clinical Information
  clinical_notes TEXT,
  diagnosis_code VARCHAR(20), -- ICD-10
  indication TEXT,
  
  -- Status Tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'processing', 'completed', 'cancelled', 'partial')),
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
  
  -- Dates
  ordered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_completion_date TIMESTAMP,
  completed_date TIMESTAMP,
  
  -- Sample Information
  sample_ids UUID[], -- References to collected samples
  
  -- Result Information
  has_results BOOLEAN DEFAULT FALSE,
  results_released_date TIMESTAMP,
  results_released_by UUID,
  
  -- Billing Reference
  billing_reference UUID,
  billing_status VARCHAR(20) CHECK (billing_status IN ('pending', 'billed', 'paid')),
  
  -- Multi-facility Support
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_lab_orders_number (order_number),
  INDEX idx_lab_orders_patient (patient_id),
  INDEX idx_lab_orders_provider (provider_id),
  INDEX idx_lab_orders_appointment (appointment_id),
  INDEX idx_lab_orders_facility (facility_id),
  INDEX idx_lab_orders_status (status),
  INDEX idx_lab_orders_priority (priority),
  INDEX idx_lab_orders_ordered_date (ordered_date DESC)
);

-- ============================================================================
-- 4. SAMPLES TABLE (Specimen Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sample Identification
  sample_number VARCHAR(50) UNIQUE NOT NULL, -- Format: SMP-YYYYMMDD-XXXXXX
  
  -- References
  lab_order_id UUID NOT NULL REFERENCES lab_orders(id),
  patient_id UUID NOT NULL,
  test_ids UUID[] NOT NULL,
  
  -- Sample Details
  sample_type VARCHAR(100) NOT NULL,
  collection_method VARCHAR(100) NOT NULL,
  collection_site VARCHAR(100),
  
  -- Volume and Container
  volume DECIMAL(10, 2),
  volume_unit VARCHAR(20),
  container_type VARCHAR(100),
  
  -- Collection Information
  collected_by UUID NOT NULL,
  collection_time TIMESTAMP NOT NULL,
  collection_notes TEXT,
  
  -- Chain of Custody (stored as JSONB)
  custody_chain JSONB NOT NULL DEFAULT '[]',
  
  -- Current Location
  current_location VARCHAR(255) NOT NULL,
  
  -- Quality Indicators
  adequate_sample BOOLEAN DEFAULT TRUE,
  hemolyzed BOOLEAN DEFAULT FALSE,
  lipemic BOOLEAN DEFAULT FALSE,
  icteric BOOLEAN DEFAULT FALSE,
  clotted BOOLEAN DEFAULT FALSE,
  quality_notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'collected' CHECK (status IN ('collected', 'in_transit', 'received', 'processing', 'analyzed', 'stored', 'discarded')),
  
  -- Storage
  storage_location VARCHAR(255),
  storage_temperature DECIMAL(5, 2), -- in Celsius
  expiry_date DATE,
  
  -- Disposal
  discarded_date TIMESTAMP,
  discarded_by UUID,
  discard_reason TEXT,
  
  -- Barcode
  barcode_id VARCHAR(100) UNIQUE,
  
  -- Multi-facility Support
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_samples_number (sample_number),
  INDEX idx_samples_lab_order (lab_order_id),
  INDEX idx_samples_patient (patient_id),
  INDEX idx_samples_facility (facility_id),
  INDEX idx_samples_status (status),
  INDEX idx_samples_barcode (barcode_id),
  INDEX idx_samples_collection_time (collection_time DESC)
);

-- ============================================================================
-- 5. LAB RESULTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  lab_order_id UUID NOT NULL REFERENCES lab_orders(id),
  test_id UUID NOT NULL REFERENCES lab_tests(id),
  sample_id UUID NOT NULL REFERENCES samples(id),
  patient_id UUID NOT NULL,
  
  -- Result Data
  result_value TEXT NOT NULL,
  result_unit VARCHAR(50),
  result_type VARCHAR(20) DEFAULT 'numeric' CHECK (result_type IN ('numeric', 'text', 'coded', 'document')),
  
  -- Reference Range
  reference_range VARCHAR(200),
  reference_range_low DECIMAL(12, 4),
  reference_range_high DECIMAL(12, 4),
  reference_range_unit VARCHAR(50),
  
  -- Interpretation
  flag VARCHAR(20) DEFAULT 'normal' CHECK (flag IN ('normal', 'abnormal', 'critical', 'high', 'low', 'panic')),
  interpretation TEXT,
  is_critical BOOLEAN DEFAULT FALSE,
  
  -- Performing Details
  performed_by UUID NOT NULL, -- Technician
  performed_at TIMESTAMP NOT NULL,
  instrument_id UUID,
  methodology VARCHAR(255),
  
  -- Quality Control
  qc_status VARCHAR(20) DEFAULT 'passed' CHECK (qc_status IN ('passed', 'failed', 'pending')),
  qc_notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'preliminary' CHECK (status IN ('preliminary', 'final', 'corrected', 'cancelled')),
  
  -- Review and Release
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  released_by UUID,
  released_at TIMESTAMP,
  review_notes TEXT,
  
  -- Critical Value Notification
  critical_value_notified BOOLEAN DEFAULT FALSE,
  critical_value_notified_at TIMESTAMP,
  critical_value_notified_to UUID[], -- Array of user IDs
  critical_value_acknowledged_by UUID,
  critical_value_acknowledged_at TIMESTAMP,
  
  -- Corrections
  is_preliminary BOOLEAN DEFAULT TRUE,
  is_corrected BOOLEAN DEFAULT FALSE,
  correction_reason TEXT,
  corrected_from TEXT, -- Previous value
  corrected_by UUID,
  corrected_at TIMESTAMP,
  
  -- Notes
  technician_notes TEXT,
  
  -- Multi-facility Support
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_lab_results_order (lab_order_id),
  INDEX idx_lab_results_test (test_id),
  INDEX idx_lab_results_sample (sample_id),
  INDEX idx_lab_results_patient (patient_id),
  INDEX idx_lab_results_facility (facility_id),
  INDEX idx_lab_results_status (status),
  INDEX idx_lab_results_flag (flag),
  INDEX idx_lab_results_critical (is_critical, facility_id) WHERE is_critical = TRUE,
  INDEX idx_lab_results_performed_at (performed_at DESC)
);

-- ============================================================================
-- 6. LAB AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action Details
  action VARCHAR(50) NOT NULL, -- created, updated, collected, processed, released
  entity_type VARCHAR(50) NOT NULL, -- lab_order, sample, result
  entity_id UUID NOT NULL,
  
  -- User Context
  user_id UUID NOT NULL,
  user_role VARCHAR(50),
  
  -- Changes (stored as JSON)
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  patient_id UUID,
  lab_order_id UUID,
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Additional Info
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_lab_audit_entity (entity_type, entity_id),
  INDEX idx_lab_audit_user (user_id),
  INDEX idx_lab_audit_facility (facility_id),
  INDEX idx_lab_audit_patient (patient_id),
  INDEX idx_lab_audit_order (lab_order_id),
  INDEX idx_lab_audit_action (action),
  INDEX idx_lab_audit_created (created_at DESC)
);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lab_tests_updated_at
  BEFORE UPDATE ON lab_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_panels_updated_at
  BEFORE UPDATE ON lab_panels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_orders_updated_at
  BEFORE UPDATE ON lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_samples_updated_at
  BEFORE UPDATE ON samples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_results_updated_at
  BEFORE UPDATE ON lab_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Pending lab orders view
CREATE OR REPLACE VIEW pending_lab_orders AS
SELECT 
  o.*,
  COUNT(r.id) as results_count,
  ARRAY_AGG(r.status) as results_statuses
FROM lab_orders o
LEFT JOIN lab_results r ON o.id = r.lab_order_id
WHERE o.status IN ('pending', 'collected', 'processing')
GROUP BY o.id;

-- Critical results view
CREATE OR REPLACE VIEW critical_lab_results AS
SELECT 
  r.*,
  t.test_name,
  t.critical_value_low,
  t.critical_value_high,
  o.patient_id,
  o.provider_id,
  o.facility_id
FROM lab_results r
JOIN lab_tests t ON r.test_id = t.id
JOIN lab_orders o ON r.lab_order_id = o.id
WHERE r.is_critical = TRUE
  AND r.critical_value_notified = FALSE;

-- ============================================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================================

-- Sample Lab Tests
INSERT INTO lab_tests (test_code, test_name, category, specimen_type, methodology, tat, tat_unit, reference_ranges, critical_value_low, critical_value_high, critical_value_unit, fasting_required, base_price, organization_id, created_by, status)
VALUES 
  ('718-7', 'Hemoglobin', 'hematology', 'blood', 'Spectrophotometry', 2, 'hours', 
   '[{"gender": "male", "minValue": 13.5, "maxValue": 17.5, "unit": "g/dL"}, {"gender": "female", "minValue": 12.0, "maxValue": 15.5, "unit": "g/dL"}]'::JSONB,
   7.0, 20.0, 'g/dL', FALSE, 25.00, gen_random_uuid(), gen_random_uuid(), 'active'),
  
  ('789-8', 'RBC Count', 'hematology', 'blood', 'Automated Counter', 2, 'hours',
   '[{"minValue": 4.5, "maxValue": 5.5, "unit": "million/µL"}]'::JSONB,
   2.0, 7.0, 'million/µL', FALSE, 20.00, gen_random_uuid(), gen_random_uuid(), 'active'),
  
  ('2345-7', 'Glucose', 'chemistry', 'blood', 'Enzymatic', 1, 'hours',
   '[{"minValue": 70, "maxValue": 100, "unit": "mg/dL"}]'::JSONB,
   40.0, 400.0, 'mg/dL', TRUE, 15.00, gen_random_uuid(), gen_random_uuid(), 'active'),
  
  ('2160-0', 'Creatinine', 'chemistry', 'blood', 'Jaffe Reaction', 3, 'hours',
   '[{"gender": "male", "minValue": 0.7, "maxValue": 1.3, "unit": "mg/dL"}, {"gender": "female", "minValue": 0.6, "maxValue": 1.1, "unit": "mg/dL"}]'::JSONB,
   0.3, 5.0, 'mg/dL', FALSE, 18.00, gen_random_uuid(), gen_random_uuid(), 'active'),
  
  ('787-2', 'MCV', 'hematology', 'blood', 'Automated Counter', 2, 'hours',
   '[{"minValue": 80, "maxValue": 100, "unit": "fL"}]'::JSONB,
   60.0, 120.0, 'fL', FALSE, 20.00, gen_random_uuid(), gen_random_uuid(), 'active')
ON CONFLICT (test_code) DO NOTHING;

-- Sample Lab Panel
INSERT INTO lab_panels (panel_code, panel_name, description, category, test_ids, base_price, organization_id, created_by, status)
SELECT 
  'CBC001',
  'Complete Blood Count',
  'Comprehensive hematology panel',
  'hematology',
  ARRAY(SELECT id FROM lab_tests WHERE test_code IN ('718-7', '789-8', '787-2')),
  50.00,
  gen_random_uuid(),
  gen_random_uuid(),
  'active'
WHERE NOT EXISTS (SELECT 1 FROM lab_panels WHERE panel_code = 'CBC001');

-- ============================================================================
-- GRANT PERMISSIONS (Adjust based on your user setup)
-- ============================================================================

-- Example: GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lab_service_user;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

