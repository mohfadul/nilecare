-- ============================================================================
-- NileCare Platform - Comprehensive Database Seeding
-- Seeds 100+ records for testing - Sudan Healthcare Context
-- ============================================================================

USE nilecare;

-- Disable foreign key checks for seeding
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- STEP 1: Create Tables (if not exists)
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'billing_clerk', 'patient') NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    phone VARCHAR(20),
    national_id VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    specialty VARCHAR(100),
    license_number VARCHAR(50),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    blood_type VARCHAR(5),
    allergies TEXT,
    medical_conditions TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Appointments table  
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    provider_id VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INT DEFAULT 30,
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    provider_id VARCHAR(50) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration_days INT,
    instructions TEXT,
    status ENUM('active', 'completed', 'discontinued') DEFAULT 'active',
    prescribed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(50) PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 50,
    unit_price DECIMAL(10, 2),
    supplier VARCHAR(255),
    expiry_date DATE,
    status ENUM('in_stock', 'low_stock', 'out_of_stock', 'expired') DEFAULT 'in_stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lab Orders table
CREATE TABLE IF NOT EXISTS lab_orders (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    provider_id VARCHAR(50) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(100),
    priority ENUM('routine', 'urgent', 'stat') DEFAULT 'routine',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    ordered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result_date TIMESTAMP NULL,
    result TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    provider_id VARCHAR(50) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    quantity INT,
    refills INT DEFAULT 0,
    status ENUM('pending', 'filled', 'cancelled') DEFAULT 'pending',
    prescribed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filled_date TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'SDG',
    status ENUM('draft', 'pending', 'paid', 'overdue') DEFAULT 'pending',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    due_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- STEP 2: Clear Existing Data
-- ============================================================================

TRUNCATE TABLE tasks;
TRUNCATE TABLE prescriptions;
TRUNCATE TABLE lab_orders;
TRUNCATE TABLE invoices;
TRUNCATE TABLE inventory;
TRUNCATE TABLE medications;
TRUNCATE TABLE appointments;
TRUNCATE TABLE patients;
TRUNCATE TABLE users;

-- ============================================================================
-- STEP 3: Seed Users (100 users)
-- ============================================================================

INSERT INTO users (id, email, password, first_name, last_name, role, status, phone, national_id, specialty) VALUES
-- Test users with TestPass123!
('user_1', 'doctor@nilecare.sd', 'TestPass123!', 'Ahmed', 'Hassan', 'doctor', 'active', '+249912345001', 'SD001', 'Internal Medicine'),
('user_2', 'nurse@nilecare.sd', 'TestPass123!', 'Sarah', 'Ali', 'nurse', 'active', '+249912345002', 'SD002', NULL),
('user_3', 'admin@nilecare.sd', 'TestPass123!', 'Admin', 'User', 'admin', 'active', '+249912345003', 'SD003', NULL),
('user_4', 'pharmacist@nilecare.sd', 'TestPass123!', 'Mohamed', 'Osman', 'pharmacist', 'active', '+249912345004', 'SD004', 'Pharmacy'),
('user_5', 'lab@nilecare.sd', 'TestPass123!', 'Ibrahim', 'Ahmed', 'lab_technician', 'active', '+249912345005', 'SD005', 'Laboratory'),
('user_6', 'reception@nilecare.sd', 'TestPass123!', 'Amina', 'Khalil', 'receptionist', 'active', '+249912345006', 'SD006', NULL),
-- Additional doctors
('user_7', 'doctor2@nilecare.sd', 'TestPass123!', 'Fatima', 'Omar', 'doctor', 'active', '+249912345007', 'SD007', 'Cardiology'),
('user_8', 'doctor3@nilecare.sd', 'TestPass123!', 'Youssef', 'Ibrahim', 'doctor', 'active', '+249912345008', 'SD008', 'Pediatrics'),
('user_9', 'doctor4@nilecare.sd', 'TestPass123!', 'Maryam', 'Ahmed', 'doctor', 'active', '+249912345009', 'SD009', 'Obstetrics'),
('user_10', 'doctor5@nilecare.sd', 'TestPass123!', 'Khalid', 'Mohamed', 'doctor', 'active', '+249912345010', 'SD010', 'Surgery');

-- Continue with procedure for remaining 90 users
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS seed_users()
BEGIN
    DECLARE i INT DEFAULT 11;
    DECLARE role_val VARCHAR(50);
    DECLARE roles VARCHAR(500) DEFAULT 'doctor,nurse,pharmacist,lab_technician,receptionist';
    
    WHILE i <= 100 DO
        SET role_val = ELT((i MOD 5) + 1, 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'receptionist');
        
        INSERT INTO users (id, email, password, first_name, last_name, role, status, phone, national_id)
        VALUES (
            CONCAT('user_', i),
            CONCAT('user', i, '@nilecare.sd'),
            'TestPass123!',
            CONCAT('FirstName', i),
            CONCAT('LastName', i),
            role_val,
            'active',
            CONCAT('+24991234', LPAD(i, 4, '0')),
            CONCAT('SD', LPAD(i, 3, '0'))
        );
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL seed_users();
DROP PROCEDURE seed_users;

SELECT CONCAT('✅ Inserted ', COUNT(*), ' users') as status FROM users;

-- ============================================================================
-- STEP 4: Seed Patients (100 patients)
-- ============================================================================

-- Sudan cities and states
INSERT INTO patients (id, national_id, first_name, last_name, date_of_birth, gender, phone, email, address, city, state, blood_type, allergies, medical_conditions, emergency_contact_name, emergency_contact_phone) VALUES
('pat_1', 'N001', 'Ahmed', 'Mohamed', '1985-03-15', 'male', '+249912001001', 'ahmed.m@example.sd', 'Street 15, Block 3', 'Khartoum', 'Khartoum', 'O+', 'Penicillin', 'Hypertension', 'Fatima Mohamed', '+249912001002'),
('pat_2', 'N002', 'Fatima', 'Hassan', '1990-07-22', 'female', '+249912001003', 'fatima.h@example.sd', 'Street 22, Block 5', 'Omdurman', 'Khartoum', 'A+', 'None', 'Diabetes Type 2', 'Ahmed Hassan', '+249912001004'),
('pat_3', 'N003', 'Omar', 'Ibrahim', '1978-11-10', 'male', '+249912001005', 'omar.i@example.sd', 'Street 8, Block 2', 'Bahri', 'Khartoum', 'B+', 'Aspirin', 'Asthma', 'Sarah Ibrahim', '+249912001006'),
('pat_4', 'N004', 'Sara', 'Ali', '1995-05-18', 'female', '+249912001007', 'sara.a@example.sd', 'Street 30, Block 7', 'Wad Medani', 'Gezira', 'AB+', 'None', NULL, 'Ali Hassan', '+249912001008'),
('pat_5', 'N005', 'Youssef', 'Khalil', '1982-09-25', 'male', '+249912001009', 'youssef.k@example.sd', 'Street 12, Block 4', 'Port Sudan', 'Red Sea', 'O-', 'Lactose', 'High Cholesterol', 'Amina Khalil', '+249912001010');

-- Generate remaining 95 patients via procedure
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS seed_patients()
BEGIN
    DECLARE i INT DEFAULT 6;
    DECLARE first_names TEXT DEFAULT 'Ahmed,Mohamed,Ali,Hassan,Ibrahim,Khalid,Omar,Abdullah,Youssef,Fatima,Sarah,Amina,Maryam,Aisha,Hanan,Nadia,Laila,Zainab,Khadija,Salma';
    DECLARE last_names TEXT DEFAULT 'Hassan,Mohamed,Ali,Ibrahim,Ahmed,Khalil,Osman,Abdalla,Mahmoud,Hussein,Saleh,Omar,Ismail,Abdullah,Youssef,Mustafa,Hamid,Nur,Bashir,Said';
    DECLARE cities TEXT DEFAULT 'Khartoum,Omdurman,Bahri,Wad Medani,Port Sudan,Kassala,Gedaref,Nyala,El Fasher,El Obeid';
    DECLARE states TEXT DEFAULT 'Khartoum,Gezira,Red Sea,Kassala,Gedaref,North Darfur,South Darfur,North Kordofan';
    DECLARE blood_types TEXT DEFAULT 'O+,A+,B+,AB+,O-,A-,B-,AB-';
    DECLARE conditions TEXT DEFAULT 'Hypertension,Diabetes Type 2,Asthma,High Cholesterol,Arthritis';
    
    WHILE i <= 100 DO
        INSERT INTO patients (id, national_id, first_name, last_name, date_of_birth, gender, phone, email, address, city, state, blood_type, medical_conditions, emergency_contact_name, emergency_contact_phone)
        VALUES (
            CONCAT('pat_', i),
            CONCAT('N', LPAD(i, 3, '0')),
            ELT((i MOD 20) + 1, 'Ahmed','Mohamed','Ali','Hassan','Ibrahim','Khalid','Omar','Abdullah','Youssef','Fatima','Sarah','Amina','Maryam','Aisha','Hanan','Nadia','Laila','Zainab','Khadija','Salma'),
            ELT(((i+5) MOD 20) + 1, 'Hassan','Mohamed','Ali','Ibrahim','Ahmed','Khalil','Osman','Abdalla','Mahmoud','Hussein','Saleh','Omar','Ismail','Abdullah','Youssef','Mustafa','Hamid','Nur','Bashir','Said'),
            DATE_SUB(CURDATE(), INTERVAL (20 + (i MOD 60)) YEAR),
            IF(i MOD 2 = 0, 'male', 'female'),
            CONCAT('+24991200', LPAD(i, 4, '0')),
            CONCAT('patient', i, '@example.sd'),
            CONCAT('Street ', (i MOD 50) + 1, ', Block ', (i MOD 10) + 1),
            ELT((i MOD 10) + 1, 'Khartoum','Omdurman','Bahri','Wad Medani','Port Sudan','Kassala','Gedaref','Nyala','El Fasher','El Obeid'),
            ELT((i MOD 8) + 1, 'Khartoum','Gezira','Red Sea','Kassala','Gedaref','North Darfur','South Darfur','North Kordofan'),
            ELT((i MOD 8) + 1, 'O+','A+','B+','AB+','O-','A-','B-','AB-'),
            IF(i MOD 3 = 0, ELT((i MOD 5) + 1, 'Hypertension','Diabetes Type 2','Asthma','High Cholesterol','Arthritis'), NULL),
            CONCAT('Emergency Contact ', i),
            CONCAT('+24991299', LPAD(i, 4, '0'))
        );
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL seed_patients();
DROP PROCEDURE seed_patients;

SELECT CONCAT('✅ Inserted ', COUNT(*), ' patients') as status FROM patients;

-- ============================================================================
-- STEP 5: Seed Appointments (100 appointments)
-- ============================================================================

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS seed_appointments()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE pat_id VARCHAR(50);
    DECLARE prov_id VARCHAR(50);
    
    WHILE i <= 100 DO
        SET pat_id = CONCAT('pat_', ((i MOD 100) + 1));
        SET prov_id = CONCAT('user_', ((i MOD 10) + 1));
        
        INSERT INTO appointments (id, patient_id, provider_id, appointment_date, appointment_time, duration, status, reason)
        VALUES (
            CONCAT('apt_', i),
            pat_id,
            prov_id,
            DATE_ADD(CURDATE(), INTERVAL (i MOD 30) - 15 DAY),
            TIME(CONCAT(LPAD(8 + (i MOD 8), 2, '0'), ':', LPAD((i MOD 4) * 15, 2, '0'), ':00')),
            IF(i MOD 3 = 0, 60, 30),
            ELT((i MOD 5) + 1, 'scheduled','confirmed','in_progress','completed','cancelled'),
            ELT((i MOD 5) + 1, 'Consultation','Follow-up','Check-up','Emergency','Procedure')
        );
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL seed_appointments();
DROP PROCEDURE seed_appointments;

SELECT CONCAT('✅ Inserted ', COUNT(*), ' appointments') as status FROM appointments;

-- ============================================================================
-- STEP 6: Seed Medications (100 medication records)
-- ============================================================================

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS seed_medications()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE med_names TEXT DEFAULT 'Aspirin,Metformin,Lisinopril,Atorvastatin,Amlodipine,Omeprazole,Losartan,Gabapentin,Levothyroxine,Albuterol';
    
    WHILE i <= 100 DO
        INSERT INTO medications (id, patient_id, provider_id, medication_name, dosage, frequency, duration_days, instructions, status)
        VALUES (
            CONCAT('med_', i),
            CONCAT('pat_', ((i MOD 100) + 1)),
            CONCAT('user_', ((i MOD 10) + 1)),
            ELT((i MOD 10) + 1, 'Aspirin','Metformin','Lisinopril','Atorvastatin','Amlodipine','Omeprazole','Losartan','Gabapentin','Levothyroxine','Albuterol'),
            CONCAT(ELT((i MOD 5) + 1, '100','250','500','750','1000'), 'mg'),
            ELT((i MOD 3) + 1, 'Once daily','Twice daily','Three times daily'),
            (i MOD 90) + 10,
            'Take with food',
            ELT((i MOD 3) + 1, 'active','completed','discontinued')
        );
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL seed_medications();
DROP PROCEDURE seed_medications;

SELECT CONCAT('✅ Inserted ', COUNT(*), ' medications') as status FROM medications;

-- ============================================================================
-- STEP 7: Seed Inventory (100 inventory items)
-- ============================================================================

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS seed_inventory()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE categories TEXT DEFAULT 'Medication,Supplies,Equipment,Consumables';
    
    WHILE i <= 100 DO
        INSERT INTO inventory (id, item_name, category, quantity, reorder_level, unit_price, supplier, expiry_date, status)
        VALUES (
            CONCAT('inv_', i),
            CONCAT(ELT((i MOD 10) + 1, 'Aspirin','Paracetamol','Ibuprofen','Amoxicillin','Ciprofloxacin','Metformin','Insulin','Bandages','Syringes','Gloves'), ' - Item ', i),
            ELT((i MOD 4) + 1, 'Medication','Supplies','Equipment','Consumables'),
            (i MOD 500) + 50,
            IF(i MOD 10 < 3, 200, 100),
            (i MOD 100) + 10.50,
            CONCAT('Sudan Pharma Supplier ', ((i MOD 5) + 1)),
            DATE_ADD(CURDATE(), INTERVAL (i MOD 365) DAY),
            IF((i MOD 500) + 50 < 100, 'low_stock', 'in_stock')
        );
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL seed_inventory();
DROP PROCEDURE seed_inventory;

SELECT CONCAT('✅ Inserted ', COUNT(*), ' inventory items') as status FROM inventory;

-- ============================================================================
-- STEP 8: Seed Lab Orders (100 lab orders)
-- ============================================================================

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS seed_lab_orders()
BEGIN
    DECLARE i INT DEFAULT 1;
    
    WHILE i <= 100 DO
        INSERT INTO lab_orders (id, patient_id, provider_id, test_name, test_type, priority, status, ordered_date, result_date, result)
        VALUES (
            CONCAT('lab_', i),
            CONCAT('pat_', ((i MOD 100) + 1)),
            CONCAT('user_', ((i MOD 10) + 1)),
            ELT((i MOD 10) + 1, 'Complete Blood Count (CBC)','Lipid Panel','HbA1c','Thyroid Panel','Liver Function','Kidney Function','Urinalysis','Blood Culture','Chest X-Ray','ECG'),
            ELT((i MOD 3) + 1, 'Hematology','Chemistry','Radiology'),
            ELT((i MOD 3) + 1, 'routine','urgent','stat'),
            ELT((i MOD 4) + 1, 'pending','in_progress','completed','cancelled'),
            DATE_SUB(NOW(), INTERVAL (i MOD 30) DAY),
            IF(i MOD 4 = 3, DATE_SUB(NOW(), INTERVAL (i MOD 20) DAY), NULL),
            IF(i MOD 4 = 3, 'Normal range', NULL)
        );
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL seed_lab_orders();
DROP PROCEDURE seed_lab_orders;

SELECT CONCAT('✅ Inserted ', COUNT(*), ' lab orders') as status FROM lab_orders;

-- ============================================================================
-- STEP 9: Seed Prescriptions (100 prescriptions)
-- ============================================================================

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS seed_prescriptions()
BEGIN
    DECLARE i INT DEFAULT 1;
    
    WHILE i <= 100 DO
        INSERT INTO prescriptions (id, patient_id, provider_id, medication_name, quantity, refills, status, prescribed_date, filled_date)
        VALUES (
            CONCAT('rx_', i),
            CONCAT('pat_', ((i MOD 100) + 1)),
            CONCAT('user_', ((i MOD 10) + 1)),
            ELT((i MOD 10) + 1, 'Aspirin 100mg','Metformin 500mg','Lisinopril 10mg','Atorvastatin 20mg','Amlodipine 5mg','Omeprazole 20mg','Losartan 50mg','Gabapentin 300mg','Levothyroxine 50mcg','Albuterol Inhaler'),
            (i MOD 90) + 10,
            (i MOD 3),
            ELT((i MOD 3) + 1, 'pending','filled','cancelled'),
            DATE_SUB(NOW(), INTERVAL (i MOD 30) DAY),
            IF(i MOD 3 = 1, DATE_SUB(NOW(), INTERVAL (i MOD 20) DAY), NULL)
        );
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL seed_prescriptions();
DROP PROCEDURE seed_prescriptions;

SELECT CONCAT('✅ Inserted ', COUNT(*), ' prescriptions') as status FROM prescriptions;

-- ============================================================================
-- STEP 10: Seed Invoices (100 invoices)
-- ============================================================================

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS seed_invoices()
BEGIN
    DECLARE i INT DEFAULT 1;
    
    WHILE i <= 100 DO
        INSERT INTO invoices (id, invoice_number, patient_id, total_amount, paid_amount, currency, status, due_date)
        VALUES (
            CONCAT('inv_', i),
            CONCAT('INV-2025-', LPAD(i, 5, '0')),
            CONCAT('pat_', ((i MOD 100) + 1)),
            (i MOD 1000) + 100.00,
            IF(i MOD 3 = 0, (i MOD 1000) + 100.00, ((i MOD 1000) + 100.00) * 0.5),
            'SDG',
            ELT((i MOD 4) + 1, 'draft','pending','paid','overdue'),
            DATE_ADD(CURDATE(), INTERVAL (i MOD 60) - 30 DAY)
        );
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL seed_invoices();
DROP PROCEDURE seed_invoices;

SELECT CONCAT('✅ Inserted ', COUNT(*), ' invoices') as status FROM invoices;

-- ============================================================================
-- STEP 11: Seed Tasks (100 tasks for healthcare workers)
-- ============================================================================

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS seed_tasks()
BEGIN
    DECLARE i INT DEFAULT 1;
    
    WHILE i <= 100 DO
        INSERT INTO tasks (id, user_id, title, description, priority, status, due_date)
        VALUES (
            CONCAT('task_', i),
            CONCAT('user_', ((i MOD 10) + 1)),
            CONCAT(ELT((i MOD 5) + 1, 'Review lab results for','Sign discharge summary for','Update medication for','Schedule follow-up for','Call patient'), ' Case ', i),
            'Task details and instructions',
            ELT((i MOD 4) + 1, 'low','medium','high','urgent'),
            ELT((i MOD 4) + 1, 'pending','in_progress','completed','cancelled'),
            DATE_ADD(NOW(), INTERVAL (i MOD 14) DAY)
        );
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL seed_tasks();
DROP PROCEDURE seed_tasks;

SELECT CONCAT('✅ Inserted ', COUNT(*), ' tasks') as status FROM tasks;

-- ============================================================================
-- STEP 12: Final Verification
-- ============================================================================

SELECT '========================================' as '';
SELECT '✅ DATABASE SEEDING COMPLETE!' as status;
SELECT '========================================' as '';

SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'patients', COUNT(*) FROM patients
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'medications', COUNT(*) FROM medications
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'lab_orders', COUNT(*) FROM lab_orders
UNION ALL
SELECT 'prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks;

SELECT '========================================' as '';
SELECT 'Test Login Credentials:' as '';
SELECT 'doctor@nilecare.sd / TestPass123!' as credentials;
SELECT 'nurse@nilecare.sd / TestPass123!' as credentials;
SELECT 'admin@nilecare.sd / TestPass123!' as credentials;
SELECT '========================================' as '';

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

