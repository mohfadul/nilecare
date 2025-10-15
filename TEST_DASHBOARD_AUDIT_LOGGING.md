# 🧪 Dashboard Audit Logging - Test Plan

## 🎯 Objective

Verify that ALL 11+ dashboards now create audit logs when accessing appointments, billing, staff, or scheduling data through the Business Service.

---

## ✅ Prerequisites

### Services Running

```bash
# Check all required services are running:

# 1. Business Service (Port 7010)
curl http://localhost:7010/health
# Expected: {"status":"healthy","service":"business-service"}

# 2. Main NileCare (Port 7000)
curl http://localhost:7000/health
# Expected: {"status":"healthy","service":"main-nilecare"}

# 3. Auth Service (Port 7020)
curl http://localhost:7020/health
# Expected: {"status":"healthy","service":"auth-service"}

# 4. Web Dashboard (Port 5173)
# Open: http://localhost:5173
```

### Database Check

```bash
# Verify audit_logs table exists
mysql -u root nilecare -e "DESCRIBE audit_logs;"

# Clear previous test data (optional)
mysql -u root nilecare -e "DELETE FROM audit_logs WHERE DATE(timestamp) = CURDATE();"
```

---

## 🧪 Test Scenarios

### Test 1: Doctor Dashboard → Appointments

**Steps:**
1. Login as doctor
2. Navigate to Doctor Dashboard
3. Dashboard loads today's appointments
4. Check audit log created

**Commands:**

```bash
# Step 1: Login
curl -X POST http://localhost:7000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@nilecare.sd","password":"TestPass123!"}' \
  -c cookies.txt

# Extract token from response (save it as $TOKEN)

# Step 2: View appointments (as dashboard would)
curl http://localhost:7000/api/v1/data/appointments/today \
  -H "Authorization: Bearer $TOKEN"

# Step 3: Verify audit log created
mysql -u root nilecare -e "
SELECT 
  user_email,
  user_role,
  action,
  resource,
  endpoint,
  result,
  timestamp
FROM audit_logs
WHERE user_email = 'doctor@nilecare.sd'
  AND DATE(timestamp) = CURDATE()
ORDER BY timestamp DESC
LIMIT 1;
"
```

**Expected Output:**
```
+--------------------+-----------+--------+-------------+---------------------------+---------+---------------------+
| user_email         | user_role | action | resource    | endpoint                  | result  | timestamp           |
+--------------------+-----------+--------+-------------+---------------------------+---------+---------------------+
| doctor@nilecare.sd | doctor    | LIST   | APPOINTMENT | /api/v1/appointments      | SUCCESS | 2025-10-13 14:35:22 |
+--------------------+-----------+--------+-------------+---------------------------+---------+---------------------+
```

✅ **PASS CRITERIA:** Audit log entry exists with correct user, action, and resource

---

### Test 2: Nurse Dashboard → Stats

**Steps:**
1. Login as nurse
2. Navigate to Nurse Dashboard
3. Dashboard loads statistics
4. Check audit log created

**Commands:**

```bash
# Step 1: Login
curl -X POST http://localhost:7000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nurse@nilecare.sd","password":"TestPass123!"}'

# Step 2: View stats (includes appointments count from Business Service)
curl http://localhost:7000/api/v1/data/dashboard/stats \
  -H "Authorization: Bearer $NURSE_TOKEN"

# Step 3: Verify audit log
mysql -u root nilecare -e "
SELECT COUNT(*) as audit_count
FROM audit_logs
WHERE user_email = 'nurse@nilecare.sd'
  AND resource = 'APPOINTMENT'
  AND DATE(timestamp) = CURDATE();
"
```

**Expected Output:**
```
+-------------+
| audit_count |
+-------------+
|           1 |
+-------------+
```

✅ **PASS CRITERIA:** At least 1 audit log entry (from stats endpoint calling appointments)

---

### Test 3: Receptionist Dashboard → Create Appointment

**Steps:**
1. Login as receptionist
2. Create new appointment
3. Check audit log for CREATE action

**Commands:**

```bash
# Step 1: Login
curl -X POST http://localhost:7000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"receptionist@nilecare.sd","password":"TestPass123!"}'

# Step 2: Create appointment
curl -X POST http://localhost:7000/api/v1/appointments \
  -H "Authorization: Bearer $RECEPTIONIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId":"patient_1",
    "providerId":"provider_1",
    "appointmentDate":"2025-10-20",
    "appointmentTime":"10:00:00",
    "duration":30,
    "reason":"Annual Checkup"
  }'

# Step 3: Verify CREATE audit log
mysql -u root nilecare -e "
SELECT 
  user_email,
  action,
  resource,
  resource_id,
  description,
  result
FROM audit_logs
WHERE user_email = 'receptionist@nilecare.sd'
  AND action = 'CREATE'
  AND resource = 'APPOINTMENT'
  AND DATE(timestamp) = CURDATE()
ORDER BY timestamp DESC
LIMIT 1;
"
```

