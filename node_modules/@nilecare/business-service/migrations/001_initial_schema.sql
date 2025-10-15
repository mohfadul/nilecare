-- Business Service Database Schema
-- PostgreSQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('consultation', 'follow-up', 'procedure', 'emergency', 'telemedicine')),
    duration INTEGER NOT NULL CHECK (duration > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')),
    reason TEXT,
    notes TEXT,
    location VARCHAR(255),
    priority VARCHAR(50) NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'emergency')),
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

-- Indexes for appointments
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_organization ON appointments(organization_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_type ON appointments(appointment_type);

-- ============================================================================
-- BILLINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS billings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL,
    appointment_id UUID,
    organization_id UUID NOT NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'refunded')),
    description TEXT NOT NULL,
    items JSONB NOT NULL,
    due_date TIMESTAMP,
    paid_date TIMESTAMP,
    payment_method VARCHAR(100),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

-- Indexes for billings
CREATE INDEX idx_billings_patient ON billings(patient_id);
CREATE INDEX idx_billings_appointment ON billings(appointment_id);
CREATE INDEX idx_billings_organization ON billings(organization_id);
CREATE INDEX idx_billings_invoice_number ON billings(invoice_number);
CREATE INDEX idx_billings_status ON billings(status);
CREATE INDEX idx_billings_created_at ON billings(created_at);

-- ============================================================================
-- SCHEDULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('shift', 'appointment', 'time-off', 'break', 'meeting')),
    location VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    CONSTRAINT check_time_range CHECK (end_time > start_time)
);

-- Indexes for schedules
CREATE INDEX idx_schedules_staff ON schedules(staff_id);
CREATE INDEX idx_schedules_organization ON schedules(organization_id);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);
CREATE INDEX idx_schedules_end_time ON schedules(end_time);
CREATE INDEX idx_schedules_type ON schedules(schedule_type);
CREATE INDEX idx_schedules_status ON schedules(status);

-- ============================================================================
-- STAFF TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('doctor', 'nurse', 'receptionist', 'admin', 'technician', 'therapist')),
    department VARCHAR(100),
    specialization VARCHAR(100),
    license_number VARCHAR(100),
    hire_date DATE DEFAULT CURRENT_DATE,
    termination_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on-leave', 'suspended', 'terminated')),
    availability JSONB DEFAULT '{}',
    credentials JSONB DEFAULT '[]',
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

-- Indexes for staff
CREATE INDEX idx_staff_organization ON staff(organization_id);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_department ON staff(department);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_name ON staff(last_name, first_name);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billings_updated_at BEFORE UPDATE ON billings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for development/testing)
-- ============================================================================

-- Uncomment the following lines to insert sample data

/*
-- Sample Organization ID (you should use your actual organization ID)
DO $$
DECLARE
    org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    staff1_id UUID := uuid_generate_v4();
    staff2_id UUID := uuid_generate_v4();
    patient1_id UUID := uuid_generate_v4();
BEGIN
    -- Insert sample staff
    INSERT INTO staff (id, organization_id, first_name, last_name, email, phone, role, department, specialization)
    VALUES 
        (staff1_id, org_id, 'John', 'Doe', 'john.doe@hospital.com', '+1234567890', 'doctor', 'Cardiology', 'Cardiologist'),
        (staff2_id, org_id, 'Jane', 'Smith', 'jane.smith@hospital.com', '+1234567891', 'nurse', 'Emergency', 'ER Nurse');

    -- Insert sample appointment
    INSERT INTO appointments (organization_id, patient_id, provider_id, appointment_date, appointment_type, duration, status, priority)
    VALUES 
        (org_id, patient1_id, staff1_id, CURRENT_TIMESTAMP + INTERVAL '1 day', 'consultation', 30, 'scheduled', 'routine');
END $$;
*/

-- ============================================================================
-- VIEWS (Optional - for reporting)
-- ============================================================================

CREATE OR REPLACE VIEW v_upcoming_appointments AS
SELECT 
    a.*,
    s.first_name || ' ' || s.last_name as provider_name,
    s.specialization as provider_specialization
FROM appointments a
LEFT JOIN staff s ON a.provider_id = s.id
WHERE a.appointment_date >= CURRENT_TIMESTAMP
    AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.appointment_date;

CREATE OR REPLACE VIEW v_staff_workload AS
SELECT 
    s.id,
    s.first_name || ' ' || s.last_name as staff_name,
    s.role,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.appointment_date >= CURRENT_TIMESTAMP THEN a.id END) as upcoming_appointments
FROM staff s
LEFT JOIN appointments a ON s.id = a.provider_id AND a.status NOT IN ('cancelled', 'no-show')
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, s.role;

CREATE OR REPLACE VIEW v_billing_summary AS
SELECT 
    organization_id,
    status,
    currency,
    COUNT(*) as total_invoices,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM billings
GROUP BY organization_id, status, currency;

-- ============================================================================
-- GRANT PERMISSIONS (Adjust as needed for your user)
-- ============================================================================

-- Example: GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO business_service_user;
-- Example: GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO business_service_user;

COMMENT ON TABLE appointments IS 'Stores patient appointments with providers';
COMMENT ON TABLE billings IS 'Stores billing and invoice information';
COMMENT ON TABLE schedules IS 'Stores staff scheduling information';
COMMENT ON TABLE staff IS 'Stores staff member information and credentials';

