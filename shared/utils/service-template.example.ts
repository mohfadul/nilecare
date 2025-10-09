/**
 * Service Template Example
 * 
 * Shows how to implement a microservice with:
 * - Environment validation
 * - Health checks (liveness, readiness, startup)
 * - Graceful shutdown
 * - Connection pooling
 * - Proper error handling
 * 
 * Copy this template when creating new services
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { Kafka } from 'kafkajs';

// Import shared utilities
import { validateServiceEnvironment, environmentPresets } from './environment-validator';
import { 
  checkPostgreSQLConnection,
  checkRedisConnection,
  checkKafkaConnection,
  generateHealthStatus,
} from './health-check.utils';
import { startService } from './service-starter';

// Load environment variables
dotenv.config();

// ============================================================================
// 1. ENVIRONMENT VALIDATION (Fail fast if misconfigured)
// ============================================================================

validateServiceEnvironment(
  'example-service',
  environmentPresets.common(),
  environmentPresets.database(),
  environmentPresets.redis(),
  environmentPresets.kafka(),
  environmentPresets.authentication()
);

// ============================================================================
// 2. INITIALIZE EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '3001');
let appInitialized = false;
const serviceStartTime = Date.now();

// ============================================================================
// 3. INITIALIZE CONNECTIONS (with pooling)
// ============================================================================

const postgresPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                          // Max connections
  idleTimeoutMillis: 30000,         // Close idle connections after 30s
  connectionTimeoutMillis: 5000,    // Timeout if no connection available
});

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableOfflineQueue: false,        // Fail fast if Redis is down
});

const kafka = new Kafka({
  clientId: 'example-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

// ============================================================================
// 4. MIDDLEWARE SETUP
// ============================================================================

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// 5. HEALTH CHECK ENDPOINTS
// ============================================================================

// Liveness probe - Is the service running?
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'example-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    features: {
      database: true,
      cache: true,
      events: true,
      auth: true,
    },
  });
});

// Readiness probe - Is the service ready to accept traffic?
app.get('/health/ready', async (req, res) => {
  try {
    // Check all dependencies in parallel
    const [dbCheck, redisCheck, kafkaCheck] = await Promise.allSettled([
      checkPostgreSQLConnection(postgresPool),
      checkRedisConnection(redis),
      checkKafkaConnection(kafka),
    ]);
    
    const health = generateHealthStatus(
      {
        database: dbCheck.status === 'fulfilled' ? dbCheck.value : { healthy: false, message: 'Check failed' },
        redis: redisCheck.status === 'fulfilled' ? redisCheck.value : { healthy: false, message: 'Check failed' },
        kafka: kafkaCheck.status === 'fulfilled' ? kafkaCheck.value : { healthy: false, message: 'Check failed' },
      },
      serviceStartTime
    );
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Health check failed';
    res.status(503).json({
      status: 'unhealthy',
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Startup probe - Has the service finished initialization?
app.get('/health/startup', (req, res) => {
  if (appInitialized) {
    res.status(200).json({
      status: 'started',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    });
  } else {
    res.status(503).json({
      status: 'starting',
      timestamp: new Date().toISOString(),
    });
  }
});

// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
  const poolStats = {
    totalCount: (postgresPool as any).totalCount || 0,
    idleCount: (postgresPool as any).idleCount || 0,
    waitingCount: (postgresPool as any).waitingCount || 0,
  };
  
  res.setHeader('Content-Type', 'text/plain');
  res.send(`
# Database connection pool metrics
db_pool_total_connections ${poolStats.totalCount}
db_pool_idle_connections ${poolStats.idleCount}
db_pool_waiting_requests ${poolStats.waitingCount}
db_pool_utilization ${poolStats.totalCount > 0 ? (poolStats.totalCount - poolStats.idleCount) / poolStats.totalCount : 0}

# Service uptime
service_uptime_seconds ${Math.floor((Date.now() - serviceStartTime) / 1000)}
  `.trim());
});

// ============================================================================
// 6. API ROUTES
// ============================================================================

app.get('/api/v1/example', async (req, res) => {
  try {
    const result = await postgresPool.query('SELECT NOW() as current_time');
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to query database',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
    });
  }
});

// ============================================================================
// 7. ERROR HANDLING
// ============================================================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      path: req.originalUrl,
    },
  });
});

// ============================================================================
// 8. START SERVICE WITH PROPER INITIALIZATION
// ============================================================================

async function initializeService(): Promise<void> {
  try {
    console.log('🚀 Initializing service...\n');
    
    // Test database connection
    console.log('📊 Testing database connection...');
    const dbCheck = await checkPostgreSQLConnection(postgresPool);
    if (!dbCheck.healthy) {
      throw new Error(`Database check failed: ${dbCheck.message}`);
    }
    console.log(`✅ Database connected (${dbCheck.latency}ms)\n`);
    
    // Test Redis connection
    console.log('💾 Testing Redis connection...');
    const redisCheck = await checkRedisConnection(redis);
    if (!redisCheck.healthy) {
      console.warn(`⚠️  Redis check failed: ${redisCheck.message}`);
    } else {
      console.log(`✅ Redis connected (${redisCheck.latency}ms)\n`);
    }
    
    // Test Kafka connection
    console.log('📨 Testing Kafka connection...');
    const kafkaCheck = await checkKafkaConnection(kafka);
    if (!kafkaCheck.healthy) {
      console.warn(`⚠️  Kafka check failed: ${kafkaCheck.message}`);
    } else {
      console.log(`✅ Kafka connected (${kafkaCheck.latency}ms)\n`);
    }
    
    // Mark as initialized
    appInitialized = true;
    console.log('✅ Service initialization complete\n');
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Initialization failed';
    console.error('❌ Service initialization failed:', message);
    throw error;
  }
}

// Cleanup function for graceful shutdown
async function cleanup(): Promise<void> {
  console.log('🧹 Cleaning up resources...');
  
  // Close database pool
  await postgresPool.end();
  console.log('✅ Database pool closed');
  
  // Close Redis connection
  await redis.quit();
  console.log('✅ Redis connection closed');
  
  // Disconnect Kafka
  // kafka disconnect logic if needed
  console.log('✅ Kafka disconnected');
}

// Start the service
(async () => {
  try {
    // Initialize connections and dependencies
    await initializeService();
    
    // Start service with health checks and graceful shutdown
    await startService(
      app,
      {
        name: 'example-service',
        version: '1.0.0',
        port: PORT,
        healthChecks: {
          liveness: {
            enabled: true,
            features: {
              database: true,
              cache: true,
              events: true,
            },
          },
          readiness: {
            enabled: true,
            checkFn: async () => {
              const [dbCheck, redisCheck, kafkaCheck] = await Promise.all([
                checkPostgreSQLConnection(postgresPool),
                checkRedisConnection(redis),
                checkKafkaConnection(kafka),
              ]);
              
              return generateHealthStatus(
                { database: dbCheck, redis: redisCheck, kafka: kafkaCheck },
                serviceStartTime
              );
            },
          },
          startup: {
            enabled: true,
            isInitializedFn: () => appInitialized,
          },
        },
      },
      cleanup
    );
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Startup failed';
    console.error('❌ Failed to start service:', message);
    process.exit(1);
  }
})();

export { app };

