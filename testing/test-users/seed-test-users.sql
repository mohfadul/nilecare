-- =====================================================
-- NileCare Platform - Test Users Seed Script
-- =====================================================
-- Purpose: Create test user accounts for all roles
-- Database: MySQL
-- Note: Passwords are bcrypt hashed
-- Default password for all: TestPass123!
-- =====================================================

-- Hash for TestPass123!: $2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K

-- Clean up existing test users (optional - comment out if you want to keep)
-- DELETE FROM users WHERE email LIKE '%@nilecare.sd';

-- =====================================================
-- INSERT TEST USERS
-- =====================================================

-- 1. System Administrator
INSERT INTO users (
    id, email, password, first_name, last_name, role, status,
    phone, national_id, date_of_birth, gender, created_at, updated_at
) VALUES (
    'USR-ADMIN-001',
    'admin@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'System',
    'Administrator',
    'admin',
    'active',
    '+249911000000',
    '10000000001',
    '1980-01-01',
    'male',
    NOW(),
    NOW()
);

-- 2. Doctors
INSERT INTO users (
    id, email, password, first_name, last_name, role, status,
    phone, national_id, date_of_birth, gender, specialty, license_number,
    created_at, updated_at
) VALUES 
(
    'USR-DOC-001',
    'doctor@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'Ahmed',
    'Hassan',
    'doctor',
    'active',
    '+249912345678',
    '12345678901',
    '1985-05-15',
    'male',
    'General Practice',
    'MED-SD-12345',
    NOW(),
    NOW()
),
(
    'USR-DOC-002',
    'fatima.ali@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'Fatima',
    'Ali',
    'doctor',
    'active',
    '+249923456789',
    '23456789012',
    '1982-08-20',
    'female',
    'Cardiology',
    'MED-SD-23456',
    NOW(),
    NOW()
),
(
    'USR-DOC-003',
    'mohamed.ibrahim@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'Mohamed',
    'Ibrahim',
    'doctor',
    'active',
    '+249934567890',
    '34567890123',
    '1987-12-10',
    'male',
    'Emergency Medicine',
    'MED-SD-34567',
    NOW(),
    NOW()
);

-- 3. Nurses
INSERT INTO users (
    id, email, password, first_name, last_name, role, status,
    phone, national_id, date_of_birth, gender, department, license_number,
    created_at, updated_at
) VALUES 
(
    'USR-NUR-001',
    'nurse@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'Sara',
    'Osman',
    'nurse',
    'active',
    '+249945678901',
    '45678901234',
    '1990-03-25',
    'female',
    'General Ward',
    'NUR-SD-45678',
    NOW(),
    NOW()
),
(
    'USR-NUR-002',
    'amira.khalid@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'Amira',
    'Khalid',
    'nurse',
    'active',
    '+249956789012',
    '56789012345',
    '1988-06-18',
    'female',
    'Intensive Care Unit',
    'NUR-SD-56789',
    NOW(),
    NOW()
);

-- 4. Receptionist
INSERT INTO users (
    id, email, password, first_name, last_name, role, status,
    phone, national_id, date_of_birth, gender, department,
    created_at, updated_at
) VALUES (
    'USR-REC-001',
    'receptionist@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'Hanan',
    'Ahmed',
    'receptionist',
    'active',
    '+249967890123',
    '67890123456',
    '1995-09-12',
    'female',
    'Front Desk',
    NOW(),
    NOW()
);

-- 5. Pharmacist
INSERT INTO users (
    id, email, password, first_name, last_name, role, status,
    phone, national_id, date_of_birth, gender, department, license_number,
    created_at, updated_at
) VALUES (
    'USR-PHM-001',
    'pharmacist@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'Yousif',
    'Hassan',
    'pharmacist',
    'active',
    '+249978901234',
    '78901234567',
    '1986-11-05',
    'male',
    'Pharmacy',
    'PHM-SD-67890',
    NOW(),
    NOW()
);

-- 6. Lab Technician
INSERT INTO users (
    id, email, password, first_name, last_name, role, status,
    phone, national_id, date_of_birth, gender, department, license_number,
    created_at, updated_at
) VALUES (
    'USR-LAB-001',
    'lab-tech@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'Mariam',
    'Suliman',
    'lab_technician',
    'active',
    '+249989012345',
    '89012345678',
    '1992-04-30',
    'female',
    'Laboratory',
    'LAB-SD-78901',
    NOW(),
    NOW()
);

-- 7. Billing Clerk
INSERT INTO users (
    id, email, password, first_name, last_name, role, status,
    phone, national_id, date_of_birth, gender, department,
    created_at, updated_at
) VALUES (
    'USR-BIL-001',
    'billing@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'Nadia',
    'Mohamed',
    'billing_clerk',
    'active',
    '+249990123456',
    '90123456789',
    '1991-07-22',
    'female',
    'Finance',
    NOW(),
    NOW()
);

