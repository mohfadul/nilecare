# Healthcare Services - Quick Reference Guide

**Use this guide for quick lookups of service capabilities and integration points**

---

## 🎯 Three Core Services at a Glance

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Clinical        │  │  CDS             │  │  EHR             │
│  Service         │  │  Service         │  │  Service         │
│  Port: 3004      │  │  Port: 4002      │  │  Port: 4001      │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│                  │  │                  │  │                  │
│ OPERATIONS       │  │ SAFETY           │  │ DOCUMENTATION    │
│                  │  │                  │  │                  │
│ • Patients       │  │ • Drug checks    │  │ • SOAP notes     │
│ • Encounters     │  │ • Allergy alerts │  │ • Problem lists  │
│ • Medications    │  │ • Dose validate  │  │ • Progress notes │
│ • Diagnostics    │  │ • Guidelines     │  │ • Documents      │
│ • Vital signs    │  │ • Warnings       │  │ • History        │
│                  │  │                  │  │                  │
│ Status: 80% ✅   │  │ Status: 20% 🟡   │  │ Status: 15% 🟡   │
│                  │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 🔑 Quick Lookup: What Service Does What?

| I want to... | Service | Endpoint Example |
|-------------|---------|------------------|
| Register a patient | Clinical | `POST /api/v1/patients` |
| Get patient data | Clinical | `GET /api/v1/patients/:id` |
| Create encounter | Clinical | `POST /api/v1/encounters` |
| Prescribe medication | Clinical | `POST /api/v1/medications` |
| Check drug interactions | CDS | `POST /api/v1/check-medication` |
| Validate dose | CDS | `POST /api/v1/dose-validation` |
| Check allergies | CDS | `POST /api/v1/allergy-alerts` |
| Get clinical guidelines | CDS | `GET /api/v1/clinical-guidelines` |
| Create SOAP note | EHR | `POST /api/v1/soap-notes` |
| View problem list | EHR | `GET /api/v1/problem-lists/patient/:id` |
| Add progress note | EHR | `POST /api/v1/progress-notes` |
| Export medical records | EHR | `GET /api/v1/ehr/patient/:id/export` |

---

## 📞 Service Endpoints Quick Reference

### Clinical Service (Port 3004)

```
GET  /health                              Health check
GET  /api-docs                            API documentation

GET  /api/v1/patients                     List patients
POST /api/v1/patients                     Create patient
GET  /api/v1/patients/:id                 Get patient
PUT  /api/v1/patients/:id                 Update patient

GET  /api/v1/encounters                   List encounters
POST /api/v1/encounters                   Create encounter
GET  /api/v1/encounters/:id               Get encounter
PATCH /api/v1/encounters/:id/complete     Complete encounter

GET  /api/v1/medications                  List medications
POST /api/v1/medications                  Prescribe medication
PUT  /api/v1/medications/:id              Update medication
PATCH /api/v1/medications/:id/discontinue Discontinue medication
```

### CDS Service (Port 4002)

```
GET  /health                              Health check
GET  /api-docs                            API documentation

POST /api/v1/check-medication             🔥 Comprehensive safety check
POST /api/v1/drug-interactions            Check drug interactions
POST /api/v1/allergy-alerts               Check allergies
POST /api/v1/dose-validation              Validate dosage
POST /api/v1/contraindications            Check contraindications
GET  /api/v1/clinical-guidelines          Get guidelines
```

### EHR Service (Port 4001)

```
GET  /health                              Health check
GET  /api-docs                            API documentation

GET  /api/v1/soap-notes                   List SOAP notes
POST /api/v1/soap-notes                   Create SOAP note
GET  /api/v1/soap-notes/:id               Get SOAP note
PATCH /api/v1/soap-notes/:id/finalize     Finalize note
GET  /api/v1/soap-notes/:id/export        Export to PDF

GET  /api/v1/problem-lists/patient/:id    Get problem list
POST /api/v1/problem-lists                Add problem
PATCH /api/v1/problem-lists/:id/resolve   Resolve problem

GET  /api/v1/ehr/patient/:id              Get complete EHR
GET  /api/v1/ehr/patient/:id/export       Export EHR to PDF
```

---

## 🔄 Common Workflows Cheat Sheet

### Workflow 1: New Patient Visit

```bash
# 1. Create patient (Clinical)
POST http://localhost:3004/api/v1/patients

# 2. Create encounter (Clinical)
POST http://localhost:3004/api/v1/encounters

# 3. Document visit (EHR)
POST http://localhost:4001/api/v1/soap-notes

# 4. Add diagnosis (EHR)
POST http://localhost:4001/api/v1/problem-lists

# 5. Prescribe medication (Clinical → calls CDS automatically)
POST http://localhost:3004/api/v1/medications
```

### Workflow 2: Check Medication Safety

```bash
# Call CDS service directly
POST http://localhost:4002/api/v1/check-medication
{
  "patientId": "P123",
  "medications": [...],
  "allergies": [...],
  "conditions": [...]
}

# Returns risk assessment
```

