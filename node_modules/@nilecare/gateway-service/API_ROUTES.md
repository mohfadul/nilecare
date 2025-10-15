# API Gateway Routes Reference

## Quick Reference

All routes are prefixed with `/api/v1/` unless otherwise noted.

**Base URL**: `http://localhost:3000` (development) or `https://api.nilecare.com` (production)

---

## 🏥 Health & Monitoring

### Health Check
```http
GET /health
```
Returns gateway health status and features.

**Authentication**: None required

**Response**:
```json
{
  "status": "healthy",
  "service": "gateway-service",
  "timestamp": "2025-10-15T14:30:45.123Z",
  "version": "1.0.0",
  "features": {
    "apiRouting": true,
    "requestComposition": true,
    "responseTransformation": true,
    "cors": true,
    "securityHeaders": true,
    "swaggerDocumentation": true,
    "rateLimiting": true,
    "caching": true
  }
}
```

### Readiness Probe
```http
GET /health/ready
```
Kubernetes readiness probe - checks if gateway can handle requests.

### Startup Probe
```http
GET /health/startup
```
Kubernetes startup probe - checks if gateway has fully initialized.

### Metrics
```http
GET /metrics
```
Prometheus-compatible metrics endpoint.

---

## 📚 API Documentation

### Swagger UI
```http
GET /api-docs
```
Interactive API documentation with Swagger UI.

### OpenAPI Specification
```http
GET /api-docs/swagger.json
```
Complete OpenAPI 3.0 specification (merged from all services).

---

## 🔐 Authentication Service (Port 7020)

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "doctor@nilecare.com",
  "password": "password123"
}
```

**Authentication**: None required

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "doctor@nilecare.com",
    "role": "doctor",
    "organizationId": "org_456"
  }
}
```

