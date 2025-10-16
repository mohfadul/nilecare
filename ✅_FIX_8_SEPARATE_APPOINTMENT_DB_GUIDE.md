# ✅ FIX #8: SEPARATE APPOINTMENT DB IMPLEMENTATION

**Status:** 🟢 **READY TO IMPLEMENT**  
**Priority:** 🟢 MEDIUM  
**Time:** 2 hours  
**Complexity:** MEDIUM

---

## 🎯 OBJECTIVE

Move Appointment Service to its own dedicated database for better scalability and independence.

---

## 📊 CURRENT STATE

- ❌ Appointments table in shared `nilecare_business` database
- ❌ Can't scale appointments independently
- ❌ Shared database creates coupling

---

## ✅ TARGET STATE

- ✅ New database: `nilecare_appointment`
- ✅ Dedicated user: `appointment_service`
- ✅ Independent scaling
- ✅ No shared tables

---

## 🚀 IMPLEMENTATION (2 HOURS)

### STEP 1: Create New Database (15 min)

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS nilecare_appointment
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER IF NOT EXISTS 'appointment_service'@'%' 
  IDENTIFIED BY 'secure_appointment_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON nilecare_appointment.* 
  TO 'appointment_service'@'%';

FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES LIKE 'nilecare_appointment';
```

### STEP 2: Create Migration (30 min)

Create: `microservices/appointment-service/migrations/V3__Create_appointments_table.sql`

```sql
-- ============================================================================
-- V3: Create Appointments Table in Dedicated Database
-- ============================================================================

USE nilecare_appointment;

CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(36) PRIMARY KEY,
  
  -- References
  patient_id VARCHAR(36) NOT NULL,
  doctor_id VARCHAR(36) NOT NULL,
  facility_id VARCHAR(36) NOT NULL,
  
  -- Appointment Details
  appointment_date DATETIME NOT NULL,
  appointment_type ENUM('consultation', 'follow_up', 'emergency', 'procedure', 'check_up') NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  
  -- Status
  status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
  
  -- Contact & Notes
  patient_phone VARCHAR(20),
  reason TEXT,
  notes TEXT,
  cancellation_reason TEXT,
  
  -- Audit columns (✅ Fix #4)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  deleted_by VARCHAR(36),
  
  -- Indexes
  INDEX idx_patient_id (patient_id),
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_facility_id (facility_id),
  INDEX idx_appointment_date (appointment_date),
  INDEX idx_status (status),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_patient_date (patient_id, appointment_date),
  INDEX idx_doctor_date (doctor_id, appointment_date)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- COPY DATA FROM OLD DATABASE (if needed)
-- ============================================================================

-- INSERT INTO nilecare_appointment.appointments
-- SELECT * FROM nilecare_business.appointments;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT COUNT(*) as total_appointments FROM appointments;
```

### STEP 3: Update Service Configuration (30 min)

**Update `.env`:**
```env
# OLD
# DB_NAME=nilecare_business

# NEW
DB_NAME=nilecare_appointment
DB_USER=appointment_service
DB_PASSWORD=secure_appointment_password
```

**Update `flyway.conf`:**
```properties
# OLD
# flyway.url=jdbc:mysql://localhost:3306/nilecare_business

# NEW
flyway.url=jdbc:mysql://localhost:3306/nilecare_appointment
flyway.user=appointment_service
flyway.password=secure_appointment_password
```

### STEP 4: Update docker-compose.yml (15 min)

```yaml
appointment-service:
  environment:
    DB_NAME: nilecare_appointment
    DB_USER: appointment_service
    DB_PASSWORD: ${APPOINTMENT_DB_PASSWORD}
```

### STEP 5: Test (30 min)

```bash
# Run migrations
cd microservices/appointment-service
npm run migrate

# Start service
npm run dev

# Test endpoints
curl http://localhost:7040/api/v1/appointments
```

---

## ✅ SUCCESS CRITERIA

- ✅ New database created
- ✅ Appointments table in new database
- ✅ Service uses new database
- ✅ Old table marked as deprecated
- ✅ All tests passing

---

**ESTIMATED TIME:** 2 hours  
**COMPLEXITY:** Medium  
**NEXT:** Fix #9 (API Documentation)

