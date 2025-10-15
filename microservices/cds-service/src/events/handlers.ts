/**
 * Event Handlers for CDS Service
 * 
 * Handles WebSocket events and real-time alert broadcasting
 * Integrates with Clinical Service for seamless communication
 */

import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { AlertService } from '../services/AlertService';

/**
 * Setup event handlers for Socket.IO
 * 
 * @param io - Socket.IO server instance
 * @param alertService - Alert service for broadcasting
 */
export function setupEventHandlers(io: Server, alertService: AlertService): void {
  // Configure alert service with Socket.IO
  alertService.setSocketServer(io);

  // Socket connection handling
  io.on('connection', (socket: Socket) => {
    logger.info(`CDS client connected: ${socket.id}`);

    // Join patient-specific alert room
    socket.on('join-patient-alerts', (patientId: string) => {
      socket.join(`patient-${patientId}`);
      logger.info(`Socket ${socket.id} joined patient alerts: ${patientId}`);
    });

    // Join facility alert room
    socket.on('join-facility-alerts', (facilityId: string) => {
      socket.join(`facility-${facilityId}`);
      logger.info(`Socket ${socket.id} joined facility alerts: ${facilityId}`);
    });

    // Join organization alert room
    socket.on('join-organization-alerts', (organizationId: string) => {
      socket.join(`organization-${organizationId}`);
      logger.info(`Socket ${socket.id} joined organization alerts: ${organizationId}`);
    });

    // Join clinical team room
    socket.on('join-clinical-team', (teamId: string) => {
      if (teamId === 'all-staff') {
        socket.join('clinical-team-all');
        logger.info(`Socket ${socket.id} joined all clinical staff room`);
      } else {
        socket.join(`clinical-team-${teamId}`);
        logger.info(`Socket ${socket.id} joined clinical team: ${teamId}`);
      }
    });

    // Leave room
    socket.on('leave-room', (room: string) => {
      socket.leave(room);
      logger.info(`Socket ${socket.id} left room: ${room}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`CDS client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('✅ CDS event handlers setup complete');
}

export default setupEventHandlers;

