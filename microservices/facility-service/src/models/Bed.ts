/**
 * Bed Model
 * Represents a hospital bed
 */

export interface Bed {
  id: string;
  bedId: string; // UUID
  facilityId: string;
  departmentId: string;
  wardId: string;
  bedNumber: string; // "A-101", "ICU-5"
  bedType: BedType;
  bedStatus: BedStatus;
  patientId?: string;
  assignmentDate?: Date;
  expectedDischargeDate?: Date;
  location?: string; // Room number or location description
  hasOxygen: boolean;
  hasMonitor: boolean;
  hasVentilator: boolean;
  isolationCapable: boolean;
  isActive: boolean;
  notes?: string;
  lastMaintenanceDate?: Date;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BedType = 
  | 'standard' 
  | 'icu' 
  | 'pediatric' 
  | 'maternity' 
  | 'isolation'
  | 'observation'
  | 'recovery';

export type BedStatus = 
  | 'available' 
  | 'occupied' 
  | 'reserved' 
  | 'maintenance' 
  | 'cleaning'
  | 'out_of_service';

/**
 * DTOs for Bed
 */

export interface CreateBedDTO {
  facilityId: string;
  departmentId: string;
  wardId: string;
  bedNumber: string;
  bedType: BedType;
  location?: string;
  hasOxygen?: boolean;
  hasMonitor?: boolean;
  hasVentilator?: boolean;
  isolationCapable?: boolean;
  createdBy: string;
}

export interface UpdateBedDTO {
  bedNumber?: string;
  bedType?: BedType;
  bedStatus?: BedStatus;
  location?: string;
  hasOxygen?: boolean;
  hasMonitor?: boolean;
  hasVentilator?: boolean;
  isolationCapable?: boolean;
  isActive?: boolean;
  notes?: string;
  lastMaintenanceDate?: Date;
  updatedBy?: string;
}

export interface AssignBedDTO {
  bedId: string;
  patientId: string;
  assignmentDate?: Date;
  expectedDischargeDate?: Date;
  notes?: string;
  assignedBy: string;
}

export interface ReleaseBedDTO {
  bedId: string;
  releaseReason?: string;
  releasedBy: string;
}

export interface BedAssignment {
  bedId: string;
  bedNumber: string;
  patientId: string;
  assignmentDate: Date;
  expectedDischargeDate?: Date;
  actualDischargeDate?: Date;
  duration?: number; // In days
  notes?: string;
}

export interface BedSearchParams {
  facilityId?: string;
  departmentId?: string;
  wardId?: string;
  bedType?: BedType;
  bedStatus?: BedStatus;
  patientId?: string;
  hasOxygen?: boolean;
  hasMonitor?: boolean;
  hasVentilator?: boolean;
  isolationCapable?: boolean;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}

export interface BedHistory {
  id: string;
  bedId: string;
  patientId: string;
  assignmentDate: Date;
  dischargeDate?: Date;
  duration?: number;
  reason?: string;
  createdAt: Date;
}

export default Bed;

