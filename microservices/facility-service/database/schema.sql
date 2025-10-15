-- ============================================================================
-- NileCare Facility Service - Database Schema
-- PostgreSQL 15+
-- Version: 1.0.0
-- Date: October 14, 2025
-- ============================================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS facility_audit_log CASCADE;
DROP TABLE IF EXISTS bed_history CASCADE;
DROP TABLE IF EXISTS beds CASCADE;
DROP TABLE IF EXISTS wards CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS facility_settings CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;

-- ============================================================================
-- FACILITIES TABLE
-- ============================================================================

CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    facility_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    facility_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('hospital', 'clinic', 'lab', 'pharmacy', 'rehabilitation', 'diagnostic_center', 'urgent_care', 'specialty_clinic')),
    address JSONB NOT NULL,
    contact JSONB NOT NULL,
    capacity JSONB DEFAULT '{}',
    licensing JSONB DEFAULT '{}',
    operating_hours JSONB DEFAULT '{}',
    services JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'closed')),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for facilities
CREATE INDEX idx_facilities_organization ON facilities(organization_id);
CREATE INDEX idx_facilities_type ON facilities(type);
CREATE INDEX idx_facilities_status ON facilities(status);
CREATE INDEX idx_facilities_code ON facilities(facility_code);
CREATE INDEX idx_facilities_name ON facilities USING gin(to_tsvector('english', name));
CREATE INDEX idx_facilities_city ON facilities USING gin((address->>'city'));
CREATE INDEX idx_facilities_state ON facilities USING gin((address->>'state'));

-- ============================================================================
-- DEPARTMENTS TABLE
-- ============================================================================

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(facility_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    head_of_department UUID,
    specialization VARCHAR(255) NOT NULL,
    floor INTEGER,
    building VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    operating_hours JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    staff_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, code)
);

-- Indexes for departments
CREATE INDEX idx_departments_facility ON departments(facility_id);
CREATE INDEX idx_departments_specialization ON departments(specialization);
CREATE INDEX idx_departments_head ON departments(head_of_department);
CREATE INDEX idx_departments_name ON departments USING gin(to_tsvector('english', name));

-- ============================================================================
-- WARDS TABLE
-- ============================================================================

CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    ward_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(facility_id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    ward_code VARCHAR(50) NOT NULL,
    ward_type VARCHAR(50) NOT NULL CHECK (ward_type IN ('general', 'icu', 'emergency', 'maternity', 'pediatric', 'surgical', 'medical', 'psychiatric', 'isolation')),
    floor INTEGER,
    total_beds INTEGER NOT NULL DEFAULT 0,
    occupied_beds INTEGER DEFAULT 0,
    available_beds INTEGER DEFAULT 0,
    nurse_station_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'full', 'maintenance', 'closed')),
    is_active BOOLEAN DEFAULT true,
    specialty_type VARCHAR(100),
    gender_restriction VARCHAR(10) CHECK (gender_restriction IN ('male', 'female', 'mixed')),
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, ward_code)
);

-- Indexes for wards
CREATE INDEX idx_wards_facility ON wards(facility_id);
CREATE INDEX idx_wards_department ON wards(department_id);
CREATE INDEX idx_wards_type ON wards(ward_type);
CREATE INDEX idx_wards_status ON wards(status);
CREATE INDEX idx_wards_available_beds ON wards(available_beds) WHERE available_beds > 0;

-- ============================================================================
-- BEDS TABLE
-- ============================================================================

