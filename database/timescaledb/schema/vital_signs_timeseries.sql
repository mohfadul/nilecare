-- =====================================================
-- TimescaleDB Schema for Vital Signs Time-Series Data
-- Purpose: High-frequency vital signs monitoring
-- Sudan-specific: Optimized for Sudan healthcare facilities
-- =====================================================

-- Create TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- =====================================================
-- VITAL SIGNS TIME-SERIES TABLE
-- =====================================================

CREATE TABLE vital_signs_timeseries (
  observation_time TIMESTAMPTZ NOT NULL,
  device_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  facility_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  -- Vital Signs
  temperature NUMERIC(4,1),
  heart_rate INTEGER,
  respiratory_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  oxygen_saturation NUMERIC(5,2),
  pulse_rate INTEGER,
  -- Additional Parameters
  mean_arterial_pressure NUMERIC(5,1) GENERATED ALWAYS AS (
    (blood_pressure_systolic + 2 * blood_pressure_diastolic) / 3.0
  ) STORED,
  pulse_pressure INTEGER GENERATED ALWAYS AS (
    blood_pressure_systolic - blood_pressure_diastolic
  ) STORED,
  -- Data Quality
  signal_quality VARCHAR(20) CHECK (signal_quality IN ('excellent', 'good', 'fair', 'poor', 'no_signal')),
  lead_off BOOLEAN DEFAULT FALSE,
  artifacts BOOLEAN DEFAULT FALSE,
  confidence NUMERIC(5,2) CHECK (confidence BETWEEN 0 AND 100),
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable (TimescaleDB)
SELECT create_hypertable(
  'vital_signs_timeseries',
  'observation_time',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- Create indexes
CREATE INDEX idx_vital_signs_device ON vital_signs_timeseries (device_id, observation_time DESC);
CREATE INDEX idx_vital_signs_patient ON vital_signs_timeseries (patient_id, observation_time DESC);
CREATE INDEX idx_vital_signs_facility ON vital_signs_timeseries (facility_id, observation_time DESC);

-- =====================================================
-- CONTINUOUS AGGREGATES (Materialized Views)
-- =====================================================

-- Hourly averages
CREATE MATERIALIZED VIEW vital_signs_hourly
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 hour', observation_time) AS hour,
  device_id,
  patient_id,
  facility_id,
  COUNT(*) as sample_count,
  AVG(temperature) as avg_temperature,
  MIN(temperature) as min_temperature,
  MAX(temperature) as max_temperature,
  AVG(heart_rate) as avg_heart_rate,
  MIN(heart_rate) as min_heart_rate,
  MAX(heart_rate) as max_heart_rate,
  AVG(blood_pressure_systolic) as avg_bp_systolic,
  AVG(blood_pressure_diastolic) as avg_bp_diastolic,
  AVG(oxygen_saturation) as avg_oxygen_saturation,
  MIN(oxygen_saturation) as min_oxygen_saturation,
  AVG(respiratory_rate) as avg_respiratory_rate
FROM vital_signs_timeseries
GROUP BY hour, device_id, patient_id, facility_id
WITH NO DATA;

-- Refresh policy (update every 10 minutes)
SELECT add_continuous_aggregate_policy('vital_signs_hourly',
  start_offset => INTERVAL '2 hours',
  end_offset => INTERVAL '10 minutes',
  schedule_interval => INTERVAL '10 minutes');

-- Daily averages
CREATE MATERIALIZED VIEW vital_signs_daily
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 day', observation_time) AS day,
  patient_id,
  facility_id,
  COUNT(*) as sample_count,
  AVG(temperature) as avg_temperature,
  STDDEV(temperature) as stddev_temperature,
  AVG(heart_rate) as avg_heart_rate,
  STDDEV(heart_rate) as stddev_heart_rate,
  AVG(blood_pressure_systolic) as avg_bp_systolic,
  AVG(blood_pressure_diastolic) as avg_bp_diastolic,
  AVG(oxygen_saturation) as avg_oxygen_saturation,
  AVG(respiratory_rate) as avg_respiratory_rate
FROM vital_signs_timeseries
GROUP BY day, patient_id, facility_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('vital_signs_daily',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- =====================================================
-- DEVICE ALERTS TABLE
-- =====================================================

CREATE TABLE device_alerts (
  alert_time TIMESTAMPTZ NOT NULL,
  alert_id UUID NOT NULL,
  device_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  facility_id UUID NOT NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'critical_value', 'device_malfunction', 'lead_off', 'battery_low', 'calibration_required'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  parameter VARCHAR(50),
  value NUMERIC(10,2),
  threshold NUMERIC(10,2),
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable(
  'device_alerts',
  'alert_time',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

CREATE INDEX idx_device_alerts_device ON device_alerts (device_id, alert_time DESC);
CREATE INDEX idx_device_alerts_patient ON device_alerts (patient_id, alert_time DESC);
CREATE INDEX idx_device_alerts_severity ON device_alerts (severity, alert_time DESC) WHERE acknowledged = FALSE;

-- =====================================================
-- DEVICE STATUS TABLE
-- =====================================================

CREATE TABLE device_status (
  status_time TIMESTAMPTZ NOT NULL,
  device_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('connected', 'disconnected', 'error', 'maintenance')),
  battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
  signal_strength INTEGER CHECK (signal_strength BETWEEN 0 AND 100),
  firmware_version VARCHAR(50),
  last_calibration_date DATE,
  next_calibration_due DATE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable(
  'device_status',
  'status_time',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

CREATE INDEX idx_device_status_device ON device_status (device_id, status_time DESC);

-- =====================================================
-- COMPRESSION POLICIES
-- =====================================================

-- Compress data older than 7 days
SELECT add_compression_policy('vital_signs_timeseries', INTERVAL '7 days');
SELECT add_compression_policy('device_alerts', INTERVAL '7 days');
SELECT add_compression_policy('device_status', INTERVAL '7 days');

-- =====================================================
-- RETENTION POLICIES
-- =====================================================

-- Drop raw vital signs data older than 2 years (keep aggregates)
SELECT add_retention_policy('vital_signs_timeseries', INTERVAL '2 years');

-- Drop device alerts older than 1 year
SELECT add_retention_policy('device_alerts', INTERVAL '1 year');

-- Drop device status older than 90 days
SELECT add_retention_policy('device_status', INTERVAL '90 days');

-- =====================================================
-- ANALYSIS FUNCTIONS
-- =====================================================

-- Get vital signs for patient in time range
CREATE OR REPLACE FUNCTION get_patient_vital_signs(
  p_patient_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
  observation_time TIMESTAMPTZ,
  temperature NUMERIC,
  heart_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  oxygen_saturation NUMERIC,
  respiratory_rate INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vs.observation_time,
    vs.temperature,
    vs.heart_rate,
    vs.blood_pressure_systolic,
    vs.blood_pressure_diastolic,
    vs.oxygen_saturation,
    vs.respiratory_rate
  FROM vital_signs_timeseries vs
  WHERE vs.patient_id = p_patient_id
    AND vs.observation_time BETWEEN p_start_time AND p_end_time
  ORDER BY vs.observation_time;
END;
$$ LANGUAGE plpgsql;

-- Get average vital signs per hour
CREATE OR REPLACE FUNCTION get_hourly_averages(
  p_patient_id UUID,
  p_date DATE
)
RETURNS TABLE (
  hour TIMESTAMPTZ,
  avg_heart_rate NUMERIC,
  avg_blood_pressure NUMERIC,
  avg_oxygen_saturation NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    time_bucket('1 hour', observation_time) AS hour,
    AVG(heart_rate) as avg_heart_rate,
    AVG((blood_pressure_systolic + blood_pressure_diastolic) / 2.0) as avg_blood_pressure,
    AVG(oxygen_saturation) as avg_oxygen_saturation
  FROM vital_signs_timeseries
  WHERE patient_id = p_patient_id
    AND observation_time >= p_date::TIMESTAMPTZ
    AND observation_time < (p_date + INTERVAL '1 day')::TIMESTAMPTZ
  GROUP BY hour
  ORDER BY hour;
END;
$$ LANGUAGE plpgsql;

-- Detect vital signs trends
CREATE OR REPLACE FUNCTION detect_vital_trends(
  p_patient_id UUID,
  p_parameter VARCHAR(50),
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  trend VARCHAR(20),
  change_percentage NUMERIC,
  current_value NUMERIC,
  previous_value NUMERIC
) AS $$
DECLARE
  current_avg NUMERIC;
  previous_avg NUMERIC;
  change_pct NUMERIC;
  trend_direction VARCHAR(20);
BEGIN
  -- Get current period average
  EXECUTE format('
    SELECT AVG(%I)
    FROM vital_signs_timeseries
    WHERE patient_id = $1
      AND observation_time > NOW() - INTERVAL ''%s hours''
  ', p_parameter, p_hours / 2)
  INTO current_avg
  USING p_patient_id;

  -- Get previous period average
  EXECUTE format('
    SELECT AVG(%I)
    FROM vital_signs_timeseries
    WHERE patient_id = $1
      AND observation_time BETWEEN NOW() - INTERVAL ''%s hours'' AND NOW() - INTERVAL ''%s hours''
  ', p_parameter, p_hours, p_hours / 2)
  INTO previous_avg
  USING p_patient_id;

  -- Calculate change
  IF previous_avg IS NOT NULL AND previous_avg != 0 THEN
    change_pct := ((current_avg - previous_avg) / previous_avg) * 100;
    
    IF ABS(change_pct) < 5 THEN
      trend_direction := 'stable';
    ELSIF change_pct > 0 THEN
      trend_direction := 'increasing';
    ELSE
      trend_direction := 'decreasing';
    END IF;
  ELSE
    trend_direction := 'insufficient_data';
    change_pct := 0;
  END IF;

  RETURN QUERY
  SELECT 
    trend_direction,
    change_pct,
    current_avg,
    previous_avg;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Current vital signs (last reading per patient)
CREATE OR REPLACE VIEW v_current_vital_signs AS
SELECT DISTINCT ON (patient_id)
  patient_id,
  device_id,
  observation_time,
  temperature,
  heart_rate,
  blood_pressure_systolic,
  blood_pressure_diastolic,
  oxygen_saturation,
  respiratory_rate,
  signal_quality
FROM vital_signs_timeseries
ORDER BY patient_id, observation_time DESC;

-- Active critical alerts
CREATE OR REPLACE VIEW v_active_critical_alerts AS
SELECT 
  alert_id,
  device_id,
  patient_id,
  alert_type,
  severity,
  parameter,
  value,
  threshold,
  message,
  alert_time,
  AGE(NOW(), alert_time) as alert_age
FROM device_alerts
WHERE acknowledged = FALSE
  AND severity IN ('high', 'critical')
  AND alert_time > NOW() - INTERVAL '1 hour'
ORDER BY severity DESC, alert_time DESC;

-- Device connectivity status
CREATE OR REPLACE VIEW v_device_connectivity AS
SELECT DISTINCT ON (device_id)
  device_id,
  status,
  status_time,
  battery_level,
  signal_strength,
  AGE(NOW(), status_time) as time_since_update
FROM device_status
ORDER BY device_id, status_time DESC;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Create device integration user
CREATE USER IF NOT EXISTS nilecare_devices WITH PASSWORD 'nilecare_devices_password';
GRANT CONNECT ON DATABASE timescaledb TO nilecare_devices;
GRANT SELECT, INSERT ON vital_signs_timeseries TO nilecare_devices;
GRANT SELECT, INSERT, UPDATE ON device_alerts TO nilecare_devices;
GRANT SELECT, INSERT ON device_status TO nilecare_devices;
GRANT SELECT ON vital_signs_hourly TO nilecare_devices;
GRANT SELECT ON vital_signs_daily TO nilecare_devices;
GRANT SELECT ON v_current_vital_signs TO nilecare_devices;
GRANT SELECT ON v_active_critical_alerts TO nilecare_devices;
GRANT SELECT ON v_device_connectivity TO nilecare_devices;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
-- Insert vital signs
INSERT INTO vital_signs_timeseries (
  observation_time, device_id, patient_id, facility_id, tenant_id,
  temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic,
  oxygen_saturation, respiratory_rate, signal_quality
) VALUES (
  NOW(),
  'device-uuid',
  'patient-uuid',
  'khartoum-hospital-uuid',
  'sudan-ministry-uuid',
  37.2,
  72,
  120,
  80,
  98,
  16,
  'excellent'
);

-- Query last 24 hours of vital signs
SELECT * FROM vital_signs_timeseries
WHERE patient_id = 'patient-uuid'
  AND observation_time > NOW() - INTERVAL '24 hours'
ORDER BY observation_time DESC;

-- Get hourly averages
SELECT * FROM vital_signs_hourly
WHERE patient_id = 'patient-uuid'
  AND hour > NOW() - INTERVAL '7 days'
ORDER BY hour;

-- Get vital signs trends
SELECT * FROM detect_vital_trends('patient-uuid', 'heart_rate', 24);

-- Get current vital signs for all patients
SELECT * FROM v_current_vital_signs;

-- Get active critical alerts
SELECT * FROM v_active_critical_alerts;

-- Get device connectivity status
SELECT * FROM v_device_connectivity
WHERE status = 'connected';
*/
