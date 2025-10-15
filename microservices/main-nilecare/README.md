# 🏥 NileCare Main Orchestration Service

**Version:** 2.0.0  
**Port:** 7000  
**Database:** MySQL  
**Role:** Central Orchestrator

---

## 📋 Overview

The Main NileCare Service acts as the **central orchestrator** for the NileCare Healthcare Platform. It coordinates between various microservices, aggregates data, and provides a unified API gateway for frontend applications.

### Key Responsibilities

- ✅ **Patient Management**: Complete patient records and demographics
- ✅ **Clinical Data**: Encounters, diagnoses, medical history
- ✅ **Service Orchestration**: Coordinates between microservices
- ✅ **Data Aggregation**: Combines data from multiple services
- ✅ **Search & Filtering**: Advanced patient and clinical data search
- ✅ **Dashboard APIs**: Provides data for various role-based dashboards
- ✅ **Audit Logging**: Comprehensive audit trail
- ✅ **Real-time Updates**: Socket.IO for live data push

---

## ✨ Features

### Patient Management
- Complete patient registration and profiles
- Medical history and allergies
- Emergency contacts
- Insurance information
- Document management

### Clinical Operations
- Encounter management (inpatient, outpatient, emergency)
- Diagnosis tracking with ICD-10 codes
- Medication management
- Vital signs monitoring
- Lab order integration
- Immunization records

### Service Integration
- **Auth Service Integration**: Centralized authentication
- **Appointment Service**: Fetches patient appointments
- **Business Service**: Billing and staff information
- **Payment Service**: Payment status and history
- **Device Service**: Medical device data integration

### Dashboards
- Super Admin Dashboard
- Medical Director Dashboard
- Doctor Dashboard
- Nurse Dashboard
- Receptionist Dashboard
- Patient Portal
- Compliance Officer Dashboard
- Lab Technician Dashboard
- Pharmacist Dashboard
- Sudan Health Inspector Dashboard

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Auth Service running on port 7020

### Installation

```bash
cd microservices/main-nilecare
npm install
```

### Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Import schemas
mysql -u root -p nilecare < ../../database/mysql/schema/clinical_data.sql
mysql -u root -p nilecare < ../../database/SEED_DATABASE.sql
```

### Environment Configuration

Create `.env` file:

```env
NODE_ENV=development
PORT=7000

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# JWT (for backward compatibility, but delegates to Auth Service)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Service URLs
AUTH_SERVICE_URL=http://localhost:7020
PAYMENT_SERVICE_URL=http://localhost:7030
BUSINESS_SERVICE_URL=http://localhost:7010
APPOINTMENT_SERVICE_URL=http://localhost:7040

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### Start Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Verify Installation

```bash
# Health check
curl http://localhost:7000/health

# Get patients (requires authentication)
curl -H "Authorization: Bearer <token>" http://localhost:7000/api/patients
```

---

## 📡 API Endpoints

### Patients

#### GET /api/patients
Get all patients (with pagination).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by name, email, or national ID

