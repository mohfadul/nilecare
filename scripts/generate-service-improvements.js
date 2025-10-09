/**
 * Service Improvement Generator
 * 
 * Automatically generates improved service files with:
 * - Environment validation
 * - Readiness/startup health checks
 * - Metrics endpoints
 * - Proper initialization
 * 
 * Usage: node scripts/generate-service-improvements.js
 */

const fs = require('fs');
const path = require('path');

const SERVICE_CONFIGS = [
  { name: 'clinical', port: 3004, features: ['patients', 'encounters', 'medications', 'diagnostics', 'fhir'] },
  { name: 'business', port: 3002, features: ['appointments', 'billing', 'scheduling', 'staff'] },
  { name: 'data', port: 3003, features: ['analytics', 'reports', 'dashboard', 'insights'] },
  { name: 'auth-service', port: 3001, features: ['jwt', 'oauth2', 'mfa', 'rbac'], requireRedis: true },
  { name: 'ehr-service', port: 3005, features: ['medical-records', 'soap-notes', 'progress-notes'] },
  { name: 'lab-service', port: 3006, features: ['lab-orders', 'results', 'specimen-tracking'] },
  { name: 'medication-service', port: 3007, features: ['prescriptions', 'mar', 'barcode-verification'] },
  { name: 'cds-service', port: 3008, features: ['drug-interactions', 'alerts', 'guidelines'] },
  { name: 'fhir-service', port: 3009, features: ['fhir-resources', 'validation', 'mapping'] },
  { name: 'hl7-service', port: 3010, features: ['hl7-messages', 'mllp-server', 'adt'] },
  { name: 'device-integration-service', port: 3011, features: ['iomt', 'device-monitoring'] },
  { name: 'facility-service', port: 3012, features: ['facility-management', 'bed-status'] },
  { name: 'inventory-service', port: 3013, features: ['stock-management', 'orders'] },
  { name: 'notification-service', port: 3014, features: ['email', 'sms', 'push'] },
  { name: 'billing-service', port: 3015, features: ['invoices', 'claims', 'payments'] },
  { name: 'appointment-service', port: 3016, features: ['scheduling', 'availability'] },
  { name: 'gateway-service', port: 3000, features: ['routing', 'load-balancing'] },
  { name: 'payment-gateway-service', port: 7001, features: ['payments', 'providers', 'reconciliation'], useMySQL: true },
];

function generateHealthCheckCode(serviceName, servicePort, features, options = {}) {
  const featuresList = features.map(f => `      ${f}: true`).join(',\n');
  
  return `
// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

// Liveness probe - Is the service running?
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: '${serviceName}',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    features: {
${featuresList}
    },
  });
});

// Readiness probe - Is the service ready to accept traffic?
app.get('/health/ready', async (req, res) => {
  try {
    const checks: any = {};
    
    // Check database connection
    if (dbPool) {
      const dbStart = Date.now();
      await dbPool.query('SELECT 1');
      checks.database = { healthy: true, latency: Date.now() - dbStart };
    }
    
    ${options.requireRedis ? `
    // Check Redis connection
    if (redis) {
      const redisStart = Date.now();
      await redis.ping();
      checks.redis = { healthy: true, latency: Date.now() - redisStart };
    }
    ` : ''}
    
    res.status(200).json({
      status: 'ready',
      checks,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    });
  } catch (error: any) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
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
  const poolStats = dbPool ? {
    totalCount: dbPool.totalCount || 0,
    idleCount: dbPool.idleCount || 0,
    waitingCount: dbPool.waitingCount || 0,
  } : { totalCount: 0, idleCount: 0, waitingCount: 0 };
  
  const utilization = poolStats.totalCount > 0
    ? ((poolStats.totalCount - poolStats.idleCount) / poolStats.totalCount) * 100
    : 0;
  
  res.setHeader('Content-Type', 'text/plain');
  res.send(\`
# ${serviceName.replace(/-/g, '_')}_metrics
service_uptime_seconds \${Math.floor((Date.now() - serviceStartTime) / 1000)}

# Database Connection Pool
db_pool_total_connections \${poolStats.totalCount}
db_pool_idle_connections \${poolStats.idleCount}
db_pool_waiting_requests \${poolStats.waitingCount}
db_pool_utilization_percent \${utilization.toFixed(2)}
  \`.trim());
});
  `;
}

function generateKubernetesProbes(servicePort) {
  return `
        livenessProbe:
          httpGet:
            path: /health
            port: ${servicePort}
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: ${servicePort}
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /health/startup
            port: ${servicePort}
          initialDelaySeconds: 0
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 30
  `;
}

// ============================================================================
// Generate improvement snippets for all services
// ============================================================================

console.log('🚀 Generating service improvements...\n');

const outputDir = './scripts/generated-improvements';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const config of SERVICE_CONFIGS) {
  // Generate health check code
  const healthCheckCode = generateHealthCheckCode(
    config.name,
    config.port,
    config.features,
    {
      requireRedis: config.requireRedis,
      useMySQL: config.useMySQL,
    }
  );
  
  // Generate K8s probes
  const k8sProbes = generateKubernetesProbes(config.port);
  
  // Write health check code snippet
  fs.writeFileSync(
    `${outputDir}/${config.name}-health-checks.ts.snippet`,
    healthCheckCode
  );
  
  // Write K8s probe snippet
  fs.writeFileSync(
    `${outputDir}/${config.name}-k8s-probes.yaml.snippet`,
    k8sProbes
  );
  
  console.log(`✅ Generated improvements for: ${config.name}`);
}

console.log(`\n✅ Generated improvements for ${SERVICE_CONFIGS.length} services`);
console.log(`📁 Output directory: ${outputDir}`);
console.log('\nTo apply:');
console.log('1. Copy health check code to each service\'s index.ts');
console.log('2. Copy K8s probes to each service\'s .yaml file');
console.log('3. Test each service');
console.log('');

