/**
 * Ward Model
 * Represents a ward within a department
 */

export interface Ward {
  id: string;
  wardId: string; // UUID
  facilityId: string;
  departmentId: string;
  name: string;
  wardCode: string; // Ward code (e.g., "MED-A", "ICU-1")
  wardType: WardType;
  floor?: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  nurseStationPhone?: string;
  status: WardStatus;
  isActive: boolean;
  specialtyType?: string;
  genderRestriction?: 'male' | 'female' | 'mixed';
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WardType = 
  | 'general' 
  | 'icu' 
  | 'emergency' 
  | 'maternity' 
  | 'pediatric'
  | 'surgical'
  | 'medical'
  | 'psychiatric'
  | 'isolation';

export type WardStatus = 'active' | 'full' | 'maintenance' | 'closed';

/**
 * DTOs for Ward
 */

export interface CreateWardDTO {
  facilityId: string;
  departmentId: string;
  name: string;
  wardCode: string;
  wardType: WardType;
  floor?: number;
  totalBeds: number;
  nurseStationPhone?: string;
  specialtyType?: string;
  genderRestriction?: 'male' | 'female' | 'mixed';
  createdBy: string;
}

export interface UpdateWardDTO {
  name?: string;
  wardType?: WardType;
  floor?: number;
  totalBeds?: number;
  nurseStationPhone?: string;
  status?: WardStatus;
  isActive?: boolean;
  specialtyType?: string;
  genderRestriction?: 'male' | 'female' | 'mixed';
  updatedBy?: string;
}

export interface WardOccupancy {
  wardId: string;
  wardName: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number; // Percentage
  lastUpdated: Date;
}

export interface WardSearchParams {
  facilityId?: string;
  departmentId?: string;
  wardType?: WardType;
  status?: WardStatus;
  hasAvailableBeds?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export default Ward;

