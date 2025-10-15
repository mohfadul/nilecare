/**
 * Event Service
 * Publishes events for other microservices
 * (Placeholder for Kafka/RabbitMQ integration)
 */

export interface AppointmentEvent {
  type: string;
  appointmentId: string;
  timestamp: string;
  data: any;
}

export class EventService {
  /**
   * Publish appointment created event
   */
  async publishAppointmentCreated(appointment: any) {
    const event: AppointmentEvent = {
      type: 'appointment.created',
      appointmentId: appointment.id,
      timestamp: new Date().toISOString(),
      data: appointment,
    };

    await this.publishEvent(event);
  }

  /**
   * Publish appointment updated event
   */
  async publishAppointmentUpdated(appointment: any) {
    const event: AppointmentEvent = {
      type: 'appointment.updated',
      appointmentId: appointment.id,
      timestamp: new Date().toISOString(),
      data: appointment,
    };

    await this.publishEvent(event);
  }

  /**
   * Publish appointment cancelled event
   */
  async publishAppointmentCancelled(appointment: any) {
    const event: AppointmentEvent = {
      type: 'appointment.cancelled',
      appointmentId: appointment.id,
      timestamp: new Date().toISOString(),
      data: appointment,
    };

    await this.publishEvent(event);
  }

  /**
   * Publish appointment completed event
   */
  async publishAppointmentCompleted(appointment: any) {
    const event: AppointmentEvent = {
      type: 'appointment.completed',
      appointmentId: appointment.id,
      timestamp: new Date().toISOString(),
      data: appointment,
    };

    await this.publishEvent(event);
  }

  /**
   * Publish event (placeholder)
   */
  private async publishEvent(event: AppointmentEvent) {
    // TODO: Integrate with Kafka or RabbitMQ
    // For now, just log the event
    console.log(`📮 Event published: ${event.type}`, {
      appointmentId: event.appointmentId,
      timestamp: event.timestamp,
    });

    // In production, this would:
    // 1. Connect to message broker (Kafka/RabbitMQ)
    // 2. Publish event to topic/queue
    // 3. Other microservices would subscribe and react
  }

  /**
   * Publish batch events
   */
  async publishBatchEvents(events: AppointmentEvent[]) {
    for (const event of events) {
      await this.publishEvent(event);
    }
  }
}

export default new EventService();

