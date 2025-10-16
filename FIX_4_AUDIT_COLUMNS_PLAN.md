# 🔍 Fix #4: Add Audit Columns to All Database Tables

**Status**: IN PROGRESS  
**Date Started**: October 16, 2025  
**Priority**: 🟡 HIGH (Compliance & Security)  
**Estimated Time**: 3-4 hours

---

## 📋 **Problem Statement**

Currently, database tables lack comprehensive audit columns needed for:
- **Compliance**: HIPAA, GDPR require tracking who changed what and when
- **Security**: Track all data modifications for security audits
- **Debugging**: Understand data history and changes
- **Data Integrity**: Soft deletes instead of hard deletes

---

## 🎯 **Standard Audit Columns**

Every table MUST have these columns:

### **Temporal Audit Columns**
```sql
created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  
deleted_at    TIMESTAMP      NULL DEFAULT NULL
```

### **User Audit Columns**
```sql
created_by    VARCHAR(36)    NOT NULL   -- User ID who created the record
updated_by    VARCHAR(36)    NULL       -- User ID who last updated
deleted_by    VARCHAR(36)    NULL       -- User ID who soft-deleted
```

### **Organization Context** (Where Applicable)
```sql
organization_id  VARCHAR(36)  NOT NULL   -- For multi-tenancy
```

---

## 📊 **Services & Database Types**

### **MySQL Services** (Flyway migrations)
1. **Auth Service** (Port 7020) - `auth_db`
2. **Clinical Service** (Port 7001) - `clinical_db`
3. **Billing Service** (Port 7050) - `billing_db`
4. **Appointment Service** (Port 7040) - `appointment_db`

### **PostgreSQL Services** (SQL migrations)
1. **Lab Service** (Port 7080) - `lab_db`
2. **Medication Service** (Port 7090) - `medication_db`
3. **Inventory Service** (Port 7100) - `inventory_db`
4. **Facility Service** (Port 7060) - `facility_db`

### **MongoDB Services** (Schema updates)
1. **Device Integration Service** (Port 7070)
2. **CDS Service** (Port 7002)

---

## 🔧 **Implementation Strategy**

### **Phase 1: Create Migration Templates** ✅
1. MySQL ALTER TABLE template
2. PostgreSQL ALTER TABLE template
3. MongoDB schema update template

### **Phase 2: Generate Migrations Per Service**
For each service:
1. List all tables
2. Check which columns are missing
3. Generate ALTER TABLE migration
4. Test migration (up & down)

### **Phase 3: Update Models/Entities**
Update TypeScript models to include audit columns

### **Phase 4: Create Audit Middleware**
Auto-populate audit columns on insert/update

---

## 📝 **Migration Template (MySQL)**

```sql
-- V2__Add_audit_columns.sql
-- Add audit columns to all tables

-- Users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- Patients table
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- Add to ALL tables...
```

---

## 🎯 **Success Criteria**

- ✅ All tables have created_at, updated_at, deleted_at
- ✅ All tables have created_by, updated_by, deleted_by  
- ✅ Migrations reversible (down migrations)
- ✅ Models updated with audit columns
- ✅ Middleware auto-populates columns
- ✅ Soft delete implemented everywhere
- ✅ No hard deletes in code

---

**Next**: Start creating migrations for each service

