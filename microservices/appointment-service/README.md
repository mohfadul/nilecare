# NileCare Appointment Service 📅

**Version:** 1.0.0  
**Port:** 7040  
**Database:** MySQL  
**Real-time:** Socket.IO

---

## Overview

The Appointment Service is a critical microservice in the NileCare platform that handles all appointment-related operations including scheduling, reminders, waitlist management, and resource booking.

### Key Features

- ✅ **Appointment Management** - Complete CRUD operations for appointments
- ✅ **Schedule Management** - Provider availability and time slot calculation
- ✅ **Resource Booking** - Room and equipment reservation
- ✅ **Waitlist Management** - Patient waitlist with priority handling
- ✅ **Automated Reminders** - Email and SMS reminders via Nodemailer and Twilio
- ✅ **Real-time Notifications** - Socket.IO for live updates
- ✅ **Conflict Detection** - Automatic double-booking prevention
- ✅ **Recurring Appointments** - Support for recurring appointment patterns
- ✅ **Calendar Export** - iCal format support

---

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0
- Redis 7 (optional, for caching)
- SMTP server (optional, for email reminders)
- Twilio account (optional, for SMS reminders)

### Installation

```bash
# Navigate to appointment service directory
cd microservices/appointment-service

# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=7040

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# JWT Secret (must match auth service)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:7001

# Service URLs
AUTH_SERVICE_URL=http://localhost:7020
MAIN_SERVICE_URL=http://localhost:7000

# Email (Nodemailer) - Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=nilecare@example.com

# SMS (Twilio) - Optional
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+249123456789

# Logging
LOG_LEVEL=info
```

### Database Setup

```bash
# Create database and run migrations
mysql -u root -p nilecare < ../../database/mysql/schema/appointment_service.sql
```

### Start the Service

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The service will start on http://localhost:7040

---

## API Endpoints

### Authentication

All endpoints (except `/health`) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Appointments

#### Get All Appointments

```http
GET /api/v1/appointments
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Results per page
- `status` (string) - Filter by status (scheduled, confirmed, completed, cancelled, no-show)
- `providerId` (string) - Filter by provider
- `patientId` (string) - Filter by patient
- `date` (string, YYYY-MM-DD) - Filter by date

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### Get Appointment by ID

```http
GET /api/v1/appointments/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "patient_id": "1",
    "provider_id": "2",
    "appointment_date": "2025-10-20",
    "appointment_time": "10:00:00",
    "duration": 30,
    "status": "scheduled",
    "reason": "Checkup",
    "patient_first_name": "John",
    "patient_last_name": "Doe",
    "provider_first_name": "Jane",
    "provider_last_name": "Smith"
  }
}
```

#### Create Appointment

```http
POST /api/v1/appointments
```

**Request Body:**
```json
{
  "patientId": "1",
  "providerId": "2",
  "appointmentDate": "2025-10-20",
  "appointmentTime": "10:00:00",
  "duration": 30,
  "reason": "Regular checkup",
  "notes": "Patient requested morning slot"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "status": "scheduled",
    ...
  }
}
```

#### Update Appointment

```http
PUT /api/v1/appointments/:id
```

**Request Body:** (all fields optional)
```json
{
  "appointmentDate": "2025-10-21",
  "appointmentTime": "14:00:00",
  "duration": 45,
  "notes": "Updated notes"
}
```

#### Update Appointment Status

```http
PATCH /api/v1/appointments/:id/status
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Supported Statuses:**
- `scheduled` - Initial state
- `confirmed` - Patient confirmed
- `checked-in` - Patient arrived
- `in-progress` - Currently seeing doctor
- `completed` - Appointment finished
- `cancelled` - Appointment cancelled
- `no-show` - Patient didn't show up

#### Confirm Appointment

```http
PATCH /api/v1/appointments/:id/confirm
```

#### Complete Appointment

```http
PATCH /api/v1/appointments/:id/complete
```

#### Cancel Appointment

```http
DELETE /api/v1/appointments/:id
```

#### Get Today's Appointments

```http
GET /api/v1/appointments/today?providerId=2
```

#### Get Appointment Statistics

