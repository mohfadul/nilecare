#!/usr/bin/env node
/**
 * Environment Variables Validation Script
 * 
 * Validates that all required environment variables are set
 * for each microservice before deployment.
 * 
 * Usage:
 *   node scripts/validate-env.js <service-name>
 *   node scripts/validate-env.js all
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Environment variable requirements per service
const serviceRequirements = {
  'auth-service': {
    critical: ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET', 'MFA_ENCRYPTION_KEY'],
    production: ['DB_PASSWORD', 'REDIS_URL', 'SERVICE_API_KEYS'],
    optional: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD']
  },
  'clinical-service': {
    critical: ['AUTH_SERVICE_URL', 'AUTH_SERVICE_API_KEY', 'SERVICE_NAME', 'DB_HOST', 'DB_NAME', 'DB_USER'],
    production: ['DB_PASSWORD'],
    optional: ['REDIS_HOST', 'REDIS_PORT']
  },
  'lab-service': {
    critical: ['AUTH_SERVICE_URL', 'AUTH_SERVICE_API_KEY', 'SERVICE_NAME', 'POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER'],
    production: ['POSTGRES_PASSWORD'],
    optional: ['REDIS_HOST']
  },
  'medication-service': {
    critical: ['AUTH_SERVICE_URL', 'AUTH_SERVICE_API_KEY', 'SERVICE_NAME', 'POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER'],
    production: ['POSTGRES_PASSWORD'],
    optional: ['REDIS_HOST']
  },
  'inventory-service': {
    critical: ['AUTH_SERVICE_URL', 'AUTH_SERVICE_API_KEY', 'SERVICE_NAME', 'POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER'],
    production: ['POSTGRES_PASSWORD'],
    optional: ['REDIS_HOST']
  },
  'appointment-service': {
    critical: ['AUTH_SERVICE_URL', 'AUTH_SERVICE_API_KEY', 'SERVICE_NAME', 'DB_HOST', 'DB_NAME', 'DB_USER'],
    production: ['DB_PASSWORD'],
    optional: ['REDIS_HOST']
  },
  'facility-service': {
    critical: ['AUTH_SERVICE_URL', 'AUTH_SERVICE_API_KEY', 'SERVICE_NAME', 'POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER'],
    production: ['POSTGRES_PASSWORD'],
    optional: []
  },
  'billing-service': {
    critical: ['AUTH_SERVICE_URL', 'AUTH_SERVICE_API_KEY', 'SERVICE_NAME', 'DB_HOST', 'DB_NAME', 'DB_USER'],
    production: ['DB_PASSWORD'],
    optional: []
  },
  'payment-gateway': {
    critical: ['AUTH_SERVICE_URL', 'AUTH_SERVICE_API_KEY', 'SERVICE_NAME', 'PAYMENT_ENCRYPTION_KEY', 'PAYMENT_WEBHOOK_SECRET'],
    production: ['DB_PASSWORD'],
    optional: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']
  },
  'notification-service': {
    critical: ['AUTH_SERVICE_URL', 'AUTH_SERVICE_API_KEY', 'SERVICE_NAME', 'REDIS_HOST'],
    production: ['REDIS_PASSWORD'],
    optional: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']
  },
  'main-nilecare': {
    critical: ['AUTH_SERVICE_URL', 'CLINICAL_SERVICE_URL', 'APPOINTMENT_SERVICE_URL', 'LAB_SERVICE_URL'],
    production: ['REDIS_URL'],
    optional: ['CACHE_TTL']
  }
};

/**
 * Load environment variables from .env file
 */
