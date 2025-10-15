/**
 * Event Handlers
 * Setup event listeners and handlers
 */

import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/NotificationService';
import { WebSocketService } from '../services/WebSocketService';

/**
 * Setup WebSocket event handlers
 */
export function setupWebSocketHandlers(
  io: Server,
  webSocketService: WebSocketService
): void {
  logger.info('Setting up WebSocket event handlers');

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Authenticate socket connection
    const userId = (socket.handshake.query.userId as string) || 'anonymous';
    
    if (userId !== 'anonymous') {
      webSocketService.handleConnection(socket, userId);
    }

    // Handle user joining their notification room
    socket.on('join-user-room', (data: { userId: string }) => {
      socket.join(`user-${data.userId}`);
      webSocketService.handleConnection(socket, data.userId);
      logger.info(`Socket ${socket.id} joined user room: ${data.userId}`);
    });

    // Handle organization room join
    socket.on('join-organization-room', (data: { organizationId: string }) => {
      socket.join(`organization-${data.organizationId}`);
      logger.info(`Socket ${socket.id} joined organization room: ${data.organizationId}`);
    });

    // Handle notification subscriptions
    socket.on('subscribe-notifications', (subscription: any) => {
      webSocketService.handleSubscription(socket, subscription);
    });

    // Handle notification read acknowledgment
    socket.on('notification:mark-read', async (data: { notificationId: string }) => {
      try {
        const userId = socket.handshake.query.userId as string;
        webSocketService.emitNotificationRead(userId, data.notificationId);
        logger.debug('Notification marked as read via WebSocket', {
          notificationId: data.notificationId,
          userId,
        });
      } catch (error: any) {
        logger.error('Failed to mark notification as read', { error: error.message });
      }
    });

    // Handle typing indicators (for chat-like features)
    socket.on('typing', (data: { userId: string; isTyping: boolean }) => {
      webSocketService.emitTyping(data.userId, data.isTyping);
    });

    // Handle ping for connection keep-alive
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      logger.info(`Client disconnected: ${socket.id}`, { reason });
      webSocketService.handleDisconnection(socket);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      logger.error('WebSocket error', {
        socketId: socket.id,
        error: error.message,
      });
    });
  });

  logger.info('✅ WebSocket event handlers setup complete');
}

/**
 * Setup system event handlers (Kafka, etc.)
 */
export function setupSystemEventHandlers(
  _notificationService: NotificationService
): void {
  logger.info('Setting up system event handlers');

  // TODO: Implement Kafka consumer for system events
  // Example events to handle:
  // - appointment.created → Send confirmation
  // - appointment.reminder → Send reminder
  // - lab.result.ready → Notify patient
  // - prescription.ready → Notify patient
  // - billing.invoice.created → Send invoice notification

  logger.info('System event handlers setup complete (placeholder for Kafka integration)');
}

/**
 * Setup all event handlers
 */
export function setupEventHandlers(
  io: Server,
  notificationService: NotificationService,
  webSocketService: WebSocketService
): void {
  logger.info('Setting up all event handlers');

  // Setup WebSocket handlers
  setupWebSocketHandlers(io, webSocketService);

  // Setup system event handlers
  setupSystemEventHandlers(notificationService);

  logger.info('✅ All event handlers setup complete');
}

/**
 * Handle appointment created event
 */
export async function handleAppointmentCreated(event: any): Promise<void> {
  logger.info('Handling appointment created event', { appointmentId: event.appointmentId });

  // TODO: Send appointment confirmation notification
  // await notificationService.create({
  //   user_id: event.patientId,
  //   channel: 'email',
  //   type: 'appointment_confirmation',
  //   template_id: 'appointment_confirmation',
  //   payload: event,
  // });
}

/**
 * Handle lab result ready event
 */
export async function handleLabResultReady(event: any): Promise<void> {
  logger.info('Handling lab result ready event', { labResultId: event.labResultId });

  // TODO: Send lab result notification
}

/**
 * Handle prescription ready event
 */
export async function handlePrescriptionReady(event: any): Promise<void> {
  logger.info('Handling prescription ready event', { prescriptionId: event.prescriptionId });

  // TODO: Send prescription notification
}

/**
 * Handle billing invoice created event
 */
export async function handleBillingInvoiceCreated(event: any): Promise<void> {
  logger.info('Handling billing invoice created event', { invoiceId: event.invoiceId });

  // TODO: Send invoice notification
}

export default { 
  setupEventHandlers,
  setupWebSocketHandlers,
  setupSystemEventHandlers,
  handleAppointmentCreated,
  handleLabResultReady,
  handlePrescriptionReady,
  handleBillingInvoiceCreated,
};

