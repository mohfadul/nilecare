-- ============================================================================
-- HL7 Service - Initial Schema Migration
-- Version: 1
-- Description: Create HL7 message processing tables
-- Author: Database Team
-- Date: 2025-10-15
-- Ticket: DB-009
-- ============================================================================

-- ============================================================================
-- HL7 MESSAGES TABLE (Master)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hl7_messages (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  message_id VARCHAR(100) UNIQUE NOT NULL COMMENT 'HL7 Message Control ID',
  
  -- Message Type
  message_type VARCHAR(10) NOT NULL COMMENT 'ADT, ORM, ORU, etc.',
  trigger_event VARCHAR(10) NOT NULL COMMENT 'A01, A08, O01, R01, etc.',
  message_version VARCHAR(10) DEFAULT '2.5.1',
  
  -- Source/Destination
  sending_application VARCHAR(255),
  sending_facility VARCHAR(255),
  receiving_application VARCHAR(255),
  receiving_facility VARCHAR(255),
  
  -- Message Content
  raw_message TEXT NOT NULL COMMENT 'Complete HL7 message',
  parsed_segments JSON COMMENT 'Parsed HL7 segments',
  
  -- Processing
  status ENUM('received', 'parsing', 'parsed', 'processing', 'processed', 'error', 'rejected') DEFAULT 'received',
  processing_errors JSON COMMENT 'Array of processing errors',
  
  -- Timestamps
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  parsed_at DATETIME,
  processed_at DATETIME,
  
  -- References
  patient_id CHAR(36) COMMENT 'Linked patient in clinical service',
  encounter_id CHAR(36) COMMENT 'Linked encounter',
  
  -- Acknowledgment
  ack_sent BOOLEAN DEFAULT FALSE,
  ack_sent_at DATETIME,
  ack_code VARCHAR(10) COMMENT 'AA, AE, AR',
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_hl7_messages_message_id (message_id),
  INDEX idx_hl7_messages_type (message_type, trigger_event),
  INDEX idx_hl7_messages_status (status),
  INDEX idx_hl7_messages_received_at (received_at),
  INDEX idx_hl7_messages_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='HL7 messages master table';

-- ============================================================================
-- ADT MESSAGES TABLE (Admit, Discharge, Transfer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS adt_messages (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  hl7_message_id CHAR(36) NOT NULL,
  
  -- Patient Demographics
  mrn VARCHAR(50),
  patient_name VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(10),
  
  -- Event Details
  event_type VARCHAR(10) NOT NULL COMMENT 'A01, A02, A03, A08, etc.',
  event_datetime DATETIME NOT NULL,
  
  -- Location
  facility_code VARCHAR(50),
  department_code VARCHAR(50),
  room_number VARCHAR(50),
  bed_number VARCHAR(50),
  
  -- Provider
  attending_physician VARCHAR(255),
  referring_physician VARCHAR(255),
  
  -- Parsed Data
  parsed_data JSON COMMENT 'Complete parsed ADT data',
  
  -- Processing
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at DATETIME,
  
  -- Foreign Keys
  FOREIGN KEY (hl7_message_id) REFERENCES hl7_messages(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_adt_messages_hl7 (hl7_message_id),
  INDEX idx_adt_messages_mrn (mrn),
  INDEX idx_adt_messages_event_type (event_type),
  INDEX idx_adt_messages_event_datetime (event_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ADT (Admit/Discharge/Transfer) messages';

-- ============================================================================
-- ORM MESSAGES TABLE (Order Messages)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orm_messages (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  hl7_message_id CHAR(36) NOT NULL,
  
  -- Order Details
  order_number VARCHAR(50),
  order_type VARCHAR(50),
  order_status VARCHAR(50),
  
  -- Patient
  mrn VARCHAR(50),
  
  -- Order Information
  service_code VARCHAR(50),
  service_description TEXT,
  order_datetime DATETIME,
  
  -- Provider
  ordering_physician VARCHAR(255),
  
  -- Parsed Data
  parsed_data JSON,
  
  -- Processing
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at DATETIME,
  
  -- Foreign Keys
  FOREIGN KEY (hl7_message_id) REFERENCES hl7_messages(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_orm_messages_hl7 (hl7_message_id),
  INDEX idx_orm_messages_order_number (order_number),
  INDEX idx_orm_messages_mrn (mrn),
  INDEX idx_orm_messages_order_datetime (order_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ORM (Order) messages';

-- ============================================================================
-- ORU MESSAGES TABLE (Observation Results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS oru_messages (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  hl7_message_id CHAR(36) NOT NULL,
  
  -- Order Reference
  order_number VARCHAR(50),
  
  -- Patient
  mrn VARCHAR(50),
  
  -- Results
  observation_datetime DATETIME,
  observation_results JSON COMMENT 'Array of OBX segments',
  
  -- Status
  result_status VARCHAR(10) COMMENT 'F=Final, P=Preliminary, C=Corrected',
  
  -- Parsed Data
  parsed_data JSON,
  
  -- Processing
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at DATETIME,
  
  -- Foreign Keys
  FOREIGN KEY (hl7_message_id) REFERENCES hl7_messages(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_oru_messages_hl7 (hl7_message_id),
  INDEX idx_oru_messages_order_number (order_number),
  INDEX idx_oru_messages_mrn (mrn),
  INDEX idx_oru_messages_observation_datetime (observation_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ORU (Observation Results) messages';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Recent HL7 Messages View
CREATE OR REPLACE VIEW v_recent_hl7_messages AS
SELECT 
  id,
  message_id,
  message_type,
  trigger_event,
  sending_facility,
  status,
  received_at,
  processed_at
FROM hl7_messages
WHERE received_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY received_at DESC;

-- Failed HL7 Messages View
CREATE OR REPLACE VIEW v_failed_hl7_messages AS
SELECT 
  id,
  message_id,
  message_type,
  trigger_event,
  status,
  processing_errors,
  received_at
FROM hl7_messages
WHERE status IN ('error', 'rejected')
  AND received_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY received_at DESC;

-- Log migration completion
SELECT 'Migration V1__Initial_hl7_schema completed successfully' as status;