CREATE TABLE beds (
    id SERIAL PRIMARY KEY,
    bed_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(facility_id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
    ward_id UUID NOT NULL REFERENCES wards(ward_id) ON DELETE CASCADE,
    bed_number VARCHAR(50) NOT NULL,
    bed_type VARCHAR(50) NOT NULL CHECK (bed_type IN ('standard', 'icu', 'pediatric', 'maternity', 'isolation', 'observation', 'recovery')),
    bed_status VARCHAR(50) DEFAULT 'available' CHECK (bed_status IN ('available', 'occupied', 'reserved', 'maintenance', 'cleaning', 'out_of_service')),
    patient_id UUID,
    assignment_date TIMESTAMP,
    expected_discharge_date TIMESTAMP,
    location VARCHAR(100),
    has_oxygen BOOLEAN DEFAULT false,
    has_monitor BOOLEAN DEFAULT false,
    has_ventilator BOOLEAN DEFAULT false,
    isolation_capable BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    last_maintenance_date TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(ward_id, bed_number)
);

-- Indexes for beds
CREATE INDEX idx_beds_facility ON beds(facility_id);
CREATE INDEX idx_beds_department ON beds(department_id);
CREATE INDEX idx_beds_ward ON beds(ward_id);
CREATE INDEX idx_beds_status ON beds(bed_status);
CREATE INDEX idx_beds_patient ON beds(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_beds_available ON beds(facility_id, bed_status) WHERE bed_status = 'available';
CREATE INDEX idx_beds_type ON beds(bed_type);

-- ============================================================================
-- FACILITY SETTINGS TABLE
-- ============================================================================

CREATE TABLE facility_settings (
    id SERIAL PRIMARY KEY,
    settings_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    facility_id UUID UNIQUE NOT NULL REFERENCES facilities(facility_id) ON DELETE CASCADE,
    timezone VARCHAR(100) DEFAULT 'Africa/Khartoum',
    date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(10) DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'SDG',
    default_appointment_duration INTEGER DEFAULT 30,
    allow_walk_ins BOOLEAN DEFAULT true,
    max_advance_booking_days INTEGER DEFAULT 90,
    cancellation_notice_period INTEGER DEFAULT 24,
    email_notifications_enabled BOOLEAN DEFAULT true,
    sms_notifications_enabled BOOLEAN DEFAULT true,
    appointment_reminder_hours JSONB DEFAULT '[24, 2]',
    automatic_bed_release BOOLEAN DEFAULT false,
    bed_cleaning_duration INTEGER DEFAULT 30,
    require_insurance BOOLEAN DEFAULT false,
    require_referral BOOLEAN DEFAULT false,
    allow_online_booking BOOLEAN DEFAULT true,
    custom_settings JSONB DEFAULT '{}',
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- BED HISTORY TABLE
-- ============================================================================

CREATE TABLE bed_history (
    id SERIAL PRIMARY KEY,
    bed_id UUID NOT NULL REFERENCES beds(bed_id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    assignment_date TIMESTAMP NOT NULL DEFAULT NOW(),
    discharge_date TIMESTAMP,
    duration INTEGER, -- In hours
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for bed history
CREATE INDEX idx_bed_history_bed ON bed_history(bed_id);
CREATE INDEX idx_bed_history_patient ON bed_history(patient_id);
CREATE INDEX idx_bed_history_dates ON bed_history(assignment_date, discharge_date);

-- ============================================================================
-- FACILITY AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE facility_audit_log (
    id SERIAL PRIMARY KEY,
    audit_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    facility_id UUID,
    department_id UUID,
    ward_id UUID,
    bed_id UUID,
    user_id UUID NOT NULL,
    user_role VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX idx_audit_facility ON facility_audit_log(facility_id);
CREATE INDEX idx_audit_user ON facility_audit_log(user_id);
CREATE INDEX idx_audit_action ON facility_audit_log(action);
CREATE INDEX idx_audit_resource ON facility_audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_created ON facility_audit_log(created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wards_updated_at BEFORE UPDATE ON wards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON beds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON facility_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Facility summary with counts
CREATE OR REPLACE VIEW v_facility_summary AS
SELECT 
    f.facility_id,
    f.name,
    f.type,
    f.status,
    f.address->>'city' as city,
    f.address->>'state' as state,
    COUNT(DISTINCT d.department_id) as department_count,
    COUNT(DISTINCT w.ward_id) as ward_count,
    COUNT(b.bed_id) as total_beds,
    COUNT(CASE WHEN b.bed_status = 'available' THEN 1 END) as available_beds,
    COUNT(CASE WHEN b.bed_status = 'occupied' THEN 1 END) as occupied_beds,
    CASE 
        WHEN COUNT(b.bed_id) > 0 
        THEN ROUND((COUNT(CASE WHEN b.bed_status = 'occupied' THEN 1 END)::numeric / COUNT(b.bed_id)::numeric) * 100, 2)
        ELSE 0 
    END as occupancy_rate,
    f.created_at,
    f.updated_at
FROM facilities f
LEFT JOIN departments d ON f.facility_id = d.facility_id AND d.is_active = true
LEFT JOIN wards w ON d.department_id = w.department_id AND w.is_active = true
LEFT JOIN beds b ON w.ward_id = b.ward_id AND b.is_active = true
WHERE f.is_active = true
GROUP BY f.facility_id, f.name, f.type, f.status, city, state, f.created_at, f.updated_at;

-- View: Ward occupancy details
CREATE OR REPLACE VIEW v_ward_occupancy AS
SELECT 
    w.ward_id,
    w.name as ward_name,
    w.ward_code,
    w.ward_type,
    w.facility_id,
    d.name as department_name,
    w.total_beds,
    w.occupied_beds,
    w.available_beds,
    CASE 
        WHEN w.total_beds > 0 
        THEN ROUND((w.occupied_beds::numeric / w.total_beds::numeric) * 100, 2)
        ELSE 0 
    END as occupancy_rate,
    w.status,
    w.updated_at as last_updated
FROM wards w
JOIN departments d ON w.department_id = d.department_id
WHERE w.is_active = true;

-- View: Available beds details
CREATE OR REPLACE VIEW v_available_beds AS
SELECT 
    b.bed_id,
    b.bed_number,
    b.bed_type,
    w.ward_id,
    w.name as ward_name,
    d.department_id,
    d.name as department_name,
    f.facility_id,
    f.name as facility_name,
    b.has_oxygen,
    b.has_monitor,
    b.has_ventilator,
    b.isolation_capable,
    b.location,
    b.created_at
FROM beds b
JOIN wards w ON b.ward_id = w.ward_id
JOIN departments d ON w.department_id = d.department_id
JOIN facilities f ON d.facility_id = f.facility_id
WHERE b.bed_status = 'available' AND b.is_active = true
AND w.is_active = true AND d.is_active = true AND f.is_active = true;

-- ============================================================================
-- SAMPLE DATA (For Testing)
-- ============================================================================

-- Insert sample facility
INSERT INTO facilities (
    facility_id,
    organization_id,
    facility_code,
    name,
    type,
    address,
    contact,
    capacity,
    services,
    created_by
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    'KTH-001',
    'Khartoum Teaching Hospital',
    'hospital',
    '{"street": "University Avenue", "city": "Khartoum", "state": "Khartoum", "zipCode": "11111", "country": "Sudan"}',
    '{"phone": "+249123456789", "email": "info@kth.sd", "website": "https://kth.sd"}',
    '{"totalBeds": 200, "icuBeds": 20, "emergencyBeds": 30, "operatingRooms": 8}',
    '["Emergency", "Surgery", "Internal Medicine", "Pediatrics", "Cardiology", "Radiology", "Laboratory"]',
    '550e8400-e29b-41d4-a716-446655440002'
);

-- Insert sample department
INSERT INTO departments (
    department_id,
    facility_id,
    name,
    code,
    specialization,
    floor,
    contact_phone,
    created_by
) VALUES (
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440000',
    'Internal Medicine',
    'INTMED',
    'General Internal Medicine',
    3,
    '+249123456790',
    '550e8400-e29b-41d4-a716-446655440002'
);

-- Insert sample ward
INSERT INTO wards (
    ward_id,
    facility_id,
    department_id,
    name,
    ward_code,
    ward_type,
    floor,
    total_beds,
    available_beds,
    nurse_station_phone,
    created_by
) VALUES (
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440010',
    'Medical Ward A',
    'MED-A',
    'medical',
    3,
    20,
    20,
    '+249123456791',
    '550e8400-e29b-41d4-a716-446655440002'
);

-- Insert sample beds
INSERT INTO beds (
    bed_id,
    facility_id,
    department_id,
    ward_id,
    bed_number,
    bed_type,
    bed_status,
    location,
    has_oxygen,
    has_monitor,
    created_by
) VALUES 
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440020',
    'A-101',
    'standard',
    'available',
    'Room 301',
    true,
    false,
    '550e8400-e29b-41d4-a716-446655440002'
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440020',
    'A-102',
    'standard',
    'available',
    'Room 302',
    true,
    true,
    '550e8400-e29b-41d4-a716-446655440002'
);

-- Insert sample facility settings
INSERT INTO facility_settings (
    facility_id,
    timezone,
    language,
    currency,
    default_appointment_duration,
    appointment_reminder_hours,
    created_by
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Africa/Khartoum',
    'en',
    'SDG',
    30,
    '[24, 2]',
    '550e8400-e29b-41d4-a716-446655440002'
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update ward occupancy when bed status changes
CREATE OR REPLACE FUNCTION update_ward_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    -- Update ward occupancy counts
    UPDATE wards SET
        occupied_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = NEW.ward_id AND bed_status = 'occupied' AND is_active = true),
        available_beds = (SELECT COUNT(*) FROM beds WHERE ward_id = NEW.ward_id AND bed_status = 'available' AND is_active = true),
        updated_at = NOW()
    WHERE ward_id = NEW.ward_id;
    
    -- Update ward status based on availability
    UPDATE wards SET
        status = CASE 
            WHEN available_beds = 0 THEN 'full'
            WHEN available_beds > 0 AND status = 'full' THEN 'active'
            ELSE status
        END
    WHERE ward_id = NEW.ward_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_ward_occupancy_on_bed_change
    AFTER INSERT OR UPDATE OF bed_status ON beds
    FOR EACH ROW
    EXECUTE FUNCTION update_ward_occupancy();

-- ============================================================================
-- GRANTS (for application user)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nilecare_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nilecare_app;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE facilities IS 'Healthcare facilities (hospitals, clinics, labs, pharmacies)';
COMMENT ON TABLE departments IS 'Departments within facilities';
COMMENT ON TABLE wards IS 'Wards within departments with occupancy tracking';
COMMENT ON TABLE beds IS 'Hospital beds with real-time status and patient assignments';
COMMENT ON TABLE facility_settings IS 'Facility-specific configuration and preferences';
COMMENT ON TABLE bed_history IS 'Complete audit trail of bed assignments';
COMMENT ON TABLE facility_audit_log IS 'Comprehensive audit trail for all facility operations';

COMMENT ON COLUMN facilities.facility_code IS 'Unique facility identifier code (e.g., KTH-001)';
COMMENT ON COLUMN beds.bed_status IS 'Real-time bed status for admission management';
COMMENT ON COLUMN wards.occupied_beds IS 'Auto-calculated from bed statuses via trigger';
COMMENT ON COLUMN facility_settings.timezone IS 'Sudan default: Africa/Khartoum (EAT, UTC+3)';

-- ============================================================================
-- SCHEMA VALIDATION
-- ============================================================================

-- Verify all tables created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN ('facilities', 'departments', 'wards', 'beds', 'facility_settings', 'bed_history', 'facility_audit_log')
ORDER BY table_name;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

