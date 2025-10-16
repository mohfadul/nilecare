-- ============================================================================
-- Appointment Service - Initial Schema
-- Version: 1
-- Description: Create dedicated appointment service database with all tables
-- Author: Database Team
-- Date: 2025-10-16
-- Database: appointment_db (separate from shared nilecare DB)
-- ============================================================================

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  appointment_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Patient & Provider (references to other services)
  patient_id CHAR(36) NOT NULL COMMENT 'Reference to clinical service',
  provider_id CHAR(36) NOT NULL COMMENT 'Reference to auth service',
  
  -- Facility & Location
  facility_id CHAR(36) NOT NULL COMMENT 'Reference to facility service',
  department_id CHAR(36),
  room_number VARCHAR(20),
  
  -- Organization (multi-tenancy)
  organization_id CHAR(36) NOT NULL,
  
  -- Appointment Details
  appointment_type ENUM('consultation', 'follow_up', 'procedure', 'lab', 'imaging', 'emergency', 'telehealth') NOT NULL,
  status ENUM('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled') NOT NULL DEFAULT 'scheduled',
  priority ENUM('routine', 'urgent', 'emergency') DEFAULT 'routine',
  
  -- Timing
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  actual_start_time TIMESTAMP NULL,
  actual_end_time TIMESTAMP NULL,
  
  -- Reason & Notes
  chief_complaint TEXT,
  reason TEXT,
  notes TEXT,
  cancellation_reason TEXT,
  
  -- Notifications
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP NULL,
  confirmation_sent BOOLEAN DEFAULT FALSE,
  
  -- Audit columns
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  deleted_by CHAR(36),
  
  -- Indexes
  INDEX idx_appointments_patient (patient_id),
  INDEX idx_appointments_provider (provider_id),
  INDEX idx_appointments_facility (facility_id),
  INDEX idx_appointments_organization (organization_id),
  INDEX idx_appointments_scheduled_at (scheduled_at),
  INDEX idx_appointments_status (status),
  INDEX idx_appointments_deleted_at (deleted_at),
  INDEX idx_appointments_number (appointment_number)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Appointment scheduling and management';

-- ============================================================================
-- SCHEDULES TABLE (Provider availability)
-- ============================================================================
CREATE TABLE IF NOT EXISTS schedules (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  provider_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  
  -- Schedule Details
  day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 30,
  
  -- Validity
  valid_from DATE NOT NULL,
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Exceptions
  recurring BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  deleted_by CHAR(36),
  
  INDEX idx_schedules_provider (provider_id),
  INDEX idx_schedules_facility (facility_id),
  INDEX idx_schedules_organization (organization_id),
  INDEX idx_schedules_day (day_of_week),
  INDEX idx_schedules_active (is_active),
  INDEX idx_schedules_deleted_at (deleted_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Provider availability schedules';

-- ============================================================================
-- WAITLIST TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS waitlist (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id CHAR(36) NOT NULL,
  provider_id CHAR(36),
  appointment_type VARCHAR(50) NOT NULL,
  preferred_date DATE,
  preferred_time_slot ENUM('morning', 'afternoon', 'evening', 'any') DEFAULT 'any',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('waiting', 'notified', 'scheduled', 'expired') DEFAULT 'waiting',
  organization_id CHAR(36) NOT NULL,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  created_by CHAR(36),
  deleted_by CHAR(36),
  
  INDEX idx_waitlist_patient (patient_id),
  INDEX idx_waitlist_provider (provider_id),
  INDEX idx_waitlist_status (status),
  INDEX idx_waitlist_priority (priority),
  INDEX idx_waitlist_organization (organization_id),
  INDEX idx_waitlist_deleted_at (deleted_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Appointment waitlist for scheduling';

-- ============================================================================
-- REMINDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reminders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  appointment_id CHAR(36) NOT NULL,
  reminder_type ENUM('email', 'sms', 'push', 'phone') NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP NULL,
  status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  created_by CHAR(36),
  
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_reminders_appointment (appointment_id),
  INDEX idx_reminders_scheduled (scheduled_for),
  INDEX idx_reminders_status (status)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Appointment reminders';

-- ============================================================================
-- APPOINTMENT_RESOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointment_resources (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  appointment_id CHAR(36) NOT NULL,
  resource_type ENUM('room', 'equipment', 'staff', 'other') NOT NULL,
  resource_id CHAR(36) NOT NULL,
  resource_name VARCHAR(255),
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_resources_appointment (appointment_id),
  INDEX idx_resources_type (resource_type)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Resources allocated to appointments';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SHOW TABLES;

SELECT 
  TABLE_NAME, 
  TABLE_ROWS 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'appointment_db';

