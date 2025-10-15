# 🏥 Device Integration Service

**NileCare Healthcare Platform - Medical Device Connectivity & Vital Signs Monitoring**

Version: 1.0.0  
Port: 7009  
Status: Production Ready

---

## 📋 Overview

The Device Integration Service is a critical microservice in the NileCare Healthcare Platform that provides:

- **Medical device connectivity** via multiple protocols (MQTT, HL7, FHIR, Serial, Modbus, WebSocket)
- **Real-time vital signs monitoring** with time-series data storage
- **Critical alert detection** and notification
- **FHIR R4/R5 compliance** for interoperability
- **HL7 v2.x messaging** for legacy system integration
- **WebSocket streaming** for real-time updates

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with TimescaleDB extension
- Redis 6+
- MQTT Broker (optional, for device connections)

### Installation

```bash
# 1. Clone and navigate to directory
cd microservices/device-integration-service

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp env.example.txt .env
# Edit .env with your configuration

# 4. Set up database
psql -U postgres -d nilecare_devices -f database/schema.sql

# 5. Build TypeScript
npm run build

# 6. Start the service
npm start

# Or for development with auto-reload
npm run dev
```

### Docker Setup

```bash
# Build image
docker build -t nilecare/device-integration-service:latest .

# Run container
docker run -p 7009:7009 \\
  --env-file .env \\
  nilecare/device-integration-service:latest
```

---

## 🔧 Configuration

### Environment Variables

Copy `env.example.txt` to `.env` and configure:

#### Service Configuration
```env
NODE_ENV=development
PORT=7009
SERVICE_NAME=device-integration-service
```

#### Database
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare_devices
DB_USER=nilecare_device_user
DB_PASSWORD=your_secure_password
```

#### Redis
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=3
```

#### MQTT (for device connections)
```env
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=device_mqtt_user
MQTT_PASSWORD=mqtt_password
```

#### Integration Services
```env
AUTH_SERVICE_URL=http://localhost:7000
FHIR_SERVER_URL=http://localhost:7008
HL7_SERVER_URL=http://localhost:7010
NOTIFICATION_SERVICE_URL=http://localhost:7007
FACILITY_SERVICE_URL=http://localhost:7005
```

#### Authentication
```env
JWT_SECRET=your_jwt_secret
SERVICE_API_KEY=your_service_api_key
```

---

## 📡 API Endpoints

### Device Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/devices` | Register new device |
| GET | `/api/v1/devices/:id` | Get device by ID |
| GET | `/api/v1/devices` | List all devices (with filters) |
| PATCH | `/api/v1/devices/:id` | Update device |
| PATCH | `/api/v1/devices/:id/status` | Update device status |
| DELETE | `/api/v1/devices/:id` | Delete device |
| GET | `/api/v1/devices/facility/:facilityId` | Get devices by facility |
| GET | `/api/v1/devices/status/online` | Get online devices |
| GET | `/api/v1/devices/:id/health` | Check device health |
| POST | `/api/v1/devices/:id/heartbeat` | Update device heartbeat |

### Vital Signs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/vital-signs` | Submit vital signs data |
| GET | `/api/v1/vital-signs/device/:deviceId` | Get vital signs by device |
| GET | `/api/v1/vital-signs/patient/:patientId` | Get vital signs by patient |
| GET | `/api/v1/vital-signs/device/:deviceId/latest` | Get latest vital signs |
| GET | `/api/v1/vital-signs/patient/:patientId/trends` | Get vital signs trends |

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/live` | Liveness probe |
| GET | `/health/startup` | Startup probe |
| GET | `/health/metrics` | Prometheus metrics |

### Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api-docs` | Swagger UI documentation |

---

## 🔐 Authentication

All API endpoints (except `/health/*` and `/api-docs`) require authentication via:

### JWT Token (User authentication)
```http
Authorization: Bearer <jwt_token>
```

### Service API Key (Service-to-service)
```http
X-Service-API-Key: <service_api_key>
X-Tenant-ID: <tenant_id>
```

---

## 💡 Usage Examples

### Register a Device

```bash
curl -X POST http://localhost:7009/api/v1/devices \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "deviceName": "Vital Signs Monitor #1",
    "deviceType": "vital_monitor",
    "manufacturer": "Philips",
    "modelNumber": "IntelliVue MX40",
    "serialNumber": "SN123456789",
    "protocol": "mqtt",
    "connectionParams": {
      "mqttBroker": "mqtt://broker.local:1883",
      "mqttTopic": "devices/monitor-001/vitals"
    },
    "facilityId": "123e4567-e89b-12d3-a456-426614174000",
    "location": "ICU - Bed 5"
  }'
```

### Submit Vital Signs Data

```bash
curl -X POST http://localhost:7009/api/v1/vital-signs \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "deviceId": "device-uuid",
    "patientId": "patient-uuid",
    "temperature": 37.2,
    "heartRate": 78,
    "respiratoryRate": 16,
    "bloodPressureSystolic": 120,
    "bloodPressureDiastolic": 80,
    "oxygenSaturation": 98,
    "quality": {
      "signalQuality": "good",
      "confidence": 95
    }
  }'
```

