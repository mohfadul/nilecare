/**
 * Create Claim DTO
 * Data Transfer Object for creating an insurance claim
 */

import Joi from 'joi';
import { ClaimType, ClaimFormat } from '../entities/claim.entity';

export interface CreateClaimDto {
  // Required
  patientId: string;
  facilityId: string;
  insurancePolicyId: string;
  billingAccountId: string;
  claimType: ClaimType;
  claimFormat: ClaimFormat;
  serviceDateFrom: Date | string;
  serviceDateTo: Date | string;
  
  // Optional
  invoiceId?: string;
  encounterId?: string;
  
  // Line items
  lineItems: ClaimLineItemDto[];
  
  // Providers
  renderingProviderId?: string;
  billingProviderId?: string;
  referringProviderId?: string;
  
  // EDI
  payerId?: string;
  
  // Notes
  claimNotes?: string;
  attachments?: AttachmentDto[];
}

export interface ClaimLineItemDto {
  lineNumber: number;
  serviceDate: Date | string;
  procedureCode: string;
  procedureDescription?: string;
  diagnosisCodes: string[];
  modifiers?: string;
  units: number;
  chargeAmount: number;
  revenueCode?: string;
  placeOfServiceCode?: string;
  renderingProviderId?: string;
}

export interface AttachmentDto {
  type: 'medical_record' | 'lab_result' | 'radiology' | 'authorization' | 'other';
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  description?: string;
}

export class CreateClaimDtoValidator {
  /**
   * Validation schema
   */
  static schema = Joi.object({
    patientId: Joi.string().uuid().required(),
    facilityId: Joi.string().uuid().required(),
    insurancePolicyId: Joi.string().uuid().required(),
    billingAccountId: Joi.string().uuid().required(),
    
    claimType: Joi.string().valid(
      'professional', 'institutional', 'dental', 'pharmacy', 'vision'
    ).required(),
    
    claimFormat: Joi.string().valid(
      'CMS1500', 'UB04', 'EDI_837P', 'EDI_837I', 'manual'
    ).required(),
    
    serviceDateFrom: Joi.date().iso().required(),
    serviceDateTo: Joi.date().iso().min(Joi.ref('serviceDateFrom')).required(),
    
    invoiceId: Joi.string().uuid().optional(),
    encounterId: Joi.string().uuid().optional(),
    
    lineItems: Joi.array().items(
      Joi.object({
        lineNumber: Joi.number().integer().positive().required(),
        serviceDate: Joi.date().iso().required(),
        procedureCode: Joi.string().max(20).required(),
        procedureDescription: Joi.string().max(255).optional(),
        diagnosisCodes: Joi.array().items(Joi.string().max(20)).min(1).required(),
        modifiers: Joi.string().max(50).optional(),
        units: Joi.number().positive().required(),
        chargeAmount: Joi.number().positive().required(),
        revenueCode: Joi.string().max(10).optional(),
        placeOfServiceCode: Joi.string().max(10).optional(),
        renderingProviderId: Joi.string().uuid().optional()
      })
    ).min(1).required(),
    
    renderingProviderId: Joi.string().uuid().optional(),
    billingProviderId: Joi.string().uuid().optional(),
    referringProviderId: Joi.string().uuid().optional(),
    
    payerId: Joi.string().max(50).optional(),
    
    claimNotes: Joi.string().max(2000).optional(),
    
    attachments: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('medical_record', 'lab_result', 'radiology', 'authorization', 'other').required(),
        fileUrl: Joi.string().uri().required(),
        fileName: Joi.string().max(255).optional(),
        fileSize: Joi.number().integer().positive().optional(),
        description: Joi.string().max(500).optional()
      })
    ).optional()
  });

  /**
   * Validate create claim DTO
   */
  static validate(data: CreateClaimDto): { 
    error?: Joi.ValidationError; 
    value: CreateClaimDto 
  } {
    return this.schema.validate(data, { abortEarly: false });
  }
}

export default CreateClaimDto;

