# 🧪 Phase 2 Testing Guide - Complete System

**Version:** 1.0.0  
**Date:** October 15, 2025  
**Scope:** All 15+ Microservices  
**Status:** ✅ **READY FOR TESTING**

---

## 📋 Overview

This guide provides comprehensive testing procedures for Phase 2 database separation across all 15+ microservices.

---

## 🎯 Testing Objectives

1. ✅ Verify data migrated correctly (zero data loss)
2. ✅ Verify all services start with new databases
3. ✅ Verify API integration works (replaced DB queries)
4. ✅ Verify event-driven patterns functional
5. ✅ Verify performance acceptable
6. ✅ Verify security isolation working
7. ✅ Verify all workflows end-to-end

---

## 🚀 Test 1: Data Integrity Verification

### Objective
Verify all data migrated from shared database to service-specific databases with zero loss.

### Automated Verification Script

```powershell
# database/exports/verify-data-migration.ps1

$services = @(
    @{Source="nilecare"; Table="auth_users"; Target="nilecare_auth"; TargetTable="auth_users"},
    @{Source="nilecare"; Table="invoices"; Target="nilecare_billing"; TargetTable="invoices"},
    @{Source="nilecare"; Table="payments"; Target="nilecare_payment"; TargetTable="payments"},
    @{Source="nilecare"; Table="patients"; Target="nilecare_clinical"; TargetTable="patients"},
    @{Source="nilecare"; Table="facilities"; Target="nilecare_facility"; TargetTable="facilities"},
    @{Source="nilecare"; Table="lab_orders"; Target="nilecare_lab"; TargetTable="lab_orders"},
    @{Source="nilecare"; Table="medications"; Target="nilecare_medication"; TargetTable="medications"},
    @{Source="nilecare"; Table="inventory_items"; Target="nilecare_inventory"; TargetTable="inventory_items"}
)

$allMatch = $true

foreach ($svc in $services) {
    $sourceCount = mysql -u root -p -N -e "SELECT COUNT(*) FROM $($svc.Source).$($svc.Table);"
    $targetCount = mysql -u root -p -N -e "SELECT COUNT(*) FROM $($svc.Target).$($svc.TargetTable);"
    
    if ($sourceCount -eq $targetCount) {
        Write-Host "✅ $($svc.Table): $sourceCount = $targetCount" -ForegroundColor Green
    } else {
        Write-Host "❌ $($svc.Table): $sourceCount != $targetCount" -ForegroundColor Red
        $allMatch = $false
    }
}

if ($allMatch) {
    Write-Host "`n🎉 All data migrated successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Data migration has discrepancies!" -ForegroundColor Red
    exit 1
}
```

### ✅ Success Criteria
- [ ] All source and target counts match
- [ ] Sample records verified manually
- [ ] No orphaned records
- [ ] Foreign key relationships intact (within service)

---

## 🔄 Test 2: Service Startup Test (All 15+ Services)

### Objective
Verify all services start successfully with their dedicated databases.

### Test Script

```powershell
# scripts/test-all-services-startup.ps1

$services = @(
    @{Name="auth-service"; Port=7020; DB="nilecare_auth"},
    @{Name="billing-service"; Port=7050; DB="nilecare_billing"},
    @{Name="payment-gateway-service"; Port=7030; DB="nilecare_payment"},
    @{Name="business"; Port=7010; DB="nilecare_business"},
    @{Name="facility-service"; Port=7060; DB="nilecare_facility"},
    @{Name="lab-service"; Port=7080; DB="nilecare_lab"},
    @{Name="medication-service"; Port=7090; DB="nilecare_medication"},
    @{Name="inventory-service"; Port=7100; DB="nilecare_inventory"},
    @{Name="ehr-service"; Port=4001; DB="ehr_service"},
    @{Name="device-integration-service"; Port=7070; DB="nilecare_devices"},
    @{Name="notification-service"; Port=3002; DB="nilecare_notifications"}
)

