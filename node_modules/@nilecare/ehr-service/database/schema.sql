-- ================================================================
-- Electronic Health Record Service - Database Schema
-- ================================================================
-- 
-- PostgreSQL schema for EHR Service
-- Stores SOAP notes, problem lists, progress notes, and clinical documents
-- 
-- Reference: OpenEMR database structure
-- @see https://github.com/mohfadul/openemr-nilecare
-- 
-- ================================================================

-- Create database (run separately as superuser)
-- CREATE DATABASE ehr_service;
-- CREATE USER ehr_user WITH ENCRYPTED PASSWORD 'secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE ehr_service TO ehr_user;

-- Connect to database
-- \c ehr_service

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- SOAP NOTES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS soap_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Patient/Encounter context
  patient_id UUID NOT NULL,
  encounter_id UUID NOT NULL,
  facility_id UUID,
  organization_id UUID NOT NULL,
  
  -- SOAP sections
  subjective TEXT NOT NULL,
  objective TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  
  -- Additional clinical data
  chief_complaint VARCHAR(500),
  vital_signs JSONB,
  diagnoses JSONB, -- Array of diagnosis objects
  medications JSONB, -- Array of medication objects
  orders JSONB, -- Array of order objects
  follow_up JSONB, -- Follow-up instructions
  
  -- Document lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'amended', 'addended')),
  finalized_at TIMESTAMP,
  finalized_by UUID,
  attestation TEXT,
  signature VARCHAR(500),
  
  -- Amendment tracking
  is_amendment BOOLEAN DEFAULT FALSE,
  original_note_id UUID,
  amendment_reason TEXT,
  amendment_date TIMESTAMP,
  amendment_number INTEGER,
  
  -- Addenda
  addenda JSONB, -- Array of addendum objects
  
  -- Version control
  version INTEGER DEFAULT 1,
  previous_version_id UUID,
  
  -- Template
  template_id UUID,
  template_name VARCHAR(200),
  
  -- Audit trail
  created_by UUID NOT NULL,
  updated_by UUID,
  viewed_by UUID[], -- Array of user IDs who viewed (HIPAA audit)
  
  -- Categorization
  tags TEXT[],
  specialty VARCHAR(100),
  
  -- Timestamps
  document_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMP,
  deleted_by UUID,
  deletion_reason TEXT,
  
  -- Locking for concurrent editing
  locked_by UUID,
  locked_at TIMESTAMP,
  
  -- Foreign key constraints
  CONSTRAINT fk_original_note FOREIGN KEY (original_note_id) REFERENCES soap_notes(id)
);

-- Indexes for performance
CREATE INDEX idx_soap_notes_patient ON soap_notes (patient_id, document_date DESC);
CREATE INDEX idx_soap_notes_encounter ON soap_notes (encounter_id);
CREATE INDEX idx_soap_notes_facility ON soap_notes (facility_id) WHERE facility_id IS NOT NULL;
CREATE INDEX idx_soap_notes_organization ON soap_notes (organization_id);
CREATE INDEX idx_soap_notes_status ON soap_notes (status);
CREATE INDEX idx_soap_notes_created_by ON soap_notes (created_by);
CREATE INDEX idx_soap_notes_document_date ON soap_notes (document_date DESC);
CREATE INDEX idx_soap_notes_tags ON soap_notes USING GIN (tags);
CREATE INDEX idx_soap_notes_active ON soap_notes (patient_id, status) WHERE deleted_at IS NULL;

-- ================================================================
-- SOAP NOTE VERSIONS TABLE (Audit trail)
-- ================================================================

CREATE TABLE IF NOT EXISTS soap_note_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES soap_notes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL, -- Full note content at this version
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  change_reason TEXT,
  
  UNIQUE (note_id, version)
);

CREATE INDEX idx_soap_versions_note ON soap_note_versions (note_id, version DESC);

