# CDS Service - Quick Start Guide

## ⚡ Quick Overview

The **Clinical Decision Support (CDS) Service** is a healthcare safety service that checks medications for:
- 🔴 **Drug Interactions** - Dangerous medication combinations
- 🟡 **Allergy Alerts** - Medications that trigger allergies
- 🟠 **Contraindications** - Medications unsafe for patient conditions
- 🔵 **Dose Validation** - Ensures safe medication dosages
- 🟢 **Clinical Guidelines** - Evidence-based treatment recommendations

## 🚀 5-Minute Setup (Development)

### 1. Install Dependencies
```bash
cd microservices/cds-service
npm install
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Minimal configuration for development
echo "PORT=4002
NODE_ENV=development
DB_HOST=localhost
DB_NAME=cds_service
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=dev-secret-key-change-in-production
CLIENT_URL=http://localhost:3000" > .env
```

### 3. Start the Service
```bash
# Development mode (with auto-reload)
npm run dev

# The service will start on http://localhost:4002
```

### 4. Verify It's Running
```bash
# Check health
curl http://localhost:4002/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "cds-service",
#   "timestamp": "2025-10-14T..."
# }
```

## 🧪 Test the API

### Get a JWT Token First
You need to authenticate with the auth-service:
```bash
# Login to get token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@hospital.com", "password": "your-password"}'

# Extract the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Check Medication Safety
```bash
curl -X POST http://localhost:4002/api/v1/check-medication \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

## 📚 View API Documentation

Open your browser and go to:
```
http://localhost:4002/api-docs
```

This provides interactive Swagger documentation where you can test all endpoints.

## 🔍 Available Endpoints

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `GET /health` | Health check | ❌ No |
| `GET /api-docs` | API documentation | ❌ No |
| `POST /api/v1/check-medication` | Comprehensive medication check | ✅ Yes |
| `POST /api/v1/drug-interactions` | Check drug interactions | ✅ Yes |
| `POST /api/v1/allergy-alerts` | Check allergy alerts | ✅ Yes |
| `POST /api/v1/dose-validation` | Validate medication doses | ✅ Yes |
| `POST /api/v1/contraindications` | Check contraindications | ✅ Yes |
| `GET /api/v1/clinical-guidelines` | Get clinical guidelines | ✅ Yes |

## 🔧 Configuration Options

### Minimal (Development)
```env
PORT=4002
NODE_ENV=development
DB_HOST=localhost
DB_NAME=cds_service
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=dev-secret
```

### Recommended (Production)
```env
PORT=4002
NODE_ENV=production
DB_HOST=production-db-host
DB_NAME=cds_service_prod
DB_USER=cds_user
DB_PASSWORD=strong-password-here
JWT_SECRET=generate-strong-secret
REDIS_HOST=redis-host
MONGODB_URI=mongodb://mongo-host/cds
ENABLE_REAL_TIME_ALERTS=true
LOG_LEVEL=info
```

## ⚠️ Current Status

**This service is currently in SKELETON state** - the basic structure exists but core functionality needs implementation.

### ✅ What Works
- HTTP server runs
- Health checks respond
- Authentication integration
- API endpoint routing
- WebSocket server ready

### ❌ What Needs Implementation
- DrugInteractionService
- AllergyService
- DoseValidationService
- All other core services
- Database schema
- Actual clinical logic

See `IMPLEMENTATION_TODO.md` for complete task list.

## 🛠️ Development Workflow

### 1. Watch Mode
```bash
npm run dev
```
Changes to TypeScript files automatically reload the service.

### 2. Run Tests
```bash
npm test
```

### 3. Check Code Quality
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### 4. Build for Production
```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 4002
lsof -i :4002  # Mac/Linux
netstat -ano | findstr :4002  # Windows

# Kill the process or change PORT in .env
```

### Authentication Fails
```bash
# Make sure auth-service is running
curl http://localhost:4000/health

# Check JWT_SECRET matches between services
```

### Database Connection Fails
```bash
# Check PostgreSQL is running
pg_isready -h localhost

# Verify credentials in .env
psql -h localhost -U postgres -d cds_service
```

### Missing Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📖 Next Steps

1. **Read Full Documentation**
   - See `README.md` for comprehensive overview
   - See `IMPLEMENTATION_TODO.md` for development tasks

2. **Implement Core Services**
   - Start with `DrugInteractionService`
   - Add unit tests as you go

3. **Set Up Database**
   - Create schema
   - Add seed data for testing

4. **Test Integration**
   - Test with other NileCare services
   - Verify authentication flow

## 🔗 Related Services

This service integrates with:
- **auth-service** (port 4000) - Authentication
- **patient-service** (port 4001) - Patient data
- **medication-service** (port 4003) - Medication data
- **ehr-service** (port 4004) - Health records

## 💡 Tips

1. **Use the improved version**: `index.improved.ts` has better structure
2. **Check health probes**: Three health endpoints for Kubernetes
3. **Enable Swagger in dev**: Interactive API testing
4. **Use Winston logger**: Structured logging throughout
5. **Rate limiting active**: 100 requests per 15 minutes default

## 🆘 Getting Help

- Review `README.md` for detailed documentation
- Check `IMPLEMENTATION_TODO.md` for development guide
- Look at other NileCare services for patterns
- Check logs: Service logs to console in development

---

**Ready to implement core functionality?** Start with `IMPLEMENTATION_TODO.md` Phase 1!

