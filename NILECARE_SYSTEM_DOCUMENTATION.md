# NileCare Healthcare Platform - Comprehensive System Documentation

**Version:** 2.0.0  
**Last Updated:** October 2025  
**Region:** Sudan Healthcare System  
**Architecture:** Microservices with Service Mesh

---

## Table of Contents

1. [Overview](#1-overview)
2. [Module-Level Documentation](#2-module-level-documentation)
3. [Sequence and Workflow Diagrams](#3-sequence-and-workflow-diagrams)
4. [Action Plan / Task Sequence](#4-action-plan--task-sequence)
5. [Code Comments & Implementation Details](#5-code-comments--implementation-details)
6. [Best Practices & Recommendations](#6-best-practices--recommendations)

---

## 1. Overview

### 1.1 High-Level Description

**NileCare** is a comprehensive, Sudan-specific healthcare platform designed to manage clinical operations, appointments, billing, inventory, lab orders, and electronic health records (EHR). The system is built using a **microservices architecture** with modern cloud-native patterns.

### 1.2 Purpose & Goals

- **Clinical Management:** Complete EHR system with FHIR R4 compliance
- **Appointment Scheduling:** Advanced scheduling with waitlist and reminders
- **Billing & Payments:** Multi-provider payment integration (Sudan banks, mobile wallets)
- **Security & Compliance:** RBAC, JWT authentication, PHI audit logging
- **Scalability:** Kubernetes-ready, horizontally scalable microservices
- **Sudan-Specific:** Arabic RTL support, Sudan payment providers, local regulations

### 1.3 Core Functionality

- Patient registration and medical records management
- Appointment scheduling with resource management
- Clinical documentation (SOAP notes, prescriptions, lab orders)
- Billing, invoicing, and payment processing
- Inventory and pharmacy management
- Role-based dashboards (Doctor, Nurse, Admin, Patient, etc.)
- Real-time notifications via WebSocket
- Advanced search and bulk operations
- Audit logging and compliance reporting

### 1.4 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 7001)                       │
│              Rate Limiting, CORS, Request Routing                │
└────────────┬────────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────────┐  ┌────▼─────────┐  ┌─────────────┐  ┌──────────────┐
│ Auth       │  │ Main         │  │ Business    │  │ Payment      │
│ Service    │  │ NileCare     │  │ Service     │  │ Gateway      │
│ (7020)     │  │ (7000)       │  │ (7010)      │  │ (7030)       │
│ PostgreSQL │  │ MySQL        │  │ MySQL       │  │ PostgreSQL   │
└────────────┘  └──────────────┘  └─────────────┘  └──────────────┘
                                         │
                              ┌──────────┴──────────┐
                              │                     │
                    ┌─────────▼─────┐    ┌─────────▼─────┐
                    │ Appointment   │    │ Web Dashboard │
                    │ Service       │    │ React + MUI   │
                    │ (7040)        │    │ (5173)        │
                    └───────────────┘    └───────────────┘

         ┌──────────────────────────────────────────┐
         │   Shared Infrastructure                   │
         │   - Redis (Cache & Sessions)              │
         │   - MySQL (Primary Database)              │
         │   - PostgreSQL (Auth & Payments)          │
         └──────────────────────────────────────────┘
```

**Architecture Type:** **Microservices** with:
- Service Mesh (Istio for production)
- API Gateway pattern (Express-based gateway + Kong)
- Event-driven communication (Kafka)
- CQRS for complex operations
- Database per service pattern

---

## 2. Module-Level Documentation

### 2.1 Auth Service

**Port:** 7020  
**Database:** PostgreSQL  
**Responsibilities:**
- User authentication (JWT + Session-based)
- Role-Based Access Control (RBAC)
- Multi-Factor Authentication (MFA)
- OAuth2 & OpenID Connect support
- Session management
- Password reset & email verification
- Security audit logging

**Key Technologies:**
- Express.js + TypeScript
- Passport.js (Local, JWT, OAuth2 strategies)
- Argon2 for password hashing
- Speakeasy for TOTP MFA
- Redis for session storage
- PostgreSQL for user data

**Database Schema Highlights:**
- `users` - User accounts with MFA, lockout, verification
- `roles` - System and custom roles
- `permissions` - Granular permissions (resource:action)
- `user_roles` - Many-to-many with facility/department scope
- `sessions` - Active sessions with device tracking
- `oauth_clients` - OAuth2 client registration
- `security_audit_log` - Complete audit trail

**API Endpoints:**
```
POST   /api/v1/auth/register          - User registration
POST   /api/v1/auth/login             - Login with credentials
POST   /api/v1/auth/logout            - Logout and invalidate session
POST   /api/v1/auth/refresh-token     - Refresh JWT token
GET    /api/v1/auth/me                - Get current user profile
POST   /api/v1/mfa/enable             - Enable MFA
POST   /api/v1/mfa/verify             - Verify MFA code
GET    /api/v1/users                  - List users (admin)
POST   /api/v1/roles                  - Create role (admin)
GET    /api/v1/sessions               - List active sessions
```

**Environment Variables:**
```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
JWT_SECRET, JWT_EXPIRES_IN
JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN
SESSION_SECRET
REDIS_HOST, REDIS_PORT
```

---

### 2.2 Main NileCare Service

**Port:** 7000  
**Database:** MySQL  
**Responsibilities:**
- Central orchestration and data management
- Patient data management
- Bulk operations (import/export)
- Advanced search functionality
- Audit logging
- Cross-service orchestration
- Service discovery and health monitoring

**Key Features:**
- Patient CRUD operations
- Dashboard data aggregation
- Bulk data import/export
- Advanced filtering and search
- Service registry pattern
- Request logging and audit trails

**API Endpoints:**
```
GET    /api/v1/data/patients          - List patients
POST   /api/v1/data/patients          - Create patient
GET    /api/v1/data/dashboard         - Dashboard metrics
POST   /api/v1/bulk/import            - Bulk data import
GET    /api/v1/bulk/export            - Export data
POST   /api/v1/search/advanced        - Advanced search
GET    /api/v1/audit/logs             - Audit trail
```

**Middleware:**
- `authenticate` - JWT validation
- `rateLimiter` - Request throttling
- `auditLogger` - Audit trail creation
- `requestLogger` - Request/response logging

---

### 2.3 Business Service

**Port:** 7010  
**Database:** MySQL  
**Responsibilities:**
- Appointment management
- Billing and invoicing
- Staff scheduling
- Resource management (rooms, equipment)

**Database Tables:**
- `appointments` - Appointment records
- `appointment_reminders` - Email/SMS reminders
- `appointment_waitlist` - Waitlist management
- `resources` - Rooms and equipment
- `resource_bookings` - Resource reservations

**API Endpoints:**
```
GET    /api/v1/appointments           - List appointments
POST   /api/v1/appointments           - Create appointment
PATCH  /api/v1/appointments/:id       - Update appointment
DELETE /api/v1/appointments/:id       - Cancel appointment
GET    /api/v1/scheduling/availability - Check availability
POST   /api/v1/billing/invoices       - Create invoice
GET    /api/v1/staff                  - List staff
```

**Real-time Features:**
- Socket.IO integration for live updates
- Real-time appointment notifications
- Staff availability updates

---

### 2.4 Payment Gateway Service

**Port:** 7030  
**Database:** PostgreSQL  
**Responsibilities:**
- Multi-provider payment processing
- Payment verification (manual & automatic)
- Refund management
- Payment reconciliation
- Installment plans
- Fraud detection

**Supported Payment Providers (Sudan-specific):**
- **Banks:** Bank of Khartoum, Faisal Islamic Bank, Omdurman National Bank
- **Mobile Wallets:** Zain Cash, MTN Money, Sudani Cash, Bankak
- **Cards:** Visa, Mastercard
- **Traditional:** Cash, Cheque, Bank Transfer

**Database Schema Highlights:**
```sql
payment_providers           - Provider configuration
payments                    - Payment transactions
payment_reconciliation      - Bank statement reconciliation
payment_refunds             - Refund requests
invoice_payments            - Invoice-payment allocation
payment_installment_plans   - Installment plans
installment_schedule        - Individual installments
payment_webhooks            - Webhook logs
payment_disputes            - Dispute management
payment_analytics_daily     - Daily aggregated metrics
```

**API Endpoints:**
```
POST   /api/v1/payments/initiate      - Initiate payment
POST   /api/v1/payments/verify        - Manual verification
POST   /api/v1/refunds                - Request refund
GET    /api/v1/reconciliation         - Reconciliation reports
POST   /api/v1/installments/create    - Create installment plan
```

**Verification Workflow:**
```
1. Payment initiated (status: pending)
2. Provider processing (status: processing)
3. Manual/API verification (status: awaiting_verification)
4. Admin approval (status: verified)
5. Confirmation (status: confirmed)
```

---

### 2.5 Appointment Service

**Port:** 7040  
**Database:** MySQL  
**Responsibilities:**
- Advanced appointment scheduling
- Calendar management
- Reminders (Email, SMS, Push)
- Waitlist management
- Resource booking

**Features:**
- Recurring appointments (RRule support)
- Multi-provider scheduling
- Conflict detection
- Automated reminders
- Calendar export (iCal)
- Firebase push notifications

---

### 2.6 Web Dashboard (React Frontend)

**Port:** 5173  
**Technology:** React 18 + TypeScript + Material-UI  
**Features:**
- Role-based dashboards (11 different roles)
- Arabic RTL support
- Dark/Light mode
- Real-time updates (Socket.IO)
- Advanced search and filtering
- Export to PDF/Excel
- Responsive design

**Role-Based Dashboards:**
1. Super Admin Dashboard
2. Medical Director Dashboard
3. Doctor Dashboard
4. Nurse Dashboard
5. Pharmacist Dashboard
6. Lab Technician Dashboard
7. Receptionist Dashboard
8. Admin Dashboard
9. Patient Portal
10. Compliance Officer Dashboard
11. Sudan Health Inspector Dashboard

**Tech Stack:**
- React Query for server state
- React Router for navigation
- Formik + Yup for forms
- Recharts for data visualization
- jsPDF for PDF export
- Socket.IO client for real-time

---

### 2.7 Shared Modules

Located in `/shared` directory:

**Middleware:**
- `auth.ts` - JWT authentication middleware
- `phiAuditMiddleware.ts` - PHI access logging
- `sudanValidationMiddleware.ts` - Sudan-specific validation

**Services:**
- `ComplianceEngine.ts` - Compliance rule engine
- `PHIAuditService.ts` - Protected Health Information auditing
- `QualityMeasureService.ts` - Clinical quality metrics
- `ClinicalEventService.ts` - Event publishing

**Utilities:**
- `sudanValidation.ts` - Sudan NID, phone validation
- `authClient.ts` - Inter-service auth client
- `environment-validator.ts` - Environment config validation

---

## 3. Sequence and Workflow Diagrams

### 3.1 User Authentication Flow

```
User → Web Dashboard → API Gateway → Auth Service → Database
  │                                        │
  │  1. POST /auth/login                  │
  │  ────────────────────────────────────→│
  │                                        │ 2. Validate credentials
  │                                        │ 3. Check MFA status
  │                                        │ 4. Generate JWT token
  │                                        │ 5. Create session
  │  ←────────────────────────────────────│
  │  { token, refreshToken, user }        │
  │                                        │
  │  6. Store token in localStorage       │
  │  7. Attach to subsequent requests     │
```

### 3.2 Appointment Booking Flow

```
User → Dashboard → Main NileCare → Business Service → Database
  │                      │                   │
  │  1. Check doctor availability           │
  │  ───────────────────→│                   │
  │                      │  2. Forward       │
  │                      │  ─────────────────→│
  │                      │                   │ 3. Query schedules
  │                      │                   │ 4. Check conflicts
  │                      │  ←─────────────────
  │  ←───────────────────│ Available slots   │
  │                      │                   │
  │  5. Book appointment │                   │
  │  ───────────────────→│  6. Forward       │
  │                      │  ─────────────────→│
  │                      │                   │ 7. Create appointment
  │                      │                   │ 8. Book resources
  │                      │                   │ 9. Schedule reminders
  │                      │  ←─────────────────
  │  ←───────────────────│ Appointment created
  │                      │                   │
  │  10. Real-time notification via Socket.IO
```

### 3.3 Payment Processing Flow

```
Patient → Dashboard → Payment Gateway → Provider API → Bank
   │                       │                  │
   │  1. Initiate payment  │                  │
   │  ────────────────────→│                  │
   │                       │ 2. Create payment record
   │                       │ 3. Call provider API
   │                       │  ────────────────→│
   │                       │                  │ 4. Process
   │                       │  ←────────────────│
   │                       │ 5. Receive webhook
   │                       │                  │
   │  ←────────────────────│ Payment pending  │
   │                       │                  │
   │                       │ 6. Manual verification (if required)
   │  Admin uploads evidence│                  │
   │  ────────────────────→│ 7. Verify        │
   │                       │ 8. Update status  │
   │                       │ 9. Allocate to invoice
   │  ←────────────────────│ Payment confirmed │
```

### 3.4 Data Flow Architecture

```
┌──────────────┐
│ Web Dashboard│
└──────┬───────┘
       │ HTTP/HTTPS + JWT
       ▼
┌──────────────┐
│ API Gateway  │ ◄─── Rate Limiting, CORS, Logging
│  (Port 7001) │
└──────┬───────┘
       │
       ├─────────────┬─────────────┬─────────────┬──────────────┐
       ▼             ▼             ▼             ▼              ▼
┌──────────┐  ┌─────────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
│   Auth   │  │ Main        │ │Business │ │ Payment  │ │Appointment │
│ Service  │  │ NileCare    │ │ Service │ │ Gateway  │ │  Service   │
└────┬─────┘  └──────┬──────┘ └────┬────┘ └────┬─────┘ └──────┬─────┘
     │               │              │           │              │
     ▼               ▼              ▼           ▼              ▼
┌─────────┐    ┌─────────┐    ┌─────────┐ ┌─────────┐   ┌─────────┐
│PostgreSQL│   │  MySQL  │    │  MySQL  │ │PostgreSQL│  │  MySQL  │
└─────────┘    └─────────┘    └─────────┘ └─────────┘   └─────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Redis Cache  │
              └──────────────┘
```

---

## 4. Action Plan / Task Sequence

### 4.1 Project Structure

```
NileCare/
├── clients/
│   └── web-dashboard/        # React frontend
├── database/
│   ├── mysql/schema/         # MySQL schemas
│   ├── postgresql/schema/    # PostgreSQL schemas
│   └── SEED_DATABASE.sql     # Sample data
├── docker-compose.yml        # Local development
├── gateway/                  # API Gateway
├── infrastructure/
│   ├── api-gateway/          # Kong configuration
│   ├── istio/                # Service mesh
│   └── kubernetes/           # K8s deployments
├── microservices/
│   ├── auth-service/
│   ├── main-nilecare/
│   ├── business/
│   ├── payment-gateway-service/
│   ├── appointment-service/
│   └── common/               # Shared types
└── shared/                   # Shared middleware/utils
```

### 4.2 Setup Instructions

**Prerequisites:**
- Node.js 18+ and npm 9+
- Docker & Docker Compose
- MySQL 8.0
- PostgreSQL 15
- Redis 7

**Step 1: Clone and Install**
```bash
git clone <repository-url>
cd NileCare

# Install dependencies for all services
cd microservices/auth-service && npm install
cd ../main-nilecare && npm install
cd ../business && npm install
cd ../payment-gateway-service && npm install
cd ../appointment-service && npm install

# Install shared modules
cd ../../shared && npm install && npm run build

# Install frontend
cd ../clients/web-dashboard && npm install
```

**Step 2: Environment Configuration**

Create `.env` files in each service directory:

**Auth Service (.env):**
```env
NODE_ENV=development
PORT=7020

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare_user
DB_PASSWORD=nilecare_pass

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Session
SESSION_SECRET=your-session-secret-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

LOG_LEVEL=info
```

**Main NileCare (.env):**
```env
NODE_ENV=development
PORT=7000

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Service URLs
AUTH_SERVICE_URL=http://localhost:7020
PAYMENT_SERVICE_URL=http://localhost:7030
APPOINTMENT_SERVICE_URL=http://localhost:7040
BUSINESS_SERVICE_URL=http://localhost:7010

# CORS
CORS_ORIGIN=http://localhost:5173

LOG_LEVEL=info
```

**Business Service (.env):**
```env
NODE_ENV=development
PORT=7010

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

JWT_SECRET=your-super-secret-jwt-key-change-in-production
REDIS_HOST=localhost
REDIS_PORT=6379
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info
```

**Payment Gateway (.env):**
```env
NODE_ENV=development
PORT=7030

DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare_user
DB_PASSWORD=nilecare_pass

JWT_SECRET=your-super-secret-jwt-key-change-in-production
REDIS_HOST=localhost
REDIS_PORT=6379

# Payment Provider APIs (Sudan)
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
FLUTTERWAVE_PUBLIC_KEY=...
FLUTTERWAVE_SECRET_KEY=...

LOG_LEVEL=info
```

**Web Dashboard (.env):**
```env
VITE_API_URL=http://localhost:7000
VITE_AUTH_SERVICE_URL=http://localhost:7020
VITE_PAYMENT_SERVICE_URL=http://localhost:7030
```

**Step 3: Database Setup**

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Run schema migrations
mysql -u root -p nilecare < database/mysql/schema/identity_management.sql
mysql -u root -p nilecare < database/mysql/schema/clinical_data.sql
mysql -u root -p nilecare < database/mysql/schema/payment_system.sql
mysql -u root -p nilecare < database/mysql/schema/appointment_service.sql

# Seed sample data
mysql -u root -p nilecare < database/SEED_DATABASE.sql

# Create PostgreSQL database
psql -U postgres
CREATE DATABASE nilecare;
\q

# Run PostgreSQL schemas
psql -U postgres -d nilecare < database/postgresql/schema/healthcare_analytics.sql
psql -U postgres -d nilecare < database/postgresql/schema/phi_audit_schema.sql
```

**Step 4: Start Redis**
```bash
docker run -d -p 6379:6379 --name nilecare-redis redis:7-alpine
```

**Step 5: Start Services (Development)**

**Option A: Using Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option B: Manual Start**

Terminal 1 - Auth Service:
```bash
cd microservices/auth-service
npm run dev
```

Terminal 2 - Main NileCare:
```bash
cd microservices/main-nilecare
npm run dev
```

Terminal 3 - Business Service:
```bash
cd microservices/business
npm run dev
```

Terminal 4 - Payment Gateway:
```bash
cd microservices/payment-gateway-service
npm run dev
```

Terminal 5 - Appointment Service:
```bash
cd microservices/appointment-service
npm run dev
```

Terminal 6 - API Gateway:
```bash
cd gateway
npm start
```

Terminal 7 - Web Dashboard:
```bash
cd clients/web-dashboard
npm run dev
```

**Step 6: Verify Installation**

1. Check services health:
```bash
curl http://localhost:7020/health  # Auth Service
curl http://localhost:7000/health  # Main NileCare
curl http://localhost:7010/health  # Business Service
curl http://localhost:7030/health  # Payment Gateway
curl http://localhost:7040/health  # Appointment Service
curl http://localhost:7001/health  # API Gateway
```

2. Access web dashboard: http://localhost:5173

3. Login with test credentials:
```
Email: doctor@nilecare.sd
Password: TestPass123!
```

### 4.3 Testing Procedures

**Unit Tests:**
```bash
# Auth Service
cd microservices/auth-service
npm test

# Main NileCare
cd microservices/main-nilecare
npm test

# Business Service
cd microservices/business
npm test
```

**Integration Tests:**
```bash
# Run integration test suite
npm run test:integration
```

**End-to-End Tests:**
```bash
cd clients/web-dashboard
npm run test
```

### 4.4 Production Deployment

**Prerequisites:**
- Kubernetes cluster (1.24+)
- Istio service mesh (1.18+)
- kubectl configured
- Docker registry access

**Step 1: Build Docker Images**
```bash
# Auth Service
cd microservices/auth-service
docker build -t nilecare/auth-service:latest .

# Repeat for all services...
```

**Step 2: Push to Registry**
```bash
docker push nilecare/auth-service:latest
docker push nilecare/main-nilecare:latest
docker push nilecare/business-service:latest
docker push nilecare/payment-gateway:latest
docker push nilecare/appointment-service:latest
docker push nilecare/web-dashboard:latest
```

**Step 3: Deploy to Kubernetes**
```bash
# Create namespace
kubectl apply -f infrastructure/kubernetes/namespace.yaml

# Deploy secrets and configmaps
kubectl apply -f infrastructure/kubernetes/secrets.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml

# Deploy databases
kubectl apply -f infrastructure/kubernetes/postgres.yaml

# Deploy services
kubectl apply -f infrastructure/kubernetes/auth-service.yaml
kubectl apply -f infrastructure/kubernetes/gateway-service.yaml
kubectl apply -f infrastructure/kubernetes/appointment-service.yaml
kubectl apply -f infrastructure/kubernetes/billing-service.yaml

# Deploy Istio gateway
kubectl apply -f infrastructure/istio/gateway.yaml
kubectl apply -f infrastructure/istio/virtual-services.yaml
```

**Step 4: Verify Deployment**
```bash
kubectl get pods -n nilecare
kubectl get services -n nilecare
kubectl get ingress -n nilecare
```

### 4.5 Monitoring & Maintenance

**Health Checks:**
- All services expose `/health`, `/health/ready`, `/health/startup`
- Metrics available at `/metrics` (Prometheus format)

**Logging:**
- Centralized logging with Winston
- Log levels: error, warn, info, debug
- Logs stored in `/logs` directory in each service

**Monitoring Stack:**
- Prometheus for metrics collection
- Grafana for visualization
- Istio telemetry for service mesh observability

**Backup Procedures:**
```bash
# MySQL backup
mysqldump -u root -p nilecare > backup_$(date +%Y%m%d).sql

# PostgreSQL backup
pg_dump -U postgres nilecare > backup_$(date +%Y%m%d).sql
```

---

## 5. Code Comments & Implementation Details

### 5.1 Authentication Middleware (Shared)

**File:** `shared/middleware/auth.ts`

Key functions:
- `authenticate()` - Validates JWT token from Authorization header
- `requireRole(roles)` - Checks user has required role
- `requirePermission(permission)` - Checks specific permission
- `requireOrganization()` - Enforces organization isolation
- `requireFacility()` - Enforces facility isolation
- `optionalAuth()` - Attaches user if token present, doesn't require auth

**Usage Example:**
```typescript
import { authenticate, requireRole } from '../../shared/middleware/auth';

router.get('/patients', authenticate, handler);
router.post('/admin/users', authenticate, requireRole('admin'), handler);
```

### 5.2 Payment Processing Logic

**File:** `microservices/payment-gateway-service/src/controllers/PaymentController.ts`

**Payment Verification Workflow:**
1. Payment initiated → Status: `pending`
2. Provider processes → Status: `processing`
3. Webhook received or manual verification → Status: `awaiting_verification`
4. Admin reviews evidence → Status: `verified`
5. Final confirmation → Status: `confirmed`

**Triggers:**
- `trg_calculate_net_amount_insert` - Auto-calculate fees
- `trg_update_payment_on_refund` - Update payment status on refund
- `trg_update_installment_plan_status` - Mark plan completed

**Stored Procedures:**
- `sp_process_payment()` - Create payment with fee calculation
- `sp_reconcile_payment()` - Match with bank statement
- `sp_generate_daily_payment_analytics()` - Daily aggregation

### 5.3 Database Connection Pattern

**MySQL (Business Service):**
```typescript
const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
});
```

**PostgreSQL (Auth Service):**
```typescript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
});
```

### 5.4 React Dashboard Architecture

**Role-Based Routing:**
```typescript
const getDashboardByRole = () => {
  const role = user?.role?.toLowerCase();
  
  switch (role) {
    case 'doctor': return <DoctorDashboard />;
    case 'nurse': return <NurseDashboard />;
    case 'admin': return <AdminDashboard />;
    case 'patient': return <PatientPortal />;
    default: return <DashboardPage />;
  }
};
```

**Real-time Updates:**
```typescript
const socket = io(SOCKET_URL, {
  auth: { token: authToken }
});

socket.on('appointment_updated', (data) => {
  queryClient.invalidateQueries(['appointments']);
});
```

---

## 6. Best Practices & Recommendations

### 6.1 Security Best Practices

**✅ IMPLEMENTED:**
- JWT token authentication with refresh tokens
- Argon2 password hashing (more secure than bcrypt)
- Rate limiting at API gateway and service level
- CORS configuration with allowed origins
- Helmet.js security headers
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- RBAC with granular permissions
- PHI audit logging
- Session management with Redis
- MFA support (TOTP)
- CSRF protection

**⚠️ RECOMMENDATIONS:**
1. **Implement API Key Rotation:** Rotate JWT secrets periodically
2. **Add IP Whitelisting:** For admin endpoints
3. **Enable HTTPS Only:** In production, enforce TLS 1.3
4. **Implement Penetration Testing:** Regular security audits
5. **Add Intrusion Detection:** Monitor for suspicious patterns
6. **Encrypt PHI at Rest:** Database-level encryption for sensitive fields
7. **Implement Data Masking:** For logs and error messages
8. **Add Anomaly Detection:** ML-based fraud detection for payments

### 6.2 Performance Optimization

**✅ IMPLEMENTED:**
- Database connection pooling
- Redis caching for sessions
- Compression middleware
- Indexed database queries
- Lazy loading in React
- Code splitting in frontend
- Query result pagination

**⚠️ RECOMMENDATIONS:**
1. **Implement Redis Caching:** Cache frequent queries (patients, appointments)
2. **Add CDN:** For static assets in production
3. **Database Query Optimization:**
   - Add composite indexes for common queries
   - Use materialized views for analytics
   - Implement read replicas for heavy read operations
4. **Frontend Optimization:**
   - Implement service workers for offline support
   - Add image lazy loading
   - Use React.memo for expensive components
5. **API Response Optimization:**
   - Implement GraphQL for flexible data fetching
   - Add field filtering to reduce payload size
6. **Database Sharding:** For multi-tenancy at scale

### 6.3 Scalability Improvements

**⚠️ RECOMMENDATIONS:**
1. **Horizontal Scaling:**
   - Add Kubernetes HPA (Horizontal Pod Autoscaler)
   - Configure autoscaling based on CPU/memory/custom metrics
2. **Database Scaling:**
   - Implement read replicas
   - Consider database sharding by facility_id
   - Use TimescaleDB for time-series data (vitals, lab results)
3. **Message Queue:**
   - Add RabbitMQ/Kafka for async operations
   - Implement event sourcing for audit trails
4. **Caching Strategy:**
   - Multi-level caching (L1: in-memory, L2: Redis, L3: DB)
   - Cache warming for common queries
5. **API Gateway Improvements:**
   - Add request coalescing
   - Implement response caching
   - Add API versioning strategy

### 6.4 Code Quality & Maintainability

**✅ IMPLEMENTED:**
- TypeScript for type safety
- Consistent error handling
- Structured logging
- Environment variable validation
- Modular architecture
- Shared middleware

**⚠️ RECOMMENDATIONS:**
1. **Add Comprehensive Testing:**
   - Target 80%+ code coverage
   - Implement E2E tests with Cypress
   - Add contract testing for APIs
2. **Implement Code Quality Tools:**
   - ESLint with strict rules
   - Prettier for code formatting
   - Husky for pre-commit hooks
   - SonarQube for code analysis
3. **Documentation:**
   - Add JSDoc comments to all functions
   - Generate API documentation with Swagger
   - Create architecture decision records (ADRs)
4. **Dependency Management:**
   - Regular dependency updates
   - Security vulnerability scanning (npm audit, Snyk)
   - Lock file management
5. **Error Handling:**
   - Implement structured error responses
   - Add error tracking (Sentry, Bugsnag)
   - Create error recovery mechanisms

### 6.5 DevOps & CI/CD

**⚠️ RECOMMENDATIONS:**
1. **Implement CI/CD Pipeline:**
   ```yaml
   # GitHub Actions example
   - Build and test
   - Run linting
   - Security scan
   - Build Docker images
   - Push to registry
   - Deploy to staging
   - Run E2E tests
   - Deploy to production
   ```
2. **Infrastructure as Code:**
   - Use Terraform for cloud resources
   - Helm charts for Kubernetes deployments
   - GitOps with ArgoCD or Flux
3. **Monitoring & Alerting:**
   - Prometheus + Grafana dashboards
   - AlertManager for notifications
   - ELK stack for log aggregation
   - Distributed tracing with Jaeger
4. **Backup & Disaster Recovery:**
   - Automated daily backups
   - Point-in-time recovery
   - Cross-region replication
   - Disaster recovery runbooks

### 6.6 Potential Pitfalls

**⚠️ CRITICAL ISSUES TO ADDRESS:**

1. **Missing Environment Variables:**
   - Current: Partial validation
   - Fix: Add comprehensive env validation on startup
   - Use libraries like `joi` or `zod` for schema validation

2. **Database Migration Management:**
   - Current: Manual SQL scripts
   - Fix: Implement migration tool (Flyway, Liquibase, or TypeORM migrations)

3. **Service Discovery:**
   - Current: Hardcoded URLs
   - Fix: Implement service registry (Consul, etcd) or use Kubernetes DNS

4. **Secret Management:**
   - Current: .env files
   - Fix: Use Kubernetes Secrets, AWS Secrets Manager, or HashiCorp Vault

5. **API Versioning:**
   - Current: Single version (/api/v1)
   - Fix: Implement versioning strategy for backward compatibility

6. **Transaction Management:**
   - Current: Individual database operations
   - Fix: Implement distributed transactions (Saga pattern)

7. **Rate Limiting:**
   - Current: In-memory (doesn't work across instances)
   - Fix: Use Redis-based rate limiting for distributed systems

### 6.7 Sudan-Specific Considerations

**✅ IMPLEMENTED:**
- Arabic language support (RTL)
- Sudan payment providers
- Sudan phone number validation (+249)
- Sudan National ID format
- Sudan healthcare regulations

**⚠️ RECOMMENDATIONS:**
1. **Regulatory Compliance:**
   - Implement Sudan Ministry of Health reporting requirements
   - Add compliance dashboards
   - Generate mandatory reports
2. **Localization:**
   - Complete Arabic translation
   - Support bilingual (Arabic/English) reports
   - Date/time formatting for Sudan timezone (EAT - UTC+3)
3. **Payment Integration:**
   - Complete integration with all Sudan banks
   - Add Sudan-specific payment methods
   - Implement local currency handling (SDG)
4. **Healthcare Standards:**
   - Ensure compatibility with Sudan health information exchange
   - Implement local clinical coding systems

---

## 7. Quick Reference

### Port Allocation
- **7000** - Main NileCare Service
- **7001** - API Gateway
- **7010** - Business Service
- **7020** - Auth Service
- **7030** - Payment Gateway Service
- **7040** - Appointment Service
- **5173** - Web Dashboard (Frontend)
- **3306** - MySQL
- **5432** - PostgreSQL
- **6379** - Redis

### Default Credentials (Development)
```
Super Admin:
  Email: admin@nilecare.sd
  Password: TestPass123!

Doctor:
  Email: doctor@nilecare.sd
  Password: TestPass123!

Nurse:
  Email: nurse@nilecare.sd
  Password: TestPass123!

Pharmacist:
  Email: pharmacist@nilecare.sd
  Password: TestPass123!
```

### Key API Endpoints
```
# Authentication
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

# Patients
GET    /api/v1/data/patients
POST   /api/v1/data/patients
GET    /api/v1/data/patients/:id
PUT    /api/v1/data/patients/:id

# Appointments
GET    /api/v1/appointments
POST   /api/v1/appointments
PATCH  /api/v1/appointments/:id
DELETE /api/v1/appointments/:id

# Payments
POST   /api/v1/payments/initiate
POST   /api/v1/payments/verify
GET    /api/v1/payments/:id
POST   /api/v1/refunds

# Health Checks
GET    /health
GET    /health/ready
GET    /health/startup
GET    /metrics
```

---

## Appendix A: Technology Stack

**Backend:**
- Node.js 18+
- TypeScript 5.3
- Express.js 4.18
- MySQL 8.0
- PostgreSQL 15
- Redis 7
- Socket.IO 4.6

**Frontend:**
- React 18
- TypeScript 5.1
- Material-UI 5
- React Query 4
- React Router 6
- Vite 4

**Infrastructure:**
- Docker & Docker Compose
- Kubernetes 1.24+
- Istio 1.18+
- Kong API Gateway
- Prometheus & Grafana

**Testing:**
- Jest
- React Testing Library
- Supertest

---

**END OF DOCUMENTATION**

For updates and contributions, please refer to the project repository.

