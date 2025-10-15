/**
 * Sample Model (PostgreSQL)
 * Represents physical specimen samples with chain of custody
 */

export interface Sample {
  id: string;
  sampleNumber: string; // Format: SMP-YYYYMMDD-XXXXXX
  
  // References
  labOrderId: string;
  patientId: string;
  testIds: string[]; // Tests this sample is for
  
  // Sample details
  sampleType: string; // blood, urine, tissue, swab, etc.
  collectionMethod: string;
  collectionSite?: string; // body site
  
  // Volume and container
  volume?: number;
  volumeUnit?: string;
  containerType?: string;
  
  // Collection information
  collectedBy: string; // User ID
  collectionTime: Date;
  collectionNotes?: string;
  
  // Chain of custody
  currentLocation: string;
  custodyChain: Array<{
    action: 'collected' | 'received' | 'processed' | 'stored' | 'discarded';
    performedBy: string;
    location: string;
    timestamp: Date;
    notes?: string;
  }>;
  
  // Quality indicators
  adequateSample: boolean;
  hemolyzed?: boolean;
  lipemic?: boolean;
  icteric?: boolean;
  clotted?: boolean;
  qualityNotes?: string;
  
  // Status
  status: 'collected' | 'in_transit' | 'received' | 'processing' | 'analyzed' | 'stored' | 'discarded';
  
  // Storage
  storageLocation?: string;
  storageTemperature?: number;
  expiryDate?: Date;
  discardedDate?: Date;
  discardedBy?: string;
  discardReason?: string;
  
  // Barcode tracking
  barcodeId?: string;
  
  // Multi-facility support
  facilityId: string;
  organizationId: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSampleDTO {
  labOrderId: string;
  patientId: string;
  testIds: string[];
  sampleType: string;
  collectionMethod: string;
  collectionSite?: string;
  volume?: number;
  volumeUnit?: string;
  containerType?: string;
  collectedBy: string;
  collectionTime: Date;
  collectionNotes?: string;
  adequateSample?: boolean;
  qualityNotes?: string;
  facilityId: string;
  organizationId?: string;
}

export interface UpdateSampleDTO {
  status?: string;
  currentLocation?: string;
  storageLocation?: string;
  adequateSample?: boolean;
  qualityNotes?: string;
}

export default Sample;

