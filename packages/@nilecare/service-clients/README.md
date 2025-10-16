# @nilecare/service-clients

Type-safe service clients for NileCare microservices with built-in circuit breakers and request ID propagation.

## Features

- ✅ Type-safe API calls
- ✅ Circuit breaker pattern for resilience
- ✅ Automatic retry logic
- ✅ Request ID propagation
- ✅ Timeout handling
- ✅ Error handling

## Installation

```bash
npm install @nilecare/service-clients
```

## Usage

### Clinical Service Client

```typescript
import { ClinicalServiceClient } from '@nilecare/service-clients';

const clinicalClient = new ClinicalServiceClient('http://localhost:7001');
clinicalClient.setAuthToken(token);

// Get patients count
const patientsCount = await clinicalClient.getPatientsCount();

// Get recent patients
const patients = await clinicalClient.getRecentPatients(20);

// Get all clinical stats
const stats = await clinicalClient.getAllStats();
```

### Auth Service Client

```typescript
import { AuthServiceClient } from '@nilecare/service-clients';

const authClient = new AuthServiceClient('http://localhost:7020');
authClient.setAuthToken(token);

// Get users count
const usersCount = await authClient.getUsersCount();

// Get active users
const activeUsers = await authClient.getActiveUsersCount();
```

### Lab Service Client

```typescript
import { LabServiceClient } from '@nilecare/service-clients';

const labClient = new LabServiceClient('http://localhost:7080');
labClient.setAuthToken(token);

// Get pending orders
const pendingOrders = await labClient.getPendingOrdersCount();

// Get critical results
const criticalResults = await labClient.getCriticalResultsCount();
```

### Medication Service Client

```typescript
import { MedicationServiceClient } from '@nilecare/service-clients';

const medClient = new MedicationServiceClient('http://localhost:7090');
medClient.setAuthToken(token);

// Get active prescriptions
const activePrescriptions = await medClient.getActivePrescriptionsCount();

// Get medication alerts
const alerts = await medClient.getAlertsCount();
```

### Inventory Service Client

```typescript
import { InventoryServiceClient } from '@nilecare/service-clients';

const invClient = new InventoryServiceClient('http://localhost:7100');
invClient.setAuthToken(token);

// Get low stock items
const lowStock = await invClient.getLowStockItemsCount();

// Get low stock items details
const items = await invClient.getLowStockItems(20);
```

### Appointment Service Client

```typescript
import { AppointmentServiceClient } from '@nilecare/service-clients';

const apptClient = new AppointmentServiceClient('http://localhost:7040');
apptClient.setAuthToken(token);

// Get today's appointments
const todayCount = await apptClient.getTodayAppointmentsCount();

// Get today's appointments details
const appointments = await apptClient.getTodayAppointments();
```

## Circuit Breaker Configuration

All clients include circuit breaker protection:

- **Timeout**: 10 seconds
- **Error Threshold**: 50%
- **Reset Timeout**: 30 seconds
- **Volume Threshold**: 3 requests

## Error Handling

```typescript
try {
  const stats = await clinicalClient.getAllStats();
} catch (error) {
  if (error.code === 'EOPENBREAKER') {
    console.error('Circuit breaker is open');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('Request timed out');
  } else {
    console.error('Request failed:', error.message);
  }
}
```

## Response Format

All endpoints return standardized responses:

```typescript
{
  success: true,
  data: {
    // Service-specific data
  },
  requestId: "uuid",
  timestamp: "ISO timestamp"
}
```

## License

MIT