### Register
```http
POST /api/v1/auth/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newuser@nilecare.com",
  "password": "password123",
  "role": "nurse",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

---

## 👥 Clinical Service (Port 7001)

### Patients

#### List Patients
```http
GET /api/v1/patients?page=1&limit=20
Authorization: Bearer {token}
```

#### Get Patient by ID
```http
GET /api/v1/patients/{patientId}
Authorization: Bearer {token}
```

#### Create Patient
```http
POST /api/v1/patients
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "email": "john.doe@example.com",
  "phone": "+249912345678",
  "address": {
    "addressLine1": "123 Main St",
    "city": "Khartoum",
    "state": "Khartoum",
    "country": "Sudan"
  }
}
```

#### Update Patient
```http
PUT /api/v1/patients/{patientId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "+249912345679",
  "email": "newemail@example.com"
}
```

### Encounters

#### List Encounters
```http
GET /api/v1/encounters?patientId={patientId}
Authorization: Bearer {token}
```

#### Create Encounter
```http
POST /api/v1/encounters
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "pat_123",
  "encounterType": "consultation",
  "chiefComplaint": "Fever and cough",
  "providerId": "doc_456"
}
```

### Medications

#### List Medications
```http
GET /api/v1/medications?patientId={patientId}
Authorization: Bearer {token}
```

#### Prescribe Medication
```http
POST /api/v1/medications
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "pat_123",
  "medicationName": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "TID",
  "duration": "7 days"
}
```

### Diagnostics

#### List Diagnostics
```http
GET /api/v1/diagnostics?patientId={patientId}
Authorization: Bearer {token}
```

### FHIR Resources

#### Get FHIR Patient
```http
GET /api/v1/fhir/Patient/{patientId}
Authorization: Bearer {token}
```

#### Search FHIR Observations
```http
GET /api/v1/fhir/Observation?patient={patientId}
Authorization: Bearer {token}
```

---

## 📅 Business Service (Port 7010)

### Appointments

#### List Appointments
```http
GET /api/v1/appointments?date=2025-10-15&providerId={providerId}
Authorization: Bearer {token}
```

#### Create Appointment
```http
POST /api/v1/appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "pat_123",
  "providerId": "doc_456",
  "appointmentType": "consultation",
  "scheduledAt": "2025-10-20T10:00:00Z",
  "duration": 30,
  "reason": "Follow-up visit"
}
```

#### Cancel Appointment
```http
DELETE /api/v1/appointments/{appointmentId}
Authorization: Bearer {token}
```

### Scheduling

#### Get Provider Schedule
```http
GET /api/v1/scheduling/providers/{providerId}/slots?date=2025-10-15
Authorization: Bearer {token}
```

### Billing

#### List Bills
```http
GET /api/v1/billing/invoices?patientId={patientId}
Authorization: Bearer {token}
```

#### Create Invoice
```http
POST /api/v1/billing/invoices
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "pat_123",
  "items": [
    {
      "description": "Consultation",
      "amount": 50.00,
      "quantity": 1
    }
  ]
}
```

### Staff

#### List Staff
```http
GET /api/v1/staff?role=doctor&facilityId={facilityId}
Authorization: Bearer {token}
```

---

## 📊 Data Service (Port 7003)

### Analytics

#### Get Dashboard
```http
GET /api/v1/analytics/dashboard?period=7d
Authorization: Bearer {token}
```

#### Get Metrics
```http
GET /api/v1/analytics/metrics?metric=patient_visits&startDate=2025-10-01&endDate=2025-10-15
Authorization: Bearer {token}
```

### Reports

#### List Reports
```http
GET /api/v1/reports
Authorization: Bearer {token}
```

#### Generate Report
```http
POST /api/v1/reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "reportType": "patient_census",
  "period": {
    "start": "2025-10-01",
    "end": "2025-10-15"
  },
  "filters": {
    "facilityId": "fac_123"
  }
}
```

### Insights

#### Get Clinical Insights
```http
GET /api/v1/insights/clinical?facilityId={facilityId}
Authorization: Bearer {token}
```

---

## 🔔 Notification Service (Port 7002)

### Notifications

#### List Notifications
```http
GET /api/v1/notifications?userId={userId}&unreadOnly=true
Authorization: Bearer {token}
```

#### Mark as Read
```http
PUT /api/v1/notifications/{notificationId}/read
Authorization: Bearer {token}
```

### WebSocket (Real-time)

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/notifications', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log(notification);
};
```

---

## 💳 Payment Gateway Service (Optional)

### Payments

#### List Payments
```http
GET /api/v1/payments?patientId={patientId}
Authorization: Bearer {token}
```

#### Process Payment
```http
POST /api/v1/payments/process
Authorization: Bearer {token}
Content-Type: application/json

{
  "invoiceId": "inv_123",
  "amount": 100.00,
  "currency": "SDG",
  "paymentMethod": "credit_card",
  "cardToken": "tok_abc123"
}
```

#### Refund Payment
```http
POST /api/v1/payments/{paymentId}/refund
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 50.00,
  "reason": "Duplicate payment"
}
```

---

## 🔌 Device Integration Service (Optional)

### Devices

#### List Devices
```http
GET /api/v1/devices?facilityId={facilityId}
Authorization: Bearer {token}
```

#### Get Device Data
```http
GET /api/v1/devices/{deviceId}/data?startTime=2025-10-15T00:00:00Z
Authorization: Bearer {token}
```

#### Send Device Command
```http
POST /api/v1/devices/{deviceId}/command
Authorization: Bearer {token}
Content-Type: application/json

{
  "command": "start_monitoring",
  "parameters": {
    "interval": 60
  }
}
```

### WebSocket (Real-time Device Data)

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/devices', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

ws.onmessage = (event) => {
  const deviceData = JSON.parse(event.data);
  console.log('Real-time device data:', deviceData);
};
```

---

## 🔄 Request Composition

### Compose Multiple Service Requests

The gateway can aggregate data from multiple services in a single request.

```http
POST /api/v1/compose
Authorization: Bearer {token}
Content-Type: application/json

