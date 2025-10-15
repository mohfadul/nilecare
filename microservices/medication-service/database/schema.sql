-- ============================================================================
-- Medication Service - Database Schema (PostgreSQL)
-- Version: 1.0.0
-- Description: Schema for medication management, prescriptions, and administration records
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. MEDICATIONS TABLE (Medication Catalog/Formulary)
-- ============================================================================

CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Medication Identification
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  brand_name VARCHAR(255),
  
  -- Dosage Information
  dosage_form VARCHAR(50) NOT NULL, -- tablet, capsule, syrup, injection, etc.
  strength VARCHAR(100) NOT NULL,   -- e.g., "500mg", "10ml"
  unit VARCHAR(50) NOT NULL,        -- mg, ml, g, etc.
  
  -- Manufacturing
  manufacturer VARCHAR(255),
  description TEXT,
  category VARCHAR(100),            -- antibiotic, analgesic, etc.
  
  -- Safety Flags
  is_high_alert BOOLEAN DEFAULT FALSE,
  requires_refrigeration BOOLEAN DEFAULT FALSE,
  is_controlled_substance BOOLEAN DEFAULT FALSE,
  controlled_substance_schedule VARCHAR(10), -- DEA Schedule I-V
  
  -- Multi-facility Support
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  
  -- Audit Fields
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_medications_facility (facility_id),
  INDEX idx_medications_status (status),
  INDEX idx_medications_name (name),
  INDEX idx_medications_high_alert (is_high_alert),
  INDEX idx_medications_controlled (is_controlled_substance)
);

-- ============================================================================
-- 2. PRESCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Prescription Identification
  prescription_number VARCHAR(50) UNIQUE NOT NULL, -- Format: RX-YYYYMMDD-XXXXXX
  
  -- References
  patient_id UUID NOT NULL,
  provider_id UUID NOT NULL,        -- Prescribing doctor
  medication_id UUID NOT NULL REFERENCES medications(id),
  encounter_id UUID,
  appointment_id UUID,
  
  -- Prescription Details
  dosage VARCHAR(100) NOT NULL,
  route VARCHAR(50) NOT NULL CHECK (route IN ('oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'inhalation', 'rectal', 'sublingual', 'other')),
  frequency VARCHAR(100) NOT NULL,  -- e.g., "twice daily", "every 4 hours"
  duration VARCHAR(100) NOT NULL,   -- e.g., "7 days", "2 weeks"
  quantity DECIMAL(10, 2) NOT NULL,
  refills_allowed INTEGER DEFAULT 0,
  refills_remaining INTEGER DEFAULT 0,
  
  -- Instructions
  instructions TEXT NOT NULL,
  indication TEXT,                  -- Reason for prescription
  notes TEXT,
  
  -- Status Tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'dispensed', 'completed', 'cancelled', 'expired')),
  
  -- Dates
  prescribed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  start_date DATE NOT NULL,
  end_date DATE,
  dispensed_date TIMESTAMP,
  expiration_date DATE NOT NULL,
  
  -- Safety Checks
  allergy_check_passed BOOLEAN DEFAULT TRUE,
  interaction_check_passed BOOLEAN DEFAULT TRUE,
  contraindication_check_passed BOOLEAN DEFAULT TRUE,
  allergy_override BOOLEAN DEFAULT FALSE,
  allergy_override_reason TEXT,
  allergy_override_by UUID,
  
  -- E-prescription
  e_prescription_id VARCHAR(100),
  transmitted_to_pharmacy BOOLEAN DEFAULT FALSE,
  transmitted_date TIMESTAMP,
  pharmacy_id UUID,
  
  -- Multi-facility Support
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_prescriptions_patient (patient_id),
  INDEX idx_prescriptions_provider (provider_id),
  INDEX idx_prescriptions_medication (medication_id),
  INDEX idx_prescriptions_facility (facility_id),
  INDEX idx_prescriptions_status (status),
  INDEX idx_prescriptions_number (prescription_number),
  INDEX idx_prescriptions_expiration (expiration_date)
);

