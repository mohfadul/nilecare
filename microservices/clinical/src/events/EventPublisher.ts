import { Kafka } from 'kafkajs';
import { logger } from '../utils/logger';

export class EventPublisher {
  private kafka: Kafka;
  private producer: any;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'clinical-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    this.initializeProducer();
  }

  private async initializeProducer() {
    try {
      this.producer = this.kafka.producer();
      await this.producer.connect();
      logger.info('Kafka producer connected successfully');
    } catch (error) {
      logger.error('Failed to initialize Kafka producer:', error);
    }
  }

  async publishEvent(eventType: string, eventData: any, topic?: string): Promise<void> {
    try {
      if (!this.producer) {
        await this.initializeProducer();
      }

      const defaultTopic = this.getTopicByEventType(eventType);
      const targetTopic = topic || defaultTopic;

      const message = {
        eventType,
        eventData,
        timestamp: new Date().toISOString(),
        service: 'clinical-service',
        version: '1.0.0'
      };

      await this.producer.send({
        topic: targetTopic,
        messages: [
          {
            key: eventData.patientId || eventData.id || 'unknown',
            value: JSON.stringify(message),
            headers: {
              eventType,
              service: 'clinical-service'
            }
          }
        ]
      });

      logger.info(`Published event ${eventType} to topic ${targetTopic}`, { eventData });
    } catch (error) {
      logger.error(`Failed to publish event ${eventType}:`, error);
      throw error;
    }
  }

  private getTopicByEventType(eventType: string): string {
    const topicMappings: { [key: string]: string } = {
      'patient.created': 'patient-events',
      'patient.updated': 'patient-events',
      'patient.deleted': 'patient-events',
      'encounter.created': 'encounter-events',
      'encounter.updated': 'encounter-events',
      'encounter.completed': 'encounter-events',
      'medication.prescribed': 'medication-events',
      'medication.updated': 'medication-events',
      'medication.discontinued': 'medication-events',
      'diagnostic.created': 'diagnostic-events',
      'diagnostic.updated': 'diagnostic-events',
      'vital.signs.recorded': 'vital-signs-events'
    };

    return topicMappings[eventType] || 'clinical-events';
  }

  async disconnect(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        logger.info('Kafka producer disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting Kafka producer:', error);
    }
  }
}