-- ================================================================
-- PROBLEM LIST TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS problem_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Patient context
  patient_id UUID NOT NULL,
  facility_id UUID,
  organization_id UUID NOT NULL,
  
  -- Problem identification
  problem_name VARCHAR(200) NOT NULL,
  icd_code VARCHAR(20) NOT NULL,
  snomed_code VARCHAR(50),
  
  -- Clinical details
  onset DATE,
  end_date DATE,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'chronic', 'intermittent', 'recurrent', 'inactive', 'resolved')),
  
  -- Context
  diagnosed_by UUID,
  diagnosed_date DATE,
  resolved_date DATE,
  resolved_by UUID,
  resolved_reason TEXT,
  
  -- Clinical notes
  notes TEXT,
  clinical_significance VARCHAR(20) CHECK (clinical_significance IN ('major', 'moderate', 'minor')),
  
  -- Categorization
  category VARCHAR(20) NOT NULL CHECK (category IN ('diagnosis', 'symptom', 'finding', 'complaint')),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Relationships
  related_problems UUID[], -- Array of related problem IDs
  related_encounters UUID[], -- Array of encounter IDs
  
  -- Treatment tracking
  current_treatments JSONB,
  
  -- Outcomes
  outcome VARCHAR(20) CHECK (outcome IN ('improved', 'stable', 'worsened', 'resolved', 'deceased')),
  outcome_notes TEXT,
  
  -- Version control
  version INTEGER DEFAULT 1,
  previous_version_id UUID,
  
  -- Audit trail
  created_by UUID NOT NULL,
  updated_by UUID,
  
  -- Metadata
  tags TEXT[],
  is_chronic_condition BOOLEAN DEFAULT FALSE,
  requires_monitoring BOOLEAN DEFAULT FALSE,
  monitoring_interval VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMP,
  deleted_by UUID,
  deletion_reason TEXT
);

-- Indexes for performance
CREATE INDEX idx_problem_list_patient ON problem_list (patient_id, status);
CREATE INDEX idx_problem_list_facility ON problem_list (facility_id) WHERE facility_id IS NOT NULL;
CREATE INDEX idx_problem_list_organization ON problem_list (organization_id);
CREATE INDEX idx_problem_list_icd ON problem_list (icd_code);
CREATE INDEX idx_problem_list_status ON problem_list (status);
CREATE INDEX idx_problem_list_active ON problem_list (patient_id) WHERE status IN ('active', 'chronic', 'intermittent', 'recurrent') AND deleted_at IS NULL;
CREATE INDEX idx_problem_list_chronic ON problem_list (patient_id) WHERE is_chronic_condition = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_problem_list_tags ON problem_list USING GIN (tags);

-- ================================================================
-- PROGRESS NOTES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS progress_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Patient/Encounter context
  patient_id UUID NOT NULL,
  encounter_id UUID,
  facility_id UUID,
  organization_id UUID NOT NULL,
  
  -- Note details
  note_type VARCHAR(50) NOT NULL CHECK (note_type IN ('daily', 'shift', 'discharge', 'procedure', 'consultation', 'transfer', 'phone', 'other')),
  note_date TIMESTAMP NOT NULL,
  content TEXT NOT NULL,
  
  -- Clinical context
  vital_signs JSONB,
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('improving', 'stable', 'declining', 'critical')),
  consciousness VARCHAR(20) CHECK (consciousness IN ('alert', 'drowsy', 'confused', 'unresponsive')),
  
  -- Medications and interventions
  medications JSONB, -- Medications administered
  interventions JSONB, -- Interventions performed
  
  -- Assessment
  observations TEXT[],
  concerns TEXT[],
  
  -- Follow-up
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_instructions TEXT,
  
  -- Document lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'amended')),
  finalized_at TIMESTAMP,
  finalized_by UUID,
  
  -- Amendment tracking
  is_amendment BOOLEAN DEFAULT FALSE,
  original_note_id UUID REFERENCES progress_notes(id),
  amendment_reason TEXT,
  amendment_date TIMESTAMP,
  
  -- Shift-specific fields
  shift_start TIMESTAMP,
  shift_end TIMESTAMP,
  shift_type VARCHAR(20) CHECK (shift_type IN ('day', 'evening', 'night')),
  handoff JSONB,
  
  -- Procedure-specific fields
  procedure_details JSONB,
  
  -- Discharge-specific fields
  discharge_details JSONB,
  
  -- Consultation-specific fields
  consultation_details JSONB,
  
  -- Version control
  version INTEGER DEFAULT 1,
  previous_version_id UUID,
  
  -- Audit trail
  created_by UUID NOT NULL,
  updated_by UUID,
  viewed_by UUID[],
  
  -- Categorization
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Locking
  locked_by UUID,
  locked_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_progress_notes_patient ON progress_notes (patient_id, note_date DESC);
