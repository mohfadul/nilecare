# Clinical Decision Support (CDS) Service

## 🏥 Overview

The **Clinical Decision Support Service** is a critical healthcare microservice that provides real-time clinical intelligence to help healthcare providers make safer, evidence-based decisions. It analyzes patient data, medications, allergies, and conditions to identify potential risks and provide clinical guidance.

## 🎯 Purpose

This service acts as an intelligent safety layer in the NileCare healthcare platform, performing:

- **Drug Interaction Analysis** - Identifies potentially harmful drug-drug interactions
- **Allergy Alert System** - Warns about medications that may trigger patient allergies
- **Dose Validation** - Ensures medication dosages are within safe therapeutic ranges
- **Contraindication Detection** - Identifies medications contraindicated for patient conditions
- **Clinical Guidelines Engine** - Provides evidence-based treatment recommendations
- **Real-time Alert Broadcasting** - Immediate notifications for critical safety issues

## 🚀 Key Features

### Clinical Intelligence
- ✅ **Multi-drug Interaction Checking** - Analyzes complex medication combinations
- ✅ **Severity-based Risk Scoring** - Quantifies clinical risk levels (low/medium/high)
- ✅ **Patient-specific Validation** - Considers individual patient characteristics
- ✅ **Evidence-based Guidelines** - Integrates clinical best practices
- ✅ **Machine Learning Ready** - Infrastructure for ML-based predictions
- ✅ **NLP Processing** - Natural language processing for clinical text

### Technical Capabilities
- ✅ **Real-time Alerts** - WebSocket-based instant notifications
- ✅ **RESTful API** - Comprehensive HTTP endpoints
- ✅ **OpenAPI/Swagger Documentation** - Interactive API documentation
- ✅ **Health Monitoring** - Kubernetes-ready health probes
- ✅ **Rate Limiting** - Protection against API abuse
- ✅ **JWT Authentication** - Secure API access
- ✅ **Comprehensive Logging** - Winston-based structured logging

## 📊 Architecture

### Service Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CDS Service (Port 4002)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   HTTP Server    │  │  WebSocket (IO)  │                │
│  │   (Express)      │  │   Real-time      │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Core Services Layer                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • DrugInteractionService                             │  │
│  │ • AllergyService                                      │  │
│  │ • DoseValidationService                              │  │
│  │ • ClinicalGuidelinesService                          │  │
│  │ • ContraindicationService                            │  │
│  │ • AlertService                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Data Stores                              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • PostgreSQL (Structured Data)                       │  │
│  │ • MongoDB (Document Storage)                         │  │
│  │ • Redis (Caching)                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Client Request
     ↓
JWT Authentication
     ↓
Rate Limiting
     ↓
Request Validation
     ↓
┌─────────────────────────────────┐
│  Parallel Safety Checks:        │
│  • Drug Interactions            │
│  • Allergy Alerts               │
│  • Contraindications            │
│  • Dose Validation              │
│  • Clinical Guidelines          │
└─────────────────────────────────┘
     ↓
Risk Aggregation & Scoring
     ↓
Response + Real-time Alert (if high-risk)
```

## 🔌 API Endpoints

### Health & Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health status |
| `/health/ready` | GET | Readiness probe (checks DB) |
| `/health/startup` | GET | Startup probe |
| `/metrics` | GET | Prometheus-compatible metrics |

### Core APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/drug-interactions` | GET/POST | ✅ | Check drug interactions |
| `/api/v1/allergy-alerts` | GET/POST | ✅ | Allergy alert checking |
| `/api/v1/dose-validation` | POST | ✅ | Validate medication doses |
| `/api/v1/clinical-guidelines` | GET | ✅ | Retrieve clinical guidelines |
| `/api/v1/contraindications` | POST | ✅ | Check contraindications |
| `/api/v1/alerts` | GET | ✅ | Retrieve alert history |
| `/api/v1/check-medication` | POST | ✅ | **Comprehensive medication check** |

### Documentation

| Endpoint | Description |
|----------|-------------|
| `/api-docs` | Interactive Swagger UI |

## 🔐 Authentication

All API endpoints (except health checks) require JWT authentication:

```bash
Authorization: Bearer <JWT_TOKEN>
```

The token should be obtained from the `auth-service` and include appropriate claims.

## 📝 API Usage Examples

### Comprehensive Medication Check

**Endpoint:** `POST /api/v1/check-medication`

