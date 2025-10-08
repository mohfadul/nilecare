-- =====================================================
-- PHI Audit Logging Schema (PostgreSQL)
-- Purpose: HIPAA-compliant audit trail for PHI access
-- Sudan-specific: Tracks Sudan National ID access
-- =====================================================

-- Create dedicated schema for audit data
CREATE SCHEMA IF NOT EXISTS audit;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- PHI AUDIT LOG TABLE
-- =====================================================

CREATE TABLE audit.phi_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_name VARCHAR(200),
  user_role VARCHAR(50),
  patient_id UUID NOT NULL,
  patient_mrn VARCHAR(50),
  action VARCHAR(20) NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete', 'export', 'print')),
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address INET NOT NULL,
  user_agent TEXT,
  facility_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  session_id VARCHAR(100),
  request_id VARCHAR(100),
  access_reason TEXT,
  data_fields JSONB COMMENT 'Specific fields accessed (e.g., sudan_national_id, phone)',
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  duration INTEGER COMMENT 'Duration in milliseconds',
  -- Sudan-specific fields
  sudan_state VARCHAR(50) COMMENT 'Sudan state where access occurred',
  accessed_sudan_national_id BOOLEAN DEFAULT FALSE COMMENT 'Flag if Sudan National ID was accessed',
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_phi_audit_user ON audit.phi_audit_log(user_id);
CREATE INDEX idx_phi_audit_patient ON audit.phi_audit_log(patient_id);
CREATE INDEX idx_phi_audit_timestamp ON audit.phi_audit_log(timestamp DESC);
CREATE INDEX idx_phi_audit_facility ON audit.phi_audit_log(facility_id);
CREATE INDEX idx_phi_audit_tenant ON audit.phi_audit_log(tenant_id);
CREATE INDEX idx_phi_audit_action ON audit.phi_audit_log(action);
CREATE INDEX idx_phi_audit_resource ON audit.phi_audit_log(resource_type, resource_id);
CREATE INDEX idx_phi_audit_success ON audit.phi_audit_log(success) WHERE success = FALSE;
CREATE INDEX idx_phi_audit_national_id ON audit.phi_audit_log(accessed_sudan_national_id) WHERE accessed_sudan_national_id = TRUE;

-- GIN index for JSONB data_fields
CREATE INDEX idx_phi_audit_data_fields ON audit.phi_audit_log USING GIN (data_fields);

-- Composite indexes for common queries
CREATE INDEX idx_phi_audit_facility_time ON audit.phi_audit_log(facility_id, timestamp DESC);
CREATE INDEX idx_phi_audit_patient_time ON audit.phi_audit_log(patient_id, timestamp DESC);
CREATE INDEX idx_phi_audit_user_time ON audit.phi_audit_log(user_id, timestamp DESC);

-- =====================================================
-- COMPLIANCE VIOLATIONS TABLE
-- =====================================================

CREATE TABLE audit.compliance_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN (
    'unauthorized_access', 'data_breach', 'policy_violation', 'security_incident'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id UUID,
  patient_id UUID,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  remediation TEXT,
  resolved_at TIMESTAMP,
  resolved_by UUID,
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_violations_facility ON audit.compliance_violations(facility_id);
CREATE INDEX idx_violations_timestamp ON audit.compliance_violations(timestamp DESC);
CREATE INDEX idx_violations_severity ON audit.compliance_violations(severity);
CREATE INDEX idx_violations_status ON audit.compliance_violations(status);

-- =====================================================
-- COMPLIANCE REPORTS TABLE
-- =====================================================

CREATE TABLE audit.compliance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'hipaa', 'sudan_health', 'data_protection', 'security_audit', 'monthly', 'quarterly', 'annual'
  )),
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generated_by VARCHAR(100),
  compliance_score NUMERIC(5,2),
  overall_status VARCHAR(20) CHECK (overall_status IN ('compliant', 'non_compliant', 'needs_attention')),
  report_data JSONB NOT NULL,
  report_file_path VARCHAR(500),
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_facility ON audit.compliance_reports(facility_id);
CREATE INDEX idx_reports_generated ON audit.compliance_reports(generated_at DESC);
CREATE INDEX idx_reports_type ON audit.compliance_reports(report_type);
CREATE INDEX idx_reports_period ON audit.compliance_reports(report_period_start, report_period_end);

-- =====================================================
-- SECURITY EVENTS TABLE
-- =====================================================

