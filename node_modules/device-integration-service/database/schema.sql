-- ============================================
-- NILECARE DEVICE INTEGRATION SERVICE SCHEMA
-- ============================================
-- Description: Database schema for medical device integration
-- Version: 1.0.0
-- Date: 2025-10-15

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- ============================================
-- DEVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
    device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) NOT NULL, -- 'vital_monitor', 'infusion_pump', 'ventilator', 'ecg', 'pulse_oximeter', 'blood_pressure', 'lab_analyzer', 'imaging'
    manufacturer VARCHAR(255),
    model_number VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    protocol VARCHAR(50) NOT NULL, -- 'mqtt', 'serial', 'modbus', 'websocket', 'hl7', 'fhir', 'bluetooth', 'usb'
    firmware_version VARCHAR(50),
    
    -- Connection Parameters (JSONB for flexibility)
    connection_params JSONB NOT NULL,
    
    -- Status and Assignment
    status VARCHAR(50) DEFAULT 'inactive', -- 'active', 'inactive', 'maintenance', 'error', 'decommissioned'
    facility_id UUID NOT NULL,
    linked_patient_id UUID,
    location VARCHAR(255),
    
    -- Operational Data
    last_sync_time TIMESTAMP,
    last_seen TIMESTAMP,
    last_heartbeat TIMESTAMP,
    battery_level INTEGER,
    signal_strength INTEGER,
    
    -- Calibration
    calibration_date TIMESTAMP,
    next_calibration_due TIMESTAMP,
    calibration_status VARCHAR(50) DEFAULT 'valid', -- 'valid', 'due', 'overdue', 'failed'
    
    -- Alert Configuration
    alert_thresholds JSONB,
    
    -- Metadata
    metadata JSONB,
    payload JSONB,
    
    -- Audit Fields
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL,
    
    -- Indexes
    CONSTRAINT fk_facility FOREIGN KEY (facility_id) REFERENCES facilities(facility_id) ON DELETE CASCADE
);

