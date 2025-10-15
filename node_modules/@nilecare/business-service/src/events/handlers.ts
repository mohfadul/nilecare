import { Server } from 'socket.io';
import { logger } from '../utils/logger';

/**
 * Setup event handlers for Socket.IO real-time updates
 */
export function setupEventHandlers(io: Server) {
  logger.info('Setting up event handlers for Socket.IO');

  // Handle connection events
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle organization room joining
    socket.on('join-organization', (organizationId: string) => {
      socket.join(`org-${organizationId}`);
      logger.info(`Socket ${socket.id} joined organization: ${organizationId}`);
    });

    // Handle staff room joining
    socket.on('join-staff', (staffId: string) => {
      socket.join(`staff-${staffId}`);
      logger.info(`Socket ${socket.id} joined staff room: ${staffId}`);
    });

    // Handle patient room joining
    socket.on('join-patient', (patientId: string) => {
      socket.join(`patient-${patientId}`);
      logger.info(`Socket ${socket.id} joined patient room: ${patientId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Emit appointment-related events
 */
export class AppointmentEventEmitter {
  constructor(private io: Server) {}

  appointmentCreated(organizationId: string, appointment: any) {
    this.io.to(`org-${organizationId}`).emit('appointment:created', appointment);
    this.io.to(`patient-${appointment.patientId}`).emit('appointment:created', appointment);
    this.io.to(`staff-${appointment.providerId}`).emit('appointment:created', appointment);
    logger.info(`Emitted appointment:created for ${appointment.id}`);
  }

  appointmentUpdated(organizationId: string, appointment: any) {
    this.io.to(`org-${organizationId}`).emit('appointment:updated', appointment);
    this.io.to(`patient-${appointment.patientId}`).emit('appointment:updated', appointment);
    this.io.to(`staff-${appointment.providerId}`).emit('appointment:updated', appointment);
    logger.info(`Emitted appointment:updated for ${appointment.id}`);
  }

  appointmentCancelled(organizationId: string, appointment: any) {
    this.io.to(`org-${organizationId}`).emit('appointment:cancelled', appointment);
    this.io.to(`patient-${appointment.patientId}`).emit('appointment:cancelled', appointment);
    this.io.to(`staff-${appointment.providerId}`).emit('appointment:cancelled', appointment);
    logger.info(`Emitted appointment:cancelled for ${appointment.id}`);
  }

  appointmentConfirmed(organizationId: string, appointment: any) {
    this.io.to(`org-${organizationId}`).emit('appointment:confirmed', appointment);
    this.io.to(`patient-${appointment.patientId}`).emit('appointment:confirmed', appointment);
    this.io.to(`staff-${appointment.providerId}`).emit('appointment:confirmed', appointment);
    logger.info(`Emitted appointment:confirmed for ${appointment.id}`);
  }

  appointmentCompleted(organizationId: string, appointment: any) {
    this.io.to(`org-${organizationId}`).emit('appointment:completed', appointment);
    this.io.to(`patient-${appointment.patientId}`).emit('appointment:completed', appointment);
    this.io.to(`staff-${appointment.providerId}`).emit('appointment:completed', appointment);
    logger.info(`Emitted appointment:completed for ${appointment.id}`);
  }
}

/**
 * Emit billing-related events
 */
export class BillingEventEmitter {
  constructor(private io: Server) {}

  billingCreated(organizationId: string, billing: any) {
    this.io.to(`org-${organizationId}`).emit('billing:created', billing);
    this.io.to(`patient-${billing.patientId}`).emit('billing:created', billing);
    logger.info(`Emitted billing:created for ${billing.id}`);
  }

  billingPaid(organizationId: string, billing: any) {
    this.io.to(`org-${organizationId}`).emit('billing:paid', billing);
    this.io.to(`patient-${billing.patientId}`).emit('billing:paid', billing);
    logger.info(`Emitted billing:paid for ${billing.id}`);
  }

  billingOverdue(organizationId: string, billing: any) {
    this.io.to(`org-${organizationId}`).emit('billing:overdue', billing);
    this.io.to(`patient-${billing.patientId}`).emit('billing:overdue', billing);
    logger.info(`Emitted billing:overdue for ${billing.id}`);
  }
}

/**
 * Emit schedule-related events
 */
export class ScheduleEventEmitter {
  constructor(private io: Server) {}

  scheduleCreated(organizationId: string, schedule: any) {
    this.io.to(`org-${organizationId}`).emit('schedule:created', schedule);
    this.io.to(`staff-${schedule.staffId}`).emit('schedule:created', schedule);
    logger.info(`Emitted schedule:created for ${schedule.id}`);
  }

  scheduleUpdated(organizationId: string, schedule: any) {
    this.io.to(`org-${organizationId}`).emit('schedule:updated', schedule);
    this.io.to(`staff-${schedule.staffId}`).emit('schedule:updated', schedule);
    logger.info(`Emitted schedule:updated for ${schedule.id}`);
  }

  scheduleCancelled(organizationId: string, schedule: any) {
    this.io.to(`org-${organizationId}`).emit('schedule:cancelled', schedule);
    this.io.to(`staff-${schedule.staffId}`).emit('schedule:cancelled', schedule);
    logger.info(`Emitted schedule:cancelled for ${schedule.id}`);
  }

  scheduleConflict(organizationId: string, conflict: any) {
    this.io.to(`org-${organizationId}`).emit('schedule:conflict', conflict);
    this.io.to(`staff-${conflict.staffId}`).emit('schedule:conflict', conflict);
    logger.info(`Emitted schedule:conflict for staff ${conflict.staffId}`);
  }
}

/**
 * Emit staff-related events
 */
export class StaffEventEmitter {
  constructor(private io: Server) {}

  staffCreated(organizationId: string, staff: any) {
    this.io.to(`org-${organizationId}`).emit('staff:created', staff);
    logger.info(`Emitted staff:created for ${staff.id}`);
  }

  staffUpdated(organizationId: string, staff: any) {
    this.io.to(`org-${organizationId}`).emit('staff:updated', staff);
    this.io.to(`staff-${staff.id}`).emit('staff:updated', staff);
    logger.info(`Emitted staff:updated for ${staff.id}`);
  }

  staffStatusChanged(organizationId: string, staff: any) {
    this.io.to(`org-${organizationId}`).emit('staff:status-changed', staff);
    this.io.to(`staff-${staff.id}`).emit('staff:status-changed', staff);
    logger.info(`Emitted staff:status-changed for ${staff.id}`);
  }
}

