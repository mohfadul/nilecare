-- ============================================================================
-- NileCare - SUPER SIMPLE Setup (Just to Get Started!)
-- Copy this ENTIRE script into phpMyAdmin SQL tab and click "Go"
-- ============================================================================

USE nilecare;

-- Simple users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simple patients table
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    national_id VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simple payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add ONE test user
INSERT IGNORE INTO users VALUES
('USR-001', 'doctor@nilecare.sd', '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K', 'Ahmed', 'Hassan', 'doctor', NOW());

-- Add ONE test patient  
INSERT IGNORE INTO patients VALUES
('PAT-001', '12345678901', 'Ahmed', 'Abdullah', '1985-03-15', 'male', '+249912345678', NOW());

-- Done!
SELECT 'Setup complete! Open http://localhost:5173 and login!' AS message;