function loadEnv(servicePath) {
  const envPath = path.join(servicePath, '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

/**
 * Validate environment variables for a service
 */
function validateService(serviceName) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${colors.cyan}Validating: ${serviceName}${colors.reset}`);
  console.log(`${'═'.repeat(60)}\n`);

  const requirements = serviceRequirements[serviceName];
  if (!requirements) {
    console.log(`${colors.yellow}⚠️  No validation rules defined for ${serviceName}${colors.reset}`);
    return { valid: true, warnings: 0, errors: 0 };
  }

  const servicePath = path.join(__dirname, '..', 'microservices', serviceName);
  if (!fs.existsSync(servicePath)) {
    console.log(`${colors.red}❌  Service directory not found: ${servicePath}${colors.reset}`);
    return { valid: false, warnings: 0, errors: 1 };
  }

  const env = loadEnv(servicePath);
  const isProduction = env.NODE_ENV === 'production';

  let errors = 0;
  let warnings = 0;

  // Check critical variables
  console.log(`${colors.magenta}Critical Variables:${colors.reset}`);
  requirements.critical.forEach(varName => {
    if (!env[varName]) {
      console.log(`  ${colors.red}❌  ${varName} - MISSING (CRITICAL)${colors.reset}`);
      errors++;
    } else {
      console.log(`  ${colors.green}✅  ${varName}${colors.reset}`);
    }
  });

  // Check production variables
  if (isProduction && requirements.production) {
    console.log(`\n${colors.magenta}Production Variables:${colors.reset}`);
    requirements.production.forEach(varName => {
      if (!env[varName]) {
        console.log(`  ${colors.red}❌  ${varName} - MISSING (REQUIRED IN PRODUCTION)${colors.reset}`);
        errors++;
      } else {
        console.log(`  ${colors.green}✅  ${varName}${colors.reset}`);
      }
    });
  }

  // Check optional variables
  if (requirements.optional && requirements.optional.length > 0) {
    console.log(`\n${colors.magenta}Optional Variables:${colors.reset}`);
    requirements.optional.forEach(varName => {
      if (!env[varName]) {
        console.log(`  ${colors.yellow}⚠️   ${varName} - Not set (optional)${colors.reset}`);
        warnings++;
      } else {
        console.log(`  ${colors.green}✅  ${varName}${colors.reset}`);
      }
    });
  }

  // Summary
  console.log(`\n${colors.cyan}Summary:${colors.reset}`);
  if (errors === 0) {
    console.log(`  ${colors.green}✅  All critical variables configured${colors.reset}`);
  } else {
    console.log(`  ${colors.red}❌  ${errors} critical variable(s) missing${colors.reset}`);
  }

  if (warnings > 0) {
    console.log(`  ${colors.yellow}⚠️   ${warnings} optional variable(s) not configured${colors.reset}`);
  }

  return { valid: errors === 0, warnings, errors };
}

/**
 * Main execution
 */
function main() {
  const serviceName = process.argv[2];

  if (!serviceName) {
    console.log(`${colors.red}Usage: node validate-env.js <service-name>${colors.reset}`);
    console.log(`${colors.yellow}Example: node validate-env.js auth-service${colors.reset}`);
    console.log(`${colors.yellow}Or: node validate-env.js all${colors.reset}`);
    process.exit(1);
  }

  if (serviceName === 'all') {
    console.log(`\n${colors.blue}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}  VALIDATING ALL NILECARE MICROSERVICES${colors.reset}`);
    console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}`);

    let totalErrors = 0;
    let totalWarnings = 0;
    const results = [];

    Object.keys(serviceRequirements).forEach(service => {
      const result = validateService(service);
      totalErrors += result.errors;
      totalWarnings += result.warnings;
      results.push({ service, ...result });
    });

    // Overall summary
    console.log(`\n\n${colors.blue}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}  OVERALL SUMMARY${colors.reset}`);
    console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}\n`);

    results.forEach(r => {
      const status = r.valid ? `${colors.green}✅ VALID${colors.reset}` : `${colors.red}❌ INVALID${colors.reset}`;
      const errMsg = r.errors > 0 ? `${colors.red}${r.errors} errors${colors.reset}` : '';
      const warnMsg = r.warnings > 0 ? `${colors.yellow}${r.warnings} warnings${colors.reset}` : '';
      console.log(`  ${status} ${r.service.padEnd(25)} ${errMsg} ${warnMsg}`);
    });

    console.log(`\n${colors.cyan}Total Services: ${results.length}${colors.reset}`);
    console.log(`${colors.green}Valid: ${results.filter(r => r.valid).length}${colors.reset}`);
    console.log(`${colors.red}Invalid: ${results.filter(r => !r.valid).length}${colors.reset}`);

    if (totalErrors > 0) {
      console.log(`\n${colors.red}❌  Validation FAILED: ${totalErrors} critical errors${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`\n${colors.green}✅  All services have valid configuration${colors.reset}`);
    }

  } else {
    const result = validateService(serviceName);
    process.exit(result.valid ? 0 : 1);
  }
}

// Run the script
main();

