/**
 * Update Invoice DTO
 * Data Transfer Object for updating an existing invoice
 */

import Joi from 'joi';

export interface UpdateInvoiceDto {
  // Financial updates
  taxAmount?: number;
  discountAmount?: number;
  adjustmentAmount?: number;
  
  // Status
  status?: string;
  
  // Dates
  dueDate?: Date | string;
  paidDate?: Date | string;
  
  // Payment terms
  paymentTerms?: string;
  gracePeriodDays?: number;
  lateFeePercentage?: number;
  
  // Insurance
  insurancePolicyId?: string;
  insuranceCompany?: string;
  insuranceAuthorizationNumber?: string;
  patientResponsibility?: number;
  insuranceResponsibility?: number;
  
  // Notes
  description?: string;
  internalNotes?: string;
  patientNotes?: string;
}

export class UpdateInvoiceDtoValidator {
  /**
   * Validation schema
   */
  static schema = Joi.object({
    taxAmount: Joi.number().min(0).optional(),
    discountAmount: Joi.number().min(0).optional(),
    adjustmentAmount: Joi.number().optional(),
    
    status: Joi.string().valid(
      'draft', 'pending', 'partially_paid', 'paid',
      'overdue', 'cancelled', 'refunded', 'written_off', 'in_collections'
    ).optional(),
    
    dueDate: Joi.date().iso().optional(),
    paidDate: Joi.date().iso().optional(),
    
    paymentTerms: Joi.string().max(100).optional(),
    gracePeriodDays: Joi.number().integer().min(0).max(365).optional(),
    lateFeePercentage: Joi.number().min(0).max(100).optional(),
    
    insurancePolicyId: Joi.string().uuid().optional(),
    insuranceCompany: Joi.string().max(255).optional(),
    insuranceAuthorizationNumber: Joi.string().max(100).optional(),
    patientResponsibility: Joi.number().min(0).optional(),
    insuranceResponsibility: Joi.number().min(0).optional(),
    
    description: Joi.string().max(1000).optional(),
    internalNotes: Joi.string().max(2000).optional(),
    patientNotes: Joi.string().max(1000).optional()
  }).min(1)
    .messages({
      'object.min': 'At least one field must be provided for update'
    });

  /**
   * Validate update invoice DTO
   */
  static validate(data: UpdateInvoiceDto): { 
    error?: Joi.ValidationError; 
    value: UpdateInvoiceDto 
  } {
    return this.schema.validate(data, { abortEarly: false });
  }
}

export default UpdateInvoiceDto;

