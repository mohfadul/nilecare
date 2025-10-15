# @nilecare/validation

**Shared validation package for NileCare microservices**

Provides standardized input validation using express-validator with consistent error responses across all services.

**Issue #6 Fix:** Missing Input Validation (High Priority)

---

## Installation

```bash
# In your microservice
npm install file:../../packages/@nilecare/validation
```

## Usage

### Basic Validation

```typescript
import { validate, createPatientValidation } from '@nilecare/validation';

// In your route
router.post('/api/v1/patients', 
  validate(createPatientValidation),
  async (req, res) => {
    // Validation passed, proceed with logic
    const patient = await createPatient(req.body);
    res.json({ success: true, data: patient });
  }
);
```

### Custom Validation

```typescript
import { body } from 'express-validator';
import { validate } from '@nilecare/validation';

const customValidation = [
  body('customField')
    .notEmpty().withMessage('Custom field is required')
    .isLength({ min: 5 }).withMessage('Must be at least 5 characters'),
];

router.post('/api/v1/custom',
  validate(customValidation),
  handler
);
```

---

## Available Schemas

### Patient Schemas
- `createPatientValidation` - POST /patients
- `updatePatientValidation` - PUT /patients/:id
- `getPatientValidation` - GET /patients/:id
- `listPatientsValidation` - GET /patients (query params)

### Appointment Schemas
- `createAppointmentValidation` - POST /appointments
- `updateAppointmentValidation` - PUT /appointments/:id
- `listAppointmentsValidation` - GET /appointments

### User Schemas
- `registerUserValidation` - POST /auth/register
- `loginValidation` - POST /auth/login
- `changePasswordValidation` - POST /auth/change-password
- `updateUserValidation` - PUT /users/:id

### Device Schemas
- `registerDeviceValidation` - POST /devices
- `submitVitalSignsValidation` - POST /vital-signs
- `updateDeviceStatusValidation` - PATCH /devices/:id/status

### Payment Schemas
- `initiatePaymentValidation` - POST /payments/initiate
- `verifyPaymentValidation` - POST /payments/verify
- `cancelPaymentValidation` - PATCH /payments/:id/cancel
- `refundPaymentValidation` - POST /refunds

---

## Error Response Format

When validation fails, the middleware returns:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email must be valid",
        "value": "invalid-email"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-10-15T12:00:00Z"
  }
}
```

---

## Helper Functions

### sanitizeInput(input: string)
Removes potentially dangerous characters (XSS prevention)

### isValidUUID(uuid: string)
Validates UUID format

### isValidDate(date: string)
Validates ISO 8601 date format

### isValidEmail(email: string)
Validates RFC 5322 email format

### isValidPhone(phone: string)
Validates E.164 phone format

---

## Best Practices

1. **Always validate user input** - Never trust client data
2. **Use parameterized queries** - Prevent SQL injection
3. **Sanitize output** - Prevent XSS
4. **Validate on backend** - Frontend validation is UX, not security
5. **Return clear errors** - Help developers debug

---

## Implementation Checklist

For each microservice:

- [ ] Install @nilecare/validation package
- [ ] Import validation schemas
- [ ] Add validate() middleware to POST/PUT/PATCH routes
- [ ] Test with invalid data
- [ ] Document validation rules

---

## Example Implementation

```typescript
// routes/patients.ts
import { Router } from 'express';
import { validate, createPatientValidation, updatePatientValidation } from '@nilecare/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create patient with validation
router.post('/api/v1/patients',
  authenticate,
  validate(createPatientValidation),  // ✅ Validation added
  async (req, res) => {
    // Input is validated, safe to use
    const patient = await PatientService.create(req.body);
    res.status(201).json({ success: true, data: patient });
  }
);

// Update patient with validation
router.put('/api/v1/patients/:id',
  authenticate,
  validate(updatePatientValidation),  // ✅ Validation added
  async (req, res) => {
    const patient = await PatientService.update(req.params.id, req.body);
    res.json({ success: true, data: patient });
  }
);

export default router;
```

---

## Security Benefits

- ✅ **SQL Injection Prevention** - Validates input before database queries
- ✅ **XSS Prevention** - Sanitizes user input
- ✅ **Data Integrity** - Ensures data meets business rules
- ✅ **Type Safety** - Validates data types
- ✅ **Clear Errors** - Helps developers understand issues

---

**Version:** 1.0.0  
**Last Updated:** October 15, 2025  
**Status:** Ready for Integration

