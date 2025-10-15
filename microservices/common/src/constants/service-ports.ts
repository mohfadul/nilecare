/**
 * Service port configuration
 * Centralized port management for all microservices
 */

export const SERVICE_PORTS = {
  // Main orchestrator
  MAIN_ORCHESTRATOR: 7000,
  
  // Core services
  BUSINESS_SERVICE: 7010,
  AUTH_SERVICE: 7020,
  PAYMENT_SERVICE: 7030,
  
  // Domain services
  APPOINTMENT_SERVICE: 7040,
  BILLING_SERVICE: 7050,
  LAB_SERVICE: 7060,
  PHARMACY_SERVICE: 7070,
  INSURANCE_SERVICE: 7080,
  
  // Integration services
  EHR_SERVICE: 7090,
  FHIR_SERVICE: 7100,
  HL7_SERVICE: 7110,
  DEVICE_INTEGRATION: 7120,
  
  // Support services
  NOTIFICATION_SERVICE: 7130,
  AUDIT_SERVICE: 7140,
  ANALYTICS_SERVICE: 7150,
  
  // Infrastructure
  API_GATEWAY: 8080,
  SERVICE_REGISTRY: 8761,
  
  // Frontend
  WEB_DASHBOARD: 5173,
  ADMIN_PORTAL: 5174,
} as const;

export const SERVICE_URLS = {
  MAIN_ORCHESTRATOR: `http://localhost:${SERVICE_PORTS.MAIN_ORCHESTRATOR}`,
  BUSINESS_SERVICE: `http://localhost:${SERVICE_PORTS.BUSINESS_SERVICE}`,
  AUTH_SERVICE: `http://localhost:${SERVICE_PORTS.AUTH_SERVICE}`,
  PAYMENT_SERVICE: `http://localhost:${SERVICE_PORTS.PAYMENT_SERVICE}`,
  APPOINTMENT_SERVICE: `http://localhost:${SERVICE_PORTS.APPOINTMENT_SERVICE}`,
  BILLING_SERVICE: `http://localhost:${SERVICE_PORTS.BILLING_SERVICE}`,
  LAB_SERVICE: `http://localhost:${SERVICE_PORTS.LAB_SERVICE}`,
  PHARMACY_SERVICE: `http://localhost:${SERVICE_PORTS.PHARMACY_SERVICE}`,
  INSURANCE_SERVICE: `http://localhost:${SERVICE_PORTS.INSURANCE_SERVICE}`,
} as const;

export type ServiceName = keyof typeof SERVICE_PORTS;