CREATE TABLE audit.security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'brute_force', 'data_exfiltration', 'privilege_escalation', 
    'unusual_access', 'suspicious_activity', 'malware_detected'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID,
  facility_id UUID,
  tenant_id UUID,
  ip_address INET,
  description TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  investigated_by UUID,
  investigated_at TIMESTAMP,
  resolution TEXT,
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_events_type ON audit.security_events(event_type);
CREATE INDEX idx_security_events_severity ON audit.security_events(severity);
CREATE INDEX idx_security_events_timestamp ON audit.security_events(timestamp DESC);
CREATE INDEX idx_security_events_status ON audit.security_events(status);
CREATE INDEX idx_security_events_user ON audit.security_events(user_id);

-- =====================================================
-- DATA ACCESS CONSENT TABLE
-- =====================================================

CREATE TABLE audit.data_access_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
    'treatment', 'research', 'marketing', 'data_sharing', 'third_party_access'
  )),
  consent_status VARCHAR(20) NOT NULL CHECK (consent_status IN ('granted', 'denied', 'revoked')),
  granted_to_user_id UUID,
  granted_to_organization_id UUID,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  revocation_date DATE,
  consent_document_path VARCHAR(500),
  notes TEXT,
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consent_patient ON audit.data_access_consent(patient_id);
CREATE INDEX idx_consent_status ON audit.data_access_consent(consent_status);
CREATE INDEX idx_consent_effective ON audit.data_access_consent(effective_date);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- PHI Access Summary View
CREATE OR REPLACE VIEW audit.v_phi_access_summary AS
SELECT 
  DATE(timestamp) as access_date,
  facility_id,
  COUNT(*) as total_access,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT patient_id) as unique_patients,
  COUNT(*) FILTER (WHERE action = 'view') as view_count,
  COUNT(*) FILTER (WHERE action = 'create') as create_count,
  COUNT(*) FILTER (WHERE action = 'update') as update_count,
  COUNT(*) FILTER (WHERE action = 'delete') as delete_count,
  COUNT(*) FILTER (WHERE action = 'export') as export_count,
  COUNT(*) FILTER (WHERE success = false) as failed_access,
  COUNT(*) FILTER (WHERE accessed_sudan_national_id = true) as national_id_access
FROM audit.phi_audit_log
GROUP BY DATE(timestamp), facility_id;

-- Unauthorized Access Attempts View
CREATE OR REPLACE VIEW audit.v_unauthorized_access AS
SELECT 
  user_id,
  user_name,
  patient_id,
  action,
  resource_type,
  timestamp,
  ip_address,
  error_message,
  facility_id
FROM audit.phi_audit_log
WHERE success = FALSE
ORDER BY timestamp DESC;

-- After-Hours Access View
CREATE OR REPLACE VIEW audit.v_after_hours_access AS
SELECT 
  user_id,
  user_name,
  user_role,
  patient_id,
  action,
  resource_type,
  timestamp,
  EXTRACT(HOUR FROM timestamp) as access_hour,
  facility_id
FROM audit.phi_audit_log
WHERE EXTRACT(HOUR FROM timestamp) < 6 OR EXTRACT(HOUR FROM timestamp) > 22
ORDER BY timestamp DESC;

-- High-Risk Access View (Sudan National ID access)
CREATE OR REPLACE VIEW audit.v_high_risk_access AS
SELECT 
  user_id,
  user_name,
  user_role,
  patient_id,
  patient_mrn,
  action,
  timestamp,
  ip_address,
  access_reason,
  facility_id
FROM audit.phi_audit_log
WHERE accessed_sudan_national_id = TRUE
  OR data_fields ? 'sudan_national_id'
ORDER BY timestamp DESC;

-- Compliance Violations Summary View
CREATE OR REPLACE VIEW audit.v_violations_summary AS
SELECT 
  DATE(timestamp) as violation_date,
  facility_id,
  violation_type,
  severity,
  COUNT(*) as violation_count,
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count
FROM audit.compliance_violations
GROUP BY DATE(timestamp), facility_id, violation_type, severity;

-- =====================================================
-- FUNCTIONS FOR AUDIT ANALYSIS
-- =====================================================

