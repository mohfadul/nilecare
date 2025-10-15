/**
 * Facility Settings Model
 * Facility-specific configuration and preferences
 */

export interface FacilitySettings {
  id: string;
  settingsId: string;
  facilityId: string;
  
  // General settings
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  language: string;
  currency: string;
  
  // Operational settings
  defaultAppointmentDuration: number; // In minutes
  allowWalkIns: boolean;
  maxAdvanceBookingDays: number;
  cancellationNoticePeriod: number; // In hours
  
  // Notification settings
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  appointmentReminderHours: number[];
  
  // Bed management settings
  automaticBedRelease: boolean;
  bedCleaningDuration: number; // In minutes
  
  // Business rules
  requireInsurance: boolean;
  requireReferral: boolean;
  allowOnlineBooking: boolean;
  
  // Custom settings
  customSettings?: Record<string, any>;
  
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTOs for Facility Settings
 */

export interface CreateFacilitySettingsDTO {
  facilityId: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  language?: string;
  currency?: string;
  defaultAppointmentDuration?: number;
  allowWalkIns?: boolean;
  maxAdvanceBookingDays?: number;
  createdBy: string;
}

export interface UpdateFacilitySettingsDTO {
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  language?: string;
  currency?: string;
  defaultAppointmentDuration?: number;
  allowWalkIns?: boolean;
  maxAdvanceBookingDays?: number;
  cancellationNoticePeriod?: number;
  emailNotificationsEnabled?: boolean;
  smsNotificationsEnabled?: boolean;
  appointmentReminderHours?: number[];
  automaticBedRelease?: boolean;
  bedCleaningDuration?: number;
  requireInsurance?: boolean;
  requireReferral?: boolean;
  allowOnlineBooking?: boolean;
  customSettings?: Record<string, any>;
  updatedBy?: string;
}

export default FacilitySettings;

