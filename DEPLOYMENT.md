# NileCare Platform Deployment Guide

This guide provides step-by-step instructions for deploying the NileCare healthcare platform.

## Prerequisites

Before deploying the platform, ensure you have the following tools installed:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Kubernetes** (version 1.20 or higher)
- **kubectl** (configured to connect to your cluster)
- **Node.js** (version 18 or higher)
- **npm** (version 9 or higher)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/nilecare.git
cd nilecare
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install microservices dependencies
npm run install:all
```

### 3. Configure Environment

Copy the environment template and configure your settings:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Deploy the Platform

#### Option A: Full Deployment (Recommended)

```bash
# Run the deployment script
./scripts/deploy.sh
```

#### Option B: Step-by-Step Deployment

```bash
# 1. Start infrastructure services
docker-compose up -d

# 2. Build microservices
npm run build:all

# 3. Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/

# 4. Verify deployment
kubectl get pods -n nilecare
```

## Architecture Overview

The NileCare platform consists of the following components:

### Client Layer
- **Web Dashboard**: Role-based React application
- **Mobile App**: Patient and staff mobile interface
- **Medical Device Integration**: HL7/FHIR/DICOM support

### API Gateway Layer
- **Kong Gateway**: Authentication, rate limiting, routing
- **Load Balancing**: Automatic request distribution
- **API Versioning**: Backward compatibility support

### Microservices Layer
- **Clinical Domain**: Patient management, EHR, encounters
- **Business Domain**: Appointments, billing, scheduling
- **Data Domain**: Analytics, reporting, insights

### Infrastructure Layer
- **Kubernetes**: Container orchestration
- **Istio**: Service mesh
- **Monitoring**: Prometheus, Grafana, Jaeger

## Service Endpoints

After deployment, the following services will be available:

| Service | URL | Description |
|---------|-----|-------------|
| API Gateway | http://localhost:8000 | Main API endpoint |
| Web Dashboard | http://localhost:3000 | User interface |
| Keycloak | http://localhost:8080 | Authentication service |
| Grafana | http://localhost:3000 | Monitoring dashboard |
| Jaeger | http://localhost:16686 | Distributed tracing |
| Prometheus | http://localhost:9090 | Metrics collection |

## Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| Keycloak Admin | admin | admin123 |
| Grafana Admin | admin | admin123 |
| Database | nilecare | nilecare123 |

**⚠️ Important**: Change default passwords in production!

## Configuration

### Environment Variables

Key environment variables that can be configured:

```bash
# Database Configuration
DB_HOST=postgres-service
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare
DB_PASSWORD=nilecare123

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# Service URLs
CLINICAL_SERVICE_URL=http://clinical-service:3001
BUSINESS_SERVICE_URL=http://business-service:3002
DATA_SERVICE_URL=http://data-service:3003
```

### Kubernetes Configuration

The platform uses Kubernetes ConfigMaps and Secrets for configuration:

```bash
# View configuration
kubectl get configmap nilecare-config -n nilecare -o yaml

# Update configuration
kubectl edit configmap nilecare-config -n nilecare
```

## Monitoring and Observability

### Health Checks

Check the health of services:

```bash
# API Gateway health
curl http://localhost:8000/health

# Clinical Service health
curl http://localhost:8000/api/v1/patients/health

# Kubernetes pod status
kubectl get pods -n nilecare
```

### Metrics and Logs

Access monitoring dashboards:

- **Grafana**: http://localhost:3000 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686

### Log Aggregation

View logs from services:

```bash
# Kubernetes logs
kubectl logs -f deployment/clinical-service -n nilecare

# Docker Compose logs
docker-compose logs -f clinical-service
```

## Scaling

### Horizontal Pod Autoscaling

The platform includes HPA configurations for automatic scaling:

```bash
# View HPA status
kubectl get hpa -n nilecare

# Scale manually
kubectl scale deployment clinical-service --replicas=5 -n nilecare
```

### Load Testing

Test the platform under load:

```bash
# Install k6 for load testing
npm install -g k6

# Run load tests
k6 run tests/load/clinical-api.js
```

## Security

### TLS/SSL Configuration

For production deployment, configure TLS certificates:

```bash
# Create TLS secret
kubectl create secret tls nilecare-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  -n nilecare
```

### Network Policies

Apply network policies for security:

```bash
kubectl apply -f infrastructure/kubernetes/network-policies.yaml
```

### RBAC Configuration

Configure role-based access control:

```bash
kubectl apply -f infrastructure/kubernetes/rbac.yaml
```

## Backup and Recovery

### Database Backup

```bash
# Backup PostgreSQL database
kubectl exec -it deployment/postgres -n nilecare -- \
  pg_dump -U nilecare nilecare > backup.sql

# Restore from backup
kubectl exec -i deployment/postgres -n nilecare -- \
  psql -U nilecare nilecare < backup.sql
```

### Configuration Backup

```bash
# Backup configurations
kubectl get configmap -n nilecare -o yaml > config-backup.yaml
kubectl get secret -n nilecare -o yaml > secret-backup.yaml
```

## Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n nilecare
   kubectl logs <pod-name> -n nilecare
   ```

2. **Service connectivity issues**
   ```bash
   kubectl get services -n nilecare
   kubectl get endpoints -n nilecare
   ```

3. **Database connection problems**
   ```bash
   kubectl exec -it deployment/postgres -n nilecare -- psql -U nilecare -d nilecare
   ```

### Performance Issues

1. **High CPU usage**
   - Check HPA configuration
   - Review resource limits
   - Analyze application metrics

2. **Memory issues**
   - Monitor memory usage in Grafana
   - Check for memory leaks
   - Adjust resource requests/limits

## Production Considerations

### High Availability

- Deploy across multiple availability zones
- Use persistent volumes with replication
- Configure database clustering

### Security

- Enable TLS everywhere
- Use strong passwords and secrets
- Regular security updates
- Network segmentation

### Monitoring

- Set up alerting rules
- Monitor business metrics
- Regular backup verification
- Performance baseline establishment

## Support

For issues and questions:

- **Documentation**: Check the README.md and API documentation
- **Issues**: Create GitHub issues for bugs and feature requests
- **Community**: Join our Discord server for community support
- **Enterprise**: Contact enterprise support for production deployments

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
