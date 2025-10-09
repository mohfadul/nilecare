-- ============================================================================
-- NileCare Platform - Quick Setup for phpMyAdmin
-- Copy and paste this entire script into phpMyAdmin SQL tab
-- ============================================================================

USE nilecare;

-- Create basic tables
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert test user (doctor)
-- Password: TestPass123! (bcrypt hashed)
INSERT INTO users (id, email, password, first_name, last_name, role, phone) VALUES
('USR-DOC-001', 'doctor@nilecare.sd', '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K', 'Ahmed', 'Hassan', 'doctor', '+249912345678');

-- Insert test patient
INSERT INTO patients (id, national_id, first_name, last_name, date_of_birth, gender, phone) VALUES
('PAT-001', '12345678901', 'Ahmed', 'Abdullah', '1985-03-15', 'male', '+249912345678');

-- Verify
SELECT '✅ Setup complete!' as message;
SELECT 'Tables created: users, patients, payments' as tables;
SELECT 'Test user: doctor@nilecare.sd / TestPass123!' as login;

