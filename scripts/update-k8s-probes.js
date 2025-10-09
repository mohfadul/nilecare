/**
 * Update Kubernetes Manifests with Readiness and Startup Probes
 */

const fs = require('fs');
const path = require('path');

const K8S_FILES = [
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

console.log('Updating Kubernetes manifests with new probes...\n');

let updated = 0;
let skipped = 0;

for (const k8sFile of K8S_FILES) {
  const filePath = path.join('infrastructure/kubernetes', k8sFile.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${k8sFile.file}: Not found`);
    skipped++;
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already updated
  if (content.includes('/health/ready') && content.includes('startupProbe')) {
    console.log(`✅ ${k8sFile.file}: Already updated`);
    skipped++;
    continue;
  }
  
  // Backup original
  fs.writeFileSync(`${filePath}.backup`, content);
  
  // Update readinessProbe path
  content = content.replace(
    /(readinessProbe:\s+httpGet:\s+path:\s+)\/health(\s+port:\s+\d+)/g,
    `$1/health/ready$2`
  );
  
  // Add startupProbe if not present
  if (!content.includes('startupProbe')) {
    const startupProbe = `        startupProbe:
          httpGet:
            path: /health/startup
            port: ${k8sFile.port}
          initialDelaySeconds: 0
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 30`;
    
    // Insert after readinessProbe
    content = content.replace(
      /(readinessProbe:[\s\S]*?failureThreshold:\s+\d+)/,
      `$1\n${startupProbe}`
    );
  }
  
  // Write updated content
  fs.writeFileSync(filePath, content);
  
  console.log(`✅ ${k8sFile.file}: Updated`);
  updated++;
}

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Updated: ${updated} manifests`);
console.log(`⚠️  Skipped: ${skipped} manifests`);
console.log(`${'='.repeat(60)}\n`);

if (updated > 0) {
  console.log('Kubernetes manifests updated successfully!');
  console.log('');
  console.log('Verify with:');
  console.log('  kubectl apply -f infrastructure/kubernetes/ --dry-run=client');
  console.log('');
}