CREATE INDEX idx_progress_notes_encounter ON progress_notes (encounter_id) WHERE encounter_id IS NOT NULL;
CREATE INDEX idx_progress_notes_facility ON progress_notes (facility_id) WHERE facility_id IS NOT NULL;
CREATE INDEX idx_progress_notes_organization ON progress_notes (organization_id);
CREATE INDEX idx_progress_notes_type ON progress_notes (note_type);
CREATE INDEX idx_progress_notes_condition ON progress_notes (condition);
CREATE INDEX idx_progress_notes_status ON progress_notes (status);
CREATE INDEX idx_progress_notes_date ON progress_notes (note_date DESC);
CREATE INDEX idx_progress_notes_critical ON progress_notes (patient_id, condition) WHERE condition IN ('critical', 'declining');
CREATE INDEX idx_progress_notes_tags ON progress_notes USING GIN (tags);

-- ================================================================
-- CLINICAL DOCUMENTS TABLE (General purpose)
-- ================================================================

CREATE TABLE IF NOT EXISTS clinical_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Patient context
  patient_id UUID NOT NULL,
  encounter_id UUID,
  facility_id UUID,
  organization_id UUID NOT NULL,
  
  -- Document details
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('consultation', 'referral', 'operative-note', 'discharge-summary', 'history-physical', 'other')),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  structured_data JSONB, -- Additional structured content
  
  -- Document lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'amended', 'archived')),
  finalized_at TIMESTAMP,
  finalized_by UUID,
  
  -- Amendment tracking
  is_amendment BOOLEAN DEFAULT FALSE,
  original_document_id UUID REFERENCES clinical_documents(id),
  amendment_reason TEXT,
  
  -- Version control
  version INTEGER DEFAULT 1,
  previous_version_id UUID,
  
  -- Attachments
  attachments JSONB, -- Array of attachment metadata
  
  -- Audit trail
  created_by UUID NOT NULL,
  updated_by UUID,
  viewed_by UUID[],
  
  -- Metadata
  tags TEXT[],
  category VARCHAR(100),
  
  -- Timestamps
  document_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clinical_documents_patient ON clinical_documents (patient_id, document_date DESC);
CREATE INDEX idx_clinical_documents_encounter ON clinical_documents (encounter_id) WHERE encounter_id IS NOT NULL;
CREATE INDEX idx_clinical_documents_facility ON clinical_documents (facility_id) WHERE facility_id IS NOT NULL;
CREATE INDEX idx_clinical_documents_organization ON clinical_documents (organization_id);
CREATE INDEX idx_clinical_documents_type ON clinical_documents (document_type);
CREATE INDEX idx_clinical_documents_status ON clinical_documents (status);
CREATE INDEX idx_clinical_documents_tags ON clinical_documents USING GIN (tags);

-- ================================================================
-- AUDIT LOG TABLE (HIPAA compliance)
-- ================================================================

CREATE TABLE IF NOT EXISTS ehr_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User context
  user_id UUID,
  user_role VARCHAR(50),
  facility_id UUID,
  organization_id UUID,
  
  -- Action details
  action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'viewed', 'finalized', 'amended', 'exported'
  entity_type VARCHAR(50) NOT NULL, -- 'soap-note', 'problem-list', 'progress-note'
  entity_id UUID,
  
  -- Patient context (encrypted in production)
  patient_id UUID,
  
  -- Request details
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

-- Indexes for audit queries
CREATE INDEX idx_ehr_audit_user ON ehr_audit_log (user_id, timestamp DESC);
CREATE INDEX idx_ehr_audit_patient ON ehr_audit_log (patient_id, timestamp DESC);
CREATE INDEX idx_ehr_audit_facility ON ehr_audit_log (facility_id, timestamp DESC);
CREATE INDEX idx_ehr_audit_action ON ehr_audit_log (action);
CREATE INDEX idx_ehr_audit_entity ON ehr_audit_log (entity_type, entity_id);
CREATE INDEX idx_ehr_audit_timestamp ON ehr_audit_log (timestamp DESC);

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
CREATE TRIGGER update_soap_notes_updated_at BEFORE UPDATE ON soap_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_list_updated_at BEFORE UPDATE ON problem_list
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_notes_updated_at BEFORE UPDATE ON progress_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_documents_updated_at BEFORE UPDATE ON clinical_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SAMPLE DATA (for development/testing)
-- ================================================================