**Request:**
```json
{
  "patientId": "P12345",
  "medications": [
    {
      "id": "MED001",
      "name": "Warfarin",
      "dose": "5mg",
      "frequency": "daily"
    },
    {
      "id": "MED002",
      "name": "Aspirin",
      "dose": "81mg",
      "frequency": "daily"
    }
  ],
  "allergies": [
    {
      "allergen": "Penicillin",
      "severity": "severe"
    }
  ],
  "conditions": [
    {
      "code": "I48.91",
      "name": "Atrial Fibrillation"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "interactions": [
      {
        "severity": "major",
        "drugs": ["Warfarin", "Aspirin"],
        "description": "Increased bleeding risk",
        "recommendation": "Monitor INR closely"
      }
    ],
    "allergyAlerts": [],
    "contraindications": [],
    "doseValidation": {
      "hasErrors": false,
      "validations": [...]
    },
    "guidelines": [...],
    "overallRisk": {
      "score": 8,
      "level": "medium",
      "factors": {
        "interactions": 1,
        "allergies": 0,
        "contraindications": 0,
        "doseIssues": 0
      }
    }
  }
}
```

## 🔄 Real-time Alerts (WebSocket)

### Connect to WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4002', {
  auth: {
    token: '<JWT_TOKEN>'
  }
});

// Join patient-specific alert room
socket.emit('join-patient-alerts', 'P12345');

// Join clinical team room
socket.emit('join-clinical-team', 'TEAM001');

// Listen for clinical alerts
socket.on('clinical-alert', (alert) => {
  console.log('Critical Alert:', alert);
  // {
  //   type: 'high-risk-medication',
  //   severity: 'critical',
  //   message: 'High-risk medication combination detected',
  //   details: {...},
  //   timestamp: '2025-10-14T...'
  // }
});
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the service directory:

```env
# Server Configuration
PORT=4002
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cds_service
DB_USER=cds_user
DB_PASSWORD=secure_password

# MongoDB Configuration (for document storage)
MONGODB_URI=mongodb://localhost:27017/cds_service

# Redis Configuration (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRY=24h

# API Configuration
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# External Services
AUTH_SERVICE_URL=http://localhost:4000
PATIENT_SERVICE_URL=http://localhost:4001

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Feature Flags
ENABLE_ML_PREDICTIONS=false
ENABLE_NLP_PROCESSING=false
```

## 📦 Dependencies

### Core Dependencies
- **express** - Web framework
- **socket.io** - Real-time WebSocket communication
- **pg** - PostgreSQL client
- **mongoose** - MongoDB ODM
- **ioredis** - Redis client
- **jsonwebtoken** - JWT authentication

### Security & Middleware
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting
- **express-validator** - Request validation

### ML & NLP (Advanced Features)
- **brain.js** - Neural networks
- **natural** - Natural language processing
- **compromise** - Text analysis
- **node-nlp** - NLP toolkit

### Documentation & Monitoring
- **swagger-ui-express** - API documentation
- **winston** - Logging
- **morgan** - HTTP request logging

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- MongoDB 6+ (optional)
- Redis 6+ (optional, for caching)

### Installation

1. **Navigate to service directory:**
```bash
cd microservices/cds-service
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up database:**
```bash
# Create database
createdb cds_service

# Run migrations (if available)
npm run migrate
```

5. **Start the service:**

**Development mode (with hot-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

### Development Scripts

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Watch tests
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:4002/health
```

### API Test
```bash
curl -X POST http://localhost:4002/api/v1/check-medication \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P12345",
    "medications": [{
      "name": "Warfarin",
      "dose": "5mg"
    }],
    "allergies": [],
    "conditions": []
  }'
```

## 📈 Risk Scoring Algorithm

The service calculates an overall risk score based on:

| Factor | Weight | Impact |
|--------|--------|--------|
| Drug Interactions | × 2 | Each interaction adds 2 points |
| Allergy Alerts | × 3 | Each allergy match adds 3 points |
| Contraindications | × 4 | Each contraindication adds 4 points |
| Dose Errors | + 2 | Dose validation failure adds 2 points |

**Risk Levels:**
- **Low:** Score < 5
- **Medium:** Score 5-9
- **High:** Score ≥ 10 (triggers real-time alert)

## 🏗️ Project Structure

