# 📡 NileCare API Reference

**Last Updated:** October 15, 2025  
**Version:** 2.0.0  
**Base URL:** `http://localhost:7000` (Development)

---

## 🌐 Base URLs

### Development
```
Auth Service:        http://localhost:7020
Main Service:        http://localhost:7000
Business Service:    http://localhost:7010
Appointment Service: http://localhost:7040
Payment Service:     http://localhost:7030
```

### Production
```
Base URL: https://api.nilecare.sd
```

---

## 🔐 Authentication

All API endpoints (except login/register) require authentication via JWT token.

### Headers
```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### Get Access Token

**POST** `/api/auth/login`

```json
// Request
{
  "email": "doctor@nilecare.sd",
  "password": "TestPass123!"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "userId": 1,
    "email": "doctor@nilecare.sd",
    "role": "doctor"
  }
}
```

---

## 👥 Patients API

### List Patients
**GET** `/api/patients`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search by name, email, or ID

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

### Get Patient
**GET** `/api/patients/:id`

### Create Patient
**POST** `/api/patients`

```json
{
  "firstName": "Ahmed",
  "lastName": "Mohamed",
  "email": "ahmed@example.com",
  "phone": "+249123456789",
  "nationalId": "12345678901234",
  "dateOfBirth": "1990-01-15",
  "gender": "male"
}
```

### Update Patient
**PUT** `/api/patients/:id`

### Delete Patient
**DELETE** `/api/patients/:id`

---

## 📅 Appointments API

### List Appointments
**GET** `/api/appointments`

**Query Parameters:**
- `patientId` (number): Filter by patient
- `providerId` (number): Filter by provider
- `date` (string): Filter by date (YYYY-MM-DD)
- `status` (string): scheduled, completed, cancelled

### Get Appointment
**GET** `/api/appointments/:id`

### Create Appointment
**POST** `/api/appointments`

```json
{
  "patientId": 1,
  "providerId": 2,
  "appointmentDate": "2025-10-20",
  "appointmentTime": "10:00:00",
  "duration": 30,
  "reason": "Annual checkup",
  "type": "consultation"
}
```

### Update Appointment
**PUT** `/api/appointments/:id`

### Cancel Appointment
**POST** `/api/appointments/:id/cancel`

```json
{
  "reason": "Patient request"
}
```

### Check Available Slots
**GET** `/api/schedules/available-slots`

**Query Parameters:**
- `providerId` (required)
- `date` (required): YYYY-MM-DD
- `duration` (optional): Minutes (default: 30)

---

## 💳 Payments API

### Create Payment
**POST** `/api/payments`

```json
{
  "patientId": 1,
  "amount": 500.00,
  "currency": "SDG",
  "provider": "zain_cash",
  "description": "Consultation fee"
}
```

### Get Payment
**GET** `/api/payments/:id`

### Verify Payment
**POST** `/api/payments/:id/verify`

### Process Refund
**POST** `/api/payments/:id/refund`

```json
{
  "amount": 500.00,
  "reason": "Service cancelled"
}
```

---

## 🏥 Clinical Data API

### Create Encounter
**POST** `/api/encounters`

```json
{
  "patientId": 1,
  "providerId": 2,
  "encounterType": "outpatient",
  "chiefComplaint": "Fever and cough",
  "facilityId": 1
}
```

### Add Vital Signs
**POST** `/api/vitals`

```json
{
  "encounterId": 123,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "heartRate": 75,
  "temperature": 37.5,
  "respiratoryRate": 16,
  "oxygenSaturation": 98
}
```

### Add Diagnosis
**POST** `/api/diagnoses`

```json
{
  "encounterId": 123,
  "icd10Code": "J00",
  "description": "Acute nasopharyngitis (common cold)",
  "type": "primary"
}
```

### Create Prescription
**POST** `/api/medications`

```json
{
  "patientId": 1,
  "encounterId": 123,
  "medicationName": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "Three times daily",
  "duration": "7 days",
  "instructions": "Take with food"
}
```

---

## 📊 Analytics API

### Dashboard Stats
**GET** `/api/dashboard/stats`

```json
{
  "totalPatients": 1500,
  "todayAppointments": 45,
  "activeEncounters": 12,
  "pendingPayments": 23
}
```

### Revenue Analytics
**GET** `/api/analytics/revenue`

**Query Parameters:**
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `groupBy`: day, week, month

---

## ⚠️ Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## 🔄 Pagination

All list endpoints support pagination:

```
GET /api/patients?page=2&limit=50
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 50,
    "pages": 3
  }
}
```

---

## 🔍 Search & Filtering

### Advanced Search

**GET** `/api/search/patients`

**Query Parameters:**
- `q`: Search query
- `ageMin`: Minimum age
- `ageMax`: Maximum age
- `gender`: male, female
- `facilityId`: Filter by facility

---

## 📚 Related Documentation

- [Authentication Guide](./AUTHENTICATION.md) - Complete auth details
- [Quick Start](./QUICKSTART.md) - Setup guide
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [Main README](./README.md) - System overview

---

## 🧪 Testing

### Postman Collection

Import the Postman collection for easy testing:
- File: `tests/postman/NileCare-API.postman_collection.json`

### cURL Examples

```bash
# Login
curl -X POST http://localhost:7020/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@nilecare.sd","password":"TestPass123!"}'

# Get Patients
curl -H "Authorization: Bearer <token>" \
  http://localhost:7000/api/patients

# Create Appointment
curl -X POST http://localhost:7040/api/appointments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"patientId":1,"providerId":2,"appointmentDate":"2025-10-20","appointmentTime":"10:00:00"}'
```

---

## 📞 Support

- 📧 Email: api@nilecare.sd
- 📖 Documentation: https://docs.nilecare.sd/api
- 🐛 Report Issues: https://github.com/your-org/nilecare/issues

---

**Last Updated:** October 15, 2025  
**API Version:** 2.0.0


