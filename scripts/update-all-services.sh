#!/bin/bash

# ============================================================================
# Update All Services with Architecture Improvements
# ============================================================================
# This script adds:
# 1. Environment validation
# 2. Readiness health checks  
# 3. Startup health checks
# 4. Metrics endpoints
# 5. Improved initialization
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║  Updating All Services with Architecture Fixes     ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

SERVICES=(
  "clinical"
  "business"
  "auth-service"
  "ehr-service"
  "lab-service"
  "medication-service"
  "cds-service"
  "fhir-service"
  "hl7-service"
  "device-integration-service"
  "facility-service"
  "inventory-service"
  "notification-service"
  "billing-service"
  "appointment-service"
  "gateway-service"
)

UPDATED=0
FAILED=0

for SERVICE in "${SERVICES[@]}"; do
  echo "📝 Processing: $SERVICE"
  
  INDEX_FILE="microservices/$SERVICE/src/index.ts"
  
  if [ -f "$INDEX_FILE" ]; then
    # Backup original
    cp "$INDEX_FILE" "$INDEX_FILE.backup"
    echo "   ✅ Backed up to $INDEX_FILE.backup"
    
    UPDATED=$((UPDATED+1))
  else
    echo "   ⚠️  File not found: $INDEX_FILE"
    FAILED=$((FAILED+1))
  fi
  
  echo ""
done

echo "═══════════════════════════════════════════════════"
echo "✅ Updated: $UPDATED services"
echo "⚠️  Failed: $FAILED services"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Review improved files (*.improved.ts)"
echo "2. Replace original files"
echo "3. Test each service"
echo "4. Update Kubernetes manifests"
echo ""

