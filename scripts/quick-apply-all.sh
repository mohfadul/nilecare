#!/bin/bash
# Quick Apply Script - Auto-generated

echo "Applying architecture fixes to all services..."


echo "Updating business..."
if [ -f "microservices/business/src/index.ts" ]; then
  cp "microservices/business/src/index.ts" "microservices/business/src/index.ts.backup"
  # Manual edit required - see business-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/business-INSTRUCTIONS.md"
fi


echo "Updating data..."
if [ -f "microservices/data/src/index.ts" ]; then
  cp "microservices/data/src/index.ts" "microservices/data/src/index.ts.backup"
  # Manual edit required - see data-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/data-INSTRUCTIONS.md"
fi


echo "Updating auth-service..."
if [ -f "microservices/auth-service/src/index.ts" ]; then
  cp "microservices/auth-service/src/index.ts" "microservices/auth-service/src/index.ts.backup"
  # Manual edit required - see auth-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/auth-service-INSTRUCTIONS.md"
fi


echo "Updating ehr-service..."
if [ -f "microservices/ehr-service/src/index.ts" ]; then
  cp "microservices/ehr-service/src/index.ts" "microservices/ehr-service/src/index.ts.backup"
  # Manual edit required - see ehr-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/ehr-service-INSTRUCTIONS.md"
fi


echo "Updating lab-service..."
if [ -f "microservices/lab-service/src/index.ts" ]; then
  cp "microservices/lab-service/src/index.ts" "microservices/lab-service/src/index.ts.backup"
  # Manual edit required - see lab-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/lab-service-INSTRUCTIONS.md"
fi


echo "Updating medication-service..."
if [ -f "microservices/medication-service/src/index.ts" ]; then
  cp "microservices/medication-service/src/index.ts" "microservices/medication-service/src/index.ts.backup"
  # Manual edit required - see medication-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/medication-service-INSTRUCTIONS.md"
fi


echo "Updating cds-service..."
if [ -f "microservices/cds-service/src/index.ts" ]; then
  cp "microservices/cds-service/src/index.ts" "microservices/cds-service/src/index.ts.backup"
  # Manual edit required - see cds-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/cds-service-INSTRUCTIONS.md"
fi


echo "Updating fhir-service..."
if [ -f "microservices/fhir-service/src/index.ts" ]; then
  cp "microservices/fhir-service/src/index.ts" "microservices/fhir-service/src/index.ts.backup"
  # Manual edit required - see fhir-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/fhir-service-INSTRUCTIONS.md"
fi


echo "Updating hl7-service..."
if [ -f "microservices/hl7-service/src/index.ts" ]; then
  cp "microservices/hl7-service/src/index.ts" "microservices/hl7-service/src/index.ts.backup"
  # Manual edit required - see hl7-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/hl7-service-INSTRUCTIONS.md"
fi


echo "Updating device-integration-service..."
if [ -f "microservices/device-integration-service/src/index.ts" ]; then
  cp "microservices/device-integration-service/src/index.ts" "microservices/device-integration-service/src/index.ts.backup"
  # Manual edit required - see device-integration-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/device-integration-service-INSTRUCTIONS.md"
fi


echo "Updating facility-service..."
if [ -f "microservices/facility-service/src/index.ts" ]; then
  cp "microservices/facility-service/src/index.ts" "microservices/facility-service/src/index.ts.backup"
  # Manual edit required - see facility-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/facility-service-INSTRUCTIONS.md"
fi


echo "Updating inventory-service..."
if [ -f "microservices/inventory-service/src/index.ts" ]; then
  cp "microservices/inventory-service/src/index.ts" "microservices/inventory-service/src/index.ts.backup"
  # Manual edit required - see inventory-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/inventory-service-INSTRUCTIONS.md"
fi


echo "Updating notification-service..."
if [ -f "microservices/notification-service/src/index.ts" ]; then
  cp "microservices/notification-service/src/index.ts" "microservices/notification-service/src/index.ts.backup"
  # Manual edit required - see notification-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/notification-service-INSTRUCTIONS.md"
fi


echo "Updating billing-service..."
if [ -f "microservices/billing-service/src/index.ts" ]; then
  cp "microservices/billing-service/src/index.ts" "microservices/billing-service/src/index.ts.backup"
  # Manual edit required - see billing-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/billing-service-INSTRUCTIONS.md"
fi


echo "Updating appointment-service..."
if [ -f "microservices/appointment-service/src/index.ts" ]; then
  cp "microservices/appointment-service/src/index.ts" "microservices/appointment-service/src/index.ts.backup"
  # Manual edit required - see appointment-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/appointment-service-INSTRUCTIONS.md"
fi


echo "Updating gateway-service..."
if [ -f "microservices/gateway-service/src/index.ts" ]; then
  cp "microservices/gateway-service/src/index.ts" "microservices/gateway-service/src/index.ts.backup"
  # Manual edit required - see gateway-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/gateway-service-INSTRUCTIONS.md"
fi


echo "Updating payment-gateway-service..."
if [ -f "microservices/payment-gateway-service/src/index.ts" ]; then
  cp "microservices/payment-gateway-service/src/index.ts" "microservices/payment-gateway-service/src/index.ts.backup"
  # Manual edit required - see payment-gateway-service-INSTRUCTIONS.md
  echo "  ✅ Backup created"
  echo "  📝 Follow: microservices-improved/payment-gateway-service-INSTRUCTIONS.md"
fi


echo "Done! Follow the instructions in microservices-improved/ for each service"