-- 8. Facility Manager
INSERT INTO users (
    id, email, password, first_name, last_name, role, status,
    phone, national_id, date_of_birth, gender, department,
    created_at, updated_at
) VALUES (
    'USR-MGR-001',
    'manager@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'Khalid',
    'Omer',
    'facility_manager',
    'active',
    '+249991234567',
    '91234567890',
    '1983-02-14',
    'male',
    'Administration',
    NOW(),
    NOW()
);

-- 9. IT Support
INSERT INTO users (
    id, email, password, first_name, last_name, role, status,
    phone, national_id, date_of_birth, gender, department,
    created_at, updated_at
) VALUES (
    'USR-IT-001',
    'itsupport@nilecare.sd',
    '$2b$10$rX8vqTQkQp5YZcGxEqJ5XO7Y.HwJzLKzB5VZ7qFGpQzWJNqLXvZ8K',
    'Osman',
    'Ali',
    'it_support',
    'active',
    '+249992345678',
    '92345678901',
    '1989-10-08',
    'male',
    'Information Technology',
    NOW(),
    NOW()
);

-- =====================================================
-- INSERT TEST PATIENTS
-- =====================================================

INSERT INTO patients (
    id, national_id, first_name, last_name, date_of_birth, gender,
    phone, email, address, city, state, postal_code,
    blood_type, allergies, medical_conditions, emergency_contact_name,
    emergency_contact_phone, created_at, updated_at
) VALUES 
(
    'PAT-TEST-001',
    '12345678901',
    'Ahmed',
    'Abdullah',
    '1985-03-15',
    'male',
    '+249912345678',
    'ahmed.abdullah@example.sd',
    'Block 5, Street 10, Al-Riyadh',
    'Khartoum',
    'Khartoum State',
    '11111',
    'O+',
    'None',
    'Hypertension, Diabetes Type 2',
    'Fatima Abdullah',
    '+249922345678',
    NOW(),
    NOW()
),
(
    'PAT-TEST-002',
    '23456789012',
    'Fatima',
    'Hassan',
    '1990-07-22',
    'female',
    '+249923456789',
    'fatima.hassan@example.sd',
    'Block 12, Street 5, Al-Amarat',
    'Khartoum',
    'Khartoum State',
    '11112',
    'A+',
    'Penicillin',
    'None',
    'Hassan Mohamed',
    '+249933456789',
    NOW(),
    NOW()
),
(
    'PAT-TEST-003',
    '34567890123',
    'Mohamed',
    'Ali',
    '2010-11-10',
    'male',
    '+249934567890',
    'parent@example.sd',
    'Block 8, Street 15, Al-Sahafa',
    'Khartoum',
    'Khartoum State',
    '11113',
    'B+',
    'None',
    'Asthma',
    'Ali Mohamed (Father)',
    '+249944567890',
    NOW(),
    NOW()
),
(
    'PAT-TEST-004',
    '45678901234',
    'Sara',
    'Ibrahim',
    '1978-05-30',
    'female',
    '+249945678901',
    'sara.ibrahim@example.sd',
    'Block 3, Street 22, Al-Manshiya',
    'Khartoum',
    'Khartoum State',
    '11114',
    'AB+',
    'Aspirin',
    'Cardiac Disease, High Cholesterol',
    'Ibrahim Hassan',
    '+249955678901',
    NOW(),
    NOW()
),
(
    'PAT-TEST-005',
    '56789012345',
    'Omar',
    'Khalid',
    '2005-12-25',
    'male',
    '+249956789012',
    'omar.khalid@example.sd',
    'Block 15, Street 7, Al-Azhari',
    'Khartoum',
    'Khartoum State',
    '11115',
    'O-',
    'None',
    'None',
    'Khalid Omar (Father)',
    '+249966789012',
    NOW(),
    NOW()
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Count test users
SELECT 
    'Test Users Created' as status,
    COUNT(*) as count
FROM users 
WHERE email LIKE '%@nilecare.sd';

-- List all test users
SELECT 
    id,
    CONCAT(first_name, ' ', last_name) as name,
    email,
    role,
    status
FROM users 
WHERE email LIKE '%@nilecare.sd'
ORDER BY role, email;

-- Count test patients
SELECT 
    'Test Patients Created' as status,
    COUNT(*) as count
FROM patients 
WHERE id LIKE 'PAT-TEST-%';

-- List all test patients
SELECT 
    id,
    CONCAT(first_name, ' ', last_name) as name,
    national_id,
    phone,
    medical_conditions
FROM patients 
WHERE id LIKE 'PAT-TEST-%'
ORDER BY last_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ Test users and patients created successfully!' as message;
SELECT 'Default password for all users: TestPass123!' as note;
SELECT 'Use admin@nilecare.sd to login as administrator' as tip;

COMMIT;

