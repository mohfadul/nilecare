/**
 * Notification Service
 * Real-time notifications via Socket.IO
 */

import { Server as SocketIOServer } from 'socket.io';

export class NotificationService {
  private io: SocketIOServer | null = null;

  /**
   * Initialize Socket.IO
   */
  initialize(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      // Join user-specific room
      socket.on('join', (data: { userId: string; role: string }) => {
        socket.join(`user:${data.userId}`);
        socket.join(`role:${data.role}`);
        console.log(`User ${data.userId} joined room (role: ${data.role})`);
      });

      // Leave room
      socket.on('leave', (data: { userId: string }) => {
        socket.leave(`user:${data.userId}`);
      });

      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Send notification to specific user
   */
  notifyUser(userId: string, event: string, data: any) {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
    console.log(`📤 Notification sent to user ${userId}: ${event}`);
  }

  /**
   * Send notification to all users with specific role
   */
  notifyRole(role: string, event: string, data: any) {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    this.io.to(`role:${role}`).emit(event, data);
    console.log(`📤 Notification sent to role ${role}: ${event}`);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any) {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    this.io.emit(event, data);
    console.log(`📢 Broadcast: ${event}`);
  }

  /**
   * Notify about new appointment
   */
  notifyNewAppointment(appointment: any) {
    // Notify patient
    this.notifyUser(appointment.patient_id, 'appointment:created', {
      id: appointment.id,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      provider: `Dr. ${appointment.provider_first_name} ${appointment.provider_last_name}`,
    });

    // Notify provider
    this.notifyUser(appointment.provider_id, 'appointment:new', {
      id: appointment.id,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      patient: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
    });

    // Notify receptionists
    this.notifyRole('receptionist', 'appointment:created', {
      id: appointment.id,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
    });
  }

  /**
   * Notify about appointment update
   */
  notifyAppointmentUpdate(appointment: any) {
    this.notifyUser(appointment.patient_id, 'appointment:updated', appointment);
    this.notifyUser(appointment.provider_id, 'appointment:updated', appointment);
    this.notifyRole('receptionist', 'appointment:updated', appointment);
  }

  /**
   * Notify about appointment cancellation
   */
  notifyAppointmentCancelled(appointment: any) {
    this.notifyUser(appointment.patient_id, 'appointment:cancelled', {
      id: appointment.id,
      reason: 'Appointment cancelled',
    });
    this.notifyUser(appointment.provider_id, 'appointment:cancelled', {
      id: appointment.id,
    });
    this.notifyRole('receptionist', 'appointment:cancelled', {
      id: appointment.id,
    });
  }

  /**
   * Notify about patient check-in
   */
  notifyPatientCheckIn(appointment: any) {
    this.notifyUser(appointment.provider_id, 'patient:checked-in', {
      appointmentId: appointment.id,
      patient: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
      time: appointment.appointment_time,
    });

    this.notifyRole('nurse', 'patient:checked-in', {
      appointmentId: appointment.id,
      patient: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
    });
  }
}

export default new NotificationService();