```http
GET /api/v1/appointments/stats?dateFrom=2025-10-01&dateTo=2025-10-31
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "status": "scheduled", "count": 45 },
    { "status": "completed", "count": 120 },
    { "status": "cancelled", "count": 8 }
  ]
}
```

### Schedules

#### Get Provider Schedule

```http
GET /api/v1/schedules/provider/:providerId?dateFrom=2025-10-01&dateTo=2025-10-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "providerId": "2",
    "appointments": [...]
  }
}
```

#### Get Available Time Slots

```http
GET /api/v1/schedules/available-slots?providerId=2&date=2025-10-20&duration=30
```

**Response:**
```json
{
  "success": true,
  "data": {
    "providerId": "2",
    "date": "2025-10-20",
    "duration": 30,
    "availableSlots": [
      "08:00:00",
      "08:30:00",
      "09:00:00",
      "14:00:00",
      "14:30:00"
    ],
    "totalSlots": 5
  }
}
```

**Note:** Work hours are 8 AM - 5 PM by default. Slots are calculated based on existing appointments.

### Resources

#### Get All Resources

```http
GET /api/v1/resources?type=room
```

**Query Parameters:**
- `type` (string) - Filter by resource type (room, equipment, bed)

#### Check Resource Availability

```http
GET /api/v1/resources/:id/availability?date=2025-10-20&timeFrom=10:00:00&timeTo=11:00:00
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resourceId": "5",
    "date": "2025-10-20",
    "timeFrom": "10:00:00",
    "timeTo": "11:00:00",
    "available": true
  }
}
```

### Waitlist

#### Get Waitlist Entries

```http
GET /api/v1/waitlist?providerId=2&status=waiting
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "10",
      "patient_id": "3",
      "provider_id": "2",
      "preferred_date": "2025-10-22",
      "reason": "Follow-up",
      "status": "waiting",
      "first_name": "Alice",
      "last_name": "Johnson",
      "phone": "+249123456789",
      "email": "alice@example.com"
    }
  ]
}
```

#### Add Patient to Waitlist

```http
POST /api/v1/waitlist
```

**Request Body:**
```json
{
  "patientId": "3",
  "providerId": "2",
  "preferredDate": "2025-10-22",
  "reason": "Follow-up appointment"
}
```

#### Mark Waitlist Entry as Contacted

```http
PATCH /api/v1/waitlist/:id/contacted
```

#### Remove from Waitlist

```http
DELETE /api/v1/waitlist/:id
```

### Reminders

#### Get Pending Reminders

```http
GET /api/v1/reminders/pending
```

#### Process Pending Reminders

```http
POST /api/v1/reminders/process
```

This endpoint manually triggers the reminder processing. Normally, reminders are processed automatically every 5 minutes via cron job.

#### Schedule Reminders for Appointment

```http
POST /api/v1/reminders/appointment/:appointmentId
```

This creates:
- 24-hour email reminder
- 2-hour SMS reminder (if patient has phone number)

### Health & Monitoring

#### Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "service": "appointment-service",
  "status": "healthy",
  "timestamp": "2025-10-13T10:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

#### Readiness Probe

```http
GET /health/ready
```

#### Startup Probe

```http
GET /health/startup
```

#### Metrics (Prometheus format)

```http
GET /metrics
```

---

## Real-time Notifications (Socket.IO)

The service provides real-time updates via Socket.IO.

### Connect to Socket.IO

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:7040', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Join Rooms

```javascript
// Join user-specific room
socket.emit('join', {
  userId: '123',
  role: 'doctor'
});
```

### Listen for Events

```javascript
// New appointment created
socket.on('appointment:created', (data) => {
  console.log('New appointment:', data);
});

// Appointment updated
socket.on('appointment:updated', (data) => {
  console.log('Appointment updated:', data);
});

// Appointment cancelled
socket.on('appointment:cancelled', (data) => {
  console.log('Appointment cancelled:', data);
});

// Patient checked in
socket.on('patient:checked-in', (data) => {
  console.log('Patient arrived:', data);
});
```

---

## Email & SMS Configuration

### Email Setup (Nodemailer)