**Response:**
```json
{
  "patients": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

#### GET /api/patients/:id
Get patient by ID.

#### POST /api/patients
Create new patient.

**Request:**
```json
{
  "firstName": "Ahmed",
  "lastName": "Mohamed",
  "email": "ahmed@example.com",
  "phone": "+249123456789",
  "nationalId": "12345678901234",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "address": "Khartoum, Sudan"
}
```

#### PUT /api/patients/:id
Update patient information.

#### DELETE /api/patients/:id
Soft delete patient.

### Encounters

#### GET /api/encounters
Get all encounters.

#### POST /api/encounters
Create new encounter.

**Request:**
```json
{
  "patientId": 1,
  "providerId": 2,
  "encounterType": "outpatient",
  "chiefComplaint": "Fever and cough",
  "facilityId": 1
}
```

### Clinical Data

#### GET /api/patients/:id/medical-history
Get patient's complete medical history.

#### POST /api/patients/:id/allergies
Add patient allergy.

#### GET /api/patients/:id/medications
Get patient's current medications.

#### POST /api/vitals
Record vital signs.

### Search

#### GET /api/search/patients
Advanced patient search.

**Query Parameters:**
- `q`: Search query
- `ageMin`: Minimum age
- `ageMax`: Maximum age
- `gender`: Gender filter
- `facilityId`: Facility filter

### Dashboards

#### GET /api/dashboard/stats
Get dashboard statistics.

**Response:**
```json
{
  "totalPatients": 1500,
  "todayAppointments": 45,
  "activeEncounters": 12,
  "pendingPayments": 23,
  "criticalAlerts": 3
}
```

#### GET /api/dashboard/recent-activities
Get recent system activities.

### Service Proxying

The orchestrator also proxies requests to other services:

```
GET  /api/appointment/*       → Appointment Service (7040)
GET  /api/business/*          → Business Service (7010)
GET  /api/payment/*           → Payment Service (7030)
```

---

## 🗄️ Database Schema

### Main Tables

- **patients**: Patient demographics and profiles
- **encounters**: Patient visits and encounters
- **diagnoses**: Diagnosis records
- **medications**: Medication prescriptions
- **allergies**: Patient allergies
- **vital_signs**: Vital signs measurements
- **immunizations**: Immunization records
- **lab_orders**: Laboratory test orders
- **clinical_notes**: SOAP notes and clinical documentation
- **audit_logs**: System audit trail

### Key Relationships

```
patients (1) → (N) encounters
patients (1) → (N) allergies
patients (1) → (N) medications
encounters (1) → (N) diagnoses
encounters (1) → (N) vital_signs
```

---

## 🔌 Service Integration

### Auth Service Integration

All routes are protected by authentication middleware:

```typescript
import { authenticateToken } from './middleware/auth';

router.get('/api/patients', authenticateToken, getPatients);
```

The middleware delegates to Auth Service for token validation.

### Appointment Service Integration

```typescript
// Fetch patient appointments
const appointments = await axios.get(
  `${APPOINTMENT_SERVICE_URL}/api/appointments?patientId=${patientId}`,
  { headers: { Authorization: req.headers.authorization } }
);
```

### Business Service Integration

```typescript
// Fetch billing information
const billing = await axios.get(
  `${BUSINESS_SERVICE_URL}/api/billing/patient/${patientId}`,
  { headers: { Authorization: req.headers.authorization } }
);
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Specific test file
npm test -- patients.test.ts

# With coverage
npm run test:coverage
```

### Test Data

```bash
# Seed test data
npm run seed

# Clear test data
npm run seed:clear
```

---

## 🚀 Deployment

### Docker Build

```bash
# Build image
docker build -t nilecare/main-service:2.0.0 .

# Run container
docker run -d \
  -p 7000:7000 \
  --env-file .env.production \
  nilecare/main-service:2.0.0
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=7000

DB_HOST=mysql-production.example.com
DB_PORT=3306
DB_NAME=nilecare
DB_USER=nilecare_app
DB_PASSWORD=<strong-password>

AUTH_SERVICE_URL=http://auth-service:7020
PAYMENT_SERVICE_URL=http://payment-service:7030
BUSINESS_SERVICE_URL=http://business-service:7010
APPOINTMENT_SERVICE_URL=http://appointment-service:7040

CORS_ORIGIN=https://nilecare.sd

LOG_LEVEL=warn
```

---

## 📊 Monitoring

### Health Check

```bash
GET /health
Response: {"status":"healthy","service":"main-nilecare","timestamp":"..."}
```

### Metrics

```bash
GET /metrics
# Prometheus metrics
http_requests_total
http_request_duration_seconds
patients_total
encounters_total
```

---

## 🐛 Troubleshooting

### "Cannot connect to Auth Service"

**Symptoms:** All requests fail with 401 errors

**Solution:**
```bash
# Verify Auth Service is running
curl http://localhost:7020/health

# Check environment variable
echo $AUTH_SERVICE_URL
# Should be: http://localhost:7020
```

### "Database connection error"

**Solution:**
```bash
# Test database connection
mysql -h localhost -u root -p nilecare

# Verify credentials in .env match MySQL
```

### "Service timeout errors"

**Solution:**
```typescript
// Increase timeout in axios calls
const response = await axios.get(url, {
  timeout: 10000  // 10 seconds
});
```

---

## 📚 Related Documentation

- [Authentication Guide](../../AUTHENTICATION.md)
- [Quick Start](../../QUICKSTART.md)
- [Deployment Guide](../../DEPLOYMENT.md)
- [Troubleshooting](../../TROUBLESHOOTING.md)
- [Main README](../../README.md)

---

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Run `npm test` and `npm run lint`
5. Submit pull request

---

## 📞 Support

- 📧 Email: support@nilecare.sd
- 📖 Documentation: https://docs.nilecare.sd
- 🐛 Issues: https://github.com/your-org/nilecare/issues

---

**Last Updated:** October 15, 2025  
**Version:** 2.0.0  
**Port:** 7000  
**Maintained by:** NileCare Development Team


