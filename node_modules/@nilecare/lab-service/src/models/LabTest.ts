/**
 * Lab Test Model (PostgreSQL)
 * Represents individual lab tests and panels
 */

export interface LabTest {
  id: string;
  testCode: string; // LOINC code
  testName: string;
  category: 'hematology' | 'chemistry' | 'microbiology' | 'immunology' | 'pathology' | 'molecular' | 'toxicology' | 'other';
  specimen Type: string; // blood, urine, tissue, etc.
  methodology: string; // e.g., "PCR", "ELISA", "spectrophotometry"
  
  // Turnaround time
  tat: number; // in hours
  tatUnit: 'hours' | 'days';
  
  // Reference ranges (can be age/gender specific)
  referenceRanges: Array<{
    minAge?: number;
    maxAge?: number;
    gender?: 'male' | 'female' | 'all';
    minValue: number;
    maxValue: number;
    unit: string;
  }>;
  
  // Critical values
  criticalValueLow?: number;
  criticalValueHigh?: number;
  criticalValueUnit?: string;
  
  // Pricing
  basePrice?: number;
  currency?: string;
  
  // Requirements
  fastingRequired: boolean;
  specialInstructions?: string;
  
  // Status
  status: 'active' | 'inactive' | 'discontinued';
  
  // Multi-facility support
  facilityId?: string; // NULL = available to all facilities
  organizationId: string;
  
  // Audit fields
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabPanel {
  id: string;
  panelCode: string;
  panelName: string;
  description?: string;
  category: string;
  
  // Tests included in panel
  testIds: string[];
  
  // Pricing
  basePrice?: number;
  currency?: string;
  
  // Status
  status: 'active' | 'inactive';
  
  // Multi-facility support
  facilityId?: string;
  organizationId: string;
  
  // Audit fields
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabTestDTO {
  testCode: string;
  testName: string;
  category: string;
  specimenType: string;
  methodology: string;
  tat: number;
  tatUnit?: string;
  referenceRanges: any[];
  criticalValueLow?: number;
  criticalValueHigh?: number;
  criticalValueUnit?: string;
  fastingRequired?: boolean;
  specialInstructions?: string;
  basePrice?: number;
  facilityId?: string;
  organizationId: string;
  createdBy: string;
}

export default LabTest;

