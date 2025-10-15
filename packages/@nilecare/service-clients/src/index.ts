/**
 * @nilecare/service-clients
 * Service-to-service communication clients
 * 
 * Usage:
 *   import { ClinicalServiceClient, FacilityServiceClient } from '@nilecare/service-clients';
 *   
 *   const clinicalClient = new ClinicalServiceClient({
 *     baseUrl: process.env.CLINICAL_SERVICE_URL,
 *     apiKey: process.env.CLINICAL_SERVICE_API_KEY
 *   });
 */

export { BaseServiceClient } from './BaseServiceClient';
export type { ServiceClientConfig, CircuitBreakerConfig } from './BaseServiceClient';

export { ClinicalServiceClient } from './ClinicalServiceClient';
export type { Patient, Encounter, PatientSummary } from './ClinicalServiceClient';

export { FacilityServiceClient } from './FacilityServiceClient';
export type { Facility, Department, Bed } from './FacilityServiceClient';

// Export placeholder types for other clients
export interface BillingServiceClient extends BaseServiceClient {}
export interface PaymentServiceClient extends BaseServiceClient {}
export interface LabServiceClient extends BaseServiceClient {}
export interface MedicationServiceClient extends BaseServiceClient {}
export interface InventoryServiceClient extends BaseServiceClient {}
export interface NotificationServiceClient extends BaseServiceClient {}

/**
 * Service Client Factory
 * Convenient way to create all service clients
 */
export class ServiceClientFactory {
  static createClinicalClient(config: { baseUrl: string; apiKey: string }) {
    return new ClinicalServiceClient(config);
  }

  static createFacilityClient(config: { baseUrl: string; apiKey: string }) {
    return new FacilityServiceClient(config);
  }

  // Add other service clients as needed
}

export default {
  BaseServiceClient,
  ClinicalServiceClient,
  FacilityServiceClient,
  ServiceClientFactory
};