-- Sample patient UUID (this should match a patient in the Clinical Service)
-- In production, these UUIDs would come from actual patient records

-- Sample SOAP Notes
INSERT INTO soap_notes (
  patient_id, encounter_id, organization_id,
  subjective, objective, assessment, plan,
  chief_complaint, status, created_by, document_date
)
VALUES (
  uuid_generate_v4(), -- patient_id (replace with actual)
  uuid_generate_v4(), -- encounter_id (replace with actual)
  uuid_generate_v4(), -- organization_id (replace with actual)
  'Patient reports persistent headache for 3 days. Describes pain as throbbing, rated 7/10. Worse in morning, improves with rest. No visual changes, no fever.',
  'Vital Signs: BP 130/85, HR 78, Temp 98.6°F, RR 16, O2 Sat 98%\nPhysical Exam: Alert and oriented x3. HEENT: Normocephalic, PERRLA. No neck stiffness. Neurological exam grossly intact.',
  'Likely tension headache. Rule out migraine. No signs of serious pathology.',
  'Start ibuprofen 400mg TID PRN. Consider migraine prophylaxis if symptoms persist. Follow-up in 1 week or sooner if symptoms worsen. Return precautions discussed.',
  'Headache x 3 days',
  'draft',
  uuid_generate_v4(), -- created_by (doctor UUID)
  NOW()
) ON CONFLICT DO NOTHING;

-- Sample Problem List Items
INSERT INTO problem_list (
  patient_id, organization_id,
  problem_name, icd_code, severity, status, category, priority,
  onset, diagnosed_date, is_chronic_condition, requires_monitoring, monitoring_interval,
  created_by
)
VALUES 
  (
    uuid_generate_v4(), -- patient_id
    uuid_generate_v4(), -- organization_id
    'Essential Hypertension',
    'I10',
    'moderate',
    'chronic',
    'diagnosis',
    'high',
    '2020-01-15'::DATE,
    '2020-01-15'::DATE,
    TRUE,
    TRUE,
    '3 months',
    uuid_generate_v4() -- created_by
  ),
  (
    uuid_generate_v4(), -- patient_id
    uuid_generate_v4(), -- organization_id
    'Type 2 Diabetes Mellitus',
    'E11.9',
    'moderate',
    'chronic',
    'diagnosis',
    'high',
    '2019-06-10'::DATE,
    '2019-06-10'::DATE,
    TRUE,
    TRUE,
    '3 months',
    uuid_generate_v4() -- created_by
  )
ON CONFLICT DO NOTHING;

-- ================================================================
-- GRANTS (if using specific ehr_user)
-- ================================================================

-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ehr_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ehr_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ehr_user;

-- ================================================================
-- NOTES
-- ================================================================

-- For production:
-- 1. Enable row-level security for multi-tenancy
-- 2. Encrypt patient_id fields or use hash references
-- 3. Set up regular backups
-- 4. Configure audit log retention policies (7 years for HIPAA)
-- 5. Add partitioning for large tables (soap_notes, audit_log)
-- 6. Implement document archival strategy
-- 7. Set up automated anonymization for research datasets

COMMENT ON TABLE soap_notes IS 'SOAP format clinical notes with full lifecycle management';
COMMENT ON TABLE soap_note_versions IS 'Version history for SOAP notes (audit trail)';
COMMENT ON TABLE problem_list IS 'Patient problem list (active diagnoses and conditions)';
COMMENT ON TABLE progress_notes IS 'Progress notes (daily, shift, discharge, procedure, etc.)';
COMMENT ON TABLE clinical_documents IS 'General clinical documentation';
COMMENT ON TABLE ehr_audit_log IS 'Audit log for all EHR activities (HIPAA compliance)';

