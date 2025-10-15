-- ================================================================
-- Clinical Decision Support Service - Database Schema
-- ================================================================
-- 
-- PostgreSQL schema for CDS Service
-- Stores drug interactions, allergies, dosing guidelines, contraindications, and alerts
-- 
-- Reference: OpenEMR database structure
-- @see https://github.com/mohfadul/openemr-nilecare
-- 
-- ================================================================

-- Create database (run separately as superuser)
-- CREATE DATABASE cds_service;
-- CREATE USER cds_user WITH ENCRYPTED PASSWORD 'secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE cds_service TO cds_user;

-- Connect to database
-- \c cds_service

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- DRUG INTERACTIONS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS drug_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Drug information
  drug1_name VARCHAR(200) NOT NULL,
  drug1_rxnorm VARCHAR(50),
  drug2_name VARCHAR(200) NOT NULL,
  drug2_rxnorm VARCHAR(50),
  
  -- Interaction details
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  description TEXT NOT NULL,
  clinical_effects TEXT,
  mechanism TEXT,
  recommendation TEXT NOT NULL,
  
  -- Evidence
  evidence_level CHAR(1) CHECK (evidence_level IN ('A', 'B', 'C', 'D')),
  references TEXT[],
  
  -- Multi-facility support
  facility_id UUID,
  organization_id UUID,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_drug_pair UNIQUE (drug1_name, drug2_name)
);

CREATE INDEX idx_drug_interactions_drug1 ON drug_interactions (LOWER(drug1_name));
CREATE INDEX idx_drug_interactions_drug2 ON drug_interactions (LOWER(drug2_name));
CREATE INDEX idx_drug_interactions_severity ON drug_interactions (severity);
CREATE INDEX idx_drug_interactions_facility ON drug_interactions (facility_id) WHERE facility_id IS NOT NULL;

-- ================================================================
-- ALLERGIES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Allergen information
  allergen VARCHAR(200) NOT NULL,
  allergen_class VARCHAR(100), -- e.g., 'penicillin', 'sulfa', 'cephalosporin'
  severity VARCHAR(30) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'life-threatening')),
  reaction TEXT,
  cross_reactive_with TEXT[], -- Array of related allergen classes
  
  -- Multi-facility support
  facility_id UUID,
  organization_id UUID,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_allergies_allergen ON allergies (LOWER(allergen));
CREATE INDEX idx_allergies_class ON allergies (allergen_class);
CREATE INDEX idx_allergies_severity ON allergies (severity);

-- ================================================================
-- THERAPEUTIC RANGES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS therapeutic_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Medication information
  medication_name VARCHAR(200) NOT NULL,
  rxnorm_code VARCHAR(50),
  route VARCHAR(50) CHECK (route IN ('oral', 'IV', 'IM', 'SC', 'topical', 'inhalation')),
  
  -- Standard dosing
  min_dose DECIMAL(10, 4) NOT NULL,
  max_dose DECIMAL(10, 4) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- mg, mcg, units, etc.
  frequency VARCHAR(50), -- daily, BID, TID, QID, etc.
  
  -- Age-based adjustments (stored as JSONB)
  pediatric_dose JSONB,
  geriatric_dose JSONB,
  
  -- Organ function adjustments
  renal_adjustment JSONB,
  hepatic_adjustment JSONB,
  
  -- Clinical guidance
  monitoring_required TEXT[],
  contraindications TEXT[],
  warnings TEXT[],
  
  -- Multi-facility support
  facility_id UUID,
  organization_id UUID,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_medication_route UNIQUE (medication_name, route)
);

CREATE INDEX idx_therapeutic_ranges_medication ON therapeutic_ranges (LOWER(medication_name));
CREATE INDEX idx_therapeutic_ranges_route ON therapeutic_ranges (route);

-- ================================================================
-- CLINICAL GUIDELINES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS clinical_guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Guideline identification
  title VARCHAR(500) NOT NULL,
  condition VARCHAR(200) NOT NULL,
  icd_codes TEXT[] NOT NULL,
  snomed_codes TEXT[],
  
  -- Content
  summary TEXT NOT NULL,
  recommendations TEXT[],
  
  -- Evidence quality
  evidence_level CHAR(1) CHECK (evidence_level IN ('A', 'B', 'C', 'D')),
  strength_of_recommendation VARCHAR(20) CHECK (strength_of_recommendation IN ('strong', 'moderate', 'weak')),
  
  -- Treatment recommendations
  first_line_therapy TEXT[],
  second_line_therapy TEXT[],
  contraindicated_medications TEXT[],
  
  -- Follow-up
  monitoring_recommendations TEXT[],
  follow_up_interval VARCHAR(100),
  
  -- Source metadata
  source VARCHAR(100), -- 'NICE', 'CDC', 'AHA', etc.
  publication_date DATE,
  last_reviewed DATE NOT NULL,
  expiry_date DATE,
  
  -- Categorization
  tags TEXT[],
  category VARCHAR(100),
  
  -- Multi-facility support
  facility_id UUID,
  organization_id UUID,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_guidelines_condition ON clinical_guidelines (LOWER(condition));
