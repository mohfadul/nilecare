/**
 * Service Clients Manager
 * 
 * Centralized initialization and management of all service clients
 * Used by main-nilecare orchestrator to communicate with microservices
 */

import {
  ClinicalServiceClient,
  AuthServiceClient,
  LabServiceClient,
  MedicationServiceClient,
  InventoryServiceClient,
  AppointmentServiceClient,
} from '@nilecare/service-clients';

import { createLogger } from '@nilecare/logger';

const logger = createLogger('service-clients');

export class ServiceClientsManager {
  public clinical: ClinicalServiceClient;
  public auth: AuthServiceClient;
  public lab: LabServiceClient;
  public medication: MedicationServiceClient;
  public inventory: InventoryServiceClient;
  public appointment: AppointmentServiceClient;

  constructor() {
    // Initialize all service clients with their URLs
    this.clinical = new ClinicalServiceClient(
      process.env.CLINICAL_SERVICE_URL || 'http://localhost:7001'
    );

    this.auth = new AuthServiceClient(
      process.env.AUTH_SERVICE_URL || 'http://localhost:7020'
    );

    this.lab = new LabServiceClient(
      process.env.LAB_SERVICE_URL || 'http://localhost:7080'
    );

    this.medication = new MedicationServiceClient(
      process.env.MEDICATION_SERVICE_URL || 'http://localhost:7090'
    );

    this.inventory = new InventoryServiceClient(
      process.env.INVENTORY_SERVICE_URL || 'http://localhost:7100'
    );

    this.appointment = new AppointmentServiceClient(
      process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:7040'
    );

    logger.info('✅ All service clients initialized');
  }

  /**
   * Set auth token for all service clients
   * Should be called on each request with the user's token
   */
  setAuthToken(token: string) {
    this.clinical.setAuthToken(token);
    this.auth.setAuthToken(token);
    this.lab.setAuthToken(token);
    this.medication.setAuthToken(token);
    this.inventory.setAuthToken(token);
    this.appointment.setAuthToken(token);
  }

  /**
   * Get dashboard stats from all services
   * Aggregates data from multiple microservices
   */
  async getDashboardStats(token: string): Promise<any> {
    this.setAuthToken(token);

    try {
      // Fetch all stats in parallel
      const [
        clinicalStats,
        authStats,
        labStats,
        medicationStats,
        inventoryStats,
        appointmentStats,
      ] = await Promise.allSettled([
        this.clinical.getAllStats(),
        this.auth.getAllStats(),
        this.lab.getAllStats(),
        this.medication.getAllStats(),
        this.inventory.getAllStats(),
        this.appointment.getAllStats(),
      ]);

      // Extract successful results
      const stats = {
        clinical: clinicalStats.status === 'fulfilled' ? clinicalStats.value : null,
        auth: authStats.status === 'fulfilled' ? authStats.value : null,
        lab: labStats.status === 'fulfilled' ? labStats.value : null,
        medication: medicationStats.status === 'fulfilled' ? medicationStats.value : null,
        inventory: inventoryStats.status === 'fulfilled' ? inventoryStats.value : null,
        appointment: appointmentStats.status === 'fulfilled' ? appointmentStats.value : null,
      };

      // Log any failures
      const failures = [
        { name: 'clinical', result: clinicalStats },
        { name: 'auth', result: authStats },
        { name: 'lab', result: labStats },
        { name: 'medication', result: medicationStats },
        { name: 'inventory', result: inventoryStats },
        { name: 'appointment', result: appointmentStats },
      ].filter((s) => s.result.status === 'rejected');

      if (failures.length > 0) {
        logger.warn('Some services failed to return stats:', {
          failures: failures.map((f) => ({
            service: f.name,
            error: (f.result as PromiseRejectedResult).reason?.message || 'Unknown error',
          })),
        });
      }

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
        servicesResponded: Object.keys(stats).filter((k) => stats[k as keyof typeof stats] !== null).length,
        totalServices: 6,
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const serviceClients = new ServiceClientsManager();

