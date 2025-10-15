# NileCare Business Service

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](tsconfig.json)

**Business Domain Microservice for the NileCare Healthcare Platform**

This service handles core business operations including appointments, billing, staff scheduling, and staff management for the NileCare healthcare system.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Service](#running-the-service)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Business Service is a critical microservice in the NileCare ecosystem that manages:

- **Appointments**: Scheduling, confirmation, cancellation, and provider availability
- **Billing**: Invoice generation, payment tracking, and financial records
- **Scheduling**: Staff schedules, shifts, time-off, and conflict detection
- **Staff Management**: Staff profiles, credentials, department assignments, and availability

**Service Details:**
- **Port**: 7010 (as per NileCare architecture)
- **Database**: MySQL 8.0+
- **Framework**: Express.js + TypeScript
- **Real-time**: Socket.IO for live updates

---

## ✨ Features

### 🗓 Appointment Management

- **Create & Schedule** appointments with conflict detection
- **Provider Availability** checking with time slot generation
- **Appointment Status** tracking (scheduled → confirmed → in-progress → completed)
- **Cancellation & Rescheduling** with audit trail
- **Real-time Notifications** via Socket.IO
- **Waitlist Management** for fully booked slots

### 💰 Billing & Invoicing

- **Invoice Generation** with automatic numbering (INV-YYYY-NNNNNN)
- **Multi-currency Support** (default: SDG - Sudanese Pound)
- **Item-based Billing** with line items and calculations
- **Payment Status Tracking** (draft → pending → paid → overdue)
- **Patient Billing History** with filtering
- **Refund Processing** (future enhancement)

### 📅 Staff Scheduling

- **Shift Management** with overlap detection
- **Schedule Types**: shift, appointment, time-off, break, meeting
- **Conflict Detection** to prevent double-booking
- **Schedule Views**: by staff, by date range, by department
- **Real-time Schedule Updates**

### 👥 Staff Management

- **Staff Profiles** with roles (doctor, nurse, receptionist, admin, technician, therapist)
- **Credential Tracking** (licenses, certifications, expiry dates)
- **Availability Management** (working hours by day of week)
- **Department & Specialization** assignments
- **Status Management** (active, on-leave, suspended, terminated)

---

## 🏗 Architecture

### Technology Stack

```
┌─────────────────────────────────────────┐
│         Business Service (Port 7010)    │
├─────────────────────────────────────────┤
│  Express.js + TypeScript                │
│  ├── Controllers (Request handling)     │
│  ├── Services (Business logic)          │
│  ├── Middleware (Auth, validation)      │
│  └── Events (Socket.IO real-time)       │
├─────────────────────────────────────────┤
│  Database: MySQL 8.0                    │
│  Cache: Redis (optional)                │
│  Real-time: Socket.IO                   │
└─────────────────────────────────────────┘
```

### Service Layers

```
┌──────────────┐
│   Routes     │ → Express routers, Swagger docs
├──────────────┤
│ Controllers  │ → Request validation, response formatting
├──────────────┤
│  Services    │ → Business logic, database operations
├──────────────┤
│  Database    │ → MySQL connection pool
└──────────────┘
```

### Database Schema

```sql
-- Core Tables
├── appointments     # Appointment records
├── billings         # Invoice and billing records
├── schedules        # Staff scheduling
└── staff            # Staff members and credentials
```

See `migrations/001_initial_schema_mysql.sql` for complete schema.

---

## 📦 Prerequisites

### Required

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MySQL** 8.0+ (or XAMPP with MySQL)
- **Environment Variables** (see [Configuration](#configuration))

### Optional

- **Redis** 7.0+ (for caching and rate limiting)
- **Docker** (for containerized deployment)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/nilecare.git
cd nilecare/microservices/business
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy example configuration
cp ENV_CONFIG.md .env

# Edit .env with your settings
nano .env
```

Minimum required variables:
```env
NODE_ENV=development
PORT=7010
DB_HOST=localhost
DB_NAME=nilecare_business
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:5173
```

See [ENV_CONFIG.md](ENV_CONFIG.md) for complete configuration reference.

---

## 🗄 Database Setup

### Option 1: Using Migration Script (Recommended)

```bash
# Using MySQL client
mysql -u root -p < migrations/001_initial_schema_mysql.sql

# Or using npm script
npm run migrate
```

### Option 2: Manual Setup

```sql
-- 1. Create database
CREATE DATABASE nilecare_business CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Select database
USE nilecare_business;

-- 3. Run migration
SOURCE migrations/001_initial_schema_mysql.sql;
```

### Verify Tables

```bash
# Check tables exist
mysql -u root -p nilecare_business -e "SHOW TABLES;"

# Expected output:
# +----------------------------+
# | Tables_in_nilecare_business|
# +----------------------------+
# | appointments               |
# | billings                   |
# | schedules                  |
# | staff                      |
# +----------------------------+
```

---

## ▶️ Running the Service

### Development Mode

```bash
# With auto-reload (recommended for development)
npm run dev

# Expected output:
# ✅ Environment variables validated
# ✅ MySQL database connected
# ✅ Service initialization complete
# ╔═══════════════════════════════════════════════════╗
# ║   BUSINESS SERVICE STARTED                        ║
# ╚═══════════════════════════════════════════════════╝
# ✅ Service: business-service
# ✅ Port: 7010
# ✅ Health: http://localhost:7010/health
# ✅ Ready: http://localhost:7010/health/ready
# ✅ Metrics: http://localhost:7010/metrics
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build image
docker build -t nilecare/business-service .

# Run container
docker run -p 7010:7010 \
  -e DB_HOST=mysql \
  -e DB_NAME=nilecare_business \
  -e JWT_SECRET=your-secret \
  nilecare/business-service
```

### Docker Compose

```bash
docker-compose up -d
```

---

## 📚 API Documentation

### Swagger UI

When running in development mode, access interactive API documentation:

**URL**: http://localhost:7010/api-docs

### Health Endpoints

```bash
# Liveness probe
curl http://localhost:7010/health

# Readiness probe (checks DB and tables)
curl http://localhost:7010/health/ready

# Startup probe
curl http://localhost:7010/health/startup

# Prometheus metrics
curl http://localhost:7010/metrics
```

### API Endpoints Overview

#### Appointments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/appointments` | List all appointments | ✅ |
| GET | `/api/v1/appointments/:id` | Get appointment by ID | ✅ |
| POST | `/api/v1/appointments` | Create appointment | ✅ |
| PUT | `/api/v1/appointments/:id` | Update appointment | ✅ |
| DELETE | `/api/v1/appointments/:id` | Cancel appointment | ✅ |
| PATCH | `/api/v1/appointments/:id/confirm` | Confirm appointment | ✅ |
| PATCH | `/api/v1/appointments/:id/complete` | Complete appointment | ✅ |
| GET | `/api/v1/appointments/availability` | Get provider availability | ✅ |

#### Billing

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/billing` | List all billings | ✅ |
| GET | `/api/v1/billing/:id` | Get billing by ID | ✅ |
| POST | `/api/v1/billing` | Create billing/invoice | ✅ |
| PUT | `/api/v1/billing/:id` | Update billing | ✅ |
| PATCH | `/api/v1/billing/:id/pay` | Mark as paid | ✅ |
| PATCH | `/api/v1/billing/:id/cancel` | Cancel billing | ✅ |
| GET | `/api/v1/billing/patient/:patientId` | Get patient history | ✅ |

#### Scheduling

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/scheduling` | List schedules | ✅ |
| GET | `/api/v1/scheduling/:id` | Get schedule by ID | ✅ |
| POST | `/api/v1/scheduling` | Create schedule | ✅ |
| PUT | `/api/v1/scheduling/:id` | Update schedule | ✅ |
| DELETE | `/api/v1/scheduling/:id` | Cancel schedule | ✅ |
| GET | `/api/v1/scheduling/staff/:staffId` | Get staff schedule | ✅ |

#### Staff

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/staff` | List staff members | ✅ |
| GET | `/api/v1/staff/:id` | Get staff by ID | ✅ |
| POST | `/api/v1/staff` | Create staff member | ✅ |
| PUT | `/api/v1/staff/:id` | Update staff member | ✅ |
| DELETE | `/api/v1/staff/:id` | Terminate staff | ✅ |
| GET | `/api/v1/staff/role/:role` | Get by role | ✅ |
| GET | `/api/v1/staff/department/:dept` | Get by department | ✅ |

### Authentication

All API endpoints require JWT authentication:

```bash
# Include token in Authorization header
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:7010/api/v1/appointments
```

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- AppointmentService.test.ts

# Watch mode
npm run test:watch
```

### Manual API Testing

```bash
# Example: Create appointment
curl -X POST http://localhost:7010/api/v1/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patientId": "uuid-here",
    "providerId": "uuid-here",
    "appointmentDate": "2025-10-15T10:00:00Z",
    "appointmentType": "consultation",
    "duration": 30,
    "priority": "routine"
  }'
```

---

## 🚢 Deployment

### Environment-specific Configurations

#### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_API_DOCS=true
```

#### Staging
```env
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_API_DOCS=true
```

#### Production
```env
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_API_DOCS=false
```

### Kubernetes Deployment

```bash
# Apply deployment
kubectl apply -f ../../infrastructure/kubernetes/business-service.yaml

# Check status
kubectl get pods -n nilecare | grep business

# View logs
kubectl logs -f deployment/business-service -n nilecare
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```
❌ MySQL connection failed: Access denied for user 'root'@'localhost'
```

**Solution**: Check database credentials in `.env`

```env
DB_USER=root
DB_PASSWORD=your_password
```

#### 2. Missing Tables

```
Error: Table 'nilecare_business.appointments' doesn't exist
```

**Solution**: Run database migration

```bash
mysql -u root -p < migrations/001_initial_schema_mysql.sql
```

#### 3. Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::7010
```

**Solution**: Change port or kill process

```bash
# Change port in .env
PORT=7011

# Or kill existing process
lsof -ti:7010 | xargs kill -9
```

#### 4. JWT Verification Failed

```
Error: Invalid token provided
```

**Solution**: Ensure `JWT_SECRET` matches auth-service

```env
# Must be same in both services
JWT_SECRET=same-secret-in-auth-and-business-services
```

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
DEBUG=true
LOG_REQUESTS=true
```

### Health Check Failures

```bash
# Check readiness
curl http://localhost:7010/health/ready

# Response will show which check failed:
# - database.healthy: false → DB connection issue
# - tables.healthy: false → Missing tables
```

---

## 📊 Monitoring

### Metrics Endpoint

Prometheus-compatible metrics available at:

```
http://localhost:7010/metrics
```

**Metrics Provided:**
- `business_service_uptime_seconds` - Service uptime
- `db_pool_connection_limit` - Max DB connections
- `db_pool_queue_limit` - Max queued requests
- `db_type` - Database type (mysql)

### Logs

Logs are written to:
- `./logs/error.log` - Error level logs
- `./logs/combined.log` - All logs

Log rotation: 10MB max, 5 files retained

---

## 🤝 Integration with NileCare Ecosystem

This service integrates with:

- **Auth Service** (Port 7020) - JWT validation, user authentication
- **Main NileCare** (Port 7000) - Orchestration, data aggregation
- **Payment Service** (Port 7030) - Payment processing
- **Web Dashboard** (Port 5173) - User interface

### Inter-service Communication

```typescript
// Example: Creating appointment with payment
POST /api/v1/appointments
  ↓
Business Service creates appointment
  ↓
Emits 'appointment:created' event via Socket.IO
  ↓
Web Dashboard receives real-time update
```

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Support

For issues and questions:
- **GitHub Issues**: [Create an issue](https://github.com/your-org/nilecare/issues)
- **Documentation**: See main [NileCare README](../../README.md)
- **Email**: support@nilecare.sd

---

## 🗺 Roadmap

### Version 1.1 (Planned)
- [ ] Appointment waitlist automation
- [ ] Recurring appointment templates
- [ ] Staff performance metrics
- [ ] Advanced billing reports

### Version 1.2 (Planned)
- [ ] Integration with external calendar systems
- [ ] SMS appointment reminders
- [ ] Multi-facility support
- [ ] Advanced conflict resolution

---

**Built with ❤️ for Sudan Healthcare**