-- Function to detect unusual access patterns
CREATE OR REPLACE FUNCTION audit.detect_unusual_access(
  p_user_id UUID,
  p_threshold INTEGER DEFAULT 50
)
RETURNS TABLE (
  access_count BIGINT,
  time_window VARCHAR(50),
  is_unusual BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as access_count,
    'Last 1 minute' as time_window,
    (COUNT(*) > p_threshold) as is_unusual
  FROM audit.phi_audit_log
  WHERE user_id = p_user_id
    AND timestamp > NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- Function to get compliance score for facility
CREATE OR REPLACE FUNCTION audit.get_facility_compliance_score(
  p_facility_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  base_score NUMERIC := 100;
  violation_deduction NUMERIC := 0;
  unauthorized_deduction NUMERIC := 0;
BEGIN
  -- Deduct for violations
  SELECT COALESCE(SUM(
    CASE severity
      WHEN 'critical' THEN 10
      WHEN 'high' THEN 5
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 1
      ELSE 0
    END
  ), 0) INTO violation_deduction
  FROM audit.compliance_violations
  WHERE facility_id = p_facility_id
    AND timestamp BETWEEN p_start_date AND p_end_date;
  
  -- Deduct for unauthorized access
  SELECT COALESCE(COUNT(*) * 0.5, 0) INTO unauthorized_deduction
  FROM audit.phi_audit_log
  WHERE facility_id = p_facility_id
    AND timestamp BETWEEN p_start_date AND p_end_date
    AND success = FALSE;
  
  -- Calculate final score
  RETURN GREATEST(0, LEAST(100, base_score - violation_deduction - unauthorized_deduction));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUDIT INTEGRITY
-- =====================================================

-- Prevent modification of audit logs (immutable)
CREATE OR REPLACE FUNCTION audit.prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_phi_audit_immutable
BEFORE UPDATE OR DELETE ON audit.phi_audit_log
FOR EACH ROW
EXECUTE FUNCTION audit.prevent_audit_modification();

-- Auto-update timestamp for compliance violations
CREATE OR REPLACE FUNCTION audit.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_violations_update_timestamp
BEFORE UPDATE ON audit.compliance_violations
FOR EACH ROW
EXECUTE FUNCTION audit.update_timestamp();

-- =====================================================
-- PARTITION PHI AUDIT LOG BY TIME
-- =====================================================

-- Convert to partitioned table
CREATE TABLE audit.phi_audit_log_partitioned (
  LIKE audit.phi_audit_log INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Create partitions for each month (example for 2024-2025)
CREATE TABLE audit.phi_audit_log_2024_01 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit.phi_audit_log_2024_02 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE audit.phi_audit_log_2024_03 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

CREATE TABLE audit.phi_audit_log_2024_04 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');

CREATE TABLE audit.phi_audit_log_2024_05 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');

CREATE TABLE audit.phi_audit_log_2024_06 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

CREATE TABLE audit.phi_audit_log_2024_07 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');

CREATE TABLE audit.phi_audit_log_2024_08 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

CREATE TABLE audit.phi_audit_log_2024_09 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');

CREATE TABLE audit.phi_audit_log_2024_10 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

CREATE TABLE audit.phi_audit_log_2024_11 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE audit.phi_audit_log_2024_12 PARTITION OF audit.phi_audit_log_partitioned
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Create default partition for future data
CREATE TABLE audit.phi_audit_log_default PARTITION OF audit.phi_audit_log_partitioned
  DEFAULT;

-- =====================================================
-- AUTOMATED PARTITION MANAGEMENT
-- =====================================================

-- Function to create next month's partition
CREATE OR REPLACE FUNCTION audit.create_next_month_partition()
RETURNS VOID AS $$
DECLARE
  next_month DATE;
  month_after DATE;
  partition_name TEXT;
BEGIN
  next_month := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
  month_after := next_month + INTERVAL '1 month';
  partition_name := 'phi_audit_log_' || TO_CHAR(next_month, 'YYYY_MM');
  
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS audit.%I PARTITION OF audit.phi_audit_log_partitioned
     FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    next_month,
    month_after
  );
  
  RAISE NOTICE 'Created partition: %', partition_name;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic partition creation (requires pg_cron extension)
-- SELECT cron.schedule('create-audit-partition', '0 0 1 * *', 'SELECT audit.create_next_month_partition()');

-- =====================================================
-- COMPLIANCE REPORTING FUNCTIONS
-- =====================================================

-- Generate monthly compliance summary
CREATE OR REPLACE FUNCTION audit.generate_monthly_compliance_summary(
  p_facility_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  metric VARCHAR(100),
  value BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'Total PHI Access'::VARCHAR(100), COUNT(*)
  FROM audit.phi_audit_log
  WHERE facility_id = p_facility_id
    AND EXTRACT(YEAR FROM timestamp) = p_year
    AND EXTRACT(MONTH FROM timestamp) = p_month
  
  UNION ALL
  
  SELECT 'Unique Users', COUNT(DISTINCT user_id)
  FROM audit.phi_audit_log
  WHERE facility_id = p_facility_id
    AND EXTRACT(YEAR FROM timestamp) = p_year
    AND EXTRACT(MONTH FROM timestamp) = p_month
  
  UNION ALL
  
  SELECT 'Unique Patients', COUNT(DISTINCT patient_id)
  FROM audit.phi_audit_log
  WHERE facility_id = p_facility_id
    AND EXTRACT(YEAR FROM timestamp) = p_year
    AND EXTRACT(MONTH FROM timestamp) = p_month
  
  UNION ALL
  
  SELECT 'Unauthorized Attempts', COUNT(*)
  FROM audit.phi_audit_log
  WHERE facility_id = p_facility_id
    AND EXTRACT(YEAR FROM timestamp) = p_year
    AND EXTRACT(MONTH FROM timestamp) = p_month
    AND success = FALSE
  
  UNION ALL
  
  SELECT 'Sudan National ID Access', COUNT(*)
  FROM audit.phi_audit_log
  WHERE facility_id = p_facility_id
    AND EXTRACT(YEAR FROM timestamp) = p_year
    AND EXTRACT(MONTH FROM timestamp) = p_month
    AND accessed_sudan_national_id = TRUE
  
  UNION ALL
  
  SELECT 'Data Exports', COUNT(*)
  FROM audit.phi_audit_log
  WHERE facility_id = p_facility_id
    AND EXTRACT(YEAR FROM timestamp) = p_year
    AND EXTRACT(MONTH FROM timestamp) = p_month
    AND action = 'export'
  
  UNION ALL
  
  SELECT 'After Hours Access', COUNT(*)
  FROM audit.phi_audit_log
  WHERE facility_id = p_facility_id
    AND EXTRACT(YEAR FROM timestamp) = p_year
    AND EXTRACT(MONTH FROM timestamp) = p_month
    AND (EXTRACT(HOUR FROM timestamp) < 6 OR EXTRACT(HOUR FROM timestamp) > 22);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATA RETENTION POLICY
-- =====================================================

-- Function to archive old audit logs
CREATE OR REPLACE FUNCTION audit.archive_old_audit_logs(
  p_retention_years INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
  cutoff_date DATE;
BEGIN
  cutoff_date := CURRENT_DATE - (p_retention_years || ' years')::INTERVAL;
  
  -- Export to archive table or file before deletion
  -- This is a placeholder - implement actual archival logic
  
  -- Delete old records
  DELETE FROM audit.phi_audit_log
  WHERE timestamp < cutoff_date;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Create audit user
CREATE USER IF NOT EXISTS nilecare_audit WITH PASSWORD 'nilecare_audit_password';
GRANT CONNECT ON DATABASE healthcare_analytics TO nilecare_audit;
GRANT USAGE ON SCHEMA audit TO nilecare_audit;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO nilecare_audit;
GRANT UPDATE ON audit.compliance_violations TO nilecare_audit;
GRANT UPDATE ON audit.security_events TO nilecare_audit;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA audit TO nilecare_audit;

-- Prevent deletion of audit logs
REVOKE DELETE ON audit.phi_audit_log FROM nilecare_audit;
REVOKE DELETE ON audit.phi_audit_log_partitioned FROM nilecare_audit;

-- Read-only access for compliance officers
CREATE USER IF NOT EXISTS nilecare_compliance WITH PASSWORD 'nilecare_compliance_password';
GRANT CONNECT ON DATABASE healthcare_analytics TO nilecare_compliance;
GRANT USAGE ON SCHEMA audit TO nilecare_compliance;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO nilecare_compliance;
GRANT EXECUTE ON FUNCTION audit.generate_monthly_compliance_summary TO nilecare_compliance;
GRANT EXECUTE ON FUNCTION audit.get_facility_compliance_score TO nilecare_compliance;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
-- Log PHI access
INSERT INTO audit.phi_audit_log (
  user_id, user_name, user_role, patient_id, patient_mrn,
  action, resource_type, resource_id, ip_address, facility_id, tenant_id,
  accessed_sudan_national_id
) VALUES (
  'user-uuid',
  'Dr. Ahmed Hassan',
  'physician',
  'patient-uuid',
  'MRN-12345',
  'view',
  'patient_demographics',
  'resource-uuid',
  '192.168.1.100',
  'khartoum-hospital-uuid',
  'sudan-ministry-uuid',
  TRUE
);

-- Get compliance score
SELECT audit.get_facility_compliance_score(
  'facility-uuid',
  '2024-01-01',
  '2024-12-31'
);

-- Generate monthly summary
SELECT * FROM audit.generate_monthly_compliance_summary(
  'facility-uuid',
  2024,
  10
);

-- View unauthorized access attempts
SELECT * FROM audit.v_unauthorized_access
WHERE facility_id = 'facility-uuid'
  AND timestamp > CURRENT_DATE - INTERVAL '7 days';

-- View Sudan National ID access
SELECT * FROM audit.v_high_risk_access
WHERE facility_id = 'facility-uuid'
  AND timestamp > CURRENT_DATE - INTERVAL '30 days';
*/
