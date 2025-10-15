import { Kafka, Producer } from 'kafkajs';
import { logger } from '../utils/logger';

/**
 * Event Publisher for Inventory Service
 * Publishes events to Kafka for other services to consume
 */

export class EventPublisher {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private isConnected: boolean = false;

  constructor() {
    const kafkaBrokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];

    this.kafka = new Kafka({
      clientId: 'inventory-service',
      brokers: kafkaBrokers,
      retry: {
        retries: 3,
        initialRetryTime: 100,
        factor: 2,
      },
    });

    this.producer = this.kafka.producer();
    this.initializeProducer();
  }

  private async initializeProducer(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.connect();
        this.isConnected = true;
        logger.info('Kafka producer connected successfully');
      }
    } catch (error: any) {
      logger.error('Failed to connect Kafka producer', { error: error.message });
      this.isConnected = false;
    }
  }

  /**
   * Publish stock reserved event
   */
  async publishStockReserved(data: {
    reservationId: string;
    itemId: string;
    quantity: number;
    reference: string;
    expiresAt: Date;
    facilityId: string;
  }): Promise<void> {
    await this.publishEvent('inventory.reserved', data);
  }

  /**
   * Publish stock committed event
   */
  async publishStockCommitted(data: {
    reservationId: string;
    itemId: string;
    quantityCommitted: number;
    reference: string;
    facilityId: string;
  }): Promise<void> {
    await this.publishEvent('inventory.committed', data);
  }

  /**
   * Publish stock rolled back event
   */
  async publishStockRolledBack(data: {
    reservationId: string;
    itemId: string;
    quantity: number;
    reason: string;
    facilityId: string;
  }): Promise<void> {
    await this.publishEvent('inventory.rolled_back', data);
  }

  /**
   * Publish stock received event
   */
  async publishStockReceived(data: {
    itemId: string;
    quantity: number;
    batchNumber: string;
    locationId: string;
    facilityId: string;
  }): Promise<void> {
    await this.publishEvent('inventory.received', data);
  }

  /**
   * Publish stock updated event
   */
  async publishStockUpdated(data: {
    itemId: string;
    quantityAvailable: number;
    lowStock: boolean;
    facilityId: string;
  }): Promise<void> {
    await this.publishEvent('inventory.updated', data);
  }

  /**
   * Publish low stock alert
   */
  async publishLowStockAlert(data: {
    itemId: string;
    itemName: string;
    currentStock: number;
    reorderLevel: number;
    facilityId: string;
  }): Promise<void> {
    await this.publishEvent('inventory.low_stock', data);
  }

  /**
   * Publish expiry alert
   */
  async publishExpiryAlert(data: {
    batchNumber: string;
    itemId: string;
    itemName: string;
    expiryDate: Date;
    daysRemaining: number;
    quantityInBatch: number;
    facilityId: string;
  }): Promise<void> {
    await this.publishEvent('inventory.expiring', data);
  }

  /**
   * Generic event publisher
   */
  private async publishEvent(eventType: string, data: any): Promise<void> {
    if (!this.isConnected || !this.producer) {
      logger.warn(`Kafka not connected, skipping event: ${eventType}`);
      return;
    }

    try {
      const topic = this.getTopicForEvent(eventType);

      await this.producer.send({
        topic,
        messages: [
          {
            key: data.itemId || data.reservationId || 'inventory',
            value: JSON.stringify({
              eventType,
              data,
              timestamp: new Date().toISOString(),
              service: 'inventory-service',
            }),
          },
        ],
      });

      logger.debug(`Event published: ${eventType}`, { topic });
    } catch (error: any) {
      logger.error(`Failed to publish event: ${eventType}`, { error: error.message });
    }
  }

  /**
   * Get topic name for event type
   */
  private getTopicForEvent(eventType: string): string {
    const topicMap: Record<string, string> = {
      'inventory.reserved': 'inventory-events',
      'inventory.committed': 'inventory-events',
      'inventory.rolled_back': 'inventory-events',
      'inventory.received': 'inventory-events',
      'inventory.updated': 'inventory-events',
      'inventory.low_stock': 'inventory-alerts',
      'inventory.expiring': 'inventory-alerts',
    };

    return topicMap[eventType] || 'inventory-events';
  }

  /**
   * Disconnect producer
   */
  async disconnect(): Promise<void> {
    if (this.producer && this.isConnected) {
      try {
        await this.producer.disconnect();
        this.isConnected = false;
        logger.info('Kafka producer disconnected');
      } catch (error: any) {
        logger.error('Error disconnecting Kafka producer', { error: error.message });
      }
    }
  }
}

export default EventPublisher;

