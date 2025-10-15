/**
 * Facility Model
 * Represents a healthcare facility (hospital, clinic, lab, pharmacy)
 */

export interface Facility {
  id: string;
  facilityId: string; // UUID
  organizationId: string;
  facilityCode: string; // Unique code (e.g., "KTH-001")
  name: string;
  type: FacilityType;
  address: FacilityAddress;
  contact: FacilityContact;
  capacity: FacilityCapacity;
  licensing: FacilityLicensing;
  operatingHours: OperatingHours;
  services: string[]; // Services offered
  status: FacilityStatus;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FacilityType = 
  | 'hospital' 
  | 'clinic' 
  | 'lab' 
  | 'pharmacy' 
  | 'rehabilitation'
  | 'diagnostic_center'
  | 'urgent_care'
  | 'specialty_clinic';

export type FacilityStatus = 'active' | 'inactive' | 'maintenance' | 'closed';

export interface FacilityAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface FacilityContact {
  phone: string;
  email: string;
  fax?: string;
  website?: string;
  emergencyContact?: string;
}

export interface FacilityCapacity {
  totalBeds: number;
  availableBeds: number;
  icuBeds: number;
  emergencyBeds: number;
  operatingRooms: number;
}

export interface FacilityLicensing {
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate: Date;
  accreditations: string[];
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  is24Hours: boolean;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // "08:00"
  closeTime?: string; // "18:00"
}

/**
 * DTOs for Facility
 */

export interface CreateFacilityDTO {
  organizationId: string;
  facilityCode: string;
  name: string;
  type: FacilityType;
  address: FacilityAddress;
  contact: FacilityContact;
  capacity?: FacilityCapacity;
  licensing?: FacilityLicensing;
  operatingHours?: OperatingHours;
  services?: string[];
  createdBy: string;
}

export interface UpdateFacilityDTO {
  name?: string;
  type?: FacilityType;
  address?: FacilityAddress;
  contact?: FacilityContact;
  capacity?: FacilityCapacity;
  licensing?: FacilityLicensing;
  operatingHours?: OperatingHours;
  services?: string[];
  status?: FacilityStatus;
  isActive?: boolean;
  updatedBy?: string;
}

export interface FacilitySearchParams {
  organizationId?: string;
  type?: FacilityType;
  status?: FacilityStatus;
  city?: string;
  state?: string;
  search?: string; // Search by name or code
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export default Facility;

