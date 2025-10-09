/**
 * Create improved templates for all remaining services
 * Based on Clinical Service pattern
 */

const fs = require('fs');
const path = require('path');

const SERVICES_TO_UPDATE = [
  { name: 'data', path: 'microservices/data/src/index.ts', serviceName: 'data-service', port: 3003 },
  { name: 'auth-service', path: 'microservices/auth-service/src/index.ts', serviceName: 'auth-service', port: 3001 },
  { name: 'ehr-service', path: 'microservices/ehr-service/src/index.ts', serviceName: 'ehr-service', port: 3005 },
  { name: 'lab-service', path: 'microservices/lab-service/src/index.ts', serviceName: 'lab-service', port: 3006 },
  { name: 'medication-service', path: 'microservices/medication-service/src/index.ts', serviceName: 'medication-service', port: 3007 },
  { name: 'cds-service', path: 'microservices/cds-service/src/index.ts', serviceName: 'cds-service', port: 3008 },
  { name: 'fhir-service', path: 'microservices/fhir-service/src/index.ts', serviceName: 'fhir-service', port: 3009 },
  { name: 'hl7-service', path: 'microservices/hl7-service/src/index.ts', serviceName: 'hl7-service', port: 3010 },
  { name: 'device-integration-service', path: 'microservices/device-integration-service/src/index.ts', serviceName: 'device-integration-service', port: 3011 },
  { name: 'facility-service', path: 'microservices/facility-service/src/index.ts', serviceName: 'facility-service', port: 3012 },
  { name: 'inventory-service', path: 'microservices/inventory-service/src/index.ts', serviceName: 'inventory-service', port: 3013 },
  { name: 'notification-service', path: 'microservices/notification-service/src/index.ts', serviceName: 'notification-service', port: 3014 },
  { name: 'billing-service', path: 'microservices/billing-service/src/index.ts', serviceName: 'billing-service', port: 3015 },
  { name: 'appointment-service', path: 'microservices/appointment-service/src/index.ts', serviceName: 'appointment-service', port: 3016 },
  { name: 'gateway-service', path: 'microservices/gateway-service/src/index.ts', serviceName: 'gateway-service', port: 3000 },
  { name: 'payment-gateway-service', path: 'microservices/payment-gateway-service/src/index.ts', serviceName: 'payment-gateway-service', port: 7001, db: 'mysql' },
];

console.log('Creating improved templates for all services...\n');

let created = 0;
let skipped = 0;

for (const service of SERVICES_TO_UPDATE) {
  const filePath = service.path;
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${service.name}: File not found`);
    skipped++;
    continue;
  }
  
  // Read original file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already has improvements
  if (content.includes('/health/ready') && content.includes('/health/startup')) {
    console.log(`✅ ${service.name}: Already has improvements`);
    skipped++;
    continue;
  }
  
  // Create improved version by inserting code at key points
  let improved = content;
  
  // 1. Add Pool import if not present
  if (service.db === 'mysql') {
    if (!improved.includes('createPool')) {
      improved = improved.replace(
        /import .*dotenv.*\n/,
        `$&import { createPool, Pool as MySQLPool } from 'mysql2/promise';\n`
      );
    }
  } else {
    if (!improved.includes('Pool')) {
      improved = improved.replace(
        /import .*dotenv.*\n/,
        `$&import { Pool } from 'pg';\n`
      );
    }
  }
  
  // 2. Add environment validation after dotenv.config()
  if (!improved.includes('validateEnvironment')) {
    const envValidation = `
// Environment validation
const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
function validateEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(\`Missing env vars: \${missing.join(', ')}\`);
  }
}
validateEnvironment();

let appInitialized = false;
const serviceStartTime = Date.now();
`;
    
    improved = improved.replace(
      /dotenv\.config\(\);/,
      `dotenv.config();\n${envValidation}`
    );
  }
  
  // 3. Add health checks after existing /health endpoint
  if (!improved.includes('/health/ready')) {
    const healthChecks = `

// Readiness probe
app.get('/health/ready', async (req, res) => {
  try {
    // Check database if available
    if (typeof dbPool !== 'undefined' && dbPool) {
      await dbPool.query('SELECT 1');
    }
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: error.message });
  }
});

// Startup probe
app.get('/health/startup', (req, res) => {
  res.status(appInitialized ? 200 : 503).json({
    status: appInitialized ? 'started' : 'starting',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const uptime = Math.floor((Date.now() - serviceStartTime) / 1000);
  res.setHeader('Content-Type', 'text/plain');
  res.send(\`service_uptime_seconds \${uptime}\`);
});
`;
    
    improved = improved.replace(
      /(app\.get\('\/health',.*?\}\);)/s,
      `$1${healthChecks}`
    );
  }
  
  // Write improved version
  const improvedPath = filePath.replace('.ts', '.improved.ts');
  fs.writeFileSync(improvedPath, improved);
  
  console.log(`✅ ${service.name}: Created improved template`);
  created++;
}

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Created improved templates: ${created}`);
console.log(`⚠️  Skipped: ${skipped}`);
console.log(`${'='.repeat(60)}\n`);

if (created > 0) {
  console.log('Templates created as *.improved.ts files');
  console.log('To apply: Run scripts/apply-all-templates.ps1');
}

