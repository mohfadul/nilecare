#!/bin/bash

# NileCare Deployment Script
# This script deploys the complete NileCare healthcare platform

set -e

echo "🏥 Starting NileCare Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    print_success "All prerequisites are installed!"
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build clinical service
    print_status "Building clinical service..."
    docker build -t nilecare/clinical-service:latest ./microservices/clinical/
    
    # Build business service
    print_status "Building business service..."
    docker build -t nilecare/business-service:latest ./microservices/business/
    
    # Build data service
    print_status "Building data service..."
    docker build -t nilecare/data-service:latest ./microservices/data/
    
    # Build web dashboard
    print_status "Building web dashboard..."
    docker build -t nilecare/web-dashboard:latest ./clients/web-dashboard/
    
    print_success "All Docker images built successfully!"
}

# Start infrastructure services
start_infrastructure() {
    print_status "Starting infrastructure services..."
    
    # Start Docker Compose services
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for infrastructure services to be ready..."
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Infrastructure services started successfully!"
    else
        print_error "Failed to start infrastructure services"
        exit 1
    fi
}

# Deploy to Kubernetes
deploy_kubernetes() {
    print_status "Deploying to Kubernetes..."
    
    # Create namespace
    kubectl apply -f infrastructure/kubernetes/namespace.yaml
    
    # Apply configurations
    kubectl apply -f infrastructure/kubernetes/configmap.yaml
    kubectl apply -f infrastructure/kubernetes/secrets.yaml
    
    # Deploy database
    kubectl apply -f infrastructure/kubernetes/postgres.yaml
    
    # Deploy services
    kubectl apply -f infrastructure/kubernetes/clinical-service.yaml
    kubectl apply -f infrastructure/kubernetes/kong-gateway.yaml
    
    # Wait for deployments to be ready
    print_status "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/clinical-service -n nilecare
    kubectl wait --for=condition=available --timeout=300s deployment/kong-gateway -n nilecare
    
    print_success "Kubernetes deployment completed successfully!"
}

# Run health checks
health_check() {
    print_status "Running health checks..."
    
    # Check if pods are running
    if kubectl get pods -n nilecare | grep -q "Running"; then
        print_success "All pods are running!"
    else
        print_warning "Some pods may not be running yet"
    fi
    
    # Check API Gateway
    if curl -f http://localhost:8000/health &> /dev/null; then
        print_success "API Gateway is responding!"
    else
        print_warning "API Gateway health check failed"
    fi
    
    # Check Clinical Service
    if curl -f http://localhost:8000/api/v1/patients/health &> /dev/null; then
        print_success "Clinical Service is responding!"
    else
        print_warning "Clinical Service health check failed"
    fi
}

# Show deployment information
show_deployment_info() {
    print_success "🎉 NileCare Platform deployed successfully!"
    
    echo ""
    echo "📋 Deployment Information:"
    echo "=========================="
    echo "🌐 API Gateway: http://localhost:8000"
    echo "📊 Web Dashboard: http://localhost:3000"
    echo "🔐 Keycloak Admin: http://localhost:8080"
    echo "📈 Grafana: http://localhost:3000"
    echo "🔍 Jaeger: http://localhost:16686"
    echo ""
    echo "🔑 Default Credentials:"
    echo "Keycloak Admin: admin / admin123"
    echo "Grafana Admin: admin / admin123"
    echo ""
    echo "📚 API Documentation:"
    echo "Clinical API: http://localhost:8000/api-docs"
    echo "Business API: http://localhost:8000/api-docs"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Access the web dashboard at http://localhost:3000"
    echo "2. Configure your organization settings"
    echo "3. Add staff members and roles"
    echo "4. Import patient data"
    echo ""
    echo "📖 For more information, check the README.md file"
}

# Main deployment function
main() {
    print_status "Starting NileCare Platform Deployment..."
    
    # Parse command line arguments
    SKIP_BUILD=false
    SKIP_INFRASTRUCTURE=false
    SKIP_KUBERNETES=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-infrastructure)
                SKIP_INFRASTRUCTURE=true
                shift
                ;;
            --skip-kubernetes)
                SKIP_KUBERNETES=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-build          Skip building Docker images"
                echo "  --skip-infrastructure Skip starting infrastructure services"
                echo "  --skip-kubernetes     Skip Kubernetes deployment"
                echo "  --help                Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run deployment steps
    check_prerequisites
    
    if [ "$SKIP_BUILD" = false ]; then
        build_images
    fi
    
    if [ "$SKIP_INFRASTRUCTURE" = false ]; then
        start_infrastructure
    fi
    
    if [ "$SKIP_KUBERNETES" = false ]; then
        deploy_kubernetes
    fi
    
    health_check
    show_deployment_info
}

# Run main function
main "$@"