### Get Latest Vital Signs

```bash
curl -X GET "http://localhost:7009/api/v1/vital-signs/device/device-uuid/latest" \\
  -H "Authorization: Bearer <token>"
```

### Get Vital Signs Trends

```bash
curl -X GET "http://localhost:7009/api/v1/vital-signs/patient/patient-uuid/trends?parameter=heartRate&startTime=2025-10-01T00:00:00Z&endTime=2025-10-15T23:59:59Z&interval=1 hour" \\
  -H "Authorization: Bearer <token>"
```

---

## 🔌 WebSocket Integration

### Connect to WebSocket Server

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:7009', {
  auth: {
    token: '<jwt_token>'
  }
});

// Subscribe to device updates
socket.emit('subscribe-device', 'device-uuid');

// Listen for vital signs updates
socket.on('vital-signs-update', (data) => {
  console.log('New vital signs:', data);
});

// Listen for alerts
socket.on('device-alert', (alert) => {
  console.log('Device alert:', alert);
});
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Device Integration Service      │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐   ┌────────────────┐    │
│  │Controllers│──▶│    Services    │    │
│  └──────────┘   └────────────────┘    │
│                          │              │
│                          ▼              │
│                  ┌──────────────┐      │
│                  │ Repositories │      │
│                  └──────────────┘      │
│                          │              │
│                          ▼              │
│                  ┌──────────────┐      │
│                  │   Database   │      │
│                  │ (PostgreSQL) │      │
│                  └──────────────┘      │
│                                         │
│  External Integrations:                 │
│  • FHIR Service (R4/R5)                │
│  • HL7 Service (v2.x)                  │
│  • Notification Service                 │
│  • Auth Service                         │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎯 Features

### Device Protocols Supported
- ✅ MQTT - Real-time device messaging
- ✅ HL7 v2.x - Legacy system integration
- ✅ FHIR R4/R5 - Modern interoperability
- ✅ Serial Port - Direct device connection
- ✅ Modbus TCP - Industrial devices
- ✅ WebSocket - Bidirectional streaming
- 🔲 Bluetooth - Mobile devices (future)
- 🔲 USB - Direct USB connection (future)

### Vital Signs Monitored
- ✅ Temperature (°C)
- ✅ Heart Rate (BPM)
- ✅ Blood Pressure (mmHg)
- ✅ Oxygen Saturation (%)
- ✅ Respiratory Rate (breaths/min)
- ✅ Pulse Rate (BPM)
- ✅ ECG Waveforms
- ✅ Signal Quality Metrics

### Alert Management
- ✅ Critical value detection
- ✅ Threshold-based alerts
- ✅ Device malfunction detection
- ✅ Multi-channel notifications (email, SMS, push)
- ✅ Alert acknowledgement and resolution
- ✅ Alert history and reporting

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- DeviceService

# Run in watch mode
npm test -- --watch
```

---

## 📊 Monitoring

### Health Checks

```bash
# Basic health
curl http://localhost:7009/health

# Readiness (includes database check)
curl http://localhost:7009/health/ready

# Metrics (Prometheus format)
curl http://localhost:7009/health/metrics
```

### Logging

Logs are written to:
- Console (development)
- `./logs/device-integration.log` (production)
- Error logs: `./logs/error.log`

Log levels: `error`, `warn`, `info`, `http`, `debug`

---

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Service-to-service API keys
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting per endpoint
- ✅ Input validation and sanitization
- ✅ PHI data encryption
- ✅ Audit logging for all operations
- ✅ CORS configuration
- ✅ Helmet.js security headers

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify database exists
psql -U postgres -l | grep nilecare_devices

# Test connection
psql -U nilecare_device_user -d nilecare_devices -c "SELECT 1"
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Test connection
redis-cli -h localhost -p 6379 ping
```

### Authentication Issues
- Verify AUTH_SERVICE_URL is correct
- Check JWT_SECRET matches auth service
- Ensure SERVICE_API_KEY is configured

---

## 📝 Development

### Project Structure
```
device-integration-service/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── models/          # Data models
│   ├── repositories/    # Database operations
│   ├── services/        # Business logic
│   ├── integrations/    # External service clients
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utilities
│   └── types/           # TypeScript types
├── database/            # Database schemas
├── tests/               # Test files
└── package.json
```

### Code Style

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

---

## 🤝 Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation
4. Ensure all tests pass
5. Follow TypeScript best practices

---

## 📄 License

MIT License - NileCare Healthcare Platform

---

## 📞 Support

For issues and questions:
- Email: dev@nilecare.com
- Documentation: http://localhost:7009/api-docs
- Health Status: http://localhost:7009/health

---

**Last Updated:** October 15, 2025  
**Maintained By:** NileCare Development Team