foreach ($svc in $services) {
    Write-Host "`nTesting $($svc.Name)..." -ForegroundColor Cyan
    
    # Start service in background
    Push-Location "microservices\$($svc.Name)"
    $process = Start-Process npm -ArgumentList "run", "dev" -PassThru -NoNewWindow
    Start-Sleep -Seconds 10
    
    # Check health endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($svc.Name) started successfully" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ $($svc.Name) failed to start" -ForegroundColor Red
    }
    
    # Stop service
    Stop-Process -Id $process.Id
    Pop-Location
}
```

### ✅ Success Criteria
- [ ] All 15+ services start without database errors
- [ ] Health endpoints return 200 OK
- [ ] Database connections established
- [ ] No connection pool errors
- [ ] Services respond to API calls

---

## 🔗 Test 3: API Integration Test (Cross-Service Calls)

### Objective
Verify services communicate via API calls instead of direct database queries.

### Test Scenarios

#### Scenario 1: Billing Service Uses Clinical API

```typescript
// Test: Create invoice for patient
const invoiceData = {
  patientId: 'test-patient-id',
  facilityId: 'test-facility-id',
  items: [
    { serviceCode: 'CONS-001', description: 'Consultation', unitPrice: 100, quantity: 1 }
  ]
};

// This should make API call to clinical service to validate patient
const invoice = await billingService.createInvoice(invoiceData);

// Verify: Check logs for API call (not DB query)
// Expected: "[ClinicalServiceClient] GET /api/v1/patients/test-patient-id"
// NOT: "SELECT * FROM clinical_data.patients"
```

#### Scenario 2: Payment Gateway Uses Billing API

```typescript
// Test: Process payment
const paymentData = {
  invoiceId: 'test-invoice-id',
  amount: 100,
  paymentMethod: 'cash'
};

// Should call billing service API to get invoice
const payment = await paymentService.processPayment(paymentData);

// Verify: API call made, not DB query
```

### ✅ Success Criteria
- [ ] No direct cross-service DB queries in logs
- [ ] API calls logged for cross-service communication
- [ ] Circuit breakers working
- [ ] Retry logic functional
- [ ] Error handling robust

---

## 📊 Test 4: End-to-End Workflow Testing

### E2E Test 1: Patient Registration → Appointment → Billing → Payment

```powershell
# Test complete patient journey

# 1. Register patient (Clinical Service)
$patient = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4001/api/v1/patients" `
  -Body (@{firstName="Ahmed"; lastName="Hassan"; dateOfBirth="1990-01-01"; gender="male"} | ConvertTo-Json) `
  -ContentType "application/json"

# 2. Create appointment (Business Service)
$appointment = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:7010/api/v1/appointments" `
  -Body (@{patientId=$patient.id; providerId="test-provider"; appointmentDate="2025-10-20T10:00:00"} | ConvertTo-Json)

# 3. Create invoice (Billing Service)
$invoice = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:7050/api/v1/invoices" `
  -Body (@{patientId=$patient.id; amount=100} | ConvertTo-Json)

# 4. Process payment (Payment Gateway)
$payment = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:7030/api/v1/payments" `
  -Body (@{invoiceId=$invoice.id; amount=100; paymentMethod="cash"} | ConvertTo-Json)

# 5. Verify final states
Write-Host "Patient ID: $($patient.id)"
Write-Host "Appointment ID: $($appointment.id)"
Write-Host "Invoice ID: $($invoice.id)"
Write-Host "Payment ID: $($payment.id)"
```

### E2E Test 2: Lab Order → Result → EHR Update

```powershell
# 1. Create lab order (Lab Service)
$labOrder = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:7080/api/v1/lab/orders" `
  -Body (@{patientId=$patient.id; testCode="CBC"; priority="routine"} | ConvertTo-Json)