CREATE INDEX idx_guidelines_icd ON clinical_guidelines USING GIN (icd_codes);
CREATE INDEX idx_guidelines_tags ON clinical_guidelines USING GIN (tags);
CREATE INDEX idx_guidelines_category ON clinical_guidelines (category);
CREATE INDEX idx_guidelines_reviewed ON clinical_guidelines (last_reviewed);

-- ================================================================
-- CONTRAINDICATIONS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS contraindications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Medication information
  medication_name VARCHAR(200) NOT NULL,
  rxnorm_code VARCHAR(50),
  
  -- Condition information
  condition VARCHAR(200) NOT NULL,
  icd_code VARCHAR(20) NOT NULL,
  snomed_code VARCHAR(50),
  
  -- Contraindication details
  type VARCHAR(20) NOT NULL CHECK (type IN ('absolute', 'relative')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
  description TEXT NOT NULL,
  clinical_rationale TEXT NOT NULL,
  
  -- Alternatives
  alternatives TEXT[],
  
  -- Evidence
  evidence_level CHAR(1) CHECK (evidence_level IN ('A', 'B', 'C', 'D')),
  references TEXT[],
  
  -- Multi-facility support
  facility_id UUID,
  organization_id UUID,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_medication_condition UNIQUE (medication_name, icd_code)
);

CREATE INDEX idx_contraindications_medication ON contraindications (LOWER(medication_name));
CREATE INDEX idx_contraindications_icd ON contraindications (icd_code);
CREATE INDEX idx_contraindications_type ON contraindications (type);
CREATE INDEX idx_contraindications_severity ON contraindications (severity);