Configure SMTP settings in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=nilecare@example.com
```

**Gmail Setup:**
1. Enable 2-Step Verification
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the generated password in `SMTP_PASS`

### SMS Setup (Twilio)

Configure Twilio settings in `.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+249123456789
```

**Twilio Setup:**
1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token from dashboard
3. Purchase a phone number (Sudan: +249)

**Note:** Email and SMS services are optional. The service will simulate sending in development mode if credentials are not configured.

---

## Automated Tasks (Cron Jobs)

The service runs automated tasks:

### Reminder Processing (Every 5 minutes)

```
Schedule: */5 * * * *
Task: Process and send pending appointment reminders
```

Checks for reminders where:
- `sent = FALSE`
- `scheduled_time <= NOW()`
- Appointment status is not cancelled/no-show/completed

---

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage

The test suite covers:
- ✅ AppointmentService CRUD operations
- ✅ Conflict detection
- ✅ ReminderService email/SMS sending
- ✅ Schedule availability calculation
- ✅ Error handling

Target coverage: 80%+

---

## Architecture

### Service Layer

```
src/
├── index.ts                    # Main entry point
├── config/
│   └── database.ts            # Database configuration
├── routes/
│   ├── appointments.ts        # Appointment routes
│   ├── schedules.ts           # Schedule routes
│   ├── resources.ts           # Resource routes
│   ├── waitlist.ts            # Waitlist routes
│   └── reminders.ts           # Reminder routes
├── services/
│   ├── AppointmentService.ts  # Business logic
│   ├── ReminderService.ts     # Reminder management
│   ├── EmailService.ts        # Email notifications
│   ├── SMSService.ts          # SMS notifications
│   ├── NotificationService.ts # Real-time notifications
│   └── EventService.ts        # Event publishing
├── middleware/
│   ├── errorHandler.ts        # Error handling
│   ├── logger.ts              # Request logging
│   └── validation.ts          # Input validation
└── __tests__/
    ├── AppointmentService.test.ts
    └── ReminderService.test.ts
```

### Database Schema

Key tables:
- `appointments` - Main appointment records
- `appointment_reminders` - Scheduled reminders
- `appointment_waitlist` - Patient waitlist
- `resources` - Rooms, equipment, beds
- `resource_bookings` - Resource reservations

---

## Integration with Orchestrator

The appointment service integrates with the main-nilecare orchestrator. Frontend applications should access endpoints through the orchestrator:

```bash
# Direct access (not recommended for frontend)
GET http://localhost:7040/api/v1/appointments

# Via orchestrator (recommended)
GET http://localhost:7000/api/appointment/appointments
```

**Benefits:**
- Single entry point for all services
- Centralized authentication
- Request logging and monitoring
- Load balancing support

---

## Troubleshooting

### Service won't start

```bash
# Check database connection
mysql -u root -p -e "SELECT 1 FROM appointments LIMIT 1;" nilecare

# Check port availability
lsof -i :7040

# Check environment variables
node -e "require('dotenv').config(); console.log(process.env)"
```

### Reminders not sending

```bash
# Check cron job is running (look for log messages every 5 minutes)
# Verify SMTP/Twilio credentials
# Check reminder records in database
mysql -u root -p -e "SELECT * FROM appointment_reminders WHERE sent = 0;" nilecare
```

### Socket.IO not connecting

- Verify CORS settings in `ALLOWED_ORIGINS`
- Check firewall rules for port 7040
- Verify JWT token is valid

---

## Production Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 7040
CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: appointment-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: appointment-service
  template:
    metadata:
      labels:
        app: appointment-service
    spec:
      containers:
      - name: appointment-service
        image: nilecare/appointment-service:latest
        ports:
        - containerPort: 7040
        env:
        - name: PORT
          value: "7040"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: appointment-secrets
              key: db-host
```

---

## Contributing

Please read the main project [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](../../LICENSE) file for details.

---

## Support

For issues and questions:
- 📧 Email: support@nilecare.sd
- 🐛 Issues: https://github.com/your-org/nilecare/issues
- 📖 Documentation: https://docs.nilecare.sd

---

**Made with ❤️ for NileCare Healthcare Platform**