# 2. Enter lab result (Lab Service)
$labResult = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:7080/api/v1/lab/results" `
  -Body (@{labOrderId=$labOrder.id; resultValue="12.5"; resultUnit="g/dL"} | ConvertTo-Json)

# 3. Verify event published (check Kafka/RabbitMQ)
# 4. Verify EHR updated (EHR Service)

$ehrData = Invoke-RestMethod -Method GET `
  -Uri "http://localhost:4001/api/v1/patients/$($patient.id)/lab-results"

# Expected: Lab result appears in EHR
```

### ✅ Success Criteria
- [ ] Complete workflows functional
- [ ] Data flows correctly between services
- [ ] Events published and consumed
- [ ] No errors in workflow
- [ ] All data persisted correctly

---

## ⚡ Test 5: Performance & Load Testing

### Objective
Ensure separated databases don't degrade performance.

### Performance Benchmarks

```bash
# Test 1: Response time (Auth Service)
ab -n 1000 -c 10 http://localhost:7020/health

# Expected: < 50ms average response time

# Test 2: Database query time
mysql -u root -p nilecare_auth -e "
SELECT BENCHMARK(1000, (SELECT * FROM auth_users WHERE email='test@test.com'));
"

# Expected: < 100ms for 1000 iterations

# Test 3: API call latency
for i in {1..100}; do
  curl -w "@curl-format.txt" -o /dev/null -s http://localhost:7020/api/v1/auth/verify-token
done | awk '{sum+=$1; count++} END {print "Average:", sum/count, "ms"}'

# Expected: < 100ms average
```

### Load Testing

```bash
# Install k6 (load testing tool)
choco install k6

# Run load test
k6 run tests/load/phase2-load-test.js

# Test scenarios:
# - 100 concurrent users
# - 10,000 requests
# - Mixed workload (read/write)
```

### ✅ Success Criteria
- [ ] Response times < 100ms (p95)
- [ ] Database query times acceptable
- [ ] No connection pool exhaustion
- [ ] No memory leaks
- [ ] System stable under load

---

## 🔒 Test 6: Security & Isolation Testing

### Objective
Verify services cannot access each other's databases.

### Test Script

```bash
# Test 1: Auth service tries to access billing database
mysql -u auth_service -p'Auth_Service_P@ssw0rd_2025!' << EOF
-- Should succeed
SELECT COUNT(*) FROM nilecare_auth.auth_users;

-- Should FAIL with access denied
SELECT COUNT(*) FROM nilecare_billing.invoices;
EOF

# Expected: First query succeeds, second fails

# Test 2: Verify all service isolations
for service in auth billing payment clinical facility lab medication inventory; do
  echo "Testing ${service}_service isolation..."
  # Test access to own database (should succeed)
  # Test access to other databases (should fail)
done
```

### ✅ Success Criteria
- [ ] Services can only access own database
- [ ] Cross-service access denied
- [ ] Error messages appropriate
- [ ] No security vulnerabilities
- [ ] Audit logs capture access attempts

---

## 🔄 Test 7: Rollback Testing

### Objective
Verify we can rollback if issues occur.

### Test Procedure

```bash
# 1. Note current state
mysql -u root -p -e "SELECT * FROM nilecare_auth.schema_version;"

# 2. Simulate migration failure
# (Manually stop migration mid-process)

# 3. Execute rollback
cd microservices/auth-service
npm run migrate:undo

# 4. Restore from backup if needed
mysql -u root -p nilecare_auth < backup_before_auth_migration.sql

# 5. Revert service configuration
# Edit .env: DB_NAME=nilecare (back to shared)

# 6. Test service works with shared DB
npm run dev

# 7. Re-attempt migration
# Fix issues, then re-run migration
```

### ✅ Success Criteria
- [ ] Can rollback cleanly
- [ ] Service works with shared DB after rollback
- [ ] No data corruption
- [ ] Can re-attempt migration successfully

---

## 📊 Test 8: Multi-Tenant Testing

