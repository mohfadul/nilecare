/**
 * Event Handlers for EHR Service
 * 
 * Handles WebSocket events and real-time clinical documentation updates
 * Integrates with Clinical Service for seamless communication
 */

import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

/**
 * Setup event handlers for Socket.IO
 * 
 * @param io - Socket.IO server instance
 */
export function setupEventHandlers(io: Server): void {
  // Socket connection handling
  io.on('connection', (socket: Socket) => {
    logger.info(`EHR client connected: ${socket.id}`);

    // Join patient-specific EHR room
    socket.on('join-patient-ehr', (patientId: string) => {
      socket.join(`patient-ehr-${patientId}`);
      logger.info(`Socket ${socket.id} joined patient EHR room: ${patientId}`);
    });

    // Join encounter-specific EHR room
    socket.on('join-encounter-ehr', (encounterId: string) => {
      socket.join(`encounter-ehr-${encounterId}`);
      logger.info(`Socket ${socket.id} joined encounter EHR room: ${encounterId}`);
    });

    // Join facility room
    socket.on('join-facility-ehr', (facilityId: string) => {
      socket.join(`facility-ehr-${facilityId}`);
      logger.info(`Socket ${socket.id} joined facility EHR room: ${facilityId}`);
    });

    // Join organization room
    socket.on('join-organization-ehr', (organizationId: string) => {
      socket.join(`organization-ehr-${organizationId}`);
      logger.info(`Socket ${socket.id} joined organization EHR room: ${organizationId}`);
    });

    // Leave room
    socket.on('leave-room', (room: string) => {
      socket.leave(room);
      logger.info(`Socket ${socket.id} left room: ${room}`);
    });

    // Document events
    socket.on('document:created', (data: any) => {
      logger.info(`Document created event: ${data.documentType} for patient ${data.patientId}`);
      // Broadcast to relevant rooms
      io.to(`patient-ehr-${data.patientId}`).emit('document:created', data);
      if (data.facilityId) {
        io.to(`facility-ehr-${data.facilityId}`).emit('document:created', data);
      }
    });

    socket.on('document:updated', (data: any) => {
      logger.info(`Document updated event: ${data.documentId}`);
      io.to(`patient-ehr-${data.patientId}`).emit('document:updated', data);
    });

    socket.on('document:finalized', (data: any) => {
      logger.info(`Document finalized event: ${data.documentId}`);
      io.to(`patient-ehr-${data.patientId}`).emit('document:finalized', data);
      // Broadcast to organization for critical documents
      if (data.organizationId) {
        io.to(`organization-ehr-${data.organizationId}`).emit('document:finalized', data);
      }
    });

    // Problem list events
    socket.on('problem:added', (data: any) => {
      logger.info(`Problem added event: ${data.problemName} for patient ${data.patientId}`);
      io.to(`patient-ehr-${data.patientId}`).emit('problem:added', data);
    });

    socket.on('problem:resolved', (data: any) => {
      logger.info(`Problem resolved event: ${data.problemId}`);
      io.to(`patient-ehr-${data.patientId}`).emit('problem:resolved', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`EHR client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('✅ EHR event handlers setup complete');
}

export default setupEventHandlers;

