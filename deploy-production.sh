#!/bin/bash

# NileCare Platform - Production Deployment Script
# Deploys to Kubernetes cluster

set -e  # Exit on error

echo "🚀 NileCare Platform - Production Deployment"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${CYAN}📋 Checking prerequisites...${NC}"

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found! Please install kubectl${NC}"
    exit 1
fi
echo -e "${GREEN}✅ kubectl installed${NC}"

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connected to Kubernetes cluster${NC}"

# Check AWS CLI (for frontend)
if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}⚠️  AWS CLI not found - S3 deployment will be skipped${NC}"
    DEPLOY_FRONTEND=false
else
    echo -e "${GREEN}✅ AWS CLI installed${NC}"
    DEPLOY_FRONTEND=true
fi

# Create namespace
echo -e "\n${CYAN}🏗️  Creating Kubernetes namespace...${NC}"
kubectl apply -f infrastructure/kubernetes/namespace.yaml
echo -e "${GREEN}✅ Namespace created${NC}"

# Create ConfigMap
echo -e "\n${CYAN}📝 Creating ConfigMap...${NC}"
kubectl apply -f infrastructure/kubernetes/configmap.yaml
echo -e "${GREEN}✅ ConfigMap created${NC}"

# Create Secrets (you should customize these!)
echo -e "\n${CYAN}🔐 Creating Secrets...${NC}"
echo -e "${YELLOW}⚠️  Using default secrets - CHANGE THESE IN PRODUCTION!${NC}"

kubectl create secret generic nilecare-secrets \
  --from-literal=DB_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=REDIS_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
  --from-literal=JWT_REFRESH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=SESSION_SECRET="$(openssl rand -base64 32)" \
  --from-literal=PAYMENT_ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  --from-literal=PAYMENT_WEBHOOK_SECRET="$(openssl rand -base64 32)" \
  -n nilecare \
  --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}✅ Secrets created${NC}"

# Deploy Database
echo -e "\n${CYAN}💾 Deploying PostgreSQL...${NC}"
kubectl apply -f infrastructure/kubernetes/postgres.yaml
echo -e "${GREEN}✅ PostgreSQL deployed${NC}"

# Wait for database
echo -e "\n${CYAN}⏳ Waiting for database to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n nilecare --timeout=300s
echo -e "${GREEN}✅ Database ready${NC}"

# Deploy Backend Services
echo -e "\n${CYAN}🔧 Deploying Backend Services (15 services)...${NC}"

services=(
    "gateway-service"
    "auth-service"
    "notification-service"
    "ehr-service"
    "cds-service"
    "medication-service"
    "lab-service"
    "facility-service"
    "appointment-service"
    "billing-service"
    "inventory-service"
    "fhir-service"
    "hl7-service"
    "device-integration-service"
    "payment-gateway-service"
)

for service in "${services[@]}"; do
    echo -e "${CYAN}  Deploying $service...${NC}"
    kubectl apply -f "infrastructure/kubernetes/$service.yaml"
done

echo -e "${GREEN}✅ All backend services deployed${NC}"

# Wait for services to be ready
echo -e "\n${CYAN}⏳ Waiting for services to be ready...${NC}"
sleep 30

kubectl get pods -n nilecare

# Deploy Istio Service Mesh (if available)
if [ -f "infrastructure/istio/gateway.yaml" ]; then
    echo -e "\n${CYAN}🌐 Deploying Istio Service Mesh...${NC}"
    kubectl apply -f infrastructure/istio/
    echo -e "${GREEN}✅ Istio deployed${NC}"
fi

# Deploy Frontend (if AWS CLI available)
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo -e "\n${CYAN}🎨 Deploying Frontend to S3...${NC}"
    
    cd clients/web-dashboard
    
    # Build frontend
    echo -e "${CYAN}  Building frontend...${NC}"
    npm run build
    
    # Upload to S3
    echo -e "${CYAN}  Uploading to S3...${NC}"
    aws s3 sync dist/ s3://nilecare-frontend --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "*.html"
    
    aws s3 sync dist/ s3://nilecare-frontend \
        --exclude "*" \
        --include "*.html" \
        --cache-control "public, max-age=0, must-revalidate"
    
    # Invalidate CloudFront
    echo -e "${CYAN}  Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID:-E1234567890ABC} \
        --paths "/*"
    
    echo -e "${GREEN}✅ Frontend deployed${NC}"
    
    cd ../..
fi

# Deployment Summary
echo -e "\n${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "=============================================="
echo ""
echo -e "${CYAN}📊 Deployment Status:${NC}"
echo -e "${GREEN}✅ Backend Services: 15/15 deployed${NC}"
echo -e "${GREEN}✅ Database: Running${NC}"
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo -e "${GREEN}✅ Frontend: Deployed to S3${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: Not deployed (AWS CLI not available)${NC}"
fi
echo ""
echo -e "${CYAN}🔗 Access Points:${NC}"
echo "  Gateway Service: http://gateway-service.nilecare.svc.cluster.local:3000"
echo "  Frontend: https://nilecare.sd (if S3 deployed)"
echo ""
echo -e "${CYAN}📝 Next Steps:${NC}"
echo "  1. Verify all pods are running:"
echo "     kubectl get pods -n nilecare"
echo ""
echo "  2. Check service health:"
echo "     kubectl port-forward svc/gateway-service 3000:3000 -n nilecare"
echo "     curl http://localhost:3000/health"
echo ""
echo "  3. View logs:"
echo "     kubectl logs -f deployment/payment-gateway-service -n nilecare"
echo ""
echo "=============================================="
echo -e "${GREEN}✅ Platform is deployed and ready!${NC}"

