/**
 * Department Model
 * Represents a department within a facility (e.g., Cardiology, Surgery)
 */

export interface Department {
  id: string;
  departmentId: string; // UUID
  facilityId: string;
  name: string;
  code: string; // Department code (e.g., "CARD", "SURG")
  description?: string;
  headOfDepartment?: string; // User ID
  specialization: string;
  floor?: number;
  building?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  operatingHours?: DepartmentOperatingHours;
  staffCount?: number;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentOperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

/**
 * DTOs for Department
 */

export interface CreateDepartmentDTO {
  facilityId: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: string;
  specialization: string;
  floor?: number;
  building?: string;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: DepartmentOperatingHours;
  createdBy: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  description?: string;
  headOfDepartment?: string;
  specialization?: string;
  floor?: number;
  building?: string;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: DepartmentOperatingHours;
  isActive?: boolean;
  updatedBy?: string;
}

export interface DepartmentSearchParams {
  facilityId?: string;
  specialization?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export default Department;

