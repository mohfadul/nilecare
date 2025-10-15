# @nilecare/response-wrapper

Standardized API response wrapper for NileCare microservices.

## Installation

```bash
npm install @nilecare/response-wrapper
```

## Usage

### Basic Success Response

```typescript
import { successResponse } from '@nilecare/response-wrapper';

// In your controller
app.get('/api/patients/:id', async (req, res) => {
  const patient = await patientService.findById(req.params.id);
  
  res.json(successResponse({ patient }));
});

// Response:
{
  "success": true,
  "data": {
    "patient": { ... }
  },
  "metadata": {
    "timestamp": "2025-10-15T12:00:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "v1"
  }
}
```

### Success Response with Pagination

```typescript
import { successResponseWithPagination } from '@nilecare/response-wrapper';

app.get('/api/patients', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const result = await patientService.findAll({ page, limit });
  
  res.json(
    successResponseWithPagination(
      { patients: result.patients },
      {
        page: result.page,
        limit: result.limit,
        total: result.total
      }
    )
  );
});

// Response:
{
  "success": true,
  "data": {
    "patients": [...]
  },
  "metadata": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Error Responses

```typescript
import { 
  errorResponse, 
  ErrorCode,
  notFoundResponse,
  validationErrorResponse
} from '@nilecare/response-wrapper';

// Not found error
app.get('/api/patients/:id', async (req, res) => {
  const patient = await patientService.findById(req.params.id);
  
  if (!patient) {
    return res.status(404).json(
      notFoundResponse('Patient', req.params.id)
    );
  }
  
  res.json(successResponse({ patient }));
});

// Validation error
app.post('/api/patients', async (req, res) => {
  const errors = validatePatientData(req.body);
  
  if (Object.keys(errors).length > 0) {
    return res.status(400).json(
      validationErrorResponse(errors)
    );
  }
  
  const patient = await patientService.create(req.body);
  res.json(successResponse({ patient }));
});

// Custom error
app.post('/api/appointments', async (req, res) => {
  const conflict = await checkAppointmentConflict(req.body);
  
  if (conflict) {
    return res.status(409).json(
      errorResponse(
        ErrorCode.APPOINTMENT_CONFLICT,
        'Appointment time slot is not available',
        { conflictingAppointment: conflict },
        409
      )
    );
  }
  
  // ...
});
```

### Express Middleware

```typescript
import { 
  requestIdMiddleware,
  responseWrapperMiddleware,
  errorHandlerMiddleware 
} from '@nilecare/response-wrapper';

const app = express();

// Add request ID to all requests
app.use(requestIdMiddleware);

// Automatically wrap all responses
app.use(responseWrapperMiddleware({ service: 'auth-service' }));

// Your routes
app.get('/api/patients', (req, res) => {
  // Just return data - middleware will wrap it
  res.json({ patients: [...] });
});

// Error handler (must be last)
app.use(errorHandlerMiddleware({ service: 'auth-service' }));
```

## Standard Error Codes

```typescript
enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Business logic errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  EXPIRED = 'EXPIRED',
  
  // Resource-specific errors
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  APPOINTMENT_CONFLICT = 'APPOINTMENT_CONFLICT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PRESCRIPTION_INVALID = 'PRESCRIPTION_INVALID',
}
```

## Migration Guide

To migrate an existing service:

1. **Install package:**
   ```bash
   npm install @nilecare/response-wrapper
   ```

2. **Add middleware:**
   ```typescript
   import { requestIdMiddleware, errorHandlerMiddleware } from '@nilecare/response-wrapper';
   
   app.use(requestIdMiddleware);
   // ... your routes ...
   app.use(errorHandlerMiddleware({ service: 'your-service-name' }));
   ```

3. **Update controllers:**
   ```typescript
   // Before:
   res.json({ patient: data });
   
   // After:
   import { successResponse } from '@nilecare/response-wrapper';
   res.json(successResponse({ patient: data }));
   ```

4. **Update error handling:**
   ```typescript
   // Before:
   res.status(404).json({ error: 'Not found' });
   
   // After:
   import { notFoundResponse } from '@nilecare/response-wrapper';
   res.status(404).json(notFoundResponse('Patient', id));
   ```

## TypeScript Support

Full TypeScript support with generic types:

```typescript
import { NileCareResponse, successResponse } from '@nilecare/response-wrapper';

interface Patient {
  id: number;
  name: string;
}

// Type-safe response
const response: NileCareResponse<{ patient: Patient }> = successResponse({
  patient: { id: 1, name: 'Ahmed' }
});
```

## License

MIT

