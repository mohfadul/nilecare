# Payment Gateway Service - Setup Instructions

## Quick Start (Standalone Mode)

If you want to run this service independently without the workspace:

### 1. Remove Workspace Configuration

Temporarily move out of the workspace or remove the `workspaces` field from the root `package.json`.

### 2. Install Dependencies

```bash
cd microservices/payment-gateway-service
npm install
```

### 3. Configure Environment

```bash
cp env.example .env
# Edit .env with your actual configuration
```

### 4. Run Development Server

```bash
npm run dev
```

The service will start on port 7001.

## Issues Fixed

✅ All TypeScript linter errors resolved:
- Fixed unused `filters` variable in verification service
- Fixed unused `payment` parameters in notification methods
- Added DOM lib to tsconfig.json
- Updated package.json with all required dependencies

## Workspace Mode

If running in workspace mode, you need to fix these dependencies first:

### Root Level Fixes Required:

1. **microservices/appointment-service/package.json**
   - ✅ Removed `@types/rrule` (doesn't exist on npm)

2. **microservices/billing-service/package.json**
   - ✅ Removed `x12-parser` (doesn't exist on npm)

3. **microservices/device-integration-service/package.json**
   - ✅ Removed `timescaledb` (doesn't exist on npm)

4. **microservices/fhir-service/package.json**
   - ✅ Fixed `node-fhir-server-core` → `@asymmetrik/node-fhir-server-core`

5. **microservices/hl7-service/package.json**
   - ✅ Fixed `hl7-standard` → `hl7v2`

### Then Install Workspace Dependencies:

```bash
cd C:\Users\pc\OneDrive\Desktop\NileCare
npm install --legacy-peer-deps
```

## Service Architecture

- **Port**: 7001
- **Database**: MySQL (via TypeORM)
- **Authentication**: JWT
- **Rate Limiting**: express-rate-limit
- **Logging**: Winston
- **Validation**: Joi

## API Endpoints

- `GET /health` - Health check
- `POST /api/v1/payments` - Create payment
- `POST /api/v1/payments/verify` - Verify payment
- `GET /api/v1/payments` - List payments (with filters)
- `POST /api/v1/reconciliation` - Reconcile payments
- `POST /api/v1/refunds` - Process refund

## Next Steps

1. Ensure MySQL database is running
2. Run database migrations
3. Configure payment provider API keys in `.env`
4. Start the service
5. Test with health check: `curl http://localhost:7001/health`