-- ============================================================================
-- 3. MAR ENTRIES TABLE (Medication Administration Record)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  patient_id UUID NOT NULL,
  medication_id UUID NOT NULL REFERENCES medications(id),
  prescription_id UUID REFERENCES prescriptions(id),
  encounter_id UUID,
  
  -- Administration Details
  dosage VARCHAR(100) NOT NULL,
  route VARCHAR(50) NOT NULL CHECK (route IN ('oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'inhalation', 'rectal', 'sublingual', 'other')),
  site VARCHAR(100),                -- Body site for injection, topical, etc.
  
  -- Timing
  scheduled_time TIMESTAMP,
  administered_time TIMESTAMP NOT NULL,
  
  -- Who Administered
  administered_by UUID NOT NULL,
  witnessed_by UUID,                -- Required for high-alert medications
  
  -- Verification
  barcode_verified BOOLEAN DEFAULT FALSE,
  barcode_data VARCHAR(500),
  patient_identity_verified BOOLEAN DEFAULT TRUE,
  verification_method VARCHAR(20) DEFAULT 'manual' CHECK (verification_method IN ('barcode', 'manual', 'biometric')),
  
  -- Safety
  is_high_alert BOOLEAN DEFAULT FALSE,
  high_alert_verified BOOLEAN,
  allergy_check_performed BOOLEAN DEFAULT TRUE,
  vital_signs_checked BOOLEAN,
  
  -- Status
  status VARCHAR(20) DEFAULT 'administered' CHECK (status IN ('scheduled', 'administered', 'missed', 'refused', 'held', 'omitted')),
  missed_reason TEXT,
  refused_reason TEXT,
  held_reason TEXT,
  omitted_reason TEXT,
  
  -- Observations
  patient_response TEXT,
  adverse_reaction BOOLEAN DEFAULT FALSE,
  adverse_reaction_details TEXT,
  notes TEXT,
  
  -- Batch Tracking
  batch_number VARCHAR(100),
  expiry_date DATE,
  lot_number VARCHAR(100),
  
  -- Multi-facility Support
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_mar_patient (patient_id),
  INDEX idx_mar_medication (medication_id),
  INDEX idx_mar_prescription (prescription_id),
  INDEX idx_mar_facility (facility_id),
  INDEX idx_mar_administered_by (administered_by),
  INDEX idx_mar_administered_time (administered_time),
  INDEX idx_mar_status (status),
  INDEX idx_mar_high_alert (is_high_alert)
);

-- ============================================================================
-- 4. HIGH ALERT MEDICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS high_alert_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id),
  
  -- Alert Classification
  alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('low', 'medium', 'high', 'critical')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('anticoagulant', 'insulin', 'chemotherapy', 'opioid', 'sedative', 'neuromuscular_blocker', 'electrolyte', 'other')),
  
  -- Safety Requirements
  requires_double_check BOOLEAN DEFAULT TRUE,
  requires_witness BOOLEAN DEFAULT TRUE,
  requires_special_training BOOLEAN DEFAULT FALSE,
  requires_protocol BOOLEAN DEFAULT FALSE,
  protocol_reference TEXT,
  
  -- Risk Factors (stored as JSON)
  common_errors JSONB,              -- Array of common administration errors
  adverse_effects JSONB,            -- Array of serious adverse effects
  interaction_warnings JSONB,       -- Array of critical interactions
  
  -- Monitoring Requirements
  requires_vital_signs_monitoring BOOLEAN DEFAULT FALSE,
  vital_signs_frequency VARCHAR(100),
  requires_lab_monitoring BOOLEAN DEFAULT FALSE,
  lab_monitoring_details TEXT,
  
  -- Documentation
  safety_guidelines TEXT NOT NULL,
  administration_guidelines TEXT NOT NULL,
  emergency_procedure TEXT,
  antidote VARCHAR(255),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  
  -- Multi-facility Support
  facility_id UUID,                 -- NULL = applies to all facilities
  organization_id UUID NOT NULL,
  
  -- Audit Fields
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_high_alert_medication (medication_id),
  INDEX idx_high_alert_facility (facility_id),
  INDEX idx_high_alert_level (alert_level),
  INDEX idx_high_alert_category (category),
  INDEX idx_high_alert_active (is_active)
);

-- ============================================================================
-- 5. MEDICATION AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS medication_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action Details
  action VARCHAR(50) NOT NULL,      -- created, updated, deleted, dispensed, administered
  entity_type VARCHAR(50) NOT NULL, -- medication, prescription, mar_entry
  entity_id UUID NOT NULL,
  
  -- User Context
  user_id UUID NOT NULL,
  user_role VARCHAR(50),
  
  -- Changes (stored as JSON)
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  patient_id UUID,
  medication_id UUID,
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Additional Info
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_facility (facility_id),
  INDEX idx_audit_patient (patient_id),
  INDEX idx_audit_medication (medication_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at DESC)
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

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mar_entries_updated_at
  BEFORE UPDATE ON mar_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_high_alert_medications_updated_at
  BEFORE UPDATE ON high_alert_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Active prescriptions view
CREATE OR REPLACE VIEW active_prescriptions AS
SELECT 
  p.*,
  m.name as medication_name,
  m.generic_name,
  m.dosage_form,
  m.is_high_alert
FROM prescriptions p
JOIN medications m ON p.medication_id = m.id
WHERE p.status IN ('pending', 'active', 'dispensed')
  AND p.expiration_date > CURRENT_DATE;

-- MAR summary view
CREATE OR REPLACE VIEW mar_summary AS
SELECT
  patient_id,
  facility_id,
  DATE(administered_time) as administration_date,
  COUNT(*) as total_administrations,
  SUM(CASE WHEN status = 'administered' THEN 1 ELSE 0 END) as administered,
  SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed,
  SUM(CASE WHEN status = 'refused' THEN 1 ELSE 0 END) as refused,
  SUM(CASE WHEN is_high_alert THEN 1 ELSE 0 END) as high_alert_count
FROM mar_entries
GROUP BY patient_id, facility_id, DATE(administered_time);

-- ============================================================================
-- GRANT PERMISSIONS (Adjust based on your user setup)
-- ============================================================================

-- Example: GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO medication_service_user;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

