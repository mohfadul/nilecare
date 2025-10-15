import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

/**
 * Inventory Service Client
 * Handles communication with Inventory Service for stock management
 */

export interface InventoryCheckResult {
  available: boolean;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStock: boolean;
  outOfStock: boolean;
}

export interface StockReservation {
  reservationId: string;
  medicationId: string;
  quantity: number;
  expiresAt: Date;
}

export class InventoryServiceClient {
  private client: AxiosInstance;
  private inventoryServiceUrl: string;
  private apiKey: string;

  constructor() {
    this.inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:4004';
    this.apiKey = process.env.INVENTORY_SERVICE_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('INVENTORY_SERVICE_API_KEY not configured. Service-to-service calls may fail.');
    }

    this.client = axios.create({
      baseURL: this.inventoryServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'medication-service',
        'X-API-Key': this.apiKey,
      },
    });

    // Add interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Inventory Service Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Inventory Service Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Inventory Service Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Inventory Service Response Error', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check stock availability
   */
  async checkStock(
    medicationId: string,
    quantity: number,
    facilityId: string
  ): Promise<InventoryCheckResult | null> {
    try {
      const response = await this.client.post('/api/v1/inventory/check-stock', {
        itemId: medicationId,
        quantity,
        facilityId,
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          available: data.available,
          currentStock: data.currentStock,
          reservedStock: data.reservedStock,
          availableStock: data.availableStock,
          lowStock: data.lowStock,
          outOfStock: data.outOfStock,
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Stock check failed', { error: error.message, medicationId, quantity, facilityId });
      return null;
    }
  }

  /**
   * Reserve stock (temporary hold before dispensing)
   */
  async reserveStock(
    medicationId: string,
    quantity: number,
    facilityId: string,
    reservedBy: string,
    expiresInMinutes: number = 30
  ): Promise<StockReservation | null> {
    try {
      const response = await this.client.post('/api/v1/inventory/reserve', {
        itemId: medicationId,
        quantity,
        facilityId,
        reservedBy,
        expiresInMinutes,
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          reservationId: data.reservationId,
          medicationId: data.itemId,
          quantity: data.quantity,
          expiresAt: new Date(data.expiresAt),
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Stock reservation failed', { error: error.message, medicationId, quantity });
      return null;
    }
  }

  /**
   * Release stock reservation
   */
  async releaseReservation(reservationId: string, facilityId: string): Promise<boolean> {
    try {
      const response = await this.client.post('/api/v1/inventory/release-reservation', {
        reservationId,
        facilityId,
      });

      return response.data.success;
    } catch (error: any) {
      logger.error('Release reservation failed', { error: error.message, reservationId });
      return false;
    }
  }

  /**
   * Reduce stock (actual dispensing)
   */
  async reduceStock(
    medicationId: string,
    quantity: number,
    facilityId: string,
    reason: string,
    reference: {
      type: 'prescription' | 'dispensing' | 'administration';
      id: string;
    },
    performedBy: string
  ): Promise<boolean> {
    try {
      const response = await this.client.post('/api/v1/inventory/reduce', {
        itemId: medicationId,
        quantity,
        facilityId,
        movementType: 'dispensing',
        reason,
        referenceType: reference.type,
        referenceId: reference.id,
        performedBy,
      });

      if (response.data.success) {
        logger.info('Stock reduced successfully', {
          medicationId,
          quantity,
          facilityId,
          reason,
        });
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Stock reduction failed', { error: error.message, medicationId, quantity });
      return false;
    }
  }

  /**
   * Get batch information
   */
  async getBatchInfo(
    medicationId: string,
    facilityId: string
  ): Promise<Array<{
    batchNumber: string;
    expiryDate: Date;
    quantity: number;
  }> | null> {
    try {
      const response = await this.client.get(`/api/v1/inventory/${medicationId}/batches`, {
        params: { facilityId },
      });

      if (response.data.success && response.data.data) {
        return response.data.data.batches.map((batch: any) => ({
          batchNumber: batch.batchNumber,
          expiryDate: new Date(batch.expiryDate),
          quantity: batch.quantity,
        }));
      }

      return null;
    } catch (error: any) {
      logger.error('Get batch info failed', { error: error.message, medicationId });
      return null;
    }
  }

  /**
   * Check for expiring medications
   */
  async checkExpiringMedications(
    facilityId: string,
    daysUntilExpiry: number = 30
  ): Promise<Array<{
    medicationId: string;
    batchNumber: string;
    expiryDate: Date;
    quantity: number;
  }> | null> {
    try {
      const response = await this.client.get('/api/v1/inventory/expiring', {
        params: { facilityId, daysUntilExpiry },
      });

      if (response.data.success && response.data.data) {
        return response.data.data.items;
      }

      return null;
    } catch (error: any) {
      logger.error('Check expiring medications failed', { error: error.message, facilityId });
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error: any) {
      logger.error('Inventory Service health check failed', { error: error.message });
      return false;
    }
  }
}

export default InventoryServiceClient;

