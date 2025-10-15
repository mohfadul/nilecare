-- =====================================================
-- Appointment Service Additional Tables
-- Tables for appointment-service microservice features
-- =====================================================

USE nilecare;

-- =====================================================
-- APPOINTMENT REMINDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS appointment_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id VARCHAR(50) NOT NULL,
  reminder_type ENUM('email', 'sms', 'push') NOT NULL,
  scheduled_time DATETIME NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_appointment_reminders_scheduled (scheduled_time),
  INDEX idx_appointment_reminders_sent (sent),
  INDEX idx_appointment_reminders_appointment (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Appointment reminder notifications';

-- =====================================================
-- APPOINTMENT WAITLIST TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS appointment_waitlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id VARCHAR(50) NOT NULL,
  provider_id VARCHAR(50) NOT NULL,
  preferred_date DATE NULL,
  reason TEXT NULL,
  status ENUM('waiting', 'contacted', 'scheduled', 'cancelled') DEFAULT 'waiting',
  contacted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_waitlist_patient (patient_id),
  INDEX idx_waitlist_provider (provider_id),
  INDEX idx_waitlist_status (status),
  INDEX idx_waitlist_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Appointment waitlist for when slots are full';

-- =====================================================
-- RESOURCES TABLE (Rooms, Equipment)
-- =====================================================

CREATE TABLE IF NOT EXISTS resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('room', 'equipment', 'facility') NOT NULL,
  description TEXT NULL,
  capacity INT NULL DEFAULT 1,
  status ENUM('available', 'occupied', 'maintenance', 'unavailable') DEFAULT 'available',
  location VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_resources_type (type),
  INDEX idx_resources_status (status),
  INDEX idx_resources_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Facility resources (rooms, equipment)';

-- =====================================================
-- RESOURCE BOOKINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS resource_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resource_id INT NOT NULL,
  appointment_id VARCHAR(50) NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  INDEX idx_resource_bookings_resource (resource_id),
  INDEX idx_resource_bookings_date (booking_date),
  INDEX idx_resource_bookings_status (status),
  INDEX idx_resource_bookings_appointment (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Resource booking and scheduling';

-- =====================================================
-- INSERT SAMPLE RESOURCES
-- =====================================================

INSERT INTO resources (name, type, description, capacity, status, location) VALUES
('Room 101', 'room', 'Consultation Room', 1, 'available', 'First Floor'),
('Room 102', 'room', 'Examination Room', 1, 'available', 'First Floor'),
('Room 201', 'room', 'Procedure Room', 1, 'available', 'Second Floor'),
('Ultrasound Machine 1', 'equipment', 'Portable Ultrasound', 1, 'available', 'Radiology'),
('X-Ray Machine', 'equipment', 'Digital X-Ray', 1, 'available', 'Radiology'),
('ECG Machine', 'equipment', 'Electrocardiogram', 1, 'available', 'Cardiology'),
('Lab Equipment Set', 'equipment', 'Complete Lab Setup', 1, 'available', 'Laboratory'),
('Physical Therapy Room', 'facility', 'Rehabilitation Facility', 5, 'available', 'Ground Floor')
ON DUPLICATE KEY UPDATE id=id;

-- =====================================================
-- VIEWS FOR APPOINTMENT SERVICE
-- =====================================================

-- Available slots view
CREATE OR REPLACE VIEW v_provider_daily_schedule AS
SELECT 
  u.id as provider_id,
  CONCAT(u.first_name, ' ', u.last_name) as provider_name,
  a.appointment_date,
  a.appointment_time,
  a.duration,
  a.status,
  CONCAT(p.first_name, ' ', p.last_name) as patient_name
FROM users u
LEFT JOIN appointments a ON u.id = a.provider_id AND a.status NOT IN ('cancelled', 'no-show')
LEFT JOIN patients p ON a.patient_id = p.id
WHERE u.role IN ('doctor', 'nurse')
ORDER BY u.id, a.appointment_date, a.appointment_time;

-- Waitlist summary
CREATE OR REPLACE VIEW v_waitlist_summary AS
SELECT 
  u.id as provider_id,
  CONCAT(u.first_name, ' ', u.last_name) as provider_name,
  COUNT(*) as waiting_patients,
  MIN(w.created_at) as oldest_request
FROM appointment_waitlist w
JOIN users u ON w.provider_id = u.id
WHERE w.status = 'waiting'
GROUP BY u.id, u.first_name, u.last_name;

-- Reminder statistics
CREATE OR REPLACE VIEW v_reminder_stats AS
SELECT 
  DATE(scheduled_time) as reminder_date,
  reminder_type,
  COUNT(*) as total_reminders,
  SUM(CASE WHEN sent = TRUE THEN 1 ELSE 0 END) as sent_count,
  SUM(CASE WHEN sent = FALSE THEN 1 ELSE 0 END) as pending_count
FROM appointment_reminders
GROUP BY DATE(scheduled_time), reminder_type
ORDER BY reminder_date DESC;

-- =====================================================
-- STORED PROCEDURES FOR APPOINTMENT SERVICE
-- =====================================================

-- Note: Stored procedures removed for compatibility
-- Can be added later if needed

-- =====================================================
-- USAGE NOTES
-- =====================================================

/*
-- Schedule a reminder
INSERT INTO appointment_reminders (appointment_id, reminder_type, scheduled_time)
VALUES (123, 'email', DATE_SUB('2025-10-15 10:00:00', INTERVAL 24 HOUR));

-- Add to waitlist
INSERT INTO appointment_waitlist (patient_id, provider_id, reason)
VALUES (456, 789, 'Regular checkup');

-- Book a resource
INSERT INTO resource_bookings (resource_id, appointment_id, booking_date, start_time, end_time)
VALUES (1, 123, '2025-10-15', '10:00:00', '11:00:00');

-- View provider schedule
SELECT * FROM v_provider_daily_schedule WHERE appointment_date = CURDATE();

-- View waitlist
SELECT * FROM v_waitlist_summary;
*/

