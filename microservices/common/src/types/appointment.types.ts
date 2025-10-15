/**
 * Appointment-related types
 */

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  organizationId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  type: AppointmentType;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  symptoms?: string[];
  diagnosis?: string;
  prescription?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentType = 
  | 'consultation'
  | 'follow_up'
  | 'emergency'
  | 'surgery'
  | 'lab_test'
  | 'vaccination'
  | 'screening';

export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  organizationId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  type: AppointmentType;
  reason?: string;
  notes?: string;
}

export interface UpdateAppointmentInput {
  appointmentDate?: Date;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status?: AppointmentStatus;
  reason?: string;
  notes?: string;
  symptoms?: string[];
  diagnosis?: string;
  prescription?: string;
  followUpDate?: Date;
}

export interface AppointmentSlot {
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  doctorId: string;
}