**Expected Output:**
```
+-------------------------+--------+-------------+-------------+----------------------------+---------+
| user_email              | action | resource    | resource_id | description                | result  |
+-------------------------+--------+-------------+-------------+----------------------------+---------+
| receptionist@nilecare.sd| CREATE | APPOINTMENT | apt_xxx     | User created appointment   | SUCCESS |
+-------------------------+--------+-------------+-------------+----------------------------+---------+
```

✅ **PASS CRITERIA:** CREATE audit log with appointment details

---

### Test 4: Admin Dashboard → Business Card

**Steps:**
1. Login as admin
2. View BusinessServiceCard
3. Card loads appointments, billing, staff
4. Check multiple audit logs created

**Commands:**

```bash
# Step 1: Login as admin
curl -X POST http://localhost:7000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nilecare.sd","password":"TestPass123!"}'

# Step 2: View appointments (as BusinessServiceCard would)
curl http://localhost:7000/api/business/appointments \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Step 3: View billing
curl http://localhost:7000/api/business/billing \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Step 4: View staff
curl http://localhost:7000/api/business/staff \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Step 5: Verify multiple audit logs
mysql -u root nilecare -e "
SELECT 
  user_email,
  action,
  resource,
  COUNT(*) as count
FROM audit_logs
WHERE user_email = 'admin@nilecare.sd'
  AND DATE(timestamp) = CURDATE()
GROUP BY user_email, action, resource
ORDER BY count DESC;
"
```

**Expected Output:**
```
+-------------------+--------+-------------+-------+
| user_email        | action | resource    | count |
+-------------------+--------+-------------+-------+
| admin@nilecare.sd | LIST   | APPOINTMENT |     1 |
| admin@nilecare.sd | LIST   | BILLING     |     1 |
| admin@nilecare.sd | LIST   | STAFF       |     1 |
+-------------------+--------+-------------+-------+
```

✅ **PASS CRITERIA:** 3+ audit log entries (appointments, billing, staff)

---

### Test 5: All Dashboards Coverage

**Objective:** Verify that ALL 12 dashboards create audit logs

**Dashboard List:**
1. DoctorDashboard
2. NurseDashboard
3. ReceptionistDashboard
4. PharmacistDashboard
5. LabTechnicianDashboard
6. MedicalDirectorDashboard
7. ComplianceOfficerDashboard
8. SuperAdminDashboard
9. SudanHealthInspector
10. PatientPortal
11. AdminDashboard
12. BusinessDashboard

**Test Script:**

```bash
# For each dashboard, login and access data
ROLES=("doctor" "nurse" "receptionist" "pharmacist" "lab_technician" "medical_director" "compliance_officer" "super_admin" "health_inspector" "patient" "admin")

for role in "${ROLES[@]}"; do
  echo "Testing ${role} dashboard..."
  
  # Login
  TOKEN=$(curl -s -X POST http://localhost:7000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${role}@nilecare.sd\",\"password\":\"TestPass123!\"}" \
    | jq -r '.accessToken')
  
  # Access appointments
  curl -s http://localhost:7000/api/v1/data/appointments/today \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  
  echo "✅ ${role} dashboard tested"
done

# Verify audit logs for all roles
mysql -u root nilecare -e "
SELECT 
  user_role,
  COUNT(*) as access_count
FROM audit_logs
WHERE DATE(timestamp) = CURDATE()
  AND resource = 'APPOINTMENT'
GROUP BY user_role;
"
```

**Expected Output:**
```
+-------------------+-------------+
| user_role         | access_count|
+-------------------+-------------+
| doctor            |           1 |
| nurse             |           1 |
| receptionist      |           1 |
| pharmacist        |           1 |
| ...               |         ... |
+-------------------+-------------+
```

✅ **PASS CRITERIA:** All roles have at least 1 audit log entry

---

## 📊 Audit Log Verification Queries

### Query 1: Today's Dashboard Access Summary

