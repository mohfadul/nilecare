-- =====================================================
-- NileCare Healthcare Analytics Database Schema
-- Database: healthcare_analytics (PostgreSQL 14+)
-- Purpose: Data warehouse for analytics and reporting
-- =====================================================

CREATE DATABASE healthcare_analytics
  WITH ENCODING 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;

\c healthcare_analytics;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- For indexing
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";  -- For query performance

-- Create schemas for organization
CREATE SCHEMA IF NOT EXISTS dim;  -- Dimension tables
CREATE SCHEMA IF NOT EXISTS fact;  -- Fact tables
CREATE SCHEMA IF NOT EXISTS staging;  -- Staging area for ETL
CREATE SCHEMA IF NOT EXISTS reporting;  -- Reporting views

-- =====================================================
-- DIMENSION TABLES
-- =====================================================

-- Date Dimension
CREATE TABLE dim.date_dimension (
  date_key INTEGER PRIMARY KEY,
  full_date DATE NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  week INTEGER NOT NULL,
  day_of_month INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  day_name VARCHAR(20) NOT NULL,
  is_weekend BOOLEAN NOT NULL,
  is_holiday BOOLEAN DEFAULT FALSE,
  holiday_name VARCHAR(100),
  fiscal_year INTEGER,
  fiscal_quarter INTEGER,
  fiscal_month INTEGER
);

-- Time Dimension
CREATE TABLE dim.time_dimension (
  time_key INTEGER PRIMARY KEY,
  full_time TIME NOT NULL UNIQUE,
  hour INTEGER NOT NULL,
  minute INTEGER NOT NULL,
  second INTEGER NOT NULL,
  am_pm VARCHAR(2) NOT NULL,
  hour_12 INTEGER NOT NULL,
  time_period VARCHAR(20) NOT NULL  -- Morning, Afternoon, Evening, Night
);