{
  "endpoints": [
    {
      "name": "patient",
      "url": "http://clinical-service:7001/api/v1/patients/pat_123"
    },
    {
      "name": "appointments",
      "url": "http://business-service:7010/api/v1/appointments?patientId=pat_123"
    },
    {
      "name": "billing",
      "url": "http://business-service:7010/api/v1/billing/invoices?patientId=pat_123"
    }
  ],
  "mergeStrategy": "nested"
}
```

**Response**:
```json
{
  "patient": {
    "id": "pat_123",
    "firstName": "John",
    "lastName": "Doe"
  },
  "appointments": [
    { "id": "apt_1", "date": "2025-10-20" }
  ],
  "billing": {
    "totalOwed": 150.00,
    "invoices": [...]
  }
}
```

---

## 📋 Common Headers

### Required Headers

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### Optional Headers

```
X-Request-Id: {unique_request_id}
X-API-Key: {api_key}  (for third-party integrations)
Accept: application/json
User-Agent: {client_info}
```

### Response Headers

Gateway adds these headers:

```
X-Gateway-Forwarded: true
X-Gateway-Timestamp: 2025-10-15T14:30:45.123Z
X-Request-Id: {request_id}
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1697385845
```

---

## 🚫 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request parameters",
    "details": { "field": "email", "error": "Invalid format" }
  },
  "timestamp": "2025-10-15T14:30:45.123Z",
  "path": "/api/v1/patients"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No authorization header provided"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied. Required role(s): admin"
  }
}
```

### 404 Not Found
```json
{
  "error": "Route not found",
  "path": "/api/v1/unknown",
  "method": "GET",
  "timestamp": "2025-10-15T14:30:45.123Z"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests, please try again later"
  },
  "timestamp": "2025-10-15T14:30:45.123Z"
}
```

### 503 Service Unavailable
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service temporarily unavailable (circuit breaker open)"
  },
  "timestamp": "2025-10-15T14:30:45.123Z"
}
```

---

## 📖 Usage Examples

### JavaScript/TypeScript (Fetch API)

```typescript
const baseURL = 'http://localhost:3000';
const token = 'your_jwt_token';

// GET request
const response = await fetch(`${baseURL}/api/v1/patients`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const patients = await response.json();

// POST request
const newPatient = await fetch(`${baseURL}/api/v1/patients`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-15',
    gender: 'male'
  })
});
```

### cURL

```bash
# Set token variable
TOKEN="your_jwt_token"

# GET request
curl -X GET "http://localhost:3000/api/v1/patients" \
  -H "Authorization: Bearer $TOKEN"

# POST request
curl -X POST "http://localhost:3000/api/v1/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "male"
  }'

# With query parameters
curl -X GET "http://localhost:3000/api/v1/patients?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Python (Requests)

```python
import requests

base_url = 'http://localhost:3000'
token = 'your_jwt_token'

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# GET request
response = requests.get(f'{base_url}/api/v1/patients', headers=headers)
patients = response.json()

# POST request
new_patient = {
    'firstName': 'John',
    'lastName': 'Doe',
    'dateOfBirth': '1990-01-15',
    'gender': 'male'
}

response = requests.post(
    f'{base_url}/api/v1/patients',
    json=new_patient,
    headers=headers
)
```

### Axios (Node.js)

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// GET request
const patients = await client.get('/api/v1/patients');

// POST request
const newPatient = await client.post('/api/v1/patients', {
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-15',
  gender: 'male'
});
```

---

## 🔒 Authentication Flow

```
1. User Login
   ↓
   POST /api/v1/auth/login
   ↓
   Receive JWT token
   
2. Make API Request
   ↓
   Include token in Authorization header
   ↓
   Gateway validates token with Auth Service
   ↓
   Gateway forwards request to backend service
   ↓
   Receive response