```
cds-service/
├── src/
│   ├── index.ts                    # Main application entry
│   ├── routes/                     # API route handlers
│   │   ├── drug-interactions.ts
│   │   ├── allergy-alerts.ts
│   │   ├── dose-validation.ts
│   │   ├── clinical-guidelines.ts
│   │   ├── contraindications.ts
│   │   └── alerts.ts
│   ├── services/                   # Business logic
│   │   ├── DrugInteractionService.ts
│   │   ├── AllergyService.ts
│   │   ├── DoseValidationService.ts
│   │   ├── ClinicalGuidelinesService.ts
│   │   ├── ContraindicationService.ts
│   │   └── AlertService.ts
│   ├── middleware/                 # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validation.ts
│   ├── models/                     # Data models
│   ├── utils/                      # Utility functions
│   │   └── logger.ts
│   └── events/                     # Event handlers
│       └── handlers.ts
├── tests/                          # Test files
├── .env.example                    # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔍 Current Implementation Status

### ⚠️ Important Notes

1. **Incomplete Implementation:** The current codebase contains:
   - ✅ Main server setup and middleware
   - ✅ API endpoint definitions
   - ✅ Real-time WebSocket integration
   - ❌ Missing: Route implementations (need to be created)
   - ❌ Missing: Service implementations (need to be created)
   - ❌ Missing: Middleware implementations (some need creation)

2. **Code Issues to Fix:**
   - Line 135 & 165 in `index.ts`: Missing closing brace for `/health` endpoint
   - Service classes referenced but not implemented
   - Route modules referenced but not created

3. **Migration Status:**
   - ✅ Uses shared authentication middleware from `../../shared/middleware/auth`
   - This aligns with the NileCare centralized authentication architecture

## 🛣️ Implementation Roadmap

### Phase 1: Core Infrastructure ✅ (Complete)
- [x] Express server setup
- [x] WebSocket integration
- [x] Health checks
- [x] Authentication middleware integration
- [x] Logging setup

### Phase 2: Service Implementation (Needed)
- [ ] Create DrugInteractionService
- [ ] Create AllergyService
- [ ] Create DoseValidationService
- [ ] Create ClinicalGuidelinesService
- [ ] Create ContraindicationService
- [ ] Create AlertService

### Phase 3: Route Implementation (Needed)
- [ ] Drug interaction routes
- [ ] Allergy alert routes
- [ ] Dose validation routes
- [ ] Clinical guidelines routes
- [ ] Contraindication routes
- [ ] Alert routes

### Phase 4: Data Integration
- [ ] Database schema design
- [ ] Clinical data integration
- [ ] Drug database integration
- [ ] Guideline database setup

### Phase 5: Advanced Features
- [ ] Machine learning models
- [ ] NLP processing
- [ ] Predictive analytics
- [ ] Integration with external clinical databases

## 🔗 Integration Points

### Dependent Services
- **auth-service** - User authentication and authorization
- **patient-service** - Patient demographics and history
- **medication-service** - Medication data
- **ehr-service** - Electronic health records

### External Integrations (Recommended)
- **RxNorm** - Medication nomenclature
- **FDA Drug Database** - Drug interaction data
- **UpToDate/Lexicomp** - Clinical guidelines
- **SNOMED CT** - Clinical terminology

## 📚 Clinical Data Sources

To make this service production-ready, integrate with:

1. **Drug Interaction Databases:**
   - DrugBank
   - Micromedex
   - Lexicomp

2. **Clinical Guidelines:**
   - UpToDate
   - National Guideline Clearinghouse
   - Clinical practice guidelines

3. **Allergy Databases:**
   - RxNorm
   - UNII (Unique Ingredient Identifier)

## 🤝 Contributing

When implementing missing components:

1. Follow the established architecture pattern
2. Maintain comprehensive error handling
3. Add unit tests for all services
4. Document all API endpoints with Swagger annotations
5. Follow TypeScript best practices
6. Ensure HIPAA compliance for all patient data handling

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support

For issues or questions:
- Create an issue in the repository
- Contact: NileCare Development Team
- Email: support@nilecare.com (example)

---

**⚠️ Healthcare Compliance Notice:**

This service handles sensitive medical data. Ensure compliance with:
- **HIPAA** (Health Insurance Portability and Accountability Act)
- **GDPR** (if operating in EU)
- **Local healthcare regulations**
- **Clinical validation** by qualified medical professionals

Always validate clinical decision support recommendations with licensed healthcare providers before clinical use.