### Objective
Verify multi-tenant functionality works across separated databases.

### Test Scenario

```typescript
// Test with 3 different facilities

const facility1Id = 'facility-1-uuid';
const facility2Id = 'facility-2-uuid';
const facility3Id = 'facility-3-uuid';

// 1. Create patients in different facilities
const patient1 = await clinicalService.createPatient({
  ...patientData,
  facilityId: facility1Id
});

const patient2 = await clinicalService.createPatient({
  ...patientData,
  facilityId: facility2Id
});

// 2. Verify facility isolation
const facility1Patients = await clinicalService.getPatientsByFacility(facility1Id);
const facility2Patients = await clinicalService.getPatientsByFacility(facility2Id);

// Expected: Each facility sees only its own patients

// 3. Test cross-facility workflows
// Lab order from facility1, processed at facility2
```

### ✅ Success Criteria
- [ ] Facility data properly separated
- [ ] Users can only access their facility data
- [ ] Cross-facility queries filtered correctly
- [ ] Multi-tenancy logic preserved

---

## 🧪 Test 9: Event-Driven Pattern Testing

### Objective
Verify event publishing and subscription works.

### Test Scenario

```typescript
// Test Lab Result Event Flow

// 1. Subscribe to lab result events (EHR Service)
let eventReceived = false;
eventBus.subscribe('lab.result.available', (event) => {
  eventReceived = true;
  console.log('Event received:', event);
});

// 2. Publish lab result (Lab Service)
await eventBus.publish('lab.result.available', {
  labOrderId: 'test-order-id',
  patientId: 'test-patient-id',
  results: { hemoglobin: 12.5 },
  isCritical: false
});

// 3. Wait for event processing
await sleep(2000);

// 4. Verify event received
assert(eventReceived === true, 'Event not received by subscriber');

// 5. Verify EHR updated
const ehrData = await ehrService.getLabResults('test-patient-id');
assert(ehrData.length > 0, 'EHR not updated with lab result');
```

### ✅ Success Criteria
- [ ] Events published successfully
- [ ] Events consumed by subscribers
- [ ] Data updated via events
- [ ] No event loss
- [ ] Event ordering preserved

---

## ⏱️ Test 10: System Performance Test

### Objective
Verify overall system performance after database separation.

### Metrics to Measure

| **Metric** | **Before Phase 2** | **After Phase 2** | **Status** |
|------------|-------------------|-------------------|------------|
| Avg Response Time | X ms | Y ms | ✅/❌ |
| P95 Response Time | X ms | Y ms | ✅/❌ |
| DB Connection Time | X ms | Y ms | ✅/❌ |
| Query Execution Time | X ms | Y ms | ✅/❌ |
| System Throughput | X req/s | Y req/s | ✅/❌ |

### Performance Test Script

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test Auth Service
ab -n 10000 -c 100 -H "Authorization: Bearer token" \
   http://localhost:7020/api/v1/auth/verify-token

# Test Billing Service
ab -n 5000 -c 50 http://localhost:7050/api/v1/invoices

# Test Payment Gateway
ab -n 5000 -c 50 http://localhost:7030/api/v1/payments

# Compare with baseline metrics
```

### ✅ Success Criteria
- [ ] Performance degradation < 10%
- [ ] No significant latency increase
- [ ] Connection pools efficient
- [ ] No database bottlenecks
- [ ] Caching effective

---

## 🎯 Test 11: Disaster Recovery Test

### Objective
Test backup and restore procedures for all service databases.

### Test Procedure

```bash
# 1. Backup all service databases
for db in nilecare_auth nilecare_billing nilecare_payment nilecare_clinical nilecare_facility nilecare_lab nilecare_medication nilecare_inventory; do
  mysqldump -u root -p $db > backup_${db}_$(date +%Y%m%d).sql
done

# 2. Simulate disaster (drop a database)
mysql -u root -p -e "DROP DATABASE nilecare_auth;"