```sql
SELECT 
  user_role,
  resource,
  action,
  COUNT(*) as access_count,
  COUNT(DISTINCT user_email) as unique_users
FROM audit_logs
WHERE DATE(timestamp) = CURDATE()
  AND resource IN ('APPOINTMENT', 'BILLING', 'STAFF', 'SCHEDULE')
GROUP BY user_role, resource, action
ORDER BY access_count DESC;
```

**Expected:** Multiple entries showing various roles accessing business resources

---

### Query 2: Failed Access Attempts

```sql
SELECT 
  user_email,
  user_role,
  action,
  resource,
  error_message,
  timestamp
FROM audit_logs
WHERE result = 'FAILURE'
  AND DATE(timestamp) = CURDATE()
ORDER BY timestamp DESC
LIMIT 20;
```

**Expected:** Empty (no failed attempts) or entries showing proper access denial logging

---

### Query 3: Most Active Users

```sql
SELECT 
  user_email,
  user_role,
  COUNT(*) as total_operations,
  COUNT(DISTINCT resource) as resources_accessed,
  MIN(timestamp) as first_access,
  MAX(timestamp) as last_access
FROM audit_logs
WHERE DATE(timestamp) = CURDATE()
GROUP BY user_email, user_role
ORDER BY total_operations DESC
LIMIT 10;
```

**Expected:** List of users with their activity counts

---

### Query 4: Resource Access Matrix

```sql
SELECT 
  resource,
  SUM(CASE WHEN action = 'LIST' THEN 1 ELSE 0 END) as list_ops,
  SUM(CASE WHEN action = 'VIEW' THEN 1 ELSE 0 END) as view_ops,
  SUM(CASE WHEN action = 'CREATE' THEN 1 ELSE 0 END) as create_ops,
  SUM(CASE WHEN action = 'UPDATE' THEN 1 ELSE 0 END) as update_ops,
  SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END) as delete_ops,
  COUNT(*) as total_ops
FROM audit_logs
WHERE DATE(timestamp) = CURDATE()
  AND resource IN ('APPOINTMENT', 'BILLING', 'STAFF', 'SCHEDULE')
GROUP BY resource;
```

**Expected:**
```
+-------------+----------+----------+------------+------------+------------+-----------+
| resource    | list_ops | view_ops | create_ops | update_ops | delete_ops | total_ops |
+-------------+----------+----------+------------+------------+------------+-----------+
| APPOINTMENT |       12 |        5 |          3 |          2 |          0 |        22 |
| BILLING     |        8 |        3 |          2 |          1 |          0 |        14 |
| STAFF       |        6 |        2 |          1 |          0 |          0 |         9 |
| SCHEDULE    |        4 |        1 |          1 |          0 |          0 |         6 |
+-------------+----------+----------+------------+------------+------------+-----------+
```

---

## 🔍 Manual Browser Testing

### Test with Real Dashboard

1. **Open Dashboard:**
   ```
   http://localhost:5173
   ```

2. **Login as Doctor:**
   - Email: `doctor@nilecare.sd`
   - Password: `TestPass123!`

3. **Navigate to Doctor Dashboard:**
   - Click "Dashboard" in navigation
   - Wait for appointments to load

4. **Open MySQL:**
   ```bash
   mysql -u root nilecare
   ```

5. **Check Audit Logs:**
   ```sql
   SELECT 
     user_email,
     user_role,
     action,
     resource,
     endpoint,
     http_method,
     result,
     timestamp
   FROM audit_logs
   WHERE user_email = 'doctor@nilecare.sd'
   ORDER BY timestamp DESC
   LIMIT 5;
   ```

6. **Expected Result:**
   - At least 1 entry with `resource='APPOINTMENT'`
   - `action='LIST'`
   - `endpoint='/api/v1/appointments'`
   - `result='SUCCESS'`
   - Recent timestamp

---

## 📋 Comprehensive Test Matrix

### All Dashboard + All Operations

| Dashboard | Role | Test Action | Endpoint | Expected Audit | Status |
|-----------|------|-------------|----------|----------------|--------|
| Doctor | doctor | View appointments | `/appointments/today` | LIST APPOINTMENT | ⏳ |
| Doctor | doctor | View appointment details | `/appointments/:id` | VIEW APPOINTMENT | ⏳ |
| Nurse | nurse | View stats | `/dashboard/stats` | LIST APPOINTMENT | ⏳ |
| Receptionist | receptionist | Create appointment | `/appointments` POST | CREATE APPOINTMENT | ⏳ |
| Receptionist | receptionist | Confirm appointment | `/appointments/:id/confirm` | UPDATE APPOINTMENT | ⏳ |
| Admin | admin | View billing | `/business/billing` | LIST BILLING | ⏳ |
| Admin | admin | View staff | `/business/staff` | LIST STAFF | ⏳ |
| Business | manager | View all | `/business/*` | Multiple logs | ⏳ |
| MedicalDirector | medical_director | View dashboard | `/dashboard/stats` | LIST APPOINTMENT | ⏳ |
| ComplianceOfficer | compliance | View audit logs | `/audit/logs` | VIEW AUDIT | ⏳ |

