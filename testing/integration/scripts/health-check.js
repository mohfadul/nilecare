/**
 * Health Check Script
 * Verifies that all services are running before running tests
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.test' });

const services = [
  { name: 'API Gateway', url: process.env.API_GATEWAY_URL || 'http://localhost:3000' },
  { name: 'Auth Service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001' },
  { name: 'Clinical Service', url: process.env.CLINICAL_SERVICE_URL || 'http://localhost:3002' },
  { name: 'Business Service', url: process.env.BUSINESS_SERVICE_URL || 'http://localhost:3003' },
  { name: 'Data Service', url: process.env.DATA_SERVICE_URL || 'http://localhost:3004' },
];

async function checkService(service) {
  try {
    const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
    return {
      name: service.name,
      status: response.status === 200 ? '✅ UP' : '⚠️  DEGRADED',
      url: service.url,
    };
  } catch (error) {
    return {
      name: service.name,
      status: '❌ DOWN',
      url: service.url,
      error: error.message,
    };
  }
}

async function runHealthCheck() {
  console.log('🏥 Running NileCare Health Check...\n');
  
  const results = await Promise.all(services.map(checkService));
  
  let allHealthy = true;
  results.forEach(result => {
    console.log(`${result.status} ${result.name} (${result.url})`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.status.includes('DOWN')) {
      allHealthy = false;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (allHealthy) {
    console.log('✅ All services are healthy! Ready to run tests.');
    process.exit(0);
  } else {
    console.log('❌ Some services are not healthy. Please start all services before running tests.');
    console.log('\nQuick start commands:');
    console.log('  - Backend: npm run dev (in project root)');
    console.log('  - Frontend: npm run dev (in clients/web-dashboard)');
    console.log('  - Database: docker-compose up -d');
    process.exit(1);
  }
}

runHealthCheck();

