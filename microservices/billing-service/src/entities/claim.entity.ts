/**
 * Insurance Claim Entity
 * Represents an insurance claim submission
 */

export interface Claim {
  id: string;
  claimNumber: string;
  
  // References
  invoiceId?: string;
  patientId: string;
  facilityId: string;
  encounterId?: string;
  insurancePolicyId: string;
  billingAccountId: string;
  
  // Claim Type
  claimType: ClaimType;
  claimFormat: ClaimFormat;
  
  // Status
  status: ClaimStatus;
  
  // Dates
  serviceDateFrom: Date;
  serviceDateTo: Date;
  submissionDate?: Date;
  receivedDate?: Date;
  processedDate?: Date;
  paidDate?: Date;
  
  // Financial
  totalCharges: number;
  allowedAmount?: number;
  paidAmount?: number;
  patientResponsibility?: number;
  adjustmentAmount?: number;
  
  // Denial/Rejection
  denialReasonCode?: string;
  denialReasonDescription?: string;
  rejectionReason?: string;
  
  // Payment Info
  remittanceAdviceNumber?: string;
  checkNumber?: string;
  checkDate?: Date;
  electronicPaymentId?: string;
  
  // Resubmission & Appeal
  resubmissionCount: number;
  lastResubmissionDate?: Date;
  appealCount: number;
  lastAppealDate?: Date;
  appealDeadline?: Date;
  
  // Providers
  renderingProviderId?: string;
  billingProviderId?: string;
  referringProviderId?: string;
  
  // EDI
  ediTransactionId?: string;
  ediBatchId?: string;
  payerId?: string;
  
  // Metadata
  claimNotes?: string;
  attachments?: any[];
  
  // Audit
  createdBy: string;
  updatedBy?: string;
  submittedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ClaimType {
  PROFESSIONAL = 'professional',
  INSTITUTIONAL = 'institutional',
  DENTAL = 'dental',
  PHARMACY = 'pharmacy',
  VISION = 'vision'
}

export enum ClaimFormat {
  CMS1500 = 'CMS1500',
  UB04 = 'UB04',
  EDI_837P = 'EDI_837P',
  EDI_837I = 'EDI_837I',
  MANUAL = 'manual'
}

export enum ClaimStatus {
  DRAFT = 'draft',
  READY_TO_SUBMIT = 'ready_to_submit',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  DENIED = 'denied',
  APPEALED = 'appealed',
  PARTIALLY_PAID = 'partially_paid'
}

export class ClaimEntity implements Claim {
  id: string;
  claimNumber: string;
  invoiceId?: string;
  patientId: string;
  facilityId: string;
  encounterId?: string;
  insurancePolicyId: string;
  billingAccountId: string;
  claimType: ClaimType;
  claimFormat: ClaimFormat;
  status: ClaimStatus;
  serviceDateFrom: Date;
  serviceDateTo: Date;
  submissionDate?: Date;
  receivedDate?: Date;
  processedDate?: Date;
  paidDate?: Date;
  totalCharges: number;
  allowedAmount?: number;
  paidAmount?: number;
  patientResponsibility?: number;
  adjustmentAmount?: number;
  denialReasonCode?: string;
  denialReasonDescription?: string;
  rejectionReason?: string;
  remittanceAdviceNumber?: string;
  checkNumber?: string;
  checkDate?: Date;
  electronicPaymentId?: string;
  resubmissionCount: number;
  lastResubmissionDate?: Date;
  appealCount: number;
  lastAppealDate?: Date;
  appealDeadline?: Date;
  renderingProviderId?: string;
  billingProviderId?: string;
  referringProviderId?: string;
  ediTransactionId?: string;
  ediBatchId?: string;
  payerId?: string;
  claimNotes?: string;
  attachments?: any[];
  createdBy: string;
  updatedBy?: string;
  submittedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Claim>) {
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
    this.resubmissionCount = this.resubmissionCount || 0;
    this.appealCount = this.appealCount || 0;
  }

  /**
   * Check if claim can be submitted
   */
  canBeSubmitted(): boolean {
    return this.status === ClaimStatus.DRAFT || 
           this.status === ClaimStatus.READY_TO_SUBMIT;
  }

  /**
   * Check if claim is paid
   */
  isPaid(): boolean {
    return this.status === ClaimStatus.PAID;
  }

  /**
   * Check if claim was denied
   */
  isDenied(): boolean {
    return this.status === ClaimStatus.DENIED;
  }

  /**
   * Check if claim can be appealed
   */
  canBeAppealed(): boolean {
    return this.status === ClaimStatus.DENIED &&
           this.appealDeadline &&
           this.appealDeadline > new Date();
  }

  /**
   * Submit claim
   */
  submit(submittedBy: string): void {
    this.status = ClaimStatus.SUBMITTED;
    this.submissionDate = new Date();
    this.submittedBy = submittedBy;
    this.updatedAt = new Date();
  }

  /**
   * Mark as paid
   */
  markAsPaid(paidAmount: number, paidDate?: Date): void {
    this.status = ClaimStatus.PAID;
    this.paidAmount = paidAmount;
    this.paidDate = paidDate || new Date();
    this.processedDate = this.processedDate || new Date();
    this.updatedAt = new Date();
  }

  /**
   * Deny claim
   */
  deny(reasonCode: string, reasonDescription: string): void {
    this.status = ClaimStatus.DENIED;
    this.denialReasonCode = reasonCode;
    this.denialReasonDescription = reasonDescription;
    this.processedDate = new Date();
    this.updatedAt = new Date();
  }

  /**
   * File appeal
   */
  fileAppeal(): void {
    this.status = ClaimStatus.APPEALED;
    this.appealCount++;
    this.lastAppealDate = new Date();
    this.updatedAt = new Date();
  }
}

export default ClaimEntity;

