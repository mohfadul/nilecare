-- ============================================================================
-- NileCare HL7 Service - Database Schema
-- PostgreSQL 15+
-- Version: 1.0.0
-- HL7 v2.x Message Storage
-- ============================================================================

DROP TABLE IF EXISTS hl7_message_log CASCADE;
DROP TABLE IF EXISTS hl7_messages CASCADE;

-- ============================================================================
-- HL7 MESSAGES TABLE
-- Stores all HL7 v2.x messages
-- ============================================================================

CREATE TABLE hl7_messages (
    id SERIAL PRIMARY KEY,
    message_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    message_type VARCHAR(50) NOT NULL,
    message_control_id VARCHAR(100) NOT NULL,
    sending_application VARCHAR(255),
    sending_facility VARCHAR(255),
    receiving_application VARCHAR(255),
    receiving_facility VARCHAR(255),
    message_timestamp TIMESTAMP NOT NULL,
    version VARCHAR(10) DEFAULT '2.5',
    message_data JSONB NOT NULL,
    facility_id UUID NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    ack_status VARCHAR(10),
    ack_message TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hl7_message_id ON hl7_messages(message_id);
CREATE INDEX idx_hl7_message_type ON hl7_messages(message_type);
CREATE INDEX idx_hl7_control_id ON hl7_messages(message_control_id);
CREATE INDEX idx_hl7_facility ON hl7_messages(facility_id);
CREATE INDEX idx_hl7_processed ON hl7_messages(processed);
CREATE INDEX idx_hl7_timestamp ON hl7_messages(message_timestamp);
CREATE INDEX idx_hl7_message_data ON hl7_messages USING gin(message_data);

-- ============================================================================
-- HL7 MESSAGE LOG TABLE
-- Audit trail for all HL7 operations
-- ============================================================================

CREATE TABLE hl7_message_log (
    id SERIAL PRIMARY KEY,
    log_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES hl7_messages(message_id),
    event_type VARCHAR(100) NOT NULL,
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
    source_system VARCHAR(255),
    destination_system VARCHAR(255),
    user_id UUID,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hl7_log_message ON hl7_message_log(message_id);
CREATE INDEX idx_hl7_log_event ON hl7_message_log(event_type);
CREATE INDEX idx_hl7_log_direction ON hl7_message_log(direction);
CREATE INDEX idx_hl7_log_created ON hl7_message_log(created_at);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample HL7 message (for testing)
INSERT INTO hl7_messages (
    message_id,
    message_type,
    message_control_id,
    sending_application,
    sending_facility,
    receiving_application,
    receiving_facility,
    message_timestamp,
    message_data,
    facility_id,
    processed
) VALUES (
    '550e8400-e29b-41d4-a716-446655440200',
    'ADT^A01',
    'MSG0001',
    'EXTERNAL_LAB',
    'LAB_FACILITY',
    'NILECARE',
    'NILECARE_HL7',
    NOW(),
    '{"messageType": "ADT^A01", "segments": []}',
    '550e8400-e29b-41d4-a716-446655440000',
    false
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE hl7_messages IS 'HL7 v2.x messages storage';
COMMENT ON TABLE hl7_message_log IS 'Audit trail for HL7 operations';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

