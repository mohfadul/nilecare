import { Kafka, Producer } from 'kafkajs';
import { logger } from '../utils/logger';

/**
 * Event Publisher
 * Publishes events to Kafka for real-time updates
 */

export class EventPublisher {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private isConnected: boolean = false;

  constructor() {
    const kafkaEnabled = process.env.KAFKA_ENABLED === 'true';
    const kafkaBrokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];

    if (!kafkaEnabled) {
      logger.info('Kafka disabled - events will not be published');
      return;
    }

    this.kafka = new Kafka({
      clientId: 'facility-service',
      brokers: kafkaBrokers,
    });

    this.producer = this.kafka.producer();
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    if (!this.producer) {
      logger.warn('Kafka not configured - skipping connection');
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('Kafka producer connected');
    } catch (error: any) {
      logger.error('Failed to connect Kafka producer', { error: error.message });
      this.isConnected = false;
    }
  }

  /**
   * Publish event
   */
  private async publish(topic: string, event: any): Promise<void> {
    if (!this.producer || !this.isConnected) {
      logger.debug('Kafka not connected - event not published', { topic, event });
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.facilityId || event.id,
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });

      logger.debug('Event published to Kafka', { topic, eventType: event.eventType });
    } catch (error: any) {
      logger.error('Failed to publish event to Kafka', {
        topic,
        error: error.message,
      });
    }
  }

  /**
   * Publish facility.created event
   */
  async publishFacilityCreated(facility: any): Promise<void> {
    await this.publish('facility-events', {
      eventType: 'facility.created',
      facilityId: facility.facilityId,
      organizationId: facility.organizationId,
      name: facility.name,
      type: facility.type,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish facility.updated event
   */
  async publishFacilityUpdated(facilityId: string, changes: any): Promise<void> {
    await this.publish('facility-events', {
      eventType: 'facility.updated',
      facilityId,
      changes,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish department.created event
   */
  async publishDepartmentCreated(department: any): Promise<void> {
    await this.publish('facility-events', {
      eventType: 'department.created',
      departmentId: department.departmentId,
      facilityId: department.facilityId,
      name: department.name,
      specialization: department.specialization,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish ward.created event
   */
  async publishWardCreated(ward: any): Promise<void> {
    await this.publish('facility-events', {
      eventType: 'ward.created',
      wardId: ward.wardId,
      facilityId: ward.facilityId,
      departmentId: ward.departmentId,
      name: ward.name,
      totalBeds: ward.totalBeds,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish bed.status_changed event (for real-time updates)
   */
  async publishBedStatusChanged(bed: any): Promise<void> {
    await this.publish('facility-alerts', {
      eventType: 'bed.status_changed',
      bedId: bed.bedId,
      bedNumber: bed.bedNumber,
      wardId: bed.wardId,
      facilityId: bed.facilityId,
      status: bed.bedStatus,
      patientId: bed.patientId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish ward.capacity_updated event
   */
  async publishWardCapacityUpdated(wardId: string, facilityId: string, capacity: any): Promise<void> {
    await this.publish('facility-alerts', {
      eventType: 'ward.capacity_updated',
      wardId,
      facilityId,
      totalBeds: capacity.totalBeds,
      occupiedBeds: capacity.occupiedBeds,
      availableBeds: capacity.availableBeds,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    if (this.producer && this.isConnected) {
      try {
        await this.producer.disconnect();
        logger.info('Kafka producer disconnected');
      } catch (error: any) {
        logger.error('Error disconnecting Kafka producer', { error: error.message });
      }
    }
  }
}

export default EventPublisher;

