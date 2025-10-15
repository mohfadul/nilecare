-- ============================================================================
-- NileCare FHIR Service - Database Schema
-- PostgreSQL 15+
-- Version: 1.0.0
-- FHIR R4 Compliant Storage
-- ============================================================================

DROP TABLE IF EXISTS bulk_export_requests CASCADE;
DROP TABLE IF EXISTS smart_access_tokens CASCADE;
DROP TABLE IF EXISTS smart_authorization_codes CASCADE;
DROP TABLE IF EXISTS smart_clients CASCADE;
DROP TABLE IF EXISTS fhir_resource_history CASCADE;
DROP TABLE IF EXISTS fhir_resources CASCADE;

-- ============================================================================
-- FHIR RESOURCES TABLE
-- Stores all FHIR R4 resources as JSON
-- ============================================================================

CREATE TABLE fhir_resources (
    id SERIAL PRIMARY KEY,
    resource_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    resource_type VARCHAR(100) NOT NULL,
    resource_data JSONB NOT NULL,
    version VARCHAR(20) DEFAULT '1',
    facility_id UUID NOT NULL,
    tenant_id UUID,
    deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fhir_resource_id ON fhir_resources(resource_id);
CREATE INDEX idx_fhir_resource_type ON fhir_resources(resource_type);
CREATE INDEX idx_fhir_facility ON fhir_resources(facility_id);
CREATE INDEX idx_fhir_tenant ON fhir_resources(tenant_id);
CREATE INDEX idx_fhir_deleted ON fhir_resources(deleted) WHERE deleted = false;
CREATE INDEX idx_fhir_created ON fhir_resources(created_at);
CREATE INDEX idx_fhir_resource_data ON fhir_resources USING gin(resource_data);

-- Patient-specific indexes
CREATE INDEX idx_fhir_patient_identifier ON fhir_resources USING gin((resource_data->'identifier'));
CREATE INDEX idx_fhir_patient_name ON fhir_resources USING gin((resource_data->'name'));

-- ============================================================================
-- FHIR RESOURCE HISTORY TABLE
-- Version history for resources
-- ============================================================================

CREATE TABLE fhir_resource_history (
    id SERIAL PRIMARY KEY,
    resource_id UUID NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    resource_data JSONB NOT NULL,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(resource_id, version)
);

CREATE INDEX idx_fhir_history_resource ON fhir_resource_history(resource_id);
CREATE INDEX idx_fhir_history_version ON fhir_resource_history(resource_id, version DESC);

-- ============================================================================
-- SMART ON FHIR TABLES
-- OAuth2 for SMART on FHIR
-- ============================================================================

CREATE TABLE smart_clients (
    id SERIAL PRIMARY KEY,
    client_id UUID UNIQUE NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    redirect_uris JSONB NOT NULL,
    scope TEXT,
    grant_types JSONB DEFAULT '["authorization_code"]',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE smart_authorization_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES smart_clients(client_id),
    user_id UUID NOT NULL,
    patient_id UUID,
    scope TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_smart_auth_code ON smart_authorization_codes(code);
CREATE INDEX idx_smart_auth_expires ON smart_authorization_codes(expires_at);

CREATE TABLE smart_access_tokens (
    id SERIAL PRIMARY KEY,
    access_token VARCHAR(255) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES smart_clients(client_id),
    user_id UUID NOT NULL,
    patient_id UUID,
    scope TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_smart_token ON smart_access_tokens(access_token);
CREATE INDEX idx_smart_token_expires ON smart_access_tokens(expires_at);

-- ============================================================================
-- BULK DATA EXPORT TABLES
-- For FHIR Bulk Data Access API ($export)
-- ============================================================================

CREATE TABLE bulk_export_requests (
    id SERIAL PRIMARY KEY,
    request_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('system', 'patient', 'group')),
    resource_types JSONB NOT NULL,
    since_date TIMESTAMP,
    patient_id UUID,
    group_id UUID,
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
    progress INTEGER DEFAULT 0,
    output JSONB,
    error_message TEXT,
    facility_id UUID NOT NULL,
    created_by UUID NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bulk_export_request ON bulk_export_requests(request_id);
CREATE INDEX idx_bulk_export_status ON bulk_export_requests(status);
CREATE INDEX idx_bulk_export_created ON bulk_export_requests(created_by);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fhir_resources_updated_at BEFORE UPDATE ON fhir_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bulk_export_updated_at BEFORE UPDATE ON bulk_export_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample FHIR patient
INSERT INTO fhir_resources (
    resource_id,
    resource_type,
    resource_data,
    facility_id,
    created_by
) VALUES (
    '550e8400-e29b-41d4-a716-446655440100',
    'Patient',
    '{"resourceType": "Patient", "id": "550e8400-e29b-41d4-a716-446655440100", "name": [{"family": "Ahmed", "given": ["Mohammed"]}], "gender": "male", "birthDate": "1985-03-15"}',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440002'
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE fhir_resources IS 'FHIR R4 resources stored as JSONB';
COMMENT ON TABLE fhir_resource_history IS 'Version history for FHIR resources';
COMMENT ON TABLE smart_clients IS 'SMART on FHIR OAuth2 clients';
COMMENT ON TABLE bulk_export_requests IS 'FHIR Bulk Data Access API export requests';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

