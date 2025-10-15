/**
 * Clinical Document Model
 * 
 * Generic clinical document model for other document types
 * Supports various clinical documentation needs
 */

export interface ClinicalDocument {
  id: string;
  patientId: string;
  encounterId?: string;
  facilityId?: string;
  organizationId: string;
  
  // Document identification
  documentType: 'consultation' | 'referral' | 'operative-note' | 'discharge-summary' | 'history-physical' | 'other';
  title: string;
  content: string;
  
  // Structured data
  structuredData?: {
    diagnoses?: Array<{
      code: string;
      description: string;
      type: string;
    }>;
    procedures?: Array<{
      code: string;
      description: string;
      date: Date;
    }>;
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    [key: string]: any; // Additional structured fields
  };
  
  // Document lifecycle
  status: 'draft' | 'finalized' | 'amended' | 'archived';
  finalizedAt?: Date;
  finalizedBy?: string;
  
  // Amendment tracking
  isAmendment: boolean;
  originalDocumentId?: string;
  amendmentReason?: string;
  
  // Version control
  version: number;
  previousVersionId?: string;
  
  // Attachments
  attachments?: Array<{
    id: string;
    filename: string;
    contentType: string;
    size: number;
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
  }>;
  
  // Audit trail
  createdBy: string;
  updatedBy?: string;
  viewedBy?: string[];
  
  // Metadata
  tags?: string[];
  category?: string;
  
  // Timestamps
  documentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ClinicalDocumentModel {
  /**
   * Convert database row to ClinicalDocument object
   */
  static fromDatabaseRow(row: any): ClinicalDocument {
    return {
      id: row.id,
      patientId: row.patient_id,
      encounterId: row.encounter_id,
      facilityId: row.facility_id,
      organizationId: row.organization_id,
      documentType: row.document_type,
      title: row.title,
      content: row.content,
      structuredData: row.structured_data,
      status: row.status,
      finalizedAt: row.finalized_at,
      finalizedBy: row.finalized_by,
      isAmendment: row.is_amendment || false,
      originalDocumentId: row.original_document_id,
      amendmentReason: row.amendment_reason,
      version: row.version || 1,
      previousVersionId: row.previous_version_id,
      attachments: row.attachments || [],
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      viewedBy: row.viewed_by || [],
      tags: row.tags || [],
      category: row.category,
      documentDate: row.document_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default ClinicalDocument;

