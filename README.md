# NileCare Healthcare Platform 🏥

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)

**A comprehensive, Sudan-focused healthcare management platform built with modern microservices architecture**

🆕 **[Authentication Integration](#-authentication-integration-new)** • [Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🔐 Authentication Integration (NEW!)

**Status:** ✅ **COMPLETE AND OPERATIONAL** (October 14, 2025)

### Centralized Authentication Architecture

All NileCare microservices now use **centralized authentication** through the Auth Service:

```
✅ Single Source of Truth - Auth Service validates all tokens
✅ Real-Time Validation - No stale permissions or user status
✅ Zero JWT Secrets in microservices - Only in Auth Service
✅ Service-to-Service Auth - Secure API key authentication
✅ Comprehensive Logging - All auth attempts tracked
```

### Quick Setup

1. **Configure Auth Service** - See `QUICK_SETUP_GUIDE.md`
2. **Start Auth Service** - Must start first!
   ```bash
   cd microservices/auth-service
   npm run dev
   ```
3. **Start Other Services** - They will use Auth Service for authentication

### Documentation

- 📘 **[AUTHENTICATION.md](./AUTHENTICATION.md)** - Complete authentication architecture & integration guide
- 📗 **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 15 minutes
- 📙 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- 📕 **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

**Implementation:** 100% Complete | **Services Running:** Auth (7020) + Business (7010) ✅

---

## 📋 Overview

NileCare is an enterprise-grade healthcare platform designed specifically for the Sudanese healthcare system. It provides complete management solutions for hospitals, clinics, and healthcare facilities with support for:

- **Electronic Health Records (EHR)** with FHIR R4 compliance
- **Appointment Management** with intelligent scheduling and reminders
- **Billing & Payments** with Sudan-specific payment providers
- **Clinical Documentation** including SOAP notes, prescriptions, and lab orders
- **Inventory Management** for pharmacy and medical supplies
- **Multi-tenant Architecture** supporting multiple facilities and organizations

### 🌍 Sudan-Specific Features

- ✅ **Arabic RTL Support** - Complete right-to-left interface
- ✅ **Local Payment Integration** - Zain Cash, MTN Money, Sudani Cash, Bankak
- ✅ **Sudan Banking** - Bank of Khartoum, Faisal Islamic Bank, Omdurman National Bank
- ✅ **National ID Validation** - Sudan National ID format validation
- ✅ **Local Phone Numbers** - +249 format support
- ✅ **Sudan Timezone** - EAT (UTC+3) support
- ✅ **Bilingual Support** - Arabic and English

---

## ✨ Features

### 🔐 Authentication & Security

### Centralized Authentication Architecture ✅ NEW!

**All microservices now use centralized authentication via Auth Service (Port 7020):**

- ✅ **Single Source of Truth** - Auth Service validates all tokens
- ✅ **Real-Time Validation** - User status and permissions checked on every request
- ✅ **Service-to-Service Auth** - API key based authentication
- ✅ **No Local JWT Verification** - All services delegate to Auth Service
- ✅ **Comprehensive Logging** - All authentication attempts tracked

**See:** `AUTHENTICATION_INTEGRATION_GUIDE.md` for complete details

### Security Features

- JWT-based authentication with refresh tokens
- Role-Based Access Control (RBAC) with granular permissions
- Multi-Factor Authentication (MFA) via TOTP
- OAuth2 & OpenID Connect support
- Session management with Redis
- Comprehensive security audit logging
- PHI (Protected Health Information) access tracking
- Centralized token validation
- Real-time permission checking

### 👥 User Roles
- Super Admin
- Medical Director
- Compliance Officer
- Doctor/Physician
- Nurse
- Pharmacist
- Lab Technician
- Receptionist
- Billing Clerk
- Patient (Portal Access)
- Sudan Health Inspector

### 🏥 Clinical Features
- Patient registration and medical records
- Encounter management (inpatient, outpatient, emergency)
- Diagnosis tracking with ICD-10 codes
- Medication management and e-prescriptions
- Allergy tracking and alerts
- Vital signs monitoring
- Lab order management and results
- Immunization records
- Clinical note templates (SOAP, Progress, Discharge)

### 📅 Appointment Management
- Real-time availability checking
- Recurring appointments support
- Waitlist management
- Multi-channel reminders (Email, SMS, Push)
- Resource booking (rooms, equipment)
- Provider schedule management
- Calendar export (iCal format)

### 💳 Payment & Billing
- Multi-provider payment processing
- Manual and automatic payment verification
- Invoice generation and management
- Installment plan support
- Refund processing
- Payment reconciliation with bank statements
- Fraud detection and risk scoring
- Comprehensive payment analytics

### 📊 Analytics & Reporting
- Real-time dashboards
- Clinical quality metrics
- Financial reports
- Inventory reports
- Appointment analytics
- Export to PDF/Excel

---

## 🏗 Architecture

### Microservices Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (7001)                          │
│         Rate Limiting • CORS • Authentication • Routing          │
└────────────┬────────────────────────────────────────────────────┘
             │
    ┌────────┴────────────────────────────────────┐
    │                                             │
┌───▼─────────────┐  ┌──────────────┐  ┌────────▼────────┐
│  Auth Service   │  │    Main      │  │    Business     │
│  Port: 7020     │  │  NileCare    │  │    Service      │
│  PostgreSQL     │  │  Port: 7000  │  │   Port: 7010    │
│                 │  │   MySQL      │  │     MySQL       │
│  - JWT Auth     │  │              │  │                 │
│  - RBAC         │  │  - Patients  │  │  - Appointments │
│  - MFA          │  │  - Dashboard │  │  - Billing      │
│  - OAuth2       │  │  - Search    │  │  - Scheduling   │
│  - Sessions     │  │  - Audit     │  │  - Staff Mgmt   │
└─────────────────┘  └──────────────┘  └─────────────────┘

┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐
│ Payment Gateway │  │  Appointment     │  │ Web Dashboard  │
│  Port: 7030     │  │   Service        │  │  Port: 5173    │
│  PostgreSQL     │  │  Port: 7040      │  │   React 18     │
│                 │  │   MySQL          │  │                │
│ - Payments      │  │                  │  │ - Material-UI  │
│ - Refunds       │  │ - Scheduling     │  │ - TypeScript   │
│ - Reconciliation│  │ - Waitlist       │  │ - 11 Dashboards│
│ - Installments  │  │ - Reminders      │  │ - Real-time    │
└─────────────────┘  └──────────────────┘  └────────────────┘
```

### Technology Stack

**Backend:**
- Node.js 18+ with TypeScript
- Express.js framework
- MySQL 8.0 (primary database)
- PostgreSQL 15 (auth & payments)
- Redis 7 (caching & sessions)
- Socket.IO (real-time communication)

**Frontend:**
- React 18 with TypeScript
- Material-UI 5 (UI framework)
- React Query (server state)
- React Router 6 (routing)
- Formik + Yup (forms & validation)
- Recharts (data visualization)

**Infrastructure:**
- Docker & Docker Compose
- Kubernetes (orchestration)
- Istio (service mesh)
- Kong (API gateway)
- Prometheus & Grafana (monitoring)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Docker** and Docker Compose
- **MySQL** 8.0
- **PostgreSQL** 15
- **Redis** 7

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/nilecare.git
cd nilecare
```

2. **Install dependencies:**
```bash
# Install all microservices
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

3. **Setup databases:**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Run migrations
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

psql -U postgres -d nilecare < database/postgresql/schema/healthcare_analytics.sql
```

4. **Configure environment variables:**

Create `.env` files in each service directory (see [Environment Configuration](#environment-configuration))

5. **Start with Docker Compose (Recommended):**
```bash
docker-compose up -d
```

**OR** start services individually:
```bash
# Terminal 1 - Auth Service
cd microservices/auth-service && npm run dev

# Terminal 2 - Main NileCare
cd microservices/main-nilecare && npm run dev

# Terminal 3 - Business Service
cd microservices/business && npm run dev

# Terminal 4 - Payment Gateway
cd microservices/payment-gateway-service && npm run dev

# Terminal 5 - Appointment Service
cd microservices/appointment-service && npm run dev

# Terminal 6 - API Gateway
cd gateway && npm start

# Terminal 7 - Web Dashboard
cd clients/web-dashboard && npm run dev
```

6. **Access the application:**
- **Web Dashboard:** http://localhost:5173
- **API Gateway:** http://localhost:7001
- **Appointment Service:** http://localhost:7040
- **API Documentation:** http://localhost:7001/

### Appointment Service Quick Start

The appointment service provides comprehensive scheduling, reminders, and resource management:

**Key Endpoints:**
```bash
# Get all appointments
GET http://localhost:7040/api/v1/appointments

# Create appointment
POST http://localhost:7040/api/v1/appointments
{
  "patientId": "1",
  "providerId": "2",
  "appointmentDate": "2025-10-20",
  "appointmentTime": "10:00:00",
  "duration": 30,
  "reason": "Checkup"
}

# Check available slots
GET http://localhost:7040/api/v1/schedules/available-slots?providerId=2&date=2025-10-20

# Get today's appointments
GET http://localhost:7040/api/v1/appointments/today?providerId=2
```

**Via Orchestrator (Recommended):**
```bash
# All appointment endpoints are available through main-nilecare orchestrator
GET http://localhost:7000/api/appointment/appointments
POST http://localhost:7000/api/appointment/appointments
```

**Features:**
- ✅ Real-time notifications via Socket.IO
- ✅ Automated email/SMS reminders
- ✅ Resource booking (rooms, equipment)
- ✅ Waitlist management
- ✅ Schedule conflict detection
- ✅ Calendar export (iCal format)

### Default Test Credentials

```
Doctor:
  Email: doctor@nilecare.sd
  Password: TestPass123!

Nurse:
  Email: nurse@nilecare.sd
  Password: TestPass123!

Admin:
  Email: admin@nilecare.sd
  Password: TestPass123!

Pharmacist:
  Email: pharmacist@nilecare.sd
  Password: TestPass123!
```

---

## 📝 Environment Configuration

### Auth Service (.env)

⚠️ **IMPORTANT:** Auth Service is the ONLY service that should have JWT_SECRET!

```env
NODE_ENV=development
PORT=7020

# MySQL (Changed from PostgreSQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# JWT (ONLY IN AUTH SERVICE!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# Session & MFA
SESSION_SECRET=your-session-secret-key-min-32-chars
MFA_ENCRYPTION_KEY=your-mfa-encryption-key-64-chars

# Service-to-Service API Keys (NEW!)
# Generate keys: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SERVICE_API_KEYS=key1,key2,key3,key4,key5

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

LOG_LEVEL=info
LOG_AUTH=true
```

**See:** `microservices/auth-service/auth-service.env` for complete template

### Main NileCare (.env)
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
BUSINESS_SERVICE_URL=http://localhost:7010

CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

### Business Service (.env)
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
```

### Payment Gateway (.env)
```env
NODE_ENV=development
PORT=7030

DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare_user
DB_PASSWORD=your_secure_password

JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Payment Providers (Sudan)
STRIPE_API_KEY=sk_test_your_key
PAYPAL_CLIENT_ID=your_client_id
FLUTTERWAVE_PUBLIC_KEY=your_public_key
```

### Appointment Service (.env)

⚠️ **IMPORTANT:** Do NOT set JWT_SECRET here! This service delegates to Auth Service.

```env
NODE_ENV=development
PORT=7040
SERVICE_NAME=appointment-service

# Authentication Delegation (NEW!)
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<64-char-hex-key-must-match-auth-service>

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:7001

# Email (Nodemailer) - Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=nilecare@example.com

# Logging
LOG_LEVEL=info
LOG_AUTH=true
```

**See:** `QUICK_SETUP_GUIDE.md` for pre-configured .env templates

### Web Dashboard (.env)
```env
VITE_API_URL=http://localhost:7000
VITE_AUTH_SERVICE_URL=http://localhost:7020
VITE_PAYMENT_SERVICE_URL=http://localhost:7030
```

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests for Auth Service
cd microservices/auth-service
npm test

# Unit tests for Main NileCare
cd microservices/main-nilecare
npm test

# Unit tests for Business Service
cd microservices/business
npm test

# Unit tests for Appointment Service
cd microservices/appointment-service
npm test

# Frontend tests
cd clients/web-dashboard
npm test
```

### Health Checks

Verify all services are running:

```bash
curl http://localhost:7020/health  # Auth Service
curl http://localhost:7000/health  # Main NileCare
curl http://localhost:7010/health  # Business Service
curl http://localhost:7030/health  # Payment Gateway
curl http://localhost:7040/health  # Appointment Service
curl http://localhost:7001/health  # API Gateway
```

---

## 📚 Documentation

### Essential Guides
- **[Quick Start Guide](./QUICKSTART.md)** - Get up and running in 15 minutes
- **[Authentication Guide](./AUTHENTICATION.md)** - Authentication architecture & integration
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions
- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[Main README](./README.md)** - This file - complete system overview

### API Documentation
- **[API Documentation](http://localhost:7001/api-docs)** - Swagger/OpenAPI docs (when services are running)

### Service-Specific Documentation
- **[Auth Service](./microservices/auth-service/README.md)** - Authentication & authorization service
- **[Business Service](./microservices/business/README.md)** - Core business operations
- **[Appointment Service](./microservices/appointment-service/README.md)** - Scheduling & appointments
- **[Payment Gateway](./microservices/payment-gateway-service/README.md)** - Payment processing
- **[Notification Service](./microservices/notification-service/README.md)** - Notifications & alerts

For complete list of services, see [microservices/](./microservices/) directory.

### Project Structure

```
NileCare/
├── clients/
│   └── web-dashboard/           # React frontend application
│       ├── src/
│       │   ├── components/      # Reusable UI components
│       │   ├── pages/           # Page components
│       │   ├── services/        # API services
│       │   └── contexts/        # React contexts
│       └── package.json
│
├── microservices/
│   ├── auth-service/            # Authentication & authorization
│   ├── main-nilecare/           # Central orchestration service
│   ├── business/                # Business logic (appointments, billing)
│   ├── payment-gateway-service/ # Payment processing
│   ├── appointment-service/     # Appointment management
│   └── common/                  # Shared types and DTOs
│
├── shared/                      # Shared middleware and utilities
│   ├── middleware/              # Auth, validation, audit
│   ├── services/                # Compliance, PHI audit
│   └── utils/                   # Validation, helpers
│
├── database/
│   ├── mysql/schema/            # MySQL database schemas
│   ├── postgresql/schema/       # PostgreSQL schemas
│   └── SEED_DATABASE.sql        # Sample data
│
├── infrastructure/
│   ├── kubernetes/              # K8s deployment manifests
│   ├── istio/                   # Service mesh configuration
│   ├── api-gateway/             # Kong gateway config
│   └── monitoring/              # Prometheus configuration
│
├── gateway/                     # Express-based API gateway
├── docker-compose.yml           # Local development setup
└── README.md
```

---

## 🔧 Development

### Adding a New Service

1. Create service directory in `microservices/`
2. Initialize with `npm init` and add dependencies
3. Create basic Express server with TypeScript
4. Add to `docker-compose.yml`
5. Update API Gateway routing
6. Add health check endpoints
7. Document in system documentation

### Code Style

- TypeScript for all backend services
- ESLint + Prettier for code formatting
- Follow Airbnb style guide
- Use meaningful variable names
- Add JSDoc comments for functions

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

---

## 📊 Monitoring

### Health Endpoints

All services expose standardized health endpoints:

- `GET /health` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /health/startup` - Startup probe
- `GET /metrics` - Prometheus metrics

### Logging

- Centralized logging with Winston
- Log levels: `error`, `warn`, `info`, `debug`
- Structured JSON logging
- Log rotation and retention

### Metrics

- Prometheus metrics collection
- Grafana dashboards
- Key metrics:
  - Request rate and latency
  - Error rates
  - Database connection pool stats
  - Custom business metrics

---

## 🚀 Production Deployment

### Kubernetes Deployment

```bash
# Create namespace
kubectl apply -f infrastructure/kubernetes/namespace.yaml

# Deploy secrets and config
kubectl apply -f infrastructure/kubernetes/secrets.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml

# Deploy services
kubectl apply -f infrastructure/kubernetes/

# Check deployment status
kubectl get pods -n nilecare
kubectl get services -n nilecare
```

### Docker Build

```bash
# Build all services
docker-compose build

# Push to registry
docker tag nilecare/auth-service:latest your-registry/auth-service:v1.0.0
docker push your-registry/auth-service:v1.0.0
```

---

## 🔒 Security

### Security Features

- ✅ JWT token authentication
- ✅ Argon2 password hashing
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ PHI audit logging
- ✅ MFA support

### Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Regular security audits** - Run `npm audit` regularly
3. **Keep dependencies updated** - Use Dependabot
4. **Enable HTTPS in production** - Use TLS 1.3
5. **Implement IP whitelisting** - For admin endpoints
6. **Regular backups** - Database and file backups
7. **Security training** - For all developers

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**NileCare Development Team**
- Built with ❤️ for the Sudan healthcare community

---

## 📞 Support

For support and questions:
- 📧 Email: support@nilecare.sd
- 🌐 Website: https://nilecare.sd
- 📖 Documentation: https://docs.nilecare.sd

---

## 🗺 Roadmap

### Version 2.1 (Q1 2026)
- [ ] Mobile applications (iOS & Android)
- [ ] Telemedicine integration
- [ ] Advanced analytics with ML
- [ ] Multi-language support (French, Swahili)

### Version 2.2 (Q2 2026)
- [ ] HL7 v2.x integration
- [ ] DICOM image viewer
- [ ] Voice-to-text for clinical notes
- [ ] Blockchain for medical records

### Version 3.0 (Q4 2026)
- [ ] AI-powered clinical decision support
- [ ] Predictive analytics
- [ ] IoT device integration
- [ ] Federated learning for privacy-preserving AI

---

## 🙏 Acknowledgments

- Sudan Ministry of Health for guidelines and support
- Open source community for amazing tools
- All contributors and testers

---

<div align="center">

**Made with ❤️ for Sudan Healthcare**

[⬆ Back to Top](#nilecare-healthcare-platform-)

</div>