-- ================================================================
-- ALERTS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Patient/Context
  patient_id UUID NOT NULL,
  facility_id UUID,
  organization_id UUID,
  
  -- Alert details
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'drug-interaction', 'allergy', 'contraindication', 'dose-error', 'guideline-deviation'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Content
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  clinical_context JSONB NOT NULL,
  
  -- Risk assessment
  risk_score INTEGER NOT NULL,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  
  -- Recommendations
  recommendations TEXT[],
  alternatives TEXT[],
  
  -- Alert lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP,
  acknowledgment_note TEXT,
  
  -- Audit trail
  triggered_by UUID NOT NULL,
  dismissed_by UUID,
  dismissed_at TIMESTAMP,
  dismissal_reason TEXT,
  
  -- Metadata
  source VARCHAR(20) DEFAULT 'automated' CHECK (source IN ('automated', 'manual', 'ml-model')),
  confidence INTEGER DEFAULT 100 CHECK (confidence BETWEEN 0 AND 100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_alerts_patient ON alerts (patient_id);
CREATE INDEX idx_alerts_facility ON alerts (facility_id) WHERE facility_id IS NOT NULL;
CREATE INDEX idx_alerts_organization ON alerts (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_alerts_type ON alerts (alert_type);
CREATE INDEX idx_alerts_severity ON alerts (severity);
CREATE INDEX idx_alerts_status ON alerts (status);
CREATE INDEX idx_alerts_active ON alerts (status, expires_at) WHERE status = 'active';
CREATE INDEX idx_alerts_created ON alerts (created_at DESC);

-- ================================================================
-- MEDICATIONS TABLE (Reference table for drug classes)
-- ================================================================

CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Medication information
  name VARCHAR(200) NOT NULL UNIQUE,
  generic_name VARCHAR(200),
  brand_names TEXT[],
  rxnorm_code VARCHAR(50),
  
  -- Classification
  drug_class VARCHAR(100), -- e.g., 'penicillin', 'nsaid', 'ace-inhibitor'
  therapeutic_class VARCHAR(100),
  pharmacologic_class VARCHAR(100),
  
  -- Basic properties
  controlled_substance BOOLEAN DEFAULT FALSE,
  dea_schedule VARCHAR(5),
  
  -- Common forms and strengths
  forms TEXT[], -- tablet, capsule, injection, etc.
  strengths TEXT[], -- 500mg, 1g, etc.
  
  -- Multi-facility support
  facility_id UUID,
  organization_id UUID,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_medications_name ON medications (LOWER(name));
CREATE INDEX idx_medications_rxnorm ON medications (rxnorm_code) WHERE rxnorm_code IS NOT NULL;
CREATE INDEX idx_medications_class ON medications (drug_class);

-- ================================================================
-- AUDIT LOG TABLE (for compliance)
-- ================================================================

CREATE TABLE IF NOT EXISTS cds_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User context
  user_id UUID,
  user_role VARCHAR(50),
  facility_id UUID,
  organization_id UUID,
  
  -- Action details
  action VARCHAR(100) NOT NULL, -- 'safety-check', 'alert-created', 'alert-acknowledged', etc.
  entity_type VARCHAR(50), -- 'medication-check', 'alert', etc.
  entity_id UUID,
  
  -- Request details
  patient_id UUID, -- Encrypted or hashed in production
  request_data JSONB,
  response_data JSONB,
  
  -- Outcome
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Network
  ip_address INET,
  user_agent TEXT,
  
  -- Timing
  duration_ms INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON cds_audit_log (user_id, timestamp DESC);
CREATE INDEX idx_audit_patient ON cds_audit_log (patient_id, timestamp DESC);
CREATE INDEX idx_audit_facility ON cds_audit_log (facility_id, timestamp DESC);
CREATE INDEX idx_audit_action ON cds_audit_log (action);
CREATE INDEX idx_audit_timestamp ON cds_audit_log (timestamp DESC);

-- ================================================================
-- SAMPLE DATA (for development/testing)
-- ================================================================

-- Sample Drug Interactions
INSERT INTO drug_interactions (drug1_name, drug2_name, severity, description, clinical_effects, mechanism, recommendation, evidence_level)
VALUES 
  ('Warfarin', 'Aspirin', 'major', 'Increased risk of bleeding', 'Enhanced anticoagulant effect', 'Additive platelet inhibition and anticoagulation', 'Monitor INR closely. Consider reducing aspirin dose or using alternative antiplatelet agent.', 'A'),
  ('Warfarin', 'Ibuprofen', 'major', 'Increased bleeding risk', 'Enhanced anticoagulant effect plus GI irritation', 'Platelet inhibition and anticoagulation', 'Avoid concomitant use. Use acetaminophen for pain relief.', 'A'),
  ('Metformin', 'Contrast Dye', 'critical', 'Risk of lactic acidosis', 'Acute kidney injury can lead to metformin accumulation', 'Renal impairment from contrast media', 'Hold metformin 48 hours before and after contrast administration. Check renal function.', 'A'),
  ('Simvastatin', 'Clarithromycin', 'major', 'Increased risk of myopathy/rhabdomyolysis', 'Elevated simvastatin levels', 'CYP3A4 inhibition by clarithromycin', 'Suspend simvastatin during clarithromycin therapy. Use alternative antibiotic if possible.', 'A'),
  ('Lisinopril', 'Spironolactone', 'moderate', 'Risk of hyperkalemia', 'Potassium retention', 'Both reduce potassium excretion', 'Monitor potassium levels closely. Avoid potassium supplements.', 'B')
ON CONFLICT (drug1_name, drug2_name) DO NOTHING;

-- Sample Allergies (common allergens)
INSERT INTO allergies (allergen, allergen_class, severity, reaction, cross_reactive_with)
VALUES 
  ('Penicillin', 'penicillin', 'severe', 'Anaphylaxis, rash, hives', ARRAY['cephalosporin', 'carbapenem']),
  ('Sulfa', 'sulfonamide', 'moderate', 'Rash, Stevens-Johnson syndrome', ARRAY['sulfonylurea', 'loop-diuretic']),
  ('Aspirin', 'nsaid', 'moderate', 'Bronchospasm, urticaria', ARRAY['nsaid'])
ON CONFLICT DO NOTHING;

-- Sample Therapeutic Ranges
INSERT INTO therapeutic_ranges (medication_name, rxnorm_code, route, min_dose, max_dose, unit, frequency, monitoring_required, warnings)
VALUES 
  ('Warfarin', '11289', 'oral', 1.0, 10.0, 'mg', 'daily', ARRAY['INR monitoring 2-3x weekly initially'], ARRAY['Bleeding risk', 'Many drug interactions']),
  ('Metformin', '6809', 'oral', 500.0, 2550.0, 'mg', 'daily', ARRAY['Renal function q6-12 months', 'Vitamin B12 annually'], ARRAY['Lactic acidosis risk', 'Hold before contrast procedures']),
  ('Lisinopril', '29046', 'oral', 2.5, 40.0, 'mg', 'daily', ARRAY['Blood pressure', 'Renal function', 'Potassium'], ARRAY['Angioedema risk', 'Cough common side effect']),
  ('Amoxicillin', '723', 'oral', 250.0, 1000.0, 'mg', 'TID', ARRAY['None required for short courses'], ARRAY['Penicillin allergy screening required'])
ON CONFLICT (medication_name, route) DO NOTHING;

-- Sample Contraindications
INSERT INTO contraindications (medication_name, condition, icd_code, type, severity, description, clinical_rationale, alternatives, evidence_level)
VALUES 
  ('Metformin', 'Chronic Kidney Disease Stage 4+', 'N18.4', 'absolute', 'critical', 'Metformin contraindicated in severe renal impairment', 'Risk of lactic acidosis due to drug accumulation', ARRAY['Insulin', 'Sulfonylureas'], 'A'),
  ('Beta-blockers', 'Severe Asthma', 'J45.50', 'absolute', 'severe', 'Beta-blockers can cause bronchospasm', 'Non-selective beta blockade can worsen asthma', ARRAY['Calcium channel blockers'], 'A'),
  ('NSAIDs', 'Active Peptic Ulcer', 'K25.9', 'absolute', 'severe', 'NSAIDs increase bleeding risk and impair ulcer healing', 'Direct gastric irritation and impaired platelet function', ARRAY['Acetaminophen'], 'A'),
  ('ACE Inhibitors', 'Pregnancy', 'O09.9', 'absolute', 'critical', 'ACE inhibitors are teratogenic', 'Fetal renal dysfunction and oligohydramnios', ARRAY['Methyldopa', 'Labetalol'], 'A'),
  ('Warfarin', 'Active Bleeding', 'R58', 'absolute', 'critical', 'Anticoagulants contraindicated in active hemorrhage', 'Will worsen bleeding', ARRAY['Address bleeding source first'], 'A')
ON CONFLICT (medication_name, icd_code) DO NOTHING;

-- Sample Clinical Guidelines
INSERT INTO clinical_guidelines (
  title, condition, icd_codes, summary, recommendations, 
  evidence_level, strength_of_recommendation, first_line_therapy, 
  source, publication_date, last_reviewed, category
)
VALUES 
  (
    'Hypertension Management - JNC 8',
    'Hypertension',
    ARRAY['I10'],
    'Blood pressure goal <140/90 for most adults, <130/80 for those with diabetes or CKD',
    ARRAY['Lifestyle modifications', 'Thiazide diuretics or ACE inhibitors for initial therapy', 'Combination therapy if BP >20/10 above goal'],
    'A',
    'strong',
    ARRAY['Hydrochlorothiazide', 'Lisinopril', 'Amlodipine'],
    'JNC 8',
    '2014-01-01',
    '2024-01-01',
    'cardiovascular'
  ),
  (
    'Type 2 Diabetes Management - ADA',
    'Type 2 Diabetes Mellitus',
    ARRAY['E11.9'],
    'Metformin first-line unless contraindicated. A1C goal <7% for most adults.',
    ARRAY['Metformin as initial therapy', 'Add second agent if A1C >7% after 3 months', 'SGLT2i or GLP-1 RA for patients with ASCVD'],
    'A',
    'strong',
    ARRAY['Metformin'],
    'ADA',
    '2024-01-01',
    '2024-01-01',
    'endocrine'
  )
ON CONFLICT DO NOTHING;

-- ================================================================
-- FUNCTIONS AND TRIGGERS
-- ================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_drug_interactions_updated_at BEFORE UPDATE ON drug_interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allergies_updated_at BEFORE UPDATE ON allergies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapeutic_ranges_updated_at BEFORE UPDATE ON therapeutic_ranges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_guidelines_updated_at BEFORE UPDATE ON clinical_guidelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contraindications_updated_at BEFORE UPDATE ON contraindications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- GRANTS (if using specific cds_user)
-- ================================================================

-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cds_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cds_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cds_user;

-- ================================================================
-- NOTES
-- ================================================================

-- To populate with real data:
-- 1. Import DrugBank database
-- 2. Import FDA drug interaction database
-- 3. Import RxNorm for medication codes
-- 4. Import clinical guidelines from NICE, CDC, AHA
-- 5. Set up regular updates for guideline currency

-- For production:
-- 1. Enable row-level security for multi-tenancy
-- 2. Encrypt patient_id fields
-- 3. Set up regular backups
-- 4. Configure audit log retention policies
-- 5. Add partitioning for large tables (alerts, audit_log)

COMMENT ON TABLE drug_interactions IS 'Drug-drug interaction database from authoritative sources';
COMMENT ON TABLE allergies IS 'Common allergens and cross-reactivity patterns';
COMMENT ON TABLE therapeutic_ranges IS 'Safe dosing ranges with age/weight/organ adjustments';
COMMENT ON TABLE clinical_guidelines IS 'Evidence-based clinical practice guidelines';
COMMENT ON TABLE contraindications IS 'Drug-disease contraindications';
COMMENT ON TABLE alerts IS 'Clinical decision support alerts and their lifecycle';
COMMENT ON TABLE medications IS 'Medication reference database with drug classifications';
COMMENT ON TABLE cds_audit_log IS 'Audit log for all CDS activities (HIPAA compliance)';