CREATE INDEX idx_devices_facility ON devices(facility_id);
CREATE INDEX idx_devices_patient ON devices(linked_patient_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_type ON devices(device_type);
CREATE INDEX idx_devices_tenant ON devices(tenant_id);
CREATE INDEX idx_devices_last_seen ON devices(last_seen DESC);

-- ============================================
-- VITAL SIGNS TIME-SERIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vital_signs_timeseries (
    observation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    observation_time TIMESTAMP NOT NULL,
    
    -- Vital Signs
    temperature DECIMAL(4, 1),
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    oxygen_saturation INTEGER,
    pulse_rate INTEGER,
    
    -- Data Quality
    signal_quality VARCHAR(50), -- 'excellent', 'good', 'fair', 'poor', 'no_signal'
    lead_off BOOLEAN DEFAULT FALSE,
    artifacts BOOLEAN DEFAULT FALSE,
    confidence INTEGER,
    
    -- Waveform Data (if applicable)
    waveform_data JSONB,
    
    -- Metadata
    metadata JSONB,
    tenant_id UUID NOT NULL,
    
    -- Indexes
    CONSTRAINT fk_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('vital_signs_timeseries', 'observation_time', if_not_exists => TRUE);

CREATE INDEX idx_vital_signs_device ON vital_signs_timeseries(device_id, observation_time DESC);
CREATE INDEX idx_vital_signs_patient ON vital_signs_timeseries(patient_id, observation_time DESC);
CREATE INDEX idx_vital_signs_tenant ON vital_signs_timeseries(tenant_id, observation_time DESC);

-- ============================================
-- DEVICE ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS device_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    
    -- Alert Details
    alert_type VARCHAR(100) NOT NULL, -- 'critical_value', 'device_malfunction', 'lead_off', 'battery_low', 'calibration_required'
    severity VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    parameter VARCHAR(100),
    value DECIMAL(10, 2),
    threshold DECIMAL(10, 2),
    message TEXT NOT NULL,
    
    -- Alert Status
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    
    -- Notification Status
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels JSONB, -- ['email', 'sms', 'push', 'whatsapp']
    
    -- Timestamps
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL,
    
    CONSTRAINT fk_alert_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

CREATE INDEX idx_device_alerts_device ON device_alerts(device_id, timestamp DESC);
CREATE INDEX idx_device_alerts_patient ON device_alerts(patient_id, timestamp DESC);
CREATE INDEX idx_device_alerts_severity ON device_alerts(severity, acknowledged);
CREATE INDEX idx_device_alerts_type ON device_alerts(alert_type);
CREATE INDEX idx_device_alerts_tenant ON device_alerts(tenant_id);

-- ============================================
-- DEVICE STATUS HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS device_status_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL,
    
    -- Status Change
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    change_reason TEXT,
    
    -- Connection Info
    connection_quality INTEGER, -- 0-100
    error_message TEXT,
    error_code VARCHAR(50),
    
    -- Metadata
    metadata JSONB,
    
    -- Audit
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL,
    
    CONSTRAINT fk_status_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

CREATE INDEX idx_device_status_history_device ON device_status_history(device_id, changed_at DESC);
CREATE INDEX idx_device_status_history_tenant ON device_status_history(tenant_id);

-- ============================================
-- DEVICE COMMUNICATION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS device_communication_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL,
    
    -- Communication Details
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    protocol VARCHAR(50) NOT NULL,
    message_type VARCHAR(100),
    payload JSONB,
    raw_message TEXT,
    
    -- Status
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    response_time_ms INTEGER,
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL,
    
    CONSTRAINT fk_comm_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

CREATE INDEX idx_device_comm_logs_device ON device_communication_logs(device_id, logged_at DESC);
CREATE INDEX idx_device_comm_logs_direction ON device_communication_logs(direction);
CREATE INDEX idx_device_comm_logs_success ON device_communication_logs(success);
CREATE INDEX idx_device_comm_logs_tenant ON device_communication_logs(tenant_id);

-- ============================================
-- FHIR RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fhir_resources (
    resource_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fhir_id VARCHAR(255) UNIQUE,
    resource_type VARCHAR(100) NOT NULL, -- 'Observation', 'Device', 'DeviceMetric'
    device_id UUID,
    patient_id UUID,
    
    -- FHIR Data
    resource_data JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'entered-in-error', 'superseded'
    
    -- Sync Status
    synced_to_fhir_server BOOLEAN DEFAULT FALSE,
    sync_error TEXT,
    last_sync_attempt TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL,
    
    CONSTRAINT fk_fhir_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE SET NULL
);

CREATE INDEX idx_fhir_resources_device ON fhir_resources(device_id);
CREATE INDEX idx_fhir_resources_patient ON fhir_resources(patient_id);
CREATE INDEX idx_fhir_resources_type ON fhir_resources(resource_type);
CREATE INDEX idx_fhir_resources_sync ON fhir_resources(synced_to_fhir_server);
CREATE INDEX idx_fhir_resources_tenant ON fhir_resources(tenant_id);

-- ============================================
-- DEVICE CALIBRATION RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS device_calibration_records (
    calibration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL,
    
    -- Calibration Details
    calibration_type VARCHAR(100), -- 'routine', 'emergency', 'post-maintenance'
    performed_by UUID NOT NULL,
    results JSONB,
    passed BOOLEAN NOT NULL,
    notes TEXT,
    
    -- Certification
    certificate_number VARCHAR(100),
    certified_by VARCHAR(255),
    certification_file_url TEXT,
    
    -- Next Calibration
    next_due_date DATE,
    
    -- Timestamps
    calibration_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL,
    
    CONSTRAINT fk_calibration_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

CREATE INDEX idx_device_calibration_device ON device_calibration_records(device_id, calibration_date DESC);
CREATE INDEX idx_device_calibration_due ON device_calibration_records(next_due_date);
CREATE INDEX idx_device_calibration_tenant ON device_calibration_records(tenant_id);

-- ============================================
-- DEVICE MAINTENANCE RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS device_maintenance_records (
    maintenance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL,
    
    -- Maintenance Details
    maintenance_type VARCHAR(100), -- 'preventive', 'corrective', 'emergency'
    description TEXT NOT NULL,
    performed_by UUID NOT NULL,
    duration_minutes INTEGER,
    cost DECIMAL(10, 2),
    
    -- Parts/Components
    parts_replaced JSONB,
    parts_cost DECIMAL(10, 2),
    
    -- Results
    issues_found TEXT,
    actions_taken TEXT,
    status VARCHAR(50) DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    
    -- Next Maintenance
    next_maintenance_date DATE,
    
    -- Timestamps
    scheduled_date TIMESTAMP,
    performed_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL,
    
    CONSTRAINT fk_maintenance_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

CREATE INDEX idx_device_maintenance_device ON device_maintenance_records(device_id, performed_date DESC);
CREATE INDEX idx_device_maintenance_status ON device_maintenance_records(status);
CREATE INDEX idx_device_maintenance_tenant ON device_maintenance_records(tenant_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fhir_resources_updated_at BEFORE UPDATE ON fhir_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Active Devices by Facility
CREATE OR REPLACE VIEW v_active_devices_by_facility AS
SELECT 
    f.facility_id,
    f.facility_name,
    d.device_type,
    COUNT(*) as device_count,
    COUNT(CASE WHEN d.status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN d.status = 'error' THEN 1 END) as error_count
FROM devices d
JOIN facilities f ON d.facility_id = f.facility_id
GROUP BY f.facility_id, f.facility_name, d.device_type;

-- Recent Alerts Summary
CREATE OR REPLACE VIEW v_recent_alerts_summary AS
SELECT 
    d.device_id,
    d.device_name,
    d.facility_id,
    a.alert_type,
    a.severity,
    COUNT(*) as alert_count,
    MAX(a.timestamp) as last_alert_time
FROM device_alerts a
JOIN devices d ON a.device_id = d.device_id
WHERE a.timestamp >= NOW() - INTERVAL '24 hours'
    AND a.acknowledged = FALSE
GROUP BY d.device_id, d.device_name, d.facility_id, a.alert_type, a.severity;

-- Device Health Status
CREATE OR REPLACE VIEW v_device_health_status AS
SELECT 
    d.device_id,
    d.device_name,
    d.device_type,
    d.facility_id,
    d.status,
    d.last_seen,
    d.battery_level,
    d.signal_strength,
    d.calibration_status,
    d.next_calibration_due,
    CASE 
        WHEN d.last_seen < NOW() - INTERVAL '5 minutes' THEN 'offline'
        WHEN d.battery_level < 20 THEN 'low_battery'
        WHEN d.calibration_status = 'overdue' THEN 'calibration_overdue'
        WHEN d.status = 'error' THEN 'error'
        ELSE 'healthy'
    END as health_status
FROM devices d;

-- ============================================
-- GRANTS (Adjust based on your user management)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nilecare_device_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nilecare_device_user;

-- ============================================
-- DATA RETENTION POLICIES (TimescaleDB)
-- ============================================
-- Keep vital signs data for 1 year
SELECT add_retention_policy('vital_signs_timeseries', INTERVAL '365 days', if_not_exists => TRUE);

-- ============================================
-- INITIAL DATA / SEED (if needed)
-- ============================================
-- INSERT INTO device_types (name, description) VALUES ...

COMMENT ON TABLE devices IS 'Medical device registry with connection and configuration details';
COMMENT ON TABLE vital_signs_timeseries IS 'Time-series storage for real-time vital signs data from medical devices';
COMMENT ON TABLE device_alerts IS 'Alert tracking for critical values and device malfunctions';
COMMENT ON TABLE device_communication_logs IS 'Audit log of all device communication for compliance and troubleshooting';
COMMENT ON TABLE fhir_resources IS 'FHIR-compliant observations and device resources for interoperability';