# 3. Restore from backup
mysql -u root -p -e "CREATE DATABASE nilecare_auth;"
mysql -u root -p nilecare_auth < backup_nilecare_auth_*.sql

# 4. Verify service works
cd microservices/auth-service
npm run dev

# 5. Test API endpoints
curl http://localhost:7020/health
```

### ✅ Success Criteria
- [ ] All databases can be backed up
- [ ] Backups can be restored
- [ ] Services work with restored databases
- [ ] No data loss
- [ ] Recovery time acceptable

---

## 📋 Comprehensive Test Checklist

### Pre-Migration Testing
- [ ] All Phase 1 tests passing
- [ ] Flyway configurations validated
- [ ] Backup procedures tested
- [ ] Rollback procedures documented
- [ ] Team trained

### During Migration Testing (Per Service)
- [ ] Data export successful
- [ ] Data import successful
- [ ] Record counts match
- [ ] Service starts with new DB
- [ ] API endpoints functional
- [ ] No errors in logs
- [ ] Cross-service calls working

### Post-Migration Testing
- [ ] All 15+ services running
- [ ] No cross-service DB queries
- [ ] API integration working
- [ ] Event patterns functional
- [ ] Performance acceptable
- [ ] Security isolation verified
- [ ] Monitoring dashboards updated

### Regression Testing
- [ ] All existing features work
- [ ] No broken workflows
- [ ] Data integrity maintained
- [ ] User experience unchanged
- [ ] No performance degradation

---

## 🚨 Test Failure Response

### If Test Fails

1. **Stop migration immediately**
2. **Document the failure**
3. **Execute rollback procedure**
4. **Investigate root cause**
5. **Fix the issue**
6. **Re-test in staging**
7. **Re-attempt migration**

### Escalation Path

- **Minor issues:** Team lead
- **Service down:** Database admin + DevOps
- **Data loss:** CTO + Database team
- **Security breach:** Security team + CTO

---

## 🎯 Final Phase 2 Acceptance Test

### Acceptance Criteria

**Phase 2 is ACCEPTED when:**

- [ ] All 12 services migrated to separate databases
- [ ] Zero data loss verified
- [ ] All services operational
- [ ] All API integrations working
- [ ] All event patterns functional
- [ ] Performance within 10% of baseline
- [ ] Security isolation verified
- [ ] All end-to-end workflows tested
- [ ] Documentation updated
- [ ] Team trained on new architecture
- [ ] Production deployment successful
- [ ] 48-hour stability period passed

---

## 📈 Progress Tracking

### Week-by-Week Goals

| Week | Services | Tables | APIs | Events | Status |
|------|----------|--------|------|--------|--------|
| 3 | 3 | 26 | 15+ | 5 | ⏳ Pending |
| 4 | 3 | 21 | 12+ | 3 | ⏳ Pending |
| 5 | 3 | 16 | 10+ | 4 | ⏳ Pending |
| 6 | 3 | 5+ | 8+ | 2 | ⏳ Pending |

**Total:** 12 services, 68+ tables, 45+ APIs, 14+ events

---

## ✅ Success Report Template

```markdown
# Phase 2 Migration Test Report

**Service:** [Service Name]
**Date:** [Date]
**Tester:** [Name]

## Test Results

| Test | Result | Notes |
|------|--------|-------|
| Data Integrity | ✅/❌ | Record counts match |
| Service Startup | ✅/❌ | Started without errors |
| API Integration | ✅/❌ | API calls functional |
| Performance | ✅/❌ | Within acceptable range |
| Security | ✅/❌ | Isolation verified |

## Issues Found
[List any issues]

## Recommendations
[Any recommendations]

## Sign-Off
- [ ] QA Team
- [ ] Database Team
- [ ] DevOps Team
```

---

**Document Owner:** QA & Testing Team  
**Last Updated:** October 15, 2025  
**Status:** ✅ **READY FOR PHASE 2 TESTING**

