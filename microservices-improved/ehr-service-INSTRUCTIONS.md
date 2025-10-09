# ehr-service Implementation Instructions

## File: microservices\ehr-service\src\index.ts

### Step 1: Backup created
✅ Backup at: microservices\ehr-service\src\index.ts.backup

### Step 2: Add these code blocks

#### A. After imports, add:
```typescript
import { Pool } from 'pg';
```

#### B. After dotenv.config(), add:
```typescript

// ============================================================================
// ENVIRONMENT VALIDATION (Fail fast if misconfigured)
// ============================================================================

const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

function validateEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('╔═══════════════════════════════════════════════════╗');
    console.error('║   ENVIRONMENT VALIDATION FAILED                   ║');
    console.error('╚═══════════════════════════════════════════════════╝');
    missing.forEach(v => console.error(`❌ Missing: ${v}`));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment variables validated');
}

// Validate before proceeding
validateEnvironment();

let appInitialized = false;
const serviceStartTime = Date.now();

```

#### C. After const app = express(), add:
```typescript

// ============================================================================
// DATABASE CONNECTION POOL
// ============================================================================

const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

dbPool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

```

#### D. After existing /health endpoint, add:
```typescript

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

// Readiness probe - Is the service ready to accept traffic?
app.get('/health/ready', async (req, res) => {
  try {
    const dbStart = Date.now();
    await dbPool.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;
    
    res.status(200).json({
      status: 'ready',
      checks: {
        database: { healthy: true, latency: dbLatency },
      },
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      checks: { database: { healthy: false, error: error.message } },
      timestamp: new Date().toISOString(),
    });
  }
});

// Startup probe - Has the service finished initialization?
app.get('/health/startup', (req, res) => {
  res.status(appInitialized ? 200 : 503).json({
    status: appInitialized ? 'started' : 'starting',
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
  const poolStats = {
    totalCount: dbPool.totalCount || 0,
    idleCount: dbPool.idleCount || 0,
    waitingCount: dbPool.waitingCount || 0,
  };
  
  const utilization = poolStats.totalCount > 0
    ? ((poolStats.totalCount - poolStats.idleCount) / poolStats.totalCount) * 100
    : 0;
  
  res.setHeader('Content-Type', 'text/plain');
  res.send(`
ehr_service_uptime_seconds ${Math.floor((Date.now() - serviceStartTime) / 1000)}
db_pool_total_connections ${poolStats.totalCount}
db_pool_idle_connections ${poolStats.idleCount}
db_pool_waiting_requests ${poolStats.waitingCount}
db_pool_utilization_percent ${utilization.toFixed(2)}
  `.trim());
});

```

#### E. Replace server.listen() section with:
```typescript

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================

async function initializeService() {
  try {
    console.log('🚀 Initializing service...');
    await dbPool.query('SELECT 1');
    console.log('✅ Database connected');
    appInitialized = true;
    console.log('✅ Service initialization complete');
  } catch (error) {
    console.error('❌ Service initialization failed:', error.message);
    throw error;
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up resources...');
  try {
    await dbPool.end();
    console.log('✅ Database pool closed');
  } catch (error) {
    console.error('⚠️  Cleanup error:', error.message);
  }
}

// Enhanced graceful shutdown
const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    console.log('HTTP server closed');
    await cleanup();
    console.log('Service shut down successfully');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};


process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

(async () => {
  try {
    await initializeService();
    server.listen(3005, () => {
      console.log('✅ ehr-service started on port 3005');
      console.log('✅ Ready: http://localhost:3005/health/ready');
      console.log('✅ Metrics: http://localhost:3005/metrics');
    });
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
})();
```

### Step 3: Test
```bash
cd microservices/ehr-service
npm run dev

# In another terminal:
curl http://localhost:3005/health/ready
curl http://localhost:3005/metrics
```
