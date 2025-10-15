/**
 * Patient-related types
 */

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: Address;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: EmergencyContact;
  insuranceInfo?: InsuranceInfo;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  expiryDate?: Date;
}

export type BloodType = 
  | 'A+' | 'A-' 
  | 'B+' | 'B-' 
  | 'AB+' | 'AB-' 
  | 'O+' | 'O-';

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: Address;
  bloodType?: BloodType;
  organizationId: string;
}

export interface UpdatePatientInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: Address;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: EmergencyContact;
  insuranceInfo?: InsuranceInfo;
  isActive?: boolean;
}