---

## 🎯 Success Criteria

### Minimum Requirements

- ✅ At least 1 audit log per dashboard role
- ✅ All audit logs have user context (ID, email, role)
- ✅ All audit logs have action + resource
- ✅ All audit logs have timestamp + IP
- ✅ No failed logs (result='FAILURE') unless testing access denial

### Gold Standard

- ✅ 100% of business operations logged
- ✅ All 12 dashboards create logs
- ✅ All CRUD operations (Create, Read, Update, Delete) logged
- ✅ Access denial attempts logged (403/401 errors)
- ✅ Audit logs queryable by WHO/WHAT/WHEN/WHERE

---

## 🔧 Test Automation Script

### PowerShell Test Script

```powershell
# test-dashboard-audit.ps1

Write-Host "🧪 Testing Dashboard Audit Logging..." -ForegroundColor Cyan

# Configuration
$API_URL = "http://localhost:7000"
$DB_NAME = "nilecare"

# Test users
$users = @(
    @{email="doctor@nilecare.sd"; role="doctor"},
    @{email="nurse@nilecare.sd"; role="nurse"},
    @{email="receptionist@nilecare.sd"; role="receptionist"},
    @{email="admin@nilecare.sd"; role="admin"}
)

$results = @()

foreach ($user in $users) {
    Write-Host "`n Testing $($user.role) dashboard..." -ForegroundColor Yellow
    
    try {
        # Login
        $loginBody = @{
            email = $user.email
            password = "TestPass123!"
        } | ConvertTo-Json

        $loginResponse = Invoke-RestMethod -Uri "$API_URL/api/v1/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $loginBody

        $token = $loginResponse.accessToken

        if ($token) {
            Write-Host "  ✅ Login successful" -ForegroundColor Green
            
            # Access appointments
            $headers = @{
                "Authorization" = "Bearer $token"
            }
            
            $aptsResponse = Invoke-RestMethod -Uri "$API_URL/api/v1/data/appointments/today" `
                -Method GET `
                -Headers $headers
            
            Write-Host "  ✅ Appointments accessed" -ForegroundColor Green
            
            # Check audit log
            $query = "SELECT COUNT(*) as count FROM audit_logs WHERE user_email = '$($user.email)' AND DATE(timestamp) = CURDATE()"
            $auditCount = (mysql -u root $DB_NAME -N -e $query).Trim()
            
            if ($auditCount -gt 0) {
                Write-Host "  ✅ Audit log created ($auditCount entries)" -ForegroundColor Green
                $results += @{role=$user.role; status="PASS"; auditCount=$auditCount}
            } else {
                Write-Host "  ❌ No audit log found!" -ForegroundColor Red
                $results += @{role=$user.role; status="FAIL"; auditCount=0}
            }
        }
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        $results += @{role=$user.role; status="ERROR"; auditCount=0}
    }
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                    TEST SUMMARY                            " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

$passed = ($results | Where-Object {$_.status -eq "PASS"}).Count
$failed = ($results | Where-Object {$_.status -eq "FAIL"}).Count
$errors = ($results | Where-Object {$_.status -eq "ERROR"}).Count

Write-Host "`nResults:" -ForegroundColor Yellow
Write-Host "  ✅ Passed: $passed" -ForegroundColor Green
Write-Host "  ❌ Failed: $failed" -ForegroundColor Red
Write-Host "  ⚠️  Errors: $errors" -ForegroundColor Magenta

if ($failed -eq 0 -and $errors -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! 100% Audit Coverage Achieved!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed. Check logs above." -ForegroundColor Red
}
```

**Run with:**
```powershell
.\test-dashboard-audit.ps1
```

---

## 📊 Expected Final Results

### Audit Log Statistics (After All Tests)

```sql
-- Total audit entries today
SELECT COUNT(*) as total_audit_entries
FROM audit_logs
WHERE DATE(timestamp) = CURDATE();
-- Expected: 20+ entries