### Workflow 3: View Patient Record

```bash
# Get complete patient data (Clinical)
GET http://localhost:3004/api/v1/patients/:id

# Get patient's encounters (Clinical)
GET http://localhost:3004/api/v1/patients/:id/encounters

# Get complete EHR (EHR)
GET http://localhost:4001/api/v1/ehr/patient/:id

# Export to PDF (EHR)
GET http://localhost:4001/api/v1/ehr/patient/:id/export?format=pdf
```

---

## 🔐 Authentication Quick Reference

All services use the same authentication:

```bash
# 1. Login (Auth Service)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@hospital.com","password":"password"}'

# 2. Extract token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Use token in all requests
curl http://localhost:3004/api/v1/patients \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚨 Risk Levels (CDS Service)

| Level | Score | Color | Action |
|-------|-------|-------|--------|
| **Low** | < 5 | 🟢 Green | Proceed normally |
| **Medium** | 5-9 | 🟡 Yellow | Show warnings, allow |
| **High** | ≥ 10 | 🔴 Red | Block, require override |

---

## 📊 Service Status Quick View

| Service | Infrastructure | Core Logic | Integration | Testing | Production Ready |
|---------|---------------|------------|-------------|---------|------------------|
| Clinical | ✅ Complete | ✅ 80% | 🟡 Partial | 🟡 Some | 🟡 Almost |
| CDS | ✅ Complete | ❌ 0% | ❌ No | ❌ No | ❌ No |
| EHR | ✅ Complete | ❌ 0% | ❌ No | ❌ No | ❌ No |

**Legend:**
- ✅ Complete
- 🟡 Partial
- ❌ Not started

---

## 💡 Quick Tips

### For Developers

1. **Start with Clinical Service** - it's the most complete
2. **Implement CDS Service next** - highest priority for safety
3. **Use Clinical Service patterns** - copy middleware, services, etc.
4. **All services share auth middleware** - `shared/middleware/auth`
5. **Check health endpoints first** - verify service is running

### For Testing

1. **Health checks don't require auth** - easy to test
2. **Get token from auth-service first** - required for all other endpoints
3. **Use Swagger UI** - interactive API testing at `/api-docs`
4. **Check logs** - services log to console in development

### For Integration

1. **Services call each other via HTTP** - use axios
2. **Fail gracefully** - if CDS down, Clinical continues
3. **Real-time via WebSocket** - critical alerts
4. **Events via Kafka** - asynchronous communication

---

## 📁 File Locations

### Documentation

```
NileCare/
├── HEALTHCARE_SERVICES_REVIEW_COMPLETE.md   ← Full review
├── SERVICES_QUICK_REFERENCE.md              ← This file
│
├── microservices/
│   ├── HEALTHCARE_SERVICES_INTEGRATION.md   ← Integration overview
│   ├── CLINICAL_CDS_INTEGRATION_SUMMARY.md  ← Clinical+CDS
│   │
│   ├── clinical/
│   │   ├── README.md                        ← Clinical service
│   │   └── CDS_INTEGRATION_GUIDE.md         ← Integration steps
│   │
│   ├── cds-service/
│   │   ├── README.md                        ← CDS service
│   │   ├── IMPLEMENTATION_TODO.md           ← Implementation tasks
│   │   ├── QUICK_START.md                   ← 5-min setup
│   │   └── SERVICE_REVIEW_SUMMARY.md        ← Status review
│   │
│   └── ehr-service/
│       ├── README.md                        ← EHR service
│       └── SERVICE_REVIEW_SUMMARY.md        ← Status review
```

### Source Code

```
microservices/
├── clinical/src/                   ✅ Mostly implemented
├── cds-service/src/                🟡 Skeleton only
└── ehr-service/src/                🟡 Skeleton only
```

---

## 🆘 Troubleshooting Quick Guide

| Problem | Solution |
|---------|----------|
| Service won't start | Check `.env` file exists, verify required env vars |
| Port already in use | Change `PORT` in `.env` or kill process on port |
| Database connection fails | Verify PostgreSQL running, check credentials |
| Authentication fails | Ensure auth-service running, check JWT_SECRET |
| CDS integration fails | Check CDS service URL in Clinical `.env` |
| Import errors (TypeScript) | Run `npm install`, check file exists |

---

## 📚 Learn More

- **Full Platform Overview:** `/README.md`
- **Auth Integration:** Various `AUTH_*` markdown files
- **Billing Service:** `START_HERE_BILLING_SERVICE.md`
- **Setup Guide:** `INTEGRATION_SETUP_GUIDE.md`

---

**🎯 Bottom Line:** You have three healthcare services with complete documentation, clear integration patterns, and a roadmap for implementation. The Clinical Service works now, CDS and EHR need 4-6 weeks each for MVP. All documentation is complete! 🚀

**Ready to implement? Start with:** `microservices/cds-service/IMPLEMENTATION_TODO.md`