3. Token Expiry
   ↓
   POST /api/v1/auth/refresh
   ↓
   Receive new token
```

---

## ⚡ Rate Limiting

**Default Limits**:
- **Standard**: 100 requests per 15 minutes
- **Auth endpoints**: 5 attempts per 15 minutes
- **Strict (admin)**: 10 requests per minute

**Rate Limit Headers**:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1697385845
```

**When Exceeded**:
```http
HTTP/1.1 429 Too Many Requests
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests, please try again later"
  },
  "timestamp": "2025-10-15T14:30:45.123Z"
}
```

---

## 🌐 CORS Configuration

**Allowed Origins** (configurable):
- `http://localhost:3000`
- `http://localhost:4200`
- `http://localhost:5173`
- Custom origins via `CORS_ORIGIN` env var

**Allowed Methods**:
- GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers**:
- Content-Type
- Authorization
- X-Requested-With
- X-API-Key

**Exposed Headers**:
- X-Total-Count
- X-Page-Count
- X-Request-Id
- RateLimit-* headers

---

## 📝 Best Practices

### 1. Always Include Authorization Header
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 2. Handle Rate Limiting
```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('RateLimit-Reset');
  // Wait and retry
}
```

### 3. Check Health Before Requests
```javascript
const health = await fetch('http://localhost:3000/health');
if (health.ok) {
  // Proceed with API calls
}
```

### 4. Use Request IDs for Debugging
```javascript
const requestId = uuid();
headers: {
  'X-Request-Id': requestId
}
// Use requestId to trace logs
```

### 5. Handle Errors Gracefully
```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error);
  }
} catch (error) {
  console.error('Network Error:', error);
}
```

---

## 🔄 Complete Route List

| Route | Service | Auth | Description |
|-------|---------|------|-------------|
| `GET /health` | Gateway | No | Health check |
| `GET /health/ready` | Gateway | No | Readiness probe |
| `GET /health/startup` | Gateway | No | Startup probe |
| `GET /metrics` | Gateway | No | Prometheus metrics |
| `GET /api-docs` | Gateway | No | Swagger UI |
| `POST /api/v1/auth/login` | Auth | No | User login |
| `POST /api/v1/auth/register` | Auth | No | User registration |
| `GET/POST /api/v1/patients` | Clinical | Yes | Patient management |
| `GET/POST /api/v1/encounters` | Clinical | Yes | Encounter management |
| `GET/POST /api/v1/medications` | Clinical | Yes | Medication management |
| `GET/POST /api/v1/diagnostics` | Clinical | Yes | Diagnostic records |
| `GET/POST /api/v1/fhir/*` | Clinical | Yes | FHIR resources |
| `GET/POST /api/v1/appointments` | Business | Yes | Appointments |
| `GET/POST /api/v1/scheduling` | Business | Yes | Scheduling |
| `GET/POST /api/v1/billing` | Business | Yes | Billing |
| `GET/POST /api/v1/staff` | Business | Yes | Staff management |
| `GET /api/v1/analytics` | Data | Yes | Analytics |
| `GET /api/v1/reports` | Data | Yes | Reports |
| `GET /api/v1/dashboard` | Data | Yes | Dashboards |
| `GET /api/v1/insights` | Data | Yes | Clinical insights |
| `GET /api/v1/notifications` | Notification | Yes | Notifications |
| `WS /ws/notifications` | Notification | Yes | Real-time notifications |
| `GET/POST /api/v1/payments` | Payment* | Yes | Payments (optional) |
| `GET/POST /api/v1/devices` | Device* | Yes | Devices (optional) |
| `WS /ws/devices` | Device* | Yes | Real-time device data (optional) |

*Optional services (enabled via environment variables)

---

**Last Updated**: October 15, 2025  
**Version**: 1.0.0  
**Maintainer**: NileCare Platform Team

