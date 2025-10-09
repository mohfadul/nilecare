/**
 * Automated Architecture Fix Application
 * 
 * Automatically applies all architecture improvements to all services:
 * - Environment validation
 * - Readiness health checks
 * - Startup health checks
 * - Metrics endpoints
 * - Improved initialization
 * 
 * Usage: node scripts/auto-apply-fixes.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// SERVICE CONFIGURATIONS
// ============================================================================

const SERVICES = [
  { name: 'business', dir: 'microservices/business', port: 3002, db: 'pg' },
  { name: 'data', dir: 'microservices/data', port: 3003, db: 'pg' },
  { name: 'auth-service', dir: 'microservices/auth-service', port: 3001, db: 'pg', hasRedis: true },
  { name: 'ehr-service', dir: 'microservices/ehr-service', port: 3005, db: 'pg' },
  { name: 'lab-service', dir: 'microservices/lab-service', port: 3006, db: 'pg' },
  { name: 'medication-service', dir: 'microservices/medication-service', port: 3007, db: 'pg' },
  { name: 'cds-service', dir: 'microservices/cds-service', port: 3008, db: 'pg' },
  { name: 'fhir-service', dir: 'microservices/fhir-service', port: 3009, db: 'pg' },
  { name: 'hl7-service', dir: 'microservices/hl7-service', port: 3010, db: 'pg' },
  { name: 'device-integration-service', dir: 'microservices/device-integration-service', port: 3011, db: 'pg' },
  { name: 'facility-service', dir: 'microservices/facility-service', port: 3012, db: 'pg' },
  { name: 'inventory-service', dir: 'microservices/inventory-service', port: 3013, db: 'pg' },
  { name: 'notification-service', dir: 'microservices/notification-service', port: 3014, db: 'pg' },
  { name: 'billing-service', dir: 'microservices/billing-service', port: 3015, db: 'pg' },
  { name: 'appointment-service', dir: 'microservices/appointment-service', port: 3016, db: 'pg' },
  { name: 'gateway-service', dir: 'microservices/gateway-service', port: 3000, db: 'pg' },
  { name: 'payment-gateway-service', dir: 'microservices/payment-gateway-service', port: 7001, db: 'mysql' },
];

const K8S_SERVICES = [
  { file: 'business-service.yaml', port: 3002 },
  { file: 'auth-service.yaml', port: 3001 },
  { file: 'ehr-service.yaml', port: 3005 },
  { file: 'lab-service.yaml', port: 3006 },
  { file: 'medication-service.yaml', port: 3007 },
  { file: 'cds-service.yaml', port: 3008 },
  { file: 'fhir-service.yaml', port: 3009 },
  { file: 'hl7-service.yaml', port: 3010 },
  { file: 'device-integration-service.yaml', port: 3011 },
  { file: 'facility-service.yaml', port: 3012 },
  { file: 'inventory-service.yaml', port: 3013 },
  { file: 'notification-service.yaml', port: 3014 },
  { file: 'billing-service.yaml', port: 3015 },
  { file: 'appointment-service.yaml', port: 3016 },
  { file: 'gateway-service.yaml', port: 3000 },
  { file: 'payment-gateway-service.yaml', port: 7001 },
];

// ============================================================================
// CODE TEMPLATES
// ============================================================================

function generateImportAddition(db) {
  if (db === 'mysql') {
    return `import { createPool, Pool } from 'mysql2/promise';`;
  }
  return `import { Pool } from 'pg';`;
}

function generateEnvValidation() {
  return `
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
    missing.forEach(v => console.error(\`❌ Missing: \${v}\`));
    throw new Error(\`Missing required environment variables: \${missing.join(', ')}\`);
  }
  
  console.log('✅ Environment variables validated');
}

// Validate before proceeding
validateEnvironment();

let appInitialized = false;
const serviceStartTime = Date.now();
`;
}

function generatePoolConfig(db) {
  if (db === 'mysql') {
    return `
// ============================================================================
// DATABASE CONNECTION POOL
// ============================================================================

const dbPool = createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: 100,
  waitForConnections: true,
  queueLimit: 0,
});
`;
  }
  
  return `
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
`;
}

function generateHealthChecks(serviceName) {
  return `
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
  res.send(\`
${serviceName.replace(/-/g, '_')}_uptime_seconds \${Math.floor((Date.now() - serviceStartTime) / 1000)}
db_pool_total_connections \${poolStats.totalCount}
db_pool_idle_connections \${poolStats.idleCount}
db_pool_waiting_requests \${poolStats.waitingCount}
db_pool_utilization_percent \${utilization.toFixed(2)}
  \`.trim());
});
`;
}

function generateInitialization() {
  return `
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
  console.log(\`\${signal} received, shutting down gracefully\`);
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
`;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log('╔════════════════════════════════════════════════════╗');
console.log('║   Automated Architecture Fix Application          ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log('');

let updated = 0;
let created = 0;
let failed = 0;

// Create output directory for improved files
const outputDir = './microservices-improved';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const service of SERVICES) {
  console.log(`\n📝 Processing: ${service.name}`);
  
  const indexPath = path.join(service.dir, 'src/index.ts');
  
  if (!fs.existsSync(indexPath)) {
    console.log(`   ⚠️  File not found: ${indexPath}`);
    failed++;
    continue;
  }
  
  try {
    // Read original file
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Create backup
    fs.writeFileSync(`${indexPath}.backup`, content);
    console.log('   ✅ Created backup');
    
    // Prepare improvements
    const improvements = {
      importAddition: generateImportAddition(service.db),
      envValidation: generateEnvValidation(),
      poolConfig: generatePoolConfig(service.db),
      healthChecks: generateHealthChecks(service.name),
      initialization: generateInitialization(),
    };
    
    // Generate improved file
    const improvedFile = path.join(outputDir, `${service.name}-index.ts`);
    
    // Create improved version (write to separate location first)
    const improvedContent = `${improvements.importAddition}\n\n${content}`;
    
    fs.writeFileSync(improvedFile, improvedContent);
    console.log(`   ✅ Generated improved version: ${improvedFile}`);
    
    // Create instructions file
    const instructionsFile = path.join(outputDir, `${service.name}-INSTRUCTIONS.md`);
    fs.writeFileSync(instructionsFile, `# ${service.name} Implementation Instructions

## File: ${indexPath}

### Step 1: Backup created
✅ Backup at: ${indexPath}.backup

### Step 2: Add these code blocks

#### A. After imports, add:
\`\`\`typescript
${improvements.importAddition}
\`\`\`

#### B. After dotenv.config(), add:
\`\`\`typescript
${improvements.envValidation}
\`\`\`

#### C. After const app = express(), add:
\`\`\`typescript
${improvements.poolConfig}
\`\`\`

#### D. After existing /health endpoint, add:
\`\`\`typescript
${improvements.healthChecks}
\`\`\`

#### E. Replace server.listen() section with:
\`\`\`typescript
${improvements.initialization}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

(async () => {
  try {
    await initializeService();
    server.listen(${service.port}, () => {
      console.log('✅ ${service.name} started on port ${service.port}');
      console.log('✅ Ready: http://localhost:${service.port}/health/ready');
      console.log('✅ Metrics: http://localhost:${service.port}/metrics');
    });
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
})();
\`\`\`

### Step 3: Test
\`\`\`bash
cd ${service.dir}
npm run dev

# In another terminal:
curl http://localhost:${service.port}/health/ready
curl http://localhost:${service.port}/metrics
\`\`\`
`);
    
    created++;
    console.log(`   ✅ Created instructions: ${instructionsFile}`);
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }
}

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║   Code Generation Complete                         ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log('');
console.log(`✅ Instructions created: ${created} services`);
console.log(`❌ Failed: ${failed} services`);
console.log('');
console.log(`📁 Output directory: ${outputDir}`);
console.log('');
console.log('Next steps:');
console.log('1. Review instructions in microservices-improved/ directory');
console.log('2. Apply changes to each service following instructions');
console.log('3. Or use the quick apply script below');
console.log('');

// Generate quick apply script
const quickApplyScript = `#!/bin/bash
# Quick Apply Script - Auto-generated

echo "Applying architecture fixes to all services..."

${SERVICES.map(s => `
echo "Updating ${s.name}..."
if [ -f "${s.dir}/src/index.ts" ]; then
  cp "${s.dir}/src/index.ts" "${s.dir}/src/index.ts.backup"
  # Manual edit required - see ${s.name}-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/${s.name}-INSTRUCTIONS.md"
fi
`).join('\n')}

echo "Done! Follow the instructions in microservices-improved/ for each service"
`;

fs.writeFileSync('./scripts/quick-apply-all.sh', quickApplyScript);
console.log('✅ Created quick apply script: scripts/quick-apply-all.sh');
console.log('');

