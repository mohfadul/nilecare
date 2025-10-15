/**
 * Medication Reconciliation Model (MongoDB)
 * Tracks medication reconciliation during care transitions
 */

import { Schema, model, Document } from 'mongoose';

export interface IMedicationReconciliation extends Document {
  // Patient and encounter info
  patientId: string;
  encounterId?: string;
  
  // Reconciliation type
  reconciliationType: 'admission' | 'transfer' | 'discharge';
  
  // Home medications (before admission)
  homeMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    lastTaken?: Date;
    prescribedBy?: string;
    pharmacyName?: string;
    indication?: string;
    notes?: string;
  }>;
  
  // Facility medications (current orders)
  facilityMedications: Array<{
    medicationId: string;
    prescriptionId?: string;
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    startDate: Date;
    endDate?: Date;
    status: string;
  }>;
  
  // Reconciliation results
  continued: Array<{
    medicationName: string;
    homeVersion?: any;
    facilityVersion?: any;
    reason: string;
  }>;
  
  modified: Array<{
    medicationName: string;
    previousDosage: string;
    newDosage: string;
    reason: string;
  }>;
  
  discontinued: Array<{
    medicationName: string;
    reason: string;
    discontinuedBy: string;
  }>;
  
  newlyAdded: Array<{
    medicationName: string;
    medicationId: string;
    reason: string;
    prescribedBy: string;
  }>;
  
  // Discrepancies
  discrepancies: Array<{
    type: 'dosage_mismatch' | 'frequency_mismatch' | 'route_mismatch' | 'missing_medication' | 'duplicate_medication' | 'other';
    description: string;
    resolution?: string;
    resolvedBy?: string;
    resolvedAt?: Date;
  }>;
  
  // Reconciliation details
  reconciledBy: string; // User ID
  reconciledAt: Date;
  reviewedBy?: string; // Pharmacist review
  reviewedAt?: Date;
  
  // Status
  status: 'draft' | 'completed' | 'reviewed' | 'cancelled';
  
  // Patient/family involvement
  patientInterviewed: boolean;
  familyInterviewed: boolean;
  interviewNotes?: string;
  
  // Documentation
  notes?: string;
  attachments?: Array<{
    filename: string;
    url: string;
    uploadedAt: Date;
  }>;
  
  // Multi-facility support
  facilityId: string;
  organizationId: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

const MedicationReconciliationSchema = new Schema<IMedicationReconciliation>(
  {
    patientId: { type: String, required: true, index: true },
    encounterId: { type: String, index: true },
    reconciliationType: {
      type: String,
      enum: ['admission', 'transfer', 'discharge'],
      required: true,
    },
    
    homeMedications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        route: { type: String, required: true },
        lastTaken: Date,
        prescribedBy: String,
        pharmacyName: String,
        indication: String,
        notes: String,
      },
    ],
    
    facilityMedications: [
      {
        medicationId: { type: String, required: true },
        prescriptionId: String,
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        route: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: Date,
        status: String,
      },
    ],
    
    continued: [
      {
        medicationName: { type: String, required: true },
        homeVersion: Schema.Types.Mixed,
        facilityVersion: Schema.Types.Mixed,
        reason: String,
      },
    ],
    
    modified: [
      {
        medicationName: { type: String, required: true },
        previousDosage: { type: String, required: true },
        newDosage: { type: String, required: true },
        reason: { type: String, required: true },
      },
    ],
    
    discontinued: [
      {
        medicationName: { type: String, required: true },
        reason: { type: String, required: true },
        discontinuedBy: { type: String, required: true },
      },
    ],
    
    newlyAdded: [
      {
        medicationName: { type: String, required: true },
        medicationId: { type: String, required: true },
        reason: { type: String, required: true },
        prescribedBy: { type: String, required: true },
      },
    ],
    
    discrepancies: [
      {
        type: {
          type: String,
          enum: ['dosage_mismatch', 'frequency_mismatch', 'route_mismatch', 'missing_medication', 'duplicate_medication', 'other'],
          required: true,
        },
        description: { type: String, required: true },
        resolution: String,
        resolvedBy: String,
        resolvedAt: Date,
      },
    ],
    
    reconciledBy: { type: String, required: true, index: true },
    reconciledAt: { type: Date, required: true },
    reviewedBy: { type: String, index: true },
    reviewedAt: Date,
    
    status: {
      type: String,
      enum: ['draft', 'completed', 'reviewed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    
    patientInterviewed: { type: Boolean, default: false },
    familyInterviewed: { type: Boolean, default: false },
    interviewNotes: String,
    
    notes: String,
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: Date,
      },
    ],
    
    facilityId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
MedicationReconciliationSchema.index({ patientId: 1, reconciliationType: 1 });
MedicationReconciliationSchema.index({ facilityId: 1, status: 1 });
MedicationReconciliationSchema.index({ reconciledAt: -1 });

export const MedicationReconciliation = model<IMedicationReconciliation>(
  'MedicationReconciliation',
  MedicationReconciliationSchema
);

export default MedicationReconciliation;