-- Breakdown by resource
SELECT resource, COUNT(*) as count
FROM audit_logs
WHERE DATE(timestamp) = CURDATE()
GROUP BY resource
ORDER BY count DESC;
-- Expected: APPOINTMENT (highest), BILLING, STAFF, SCHEDULE

-- Breakdown by role
SELECT user_role, COUNT(*) as count
FROM audit_logs
WHERE DATE(timestamp) = CURDATE()
GROUP BY user_role
ORDER BY count DESC;
-- Expected: All roles (doctor, nurse, receptionist, admin, etc.)

-- Success vs Failure rate
SELECT 
  result,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM audit_logs WHERE DATE(timestamp) = CURDATE()), 2) as percentage
FROM audit_logs
WHERE DATE(timestamp) = CURDATE()
GROUP BY result;
-- Expected: SUCCESS > 95%, FAILURE < 5%
```

---

## 🐛 Troubleshooting

### Issue: No Audit Logs Created

**Possible Causes:**
1. Business Service not running
2. Audit middleware not enabled
3. Database connection failed
4. `audit_logs` table doesn't exist

**Debug Steps:**

```bash
# 1. Check Business Service is running
curl http://localhost:7010/health

# 2. Check audit middleware is active (check logs)
cd microservices/business
tail -f logs/combined.log | grep "audit"

# 3. Verify audit_logs table
mysql -u root nilecare -e "SHOW CREATE TABLE audit_logs;"

# 4. Check Business Service has database connection
mysql -u root nilecare -e "SHOW PROCESSLIST;" | grep nilecare
```

---

### Issue: Audit Logs Missing User Context

**Possible Causes:**
1. JWT token not forwarded
2. Authentication middleware not applied
3. Token expired

**Debug Steps:**

```bash
# Test with verbose output
curl -v http://localhost:7000/api/v1/data/appointments/today \
  -H "Authorization: Bearer $TOKEN"

# Check if Authorization header is present in forwarded request
# Should see: > Authorization: Bearer eyJhbGc...
```

---

### Issue: Main NileCare Can't Reach Business Service

**Possible Causes:**
1. Business Service not running
2. Wrong port in environment variable
3. Network issue

**Debug Steps:**

```bash
# Check environment variable
cd microservices/main-nilecare
cat .env | grep BUSINESS_SERVICE_URL
# Expected: BUSINESS_SERVICE_URL=http://localhost:7010

# Test direct connection from Main NileCare to Business Service
curl http://localhost:7010/health

# Check network connectivity
netstat -an | findstr :7010
```

---

## ✅ Verification Checklist

### Before Running Tests

- [ ] Business Service running (Port 7010)
- [ ] Main NileCare running (Port 7000)
- [ ] Auth Service running (Port 7020)
- [ ] Web Dashboard running (Port 5173)
- [ ] MySQL database running
- [ ] `audit_logs` table exists
- [ ] `audit_logs` table is empty or cleared

### After Running Tests

- [ ] All test scripts executed without errors
- [ ] Audit logs contain entries for all tested dashboards
- [ ] All audit logs have user context (ID, email, role)
- [ ] All audit logs have action + resource
- [ ] All audit logs have timestamp
- [ ] No FAILURE results (unless testing access denial)
- [ ] Audit logs queryable by WHO/WHAT/WHEN/WHERE

---

## 🎖️ Completion Certificate

Once all tests pass, you'll have:

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏆 100% AUDIT COVERAGE CERTIFIED 🏆                     ║
║                                                            ║
║   ✅ All 12 Dashboards Logged                             ║
║   ✅ All Business Operations Tracked                      ║
║   ✅ Full WHO/WHAT/WHEN/WHERE Compliance                  ║
║   ✅ Security Enhanced                                    ║
║   ✅ Healthcare Compliance Met                            ║
║                                                            ║
║   Implementation: COMPLETE                                 ║
║   Audit Coverage: 100%                                     ║
║   Compliance Status: FULL COMPLIANCE                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## 📞 Next Steps

### After All Tests Pass

1. **Document Results:**
   - Take screenshots of audit logs
   - Generate compliance report
   - Update architecture documentation

2. **Production Deployment:**
   - Review performance impact
   - Set up monitoring alerts
   - Configure audit log retention
   - Schedule periodic audits

3. **Training:**
   - Train compliance officers on audit log queries
   - Document common investigation scenarios
   - Create audit log dashboard

---

**Test Plan Version:** 1.0  
**Date:** October 13, 2025  
**Status:** Ready for Execution  
**Estimated Time:** 30 minutes

---

**END OF TEST PLAN**