-- Patient Dimension (SCD Type 2)
CREATE TABLE dim.patient_dimension (
  patient_key BIGSERIAL PRIMARY KEY,
  patient_id UUID NOT NULL,
  mrn VARCHAR(50) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  age INTEGER,
  age_group VARCHAR(20),  -- 0-17, 18-30, 31-45, 46-60, 61-75, 76+
  gender VARCHAR(20),
  race VARCHAR(50),
  ethnicity VARCHAR(50),
  primary_language VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(50) COMMENT 'Sudan State',
  postal_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'Sudan',
  -- SCD Type 2 fields
  effective_date DATE NOT NULL,
  expiration_date DATE,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patient_dim_id ON dim.patient_dimension(patient_id);
CREATE INDEX idx_patient_dim_mrn ON dim.patient_dimension(mrn);
CREATE INDEX idx_patient_dim_current ON dim.patient_dimension(is_current) WHERE is_current = TRUE;

-- Provider Dimension
CREATE TABLE dim.provider_dimension (
  provider_key BIGSERIAL PRIMARY KEY,
  provider_id UUID NOT NULL UNIQUE,
  npi VARCHAR(10),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  specialty VARCHAR(100),
  sub_specialty VARCHAR(100),
  provider_type VARCHAR(50),
  license_number VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_provider_dim_id ON dim.provider_dimension(provider_id);
CREATE INDEX idx_provider_dim_specialty ON dim.provider_dimension(specialty);

-- Facility Dimension
CREATE TABLE dim.facility_dimension (
  facility_key BIGSERIAL PRIMARY KEY,
  facility_id UUID NOT NULL UNIQUE,
  facility_code VARCHAR(50),
  facility_name VARCHAR(255),
  facility_type VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(50) COMMENT 'Sudan State',
  postal_code VARCHAR(10),
  total_beds INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facility_dim_id ON dim.facility_dimension(facility_id);
CREATE INDEX idx_facility_dim_type ON dim.facility_dimension(facility_type);

-- Department Dimension
CREATE TABLE dim.department_dimension (
  department_key BIGSERIAL PRIMARY KEY,
  department_id UUID NOT NULL UNIQUE,
  department_code VARCHAR(50),
  department_name VARCHAR(255),
  department_type VARCHAR(50),
  facility_key BIGINT REFERENCES dim.facility_dimension(facility_key),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_department_dim_id ON dim.department_dimension(department_id);
CREATE INDEX idx_department_dim_facility ON dim.department_dimension(facility_key);

-- Diagnosis Dimension
CREATE TABLE dim.diagnosis_dimension (
  diagnosis_key BIGSERIAL PRIMARY KEY,
  diagnosis_code VARCHAR(20) NOT NULL,
  diagnosis_system VARCHAR(50),
  diagnosis_description TEXT,
  category VARCHAR(100),
  severity VARCHAR(20),
  is_chronic BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diagnosis_dim_code ON dim.diagnosis_dimension(diagnosis_code);
CREATE INDEX idx_diagnosis_dim_category ON dim.diagnosis_dimension(category);

-- Procedure Dimension
CREATE TABLE dim.procedure_dimension (
  procedure_key BIGSERIAL PRIMARY KEY,
  procedure_code VARCHAR(50) NOT NULL,
  procedure_name VARCHAR(255),
  procedure_category VARCHAR(100),
  procedure_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_procedure_dim_code ON dim.procedure_dimension(procedure_code);
CREATE INDEX idx_procedure_dim_category ON dim.procedure_dimension(procedure_category);

-- Medication Dimension
CREATE TABLE dim.medication_dimension (
  medication_key BIGSERIAL PRIMARY KEY,
  medication_code VARCHAR(50),
  medication_name VARCHAR(255),
  generic_name VARCHAR(255),
  brand_name VARCHAR(255),
  drug_class VARCHAR(100),
  route VARCHAR(50),
  is_controlled BOOLEAN DEFAULT FALSE,
  is_high_alert BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medication_dim_code ON dim.medication_dimension(medication_code);
CREATE INDEX idx_medication_dim_class ON dim.medication_dimension(drug_class);

-- Insurance Dimension
CREATE TABLE dim.insurance_dimension (
  insurance_key BIGSERIAL PRIMARY KEY,
  insurance_company VARCHAR(255),
  plan_name VARCHAR(255),
  plan_type VARCHAR(50),
  payer_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_insurance_dim_company ON dim.insurance_dimension(insurance_company);
CREATE INDEX idx_insurance_dim_type ON dim.insurance_dimension(plan_type);

-- =====================================================
-- FACT TABLES
-- =====================================================

-- Encounter Fact
CREATE TABLE fact.encounter_fact (
  encounter_key BIGSERIAL PRIMARY KEY,
  encounter_id UUID NOT NULL,
  patient_key BIGINT NOT NULL REFERENCES dim.patient_dimension(patient_key),
  provider_key BIGINT REFERENCES dim.provider_dimension(provider_key),
  facility_key BIGINT REFERENCES dim.facility_dimension(facility_key),
  department_key BIGINT REFERENCES dim.department_dimension(department_key),
  admission_date_key INTEGER REFERENCES dim.date_dimension(date_key),
  admission_time_key INTEGER REFERENCES dim.time_dimension(time_key),
  discharge_date_key INTEGER REFERENCES dim.date_dimension(date_key),
  discharge_time_key INTEGER REFERENCES dim.time_dimension(time_key),
  encounter_type VARCHAR(50),
  encounter_class VARCHAR(50),
  admission_source VARCHAR(50),
  discharge_disposition VARCHAR(50),
  length_of_stay_hours NUMERIC(10,2),
  length_of_stay_days NUMERIC(10,2),
  total_charges NUMERIC(12,2),
  total_payments NUMERIC(12,2),
  readmission_30_days BOOLEAN DEFAULT FALSE,
  mortality BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_encounter_fact_patient ON fact.encounter_fact(patient_key);
CREATE INDEX idx_encounter_fact_provider ON fact.encounter_fact(provider_key);
CREATE INDEX idx_encounter_fact_facility ON fact.encounter_fact(facility_key);
CREATE INDEX idx_encounter_fact_admission_date ON fact.encounter_fact(admission_date_key);
CREATE INDEX idx_encounter_fact_type ON fact.encounter_fact(encounter_type);

-- Diagnosis Fact
CREATE TABLE fact.diagnosis_fact (
  diagnosis_fact_key BIGSERIAL PRIMARY KEY,
  patient_key BIGINT NOT NULL REFERENCES dim.patient_dimension(patient_key),
  encounter_key BIGINT REFERENCES fact.encounter_fact(encounter_key),
  diagnosis_key BIGINT NOT NULL REFERENCES dim.diagnosis_dimension(diagnosis_key),
  provider_key BIGINT REFERENCES dim.provider_dimension(provider_key),
  diagnosis_date_key INTEGER REFERENCES dim.date_dimension(date_key),
  diagnosis_type VARCHAR(50),
  diagnosis_rank INTEGER,
  is_present_on_admission BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diagnosis_fact_patient ON fact.diagnosis_fact(patient_key);
CREATE INDEX idx_diagnosis_fact_encounter ON fact.diagnosis_fact(encounter_key);
CREATE INDEX idx_diagnosis_fact_diagnosis ON fact.diagnosis_fact(diagnosis_key);
CREATE INDEX idx_diagnosis_fact_date ON fact.diagnosis_fact(diagnosis_date_key);

-- Procedure Fact
CREATE TABLE fact.procedure_fact (
  procedure_fact_key BIGSERIAL PRIMARY KEY,
  patient_key BIGINT NOT NULL REFERENCES dim.patient_dimension(patient_key),
  encounter_key BIGINT REFERENCES fact.encounter_fact(encounter_key),
  procedure_key BIGINT NOT NULL REFERENCES dim.procedure_dimension(procedure_key),
  provider_key BIGINT REFERENCES dim.provider_dimension(provider_key),
  facility_key BIGINT REFERENCES dim.facility_dimension(facility_key),
  procedure_date_key INTEGER REFERENCES dim.date_dimension(date_key),
  procedure_time_key INTEGER REFERENCES dim.time_dimension(time_key),
  duration_minutes INTEGER,
  procedure_charges NUMERIC(12,2),
  complications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_procedure_fact_patient ON fact.procedure_fact(patient_key);
CREATE INDEX idx_procedure_fact_encounter ON fact.procedure_fact(encounter_key);
CREATE INDEX idx_procedure_fact_procedure ON fact.procedure_fact(procedure_key);
CREATE INDEX idx_procedure_fact_date ON fact.procedure_fact(procedure_date_key);

-- Medication Fact
CREATE TABLE fact.medication_fact (
  medication_fact_key BIGSERIAL PRIMARY KEY,
  patient_key BIGINT NOT NULL REFERENCES dim.patient_dimension(patient_key),
  encounter_key BIGINT REFERENCES fact.encounter_fact(encounter_key),
  medication_key BIGINT NOT NULL REFERENCES dim.medication_dimension(medication_key),
  provider_key BIGINT REFERENCES dim.provider_dimension(provider_key),
  prescribed_date_key INTEGER REFERENCES dim.date_dimension(date_key),
  start_date_key INTEGER REFERENCES dim.date_dimension(date_key),
  end_date_key INTEGER REFERENCES dim.date_dimension(date_key),
  duration_days INTEGER,
  quantity NUMERIC(10,2),
  refills INTEGER,
  total_cost NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medication_fact_patient ON fact.medication_fact(patient_key);
CREATE INDEX idx_medication_fact_encounter ON fact.medication_fact(encounter_key);
CREATE INDEX idx_medication_fact_medication ON fact.medication_fact(medication_key);
CREATE INDEX idx_medication_fact_date ON fact.medication_fact(prescribed_date_key);

-- Lab Result Fact
CREATE TABLE fact.lab_result_fact (
  lab_result_key BIGSERIAL PRIMARY KEY,
  patient_key BIGINT NOT NULL REFERENCES dim.patient_dimension(patient_key),
  encounter_key BIGINT REFERENCES fact.encounter_fact(encounter_key),
  provider_key BIGINT REFERENCES dim.provider_dimension(provider_key),
  facility_key BIGINT REFERENCES dim.facility_dimension(facility_key),
  result_date_key INTEGER REFERENCES dim.date_dimension(date_key),
  result_time_key INTEGER REFERENCES dim.time_dimension(time_key),
  test_code VARCHAR(50),
  test_name VARCHAR(255),
  result_value VARCHAR(500),
  result_numeric NUMERIC(20,6),
  result_unit VARCHAR(50),
  reference_range_low NUMERIC(20,6),
  reference_range_high NUMERIC(20,6),
  abnormal_flag VARCHAR(20),
  is_critical BOOLEAN DEFAULT FALSE,
  turnaround_time_hours NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lab_result_fact_patient ON fact.lab_result_fact(patient_key);
CREATE INDEX idx_lab_result_fact_encounter ON fact.lab_result_fact(encounter_key);
CREATE INDEX idx_lab_result_fact_date ON fact.lab_result_fact(result_date_key);
CREATE INDEX idx_lab_result_fact_test ON fact.lab_result_fact(test_code);

-- Vital Signs Fact
CREATE TABLE fact.vital_signs_fact (
  vital_signs_key BIGSERIAL PRIMARY KEY,
  patient_key BIGINT NOT NULL REFERENCES dim.patient_dimension(patient_key),
  encounter_key BIGINT REFERENCES fact.encounter_fact(encounter_key),
  facility_key BIGINT REFERENCES dim.facility_dimension(facility_key),
  observation_date_key INTEGER REFERENCES dim.date_dimension(date_key),
  observation_time_key INTEGER REFERENCES dim.time_dimension(time_key),
  temperature NUMERIC(4,1),
  heart_rate INTEGER,
  respiratory_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  oxygen_saturation NUMERIC(5,2),
  pain_score INTEGER,
  weight NUMERIC(6,2),
  height NUMERIC(5,2),
  bmi NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vital_signs_fact_patient ON fact.vital_signs_fact(patient_key);
CREATE INDEX idx_vital_signs_fact_encounter ON fact.vital_signs_fact(encounter_key);
CREATE INDEX idx_vital_signs_fact_date ON fact.vital_signs_fact(observation_date_key);

-- Financial Fact
CREATE TABLE fact.financial_fact (
  financial_key BIGSERIAL PRIMARY KEY,
  patient_key BIGINT NOT NULL REFERENCES dim.patient_dimension(patient_key),
  encounter_key BIGINT REFERENCES fact.encounter_fact(encounter_key),
  provider_key BIGINT REFERENCES dim.provider_dimension(provider_key),
  facility_key BIGINT REFERENCES dim.facility_dimension(facility_key),
  insurance_key BIGINT REFERENCES dim.insurance_dimension(insurance_key),
  service_date_key INTEGER REFERENCES dim.date_dimension(date_key),
  transaction_type VARCHAR(50),
  charge_amount NUMERIC(12,2),
  allowed_amount NUMERIC(12,2),
  paid_amount NUMERIC(12,2),
  adjustment_amount NUMERIC(12,2),
  patient_responsibility NUMERIC(12,2),
  collection_amount NUMERIC(12,2),
  days_to_payment INTEGER,
  denial_flag BOOLEAN DEFAULT FALSE,
  denial_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_financial_fact_patient ON fact.financial_fact(patient_key);
CREATE INDEX idx_financial_fact_encounter ON fact.financial_fact(encounter_key);
CREATE INDEX idx_financial_fact_facility ON fact.financial_fact(facility_key);
CREATE INDEX idx_financial_fact_date ON fact.financial_fact(service_date_key);
CREATE INDEX idx_financial_fact_insurance ON fact.financial_fact(insurance_key);

-- Appointment Fact
CREATE TABLE fact.appointment_fact (
  appointment_key BIGSERIAL PRIMARY KEY,
  patient_key BIGINT NOT NULL REFERENCES dim.patient_dimension(patient_key),
  provider_key BIGINT REFERENCES dim.provider_dimension(provider_key),
  facility_key BIGINT REFERENCES dim.facility_dimension(facility_key),
  department_key BIGINT REFERENCES dim.department_dimension(department_key),
  scheduled_date_key INTEGER REFERENCES dim.date_dimension(date_key),
  scheduled_time_key INTEGER REFERENCES dim.time_dimension(time_key),
  appointment_type VARCHAR(50),
  appointment_status VARCHAR(50),
  duration_minutes INTEGER,
  wait_time_minutes INTEGER,
  no_show BOOLEAN DEFAULT FALSE,
  cancelled BOOLEAN DEFAULT FALSE,
  cancellation_reason VARCHAR(255),
  lead_time_days INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointment_fact_patient ON fact.appointment_fact(patient_key);
CREATE INDEX idx_appointment_fact_provider ON fact.appointment_fact(provider_key);
CREATE INDEX idx_appointment_fact_facility ON fact.appointment_fact(facility_key);
CREATE INDEX idx_appointment_fact_date ON fact.appointment_fact(scheduled_date_key);

-- =====================================================
-- REPORTING VIEWS
-- =====================================================

-- Patient Demographics Report
CREATE OR REPLACE VIEW reporting.v_patient_demographics AS
SELECT 
  p.patient_key,
  p.mrn,
  p.first_name,
  p.last_name,
  p.age,
  p.age_group,
  p.gender,
  p.race,
  p.ethnicity,
  p.city,
  p.state,
  COUNT(DISTINCT e.encounter_key) as total_encounters,
  MAX(d.full_date) as last_encounter_date
FROM dim.patient_dimension p
LEFT JOIN fact.encounter_fact e ON p.patient_key = e.patient_key
LEFT JOIN dim.date_dimension d ON e.admission_date_key = d.date_key
WHERE p.is_current = TRUE
GROUP BY p.patient_key, p.mrn, p.first_name, p.last_name, p.age, p.age_group, 
         p.gender, p.race, p.ethnicity, p.city, p.state;

-- Encounter Summary Report
CREATE OR REPLACE VIEW reporting.v_encounter_summary AS
SELECT 
  d.year,
  d.month,
  d.month_name,
  f.facility_name,
  e.encounter_type,
  COUNT(*) as encounter_count,
  AVG(e.length_of_stay_days) as avg_los_days,
  SUM(e.total_charges) as total_charges,
  SUM(e.total_payments) as total_payments,
  SUM(CASE WHEN e.readmission_30_days THEN 1 ELSE 0 END) as readmissions_30_day,
  ROUND(SUM(CASE WHEN e.readmission_30_days THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as readmission_rate
FROM fact.encounter_fact e
JOIN dim.date_dimension d ON e.admission_date_key = d.date_key
JOIN dim.facility_dimension f ON e.facility_key = f.facility_key
GROUP BY d.year, d.month, d.month_name, f.facility_name, e.encounter_type;

-- Top Diagnoses Report
CREATE OR REPLACE VIEW reporting.v_top_diagnoses AS
SELECT 
  diag.diagnosis_code,
  diag.diagnosis_description,
  diag.category,
  COUNT(DISTINCT df.patient_key) as patient_count,
  COUNT(*) as diagnosis_count
FROM fact.diagnosis_fact df
JOIN dim.diagnosis_dimension diag ON df.diagnosis_key = diag.diagnosis_key
GROUP BY diag.diagnosis_code, diag.diagnosis_description, diag.category
ORDER BY diagnosis_count DESC;

-- Provider Productivity Report
CREATE OR REPLACE VIEW reporting.v_provider_productivity AS
SELECT 
  prov.provider_id,
  prov.first_name || ' ' || prov.last_name as provider_name,
  prov.specialty,
  d.year,
  d.month,
  COUNT(DISTINCT e.encounter_key) as encounter_count,
  COUNT(DISTINCT a.appointment_key) as appointment_count,
  COUNT(DISTINCT p.procedure_fact_key) as procedure_count,
  SUM(f.charge_amount) as total_charges
FROM dim.provider_dimension prov
LEFT JOIN fact.encounter_fact e ON prov.provider_key = e.provider_key
LEFT JOIN fact.appointment_fact a ON prov.provider_key = a.provider_key
LEFT JOIN fact.procedure_fact p ON prov.provider_key = p.provider_key
LEFT JOIN fact.financial_fact f ON prov.provider_key = f.provider_key
LEFT JOIN dim.date_dimension d ON e.admission_date_key = d.date_key
GROUP BY prov.provider_id, provider_name, prov.specialty, d.year, d.month;

-- Financial Performance Report
CREATE OR REPLACE VIEW reporting.v_financial_performance AS
SELECT 
  d.year,
  d.month,
  d.month_name,
  f.facility_name,
  SUM(fin.charge_amount) as total_charges,
  SUM(fin.allowed_amount) as total_allowed,
  SUM(fin.paid_amount) as total_paid,
  SUM(fin.adjustment_amount) as total_adjustments,
  SUM(fin.patient_responsibility) as total_patient_responsibility,
  ROUND(SUM(fin.paid_amount) * 100.0 / NULLIF(SUM(fin.charge_amount), 0), 2) as collection_rate,
  AVG(fin.days_to_payment) as avg_days_to_payment
FROM fact.financial_fact fin
JOIN dim.date_dimension d ON fin.service_date_key = d.date_key
JOIN dim.facility_dimension f ON fin.facility_key = f.facility_key
GROUP BY d.year, d.month, d.month_name, f.facility_name;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to populate date dimension
CREATE OR REPLACE FUNCTION populate_date_dimension(start_date DATE, end_date DATE)
RETURNS VOID AS $$
DECLARE
  current_date DATE := start_date;
BEGIN
  WHILE current_date <= end_date LOOP
    INSERT INTO dim.date_dimension (
      date_key, full_date, year, quarter, month, month_name,
      week, day_of_month, day_of_week, day_name, is_weekend
    ) VALUES (
      TO_CHAR(current_date, 'YYYYMMDD')::INTEGER,
      current_date,
      EXTRACT(YEAR FROM current_date),
      EXTRACT(QUARTER FROM current_date),
      EXTRACT(MONTH FROM current_date),
      TO_CHAR(current_date, 'Month'),
      EXTRACT(WEEK FROM current_date),
      EXTRACT(DAY FROM current_date),
      EXTRACT(DOW FROM current_date),
      TO_CHAR(current_date, 'Day'),
      EXTRACT(DOW FROM current_date) IN (0, 6)
    )
    ON CONFLICT (date_key) DO NOTHING;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Populate date dimension for 10 years (Sudan timezone)
SELECT populate_date_dimension('2020-01-01'::DATE, '2030-12-31'::DATE);

-- Function to populate time dimension
CREATE OR REPLACE FUNCTION populate_time_dimension()
RETURNS VOID AS $$
DECLARE
  current_time TIME := '00:00:00';
  time_period VARCHAR(20);
BEGIN
  WHILE current_time < '24:00:00' LOOP
    IF EXTRACT(HOUR FROM current_time) < 12 THEN
      time_period := 'Morning';
    ELSIF EXTRACT(HOUR FROM current_time) < 17 THEN
      time_period := 'Afternoon';
    ELSIF EXTRACT(HOUR FROM current_time) < 21 THEN
      time_period := 'Evening';
    ELSE
      time_period := 'Night';
    END IF;
    
    INSERT INTO dim.time_dimension (
      time_key, full_time, hour, minute, second, am_pm, hour_12, time_period
    ) VALUES (
      TO_CHAR(current_time, 'HH24MISS')::INTEGER,
      current_time,
      EXTRACT(HOUR FROM current_time),
      EXTRACT(MINUTE FROM current_time),
      EXTRACT(SECOND FROM current_time),
      CASE WHEN EXTRACT(HOUR FROM current_time) < 12 THEN 'AM' ELSE 'PM' END,
      CASE WHEN EXTRACT(HOUR FROM current_time) = 0 THEN 12
           WHEN EXTRACT(HOUR FROM current_time) > 12 THEN EXTRACT(HOUR FROM current_time) - 12
           ELSE EXTRACT(HOUR FROM current_time) END,
      time_period
    )
    ON CONFLICT (time_key) DO NOTHING;
    
    current_time := current_time + INTERVAL '1 minute';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Populate time dimension
SELECT populate_time_dimension();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Create analytics user
CREATE USER nilecare_analytics WITH PASSWORD 'nilecare_analytics_password';
GRANT CONNECT ON DATABASE healthcare_analytics TO nilecare_analytics;
GRANT USAGE ON SCHEMA dim, fact, staging, reporting TO nilecare_analytics;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA dim, fact, staging TO nilecare_analytics;
GRANT SELECT ON ALL TABLES IN SCHEMA reporting TO nilecare_analytics;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA dim, fact TO nilecare_analytics;

-- Create read-only user for reporting
CREATE USER nilecare_reporting WITH PASSWORD 'nilecare_reporting_password';
GRANT CONNECT ON DATABASE healthcare_analytics TO nilecare_reporting;
GRANT USAGE ON SCHEMA dim, fact, reporting TO nilecare_reporting;
GRANT SELECT ON ALL TABLES IN SCHEMA dim, fact, reporting TO nilecare_reporting;
