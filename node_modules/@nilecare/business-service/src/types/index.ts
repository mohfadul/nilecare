// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  organizationId: string;
  appointmentDate: Date;
  appointmentType: AppointmentType;
  duration: number; // in minutes
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  location?: string;
  priority: AppointmentPriority;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export type AppointmentType = 
  | 'consultation' 
  | 'follow-up' 
  | 'procedure' 
  | 'emergency' 
  | 'telemedicine';

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in-progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no-show';

export type AppointmentPriority = 
  | 'routine' 
  | 'urgent' 
  | 'emergency';

export interface AppointmentQuery {
  patientId?: string;
  providerId?: string;
  organizationId?: string;
  status?: AppointmentStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
  appointmentType?: AppointmentType;
  priority?: AppointmentPriority;
  page?: number;
  limit?: number;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

// ============================================================================
// BILLING TYPES
// ============================================================================

export interface Billing {
  id: string;
  patientId: string;
  appointmentId?: string;
  organizationId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: BillingStatus;
  description: string;
  items: BillingItem[];
  dueDate?: Date;
  paidDate?: Date;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface BillingItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  discount?: number;
}

export type BillingStatus = 
  | 'draft' 
  | 'pending' 
  | 'paid' 
  | 'overdue' 
  | 'cancelled' 
  | 'refunded';

export interface BillingQuery {
  patientId?: string;
  organizationId?: string;
  status?: BillingStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// SCHEDULE TYPES
// ============================================================================

export interface Schedule {
  id: string;
  staffId: string;
  organizationId: string;
  startTime: Date;
  endTime: Date;
  scheduleType: ScheduleType;
  location?: string;
  notes?: string;
  status: ScheduleStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export type ScheduleType = 
  | 'shift' 
  | 'appointment' 
  | 'time-off' 
  | 'break' 
  | 'meeting';

export type ScheduleStatus = 
  | 'scheduled' 
  | 'active' 
  | 'completed' 
  | 'cancelled';

export interface ScheduleQuery {
  staffId?: string;
  organizationId?: string;
  scheduleType?: ScheduleType;
  status?: ScheduleStatus;
  startDate?: string;
  endDate?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface ScheduleConflict {
  existingSchedule: Schedule;
  conflictType: 'overlap' | 'double-booking' | 'unavailable';
  message: string;
}

// ============================================================================
// STAFF TYPES
// ============================================================================

export interface Staff {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  hireDate?: Date;
  terminationDate?: Date;
  status: StaffStatus;
  availability: StaffAvailability;
  credentials: StaffCredential[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export type StaffRole = 
  | 'doctor' 
  | 'nurse' 
  | 'receptionist' 
  | 'admin' 
  | 'technician' 
  | 'therapist';

export type StaffStatus = 
  | 'active' 
  | 'on-leave' 
  | 'suspended' 
  | 'terminated';

export interface StaffAvailability {
  monday?: TimeRange[];
  tuesday?: TimeRange[];
  wednesday?: TimeRange[];
  thursday?: TimeRange[];
  friday?: TimeRange[];
  saturday?: TimeRange[];
  sunday?: TimeRange[];
}

export interface TimeRange {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

export interface StaffCredential {
  type: string;
  number: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
  verified: boolean;
}

export interface StaffQuery {
  organizationId?: string;
  role?: StaffRole;
  status?: StaffStatus;
  department?: string;
  specialization?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// PAGINATION & COMMON TYPES
// ============================================================================

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

