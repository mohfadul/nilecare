import { Server } from 'socket.io';
import { logger } from '../utils/logger';

export function setupEventHandlers(io: Server) {
  // Handle patient-related events
  io.on('patient:created', (data) => {
    logger.info('Patient created event received:', data);
    io.to(`organization-${data.organizationId}`).emit('patient:created', data);
  });

  io.on('patient:updated', (data) => {
    logger.info('Patient updated event received:', data);
    io.to(`organization-${data.organizationId}`).emit('patient:updated', data);
    io.to(`patient-${data.patientId}`).emit('patient:updated', data);
  });

  io.on('patient:deleted', (data) => {
    logger.info('Patient deleted event received:', data);
    io.to(`organization-${data.organizationId}`).emit('patient:deleted', data);
  });

  // Handle encounter-related events
  io.on('encounter:created', (data) => {
    logger.info('Encounter created event received:', data);
    io.to(`organization-${data.organizationId}`).emit('encounter:created', data);
    io.to(`patient-${data.patientId}`).emit('encounter:created', data);
  });

  io.on('encounter:updated', (data) => {
    logger.info('Encounter updated event received:', data);
    io.to(`organization-${data.organizationId}`).emit('encounter:updated', data);
    io.to(`patient-${data.patientId}`).emit('encounter:updated', data);
  });

  // Handle medication events
  io.on('medication:prescribed', (data) => {
    logger.info('Medication prescribed event received:', data);
    io.to(`organization-${data.organizationId}`).emit('medication:prescribed', data);
    io.to(`patient-${data.patientId}`).emit('medication:prescribed', data);
  });

  io.on('medication:updated', (data) => {
    logger.info('Medication updated event received:', data);
    io.to(`organization-${data.organizationId}`).emit('medication:updated', data);
    io.to(`patient-${data.patientId}`).emit('medication:updated', data);
  });

  // Handle diagnostic events
  io.on('diagnostic:created', (data) => {
    logger.info('Diagnostic created event received:', data);
    io.to(`organization-${data.organizationId}`).emit('diagnostic:created', data);
    io.to(`patient-${data.patientId}`).emit('diagnostic:created', data);
  });

  io.on('diagnostic:updated', (data) => {
    logger.info('Diagnostic updated event received:', data);
    io.to(`organization-${data.organizationId}`).emit('diagnostic:updated', data);
    io.to(`patient-${data.patientId}`).emit('diagnostic:updated', data);
  });

  // Handle vital signs events
  io.on('vital:signs:recorded', (data) => {
    logger.info('Vital signs recorded event received:', data);
    io.to(`organization-${data.organizationId}`).emit('vital:signs:recorded', data);
    io.to(`patient-${data.patientId}`).emit('vital:signs:recorded', data);
  });

  // Handle emergency alerts
  io.on('emergency:alert', (data) => {
    logger.warn('Emergency alert received:', data);
    io.to(`organization-${data.organizationId}`).emit('emergency:alert', data);
    io.to('emergency-staff').emit('emergency:alert', data);
  });

  logger.info('Event handlers setup completed');
}
