-- ============================================================================
-- Business Service Database Schema - MySQL/MariaDB Version
-- For use with XAMPP or standalone MySQL
-- ============================================================================

-- Create and use database
CREATE DATABASE IF NOT EXISTS nilecare_business CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nilecare_business;

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    provider_id VARCHAR(36) NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    appointment_date DATETIME NOT NULL,
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('consultation', 'follow-up', 'procedure', 'emergency', 'telemedicine')),
    duration INT NOT NULL CHECK (duration > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')),
    reason TEXT,
    notes TEXT,
    location VARCHAR(255),
    priority VARCHAR(50) NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'emergency')),
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    
    INDEX idx_appointments_patient (patient_id),
    INDEX idx_appointments_provider (provider_id),
    INDEX idx_appointments_organization (organization_id),
    INDEX idx_appointments_date (appointment_date),
    INDEX idx_appointments_status (status),
    INDEX idx_appointments_type (appointment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BILLINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS billings (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    appointment_id VARCHAR(36),
    organization_id VARCHAR(36) NOT NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'refunded')),
    description TEXT NOT NULL,
    items JSON NOT NULL,
    due_date DATETIME,
    paid_date DATETIME,
    payment_method VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    
    INDEX idx_billings_patient (patient_id),
    INDEX idx_billings_appointment (appointment_id),
    INDEX idx_billings_organization (organization_id),
    INDEX idx_billings_invoice_number (invoice_number),
    INDEX idx_billings_status (status),
    INDEX idx_billings_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SCHEDULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS schedules (
    id VARCHAR(36) PRIMARY KEY,
    staff_id VARCHAR(36) NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('shift', 'appointment', 'time-off', 'break', 'meeting')),
    location VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    
    INDEX idx_schedules_staff (staff_id),
    INDEX idx_schedules_organization (organization_id),
    INDEX idx_schedules_start_time (start_time),
    INDEX idx_schedules_end_time (end_time),
    INDEX idx_schedules_type (schedule_type),
    INDEX idx_schedules_status (status),
    
    CONSTRAINT check_time_range CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STAFF TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('doctor', 'nurse', 'receptionist', 'admin', 'technician', 'therapist')),
    department VARCHAR(100),
    specialization VARCHAR(100),
    license_number VARCHAR(100),
    hire_date DATE DEFAULT (CURRENT_DATE),
    termination_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on-leave', 'suspended', 'terminated')),
    availability JSON,
    credentials JSON,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    
    INDEX idx_staff_organization (organization_id),
    INDEX idx_staff_email (email),
    INDEX idx_staff_role (role),
    INDEX idx_staff_department (department),
    INDEX idx_staff_status (status),
    INDEX idx_staff_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VIEWS (Optional - for reporting)
-- ============================================================================

CREATE OR REPLACE VIEW v_upcoming_appointments AS
SELECT 
    a.*,
    CONCAT(s.first_name, ' ', s.last_name) as provider_name,
    s.specialization as provider_specialization
FROM appointments a
LEFT JOIN staff s ON a.provider_id = s.id
WHERE a.appointment_date >= NOW()
    AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.appointment_date;

CREATE OR REPLACE VIEW v_staff_workload AS
SELECT 
    s.id,
    CONCAT(s.first_name, ' ', s.last_name) as staff_name,
    s.role,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.appointment_date >= NOW() THEN a.id END) as upcoming_appointments
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
-- SAMPLE DATA (Optional - for development/testing)
-- ============================================================================

-- Uncomment to insert sample data
/*
INSERT INTO staff (id, organization_id, first_name, last_name, email, phone, role, department, specialization)
VALUES 
    (UUID(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'John', 'Doe', 'john.doe@hospital.com', '+1234567890', 'doctor', 'Cardiology', 'Cardiologist'),
    (UUID(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jane', 'Smith', 'jane.smith@hospital.com', '+1234567891', 'nurse', 'Emergency', 'ER Nurse');
*/

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Example: Create user and grant access (adjust as needed)
-- CREATE USER 'business_user'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON nilecare_business.* TO 'business_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Database schema created successfully!' AS message;
SELECT COUNT(*) AS tables_created FROM information_schema.tables 
WHERE table_schema = 'nilecare_business' AND table_type = 'BASE TABLE';


