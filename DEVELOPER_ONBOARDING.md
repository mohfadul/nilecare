# 👨‍💻 NILECARE DEVELOPER ONBOARDING GUIDE

**Version:** 1.0.0  
**Date:** October 16, 2025  
**Target Audience:** New Backend & Frontend Engineers

---

## 🎯 WELCOME TO NILECARE!

This guide will get you from zero to productive in **1 day**. Follow each section in order.

---

## 📋 TABLE OF CONTENTS

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Key Concepts](#key-concepts)
5. [Development Workflow](#development-workflow)
6. [Testing & Debugging](#testing--debugging)
7. [Common Tasks](#common-tasks)
8. [Best Practices](#best-practices)
9. [Resources](#resources)

---

## GETTING STARTED

### Prerequisites

Before you begin, ensure you have:

- [ ] **GitHub Account** with access to the repository
- [ ] **Basic Knowledge**:
  - Node.js & TypeScript
  - React (for frontend)
  - MySQL & PostgreSQL basics
  - Docker fundamentals
  - REST API concepts
- [ ] **Tools Installed** (we'll guide you):
  - Git
  - Node.js 18+
  - Docker Desktop
  - VS Code (or preferred IDE)

### Your First Day Schedule

| Time | Activity | Duration |
|------|----------|----------|
| **09:00 - 10:30** | Setup dev environment | 90 min |
| **10:30 - 12:00** | Explore codebase | 90 min |
| **12:00 - 13:00** | Lunch Break | 60 min |
| **13:00 - 14:30** | Read architecture docs | 90 min |
| **14:30 - 16:00** | Run first service locally | 90 min |
| **16:00 - 17:00** | Make first code change | 60 min |
| **17:00 - 17:30** | Team intro & Q&A | 30 min |

---

## DEVELOPMENT ENVIRONMENT SETUP

### Step 1: Install Required Tools

#### Windows

```powershell
# Install Chocolatey (package manager)
Set-ExecutionPolicy Bypass -Scope Process -Force; `
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install tools
choco install git -y
choco install nodejs-lts -y
choco install docker-desktop -y
choco install vscode -y
choco install mysql.workbench -y  # Optional: Database GUI
choco install postman -y          # Optional: API testing
```

#### macOS

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install tools
brew install git
brew install node@18
brew install --cask docker
brew install --cask visual-studio-code
brew install --cask sequel-pro        # Optional: Database GUI
brew install --cask postman           # Optional: API testing
```

#### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Git
sudo apt install -y git

# Install VS Code
sudo snap install code --classic
```

### Step 2: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/nilecare.git
cd nilecare

# Checkout development branch
git checkout development
```

### Step 3: Install VS Code Extensions

Open VS Code and install these extensions:

- **Essential:**
  - ESLint
  - Prettier - Code formatter
  - TypeScript Vue Plugin (Volar)
  - Docker
  - GitLens

- **Recommended:**
  - Thunder Client (API testing)
  - Database Client (SQL tools)
  - Error Lens (inline errors)
  - Path Intellisense
  - Auto Rename Tag

### Step 4: Project Dependencies

```bash
# Install root dependencies
npm install

# Install dependencies for all services (if using workspaces)
npm run install:all

# Or install individually
cd microservices/auth-service
npm install
cd ../..
```

### Step 5: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# Use VS Code or any text editor
code .env
```

**Key Environment Variables:**

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=nilecare_user
DB_PASSWORD=secure_password
DB_NAME=nilecare

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=24h

# Services
AUTH_SERVICE_URL=http://localhost:7020
BUSINESS_SERVICE_URL=http://localhost:7010
PAYMENT_SERVICE_URL=http://localhost:7030
```

### Step 6: Database Setup

#### Option A: Docker Compose (Recommended)

```bash
# Start all infrastructure (databases, Redis, Kafka, etc.)
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# NAME                  STATUS
# nilecare-mysql        Up 2 minutes
# nilecare-postgres     Up 2 minutes
# nilecare-redis        Up 2 minutes
# nilecare-kafka        Up 2 minutes
```

#### Option B: Local MySQL Installation

If you prefer local installations:

```bash
# Create databases
mysql -u root -p < database/create-service-databases.sql

# Run migrations for each service
cd microservices/auth-service
npm run migrate

cd ../billing-service
npm run migrate

# Repeat for all services
```

### Step 7: Verify Setup

```bash
# Run health checks
npm run health-check

# Should output:
# ✅ MySQL: Connected
# ✅ PostgreSQL: Connected
# ✅ Redis: Connected
# ✅ Kafka: Connected
```

---

## PROJECT STRUCTURE

### Repository Layout

```
NileCare/
├── microservices/          # Backend microservices (17 services)
│   ├── auth-service/       # Authentication & authorization
│   ├── main-nilecare/      # Central orchestrator
│   ├── business/           # Core business logic
│   ├── billing-service/    # Invoicing & claims
│   ├── payment-gateway-service/  # Payment processing
│   ├── appointment-service/      # Scheduling
│   ├── clinical/           # Clinical data
│   ├── lab-service/        # Laboratory
│   ├── medication-service/ # Prescriptions
│   ├── facility-service/   # Facilities management
│   ├── inventory-service/  # Stock management
│   ├── cds-service/        # Clinical decision support
│   ├── device-integration-service/  # Medical devices
│   ├── hl7-service/        # HL7 messaging
│   ├── fhir-service/       # FHIR resources
│   ├── notification-service/     # Email/SMS
│   ├── ehr-service/        # Electronic health records
│   └── gateway-service/    # API gateway
│
├── nilecare-frontend/      # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (30+)
│   │   ├── dashboards/     # 7 role-based dashboards
│   │   ├── services/       # API service clients
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   └── package.json
│
├── packages/               # Shared packages (monorepo)
│   ├── @nilecare/common/   # Shared types & DTOs
│   ├── @nilecare/service-clients/  # Service clients
│   └── @nilecare/utils/    # Shared utilities
│
├── shared/                 # Shared backend code
│   ├── middleware/         # Auth, validation, audit
│   ├── services/           # Compliance, PHI audit
│   └── utils/              # Validation, helpers
│
├── database/               # Database schemas & migrations
│   ├── mysql/schema/       # MySQL schemas
│   ├── postgresql/schema/  # PostgreSQL schemas
│   └── exports/            # Data export scripts
│
├── infrastructure/         # Infrastructure as Code
│   ├── kubernetes/         # K8s manifests
│   ├── terraform/          # Cloud provisioning
│   └── docker/             # Dockerfiles
│
├── scripts/                # Automation scripts
│   ├── setup.sh            # Initial setup
│   ├── migrate-all.sh      # Run all migrations
│   └── seed-data.sh        # Seed test data
│
├── tests/                  # Integration & E2E tests
│   ├── integration/        # Service integration tests
│   ├── e2e/                # End-to-end tests
│   └── fixtures/           # Test data
│
├── docker-compose.yml      # Local development setup
├── package.json            # Root package.json (monorepo)
├── README.md               # Main README
├── ARCHITECTURE_OVERVIEW.md         # System architecture
├── SERVICE_COMMUNICATION_PATTERNS.md # Communication docs
├── DATABASE_SCHEMAS_COMPLETE.md     # Database reference
├── DEVELOPER_ONBOARDING.md          # This file!
└── API_REFERENCE.md        # API documentation
```

### Service Structure (Typical)

Every microservice follows this structure:

```
microservices/auth-service/
├── src/
│   ├── index.ts            # Entry point
│   ├── config/             # Configuration
│   │   └── database.ts
│   ├── routes/             # API routes
│   │   ├── auth.routes.ts
│   │   └── user.routes.ts
│   ├── controllers/        # Request handlers
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   ├── services/           # Business logic
│   │   ├── auth.service.ts
│   │   ├── token.service.ts
│   │   └── user.service.ts
│   ├── middleware/         # Middleware functions
│   │   ├── auth.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/             # Database models (if using ORM)
│   │   └── user.model.ts
│   ├── utils/              # Utility functions
│   │   ├── validation.ts
│   │   └── response.ts
│   └── types/              # TypeScript types
│       └── auth.types.ts
│
├── migrations/             # Flyway migrations
│   ├── V1__Initial_schema.sql
│   └── V2__Add_mfa.sql
│
├── tests/                  # Unit tests
│   ├── auth.service.test.ts
│   └── user.service.test.ts
│
├── logs/                   # Log files (git-ignored)
├── dist/                   # Compiled JS (git-ignored)
├── node_modules/           # Dependencies (git-ignored)
│
├── Dockerfile              # Docker image definition
├── .env.example            # Environment template
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── flyway.conf             # Flyway config
└── README.md               # Service documentation
```

---

## KEY CONCEPTS

### 1. Microservices Architecture

NileCare uses **microservices** - independent, deployable services that communicate via:

- **HTTP/REST** - Synchronous requests (most common)
- **Kafka** - Asynchronous events (appointments, payments)
- **RabbitMQ** - Task queues (emails, reports)
- **WebSocket** - Real-time updates (vitals, notifications)
- **MQTT** - IoT device data

**Key Principle:** Each service owns its database. No direct database access between services.

### 2. Response Wrapper Pattern

All API responses use the **NileCareResponse** wrapper:

```typescript
// Success Response
{
  "status": 200,
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user_id": "USR-12345",
    "name": "John Doe",
    "role": "doctor"
  },
  "timestamp": "2025-10-16T10:00:00Z",
  "request_id": "req_abc123"
}

// Error Response
{
  "status": 400,
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Invalid email format"
    }
  },
  "timestamp": "2025-10-16T10:00:00Z",
  "request_id": "req_abc123"
}
```

**Why?** Consistent error handling, easier debugging, better frontend integration.

### 3. Authentication Flow

```
1. User logs in → Auth Service validates
2. Auth Service returns JWT access token + refresh token
3. Frontend stores tokens in localStorage
4. All subsequent requests include: Authorization: Bearer {token}
5. Each service validates token with Auth Service
6. User data cached in Redis for performance
```

### 4. Database Strategy

| Database | Use Case |
|----------|----------|
| **MySQL** | Transactional data (invoices, appointments, patients) |
| **PostgreSQL** | Time-series data (device readings), JSON-heavy data |
| **MongoDB** | FHIR resources, unstructured documents |
| **Redis** | Caching, sessions, pub/sub |

### 5. Event-Driven Patterns

When something important happens, publish an event:

```typescript
// Example: Appointment created
await kafkaPublisher.publish('appointment.events', {
  event_type: 'appointment.scheduled',
  data: {
    appointment_id: 'APT-12345',
    patient_id: 'PAT-67890',
    doctor_id: 'DOC-11111',
    date: '2025-10-20T14:00:00Z'
  }
});

// Other services listen and react:
// - Notification Service: Send reminder
// - Billing Service: Create pending invoice
// - Audit Service: Log appointment creation
```

---

## DEVELOPMENT WORKFLOW

### Starting Development

#### Option 1: Run All Services (Docker Compose)

```bash
# Start all services
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f auth-service

# Stop all services
docker-compose down
```

#### Option 2: Run Individual Services

```bash
# Start infrastructure only
docker-compose up mysql postgres redis kafka -d

# Run specific service
cd microservices/auth-service
npm run dev

# Service runs with hot-reload on http://localhost:7020
```

### Making Your First Code Change

Let's add a new endpoint to the Auth Service:

**Step 1:** Create a new route file

```typescript
// microservices/auth-service/src/routes/profile.routes.ts

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getProfile, updateProfile } from '../controllers/profile.controller';

const router = Router();

// GET /api/v1/profile
router.get('/', authMiddleware, getProfile);

// PUT /api/v1/profile
router.put('/', authMiddleware, updateProfile);

export default router;
```

**Step 2:** Create the controller

```typescript
// microservices/auth-service/src/controllers/profile.controller.ts

import { Request, Response } from 'express';
import { NileCareResponse } from '../utils/response';

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.user.id; // From auth middleware
    
    // Fetch user from database
    const user = await getUserById(userId);
    
    return res.json(new NileCareResponse(200, true, 'Profile retrieved', user));
  } catch (error) {
    return res.status(500).json(
      new NileCareResponse(500, false, 'Failed to get profile', null, {
        code: 'INTERNAL_ERROR',
        details: error.message
      })
    );
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const updates = req.body;
    
    // Validate and update
    const updatedUser = await updateUser(userId, updates);
    
    return res.json(new NileCareResponse(200, true, 'Profile updated', updatedUser));
  } catch (error) {
    return res.status(500).json(
      new NileCareResponse(500, false, 'Failed to update profile', null, {
        code: 'UPDATE_ERROR',
        details: error.message
      })
    );
  }
}
```

**Step 3:** Register the route

```typescript
// microservices/auth-service/src/index.ts

import profileRoutes from './routes/profile.routes';

// ...

app.use('/api/v1/profile', profileRoutes);
```

**Step 4:** Test the endpoint

```bash
# Using curl
curl -X GET http://localhost:7020/api/v1/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Or use Thunder Client extension in VS Code
```

**Step 5:** Commit your changes

```bash
git checkout -b feature/add-profile-endpoints
git add .
git commit -m "feat(auth): add profile GET/PUT endpoints"
git push origin feature/add-profile-endpoints
```

### Git Workflow

We use **Git Flow** with feature branches:

```bash
# Create feature branch
git checkout development
git pull origin development
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat(service): description"

# Push to remote
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Request review from team lead
```

**Commit Message Convention:**

```
<type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance

Examples:
- feat(auth): add MFA support
- fix(billing): correct invoice calculation
- docs(api): update authentication docs
```

---

## TESTING & DEBUGGING

### Unit Tests

```bash
# Run all tests
npm test

# Run tests for specific service
cd microservices/auth-service
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

**Example Test:**

```typescript
// microservices/auth-service/tests/auth.service.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthService } from '../src/services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const result = await authService.login('test@example.com', 'password123');
      
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
    });

    it('should throw error for invalid credentials', async () => {
      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Debugging

#### VS Code Debugger Setup

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Auth Service",
      "cwd": "${workspaceFolder}/microservices/auth-service",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 9229,
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

Set breakpoints in VS Code, press F5 to start debugging.

#### Logging

All services use structured logging:

```typescript
import logger from './utils/logger';

// Log levels
logger.info('User logged in', { user_id: 'USR-123' });
logger.warn('Invalid token attempt', { ip: req.ip });
logger.error('Database connection failed', { error: err.message });
logger.debug('Processing request', { body: req.body });
```

View logs:

```bash
# Tail logs in real-time
tail -f microservices/auth-service/logs/combined.log

# Or use Docker logs
docker-compose logs -f auth-service
```

### API Testing

#### Using Thunder Client (VS Code Extension)

1. Install Thunder Client extension
2. Create a new request
3. Set URL: `http://localhost:7020/api/v1/auth/login`
4. Set method: POST
5. Add body:
   ```json
   {
     "email": "doctor@example.com",
     "password": "password123"
   }
   ```
6. Send request

#### Using Postman

Import collection: `docs/postman/NileCare.postman_collection.json`

---

## COMMON TASKS

### Task 1: Add a New Database Column

**Example:** Add `phone_verified` to `auth_users` table

```sql
-- 1. Create migration file
-- microservices/auth-service/migrations/V3__Add_phone_verified.sql

ALTER TABLE auth_users
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE AFTER email_verified;

ALTER TABLE auth_users
ADD COLUMN phone_verification_code VARCHAR(6),
ADD COLUMN phone_verification_expires TIMESTAMP NULL;

CREATE INDEX idx_auth_users_phone_verified ON auth_users(phone_verified);
```

```bash
# 2. Run migration
cd microservices/auth-service
npm run migrate

# 3. Update TypeScript types
# Edit src/types/user.types.ts
interface User {
  // ... existing fields
  phone_verified: boolean;
  phone_verification_code?: string;
  phone_verification_expires?: Date;
}
```

### Task 2: Add a New API Endpoint

Follow the example in ["Making Your First Code Change"](#making-your-first-code-change) above.

### Task 3: Publish an Event to Kafka

```typescript
// Import publisher
import { KafkaPublisher } from '../services/kafka.publisher';

// In your service
async function createAppointment(data: AppointmentData) {
  // 1. Save to database
  const appointment = await db.insert('appointments', data);
  
  // 2. Publish event
  await KafkaPublisher.publish('appointment.events', {
    event_type: 'appointment.scheduled',
    event_version: '1.0',
    timestamp: new Date().toISOString(),
    source_service: 'appointment-service',
    correlation_id: generateCorrelationId(),
    data: appointment
  });
  
  return appointment;
}
```

### Task 4: Consume Events from Kafka

```typescript
// src/consumers/appointment.consumer.ts

import { KafkaConsumer } from '../services/kafka.consumer';

const consumer = new KafkaConsumer('notification-service-group');

await consumer.subscribe(['appointment.events']);

await consumer.start(async (event) => {
  switch (event.event_type) {
    case 'appointment.scheduled':
      await sendAppointmentReminder(event.data);
      break;
    case 'appointment.cancelled':
      await sendCancellationNotice(event.data);
      break;
  }
});
```

### Task 5: Call Another Service

```typescript
// Use service client
import { AuthServiceClient } from '@nilecare/service-clients';

const authClient = new AuthServiceClient(process.env.AUTH_SERVICE_URL);

// Validate token
const user = await authClient.validateToken(token);

// Check permission
const hasPermission = await authClient.checkPermission(
  user.id,
  'patients',
  'read'
);
```

---

## BEST PRACTICES

### Code Style

1. **Use TypeScript** - Strong typing prevents bugs
2. **Async/Await** - Always use async/await (no .then() chains)
3. **Error Handling** - Always wrap in try/catch
4. **Validation** - Validate all inputs with Joi or Zod
5. **Naming Conventions**:
   - Variables/Functions: `camelCase`
   - Classes: `PascalCase`
   - Constants: `UPPER_SNAKE_CASE`
   - Files: `kebab-case.ts`

### Security

1. **Never hardcode secrets** - Use environment variables
2. **Sanitize inputs** - Prevent SQL injection, XSS
3. **Validate JWT tokens** - Always check with Auth Service
4. **Log PHI access** - HIPAA compliance requirement
5. **Use HTTPS** - Always in production

### Performance

1. **Use caching** - Cache frequent queries in Redis
2. **Optimize queries** - Add indexes, avoid N+1 queries
3. **Pagination** - Always paginate list endpoints
4. **Compression** - Use gzip for responses
5. **Connection pooling** - Reuse database connections

### Database

1. **Use migrations** - Never modify database manually
2. **Add indexes** - For foreign keys and frequent queries
3. **Soft deletes** - Add `deleted_at` column instead of deleting
4. **Audit columns** - `created_at`, `updated_at`, `created_by`, `updated_by`
5. **Transactions** - Use for multi-table operations

---

## RESOURCES

### Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [Service Communication Patterns](./SERVICE_COMMUNICATION_PATTERNS.md)
- [Database Schemas](./DATABASE_SCHEMAS_COMPLETE.md)
- [API Reference](./API_REFERENCE.md)
- [Sequence Diagrams](./SEQUENCE_DIAGRAMS_CRITICAL_FLOWS.md)

### Service-Specific READMEs

- [Auth Service](./microservices/auth-service/README.md)
- [Business Service](./microservices/business/README.md)
- [Billing Service](./microservices/billing-service/README.md)
- [Payment Gateway](./microservices/payment-gateway-service/README.md)
- [Appointment Service](./microservices/appointment-service/README.md)

### External Resources

- **TypeScript:** https://www.typescriptlang.org/docs/
- **Express.js:** https://expressjs.com/
- **React:** https://react.dev/
- **Kafka:** https://kafka.apache.org/documentation/
- **Docker:** https://docs.docker.com/
- **MySQL:** https://dev.mysql.com/doc/

### Team Contacts

| Role | Name | Slack | Email |
|------|------|-------|-------|
| **Tech Lead** | [Name] | @tech-lead | tech@nilecare.com |
| **Backend Lead** | [Name] | @backend-lead | backend@nilecare.com |
| **Frontend Lead** | [Name] | @frontend-lead | frontend@nilecare.com |
| **DevOps** | [Name] | @devops | devops@nilecare.com |

### Slack Channels

- `#engineering` - General engineering discussions
- `#backend` - Backend-specific
- `#frontend` - Frontend-specific
- `#incidents` - Production incidents
- `#releases` - Release announcements
- `#questions` - Ask anything!

---

## 🎉 CONGRATULATIONS!

You're now ready to contribute to NileCare!

### Your First Tasks

1. **Easy:** Fix a documentation typo
2. **Medium:** Add a new validation rule to an existing endpoint
3. **Hard:** Implement a new feature endpoint

### Getting Help

- **Stuck?** Ask in `#questions` Slack channel
- **Bug?** Check existing GitHub issues
- **Unclear?** Schedule a pairing session with your mentor

**Remember:** There are no stupid questions. We're all here to help!

---

**Document Status:** ✅ Complete  
**Last Updated:** October 16, 2025  
**Maintained By:** Engineering Team

**Welcome to the team! 🚀**

