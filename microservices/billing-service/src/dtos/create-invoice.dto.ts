/**
 * Create Invoice DTO
 * Data Transfer Object for creating a new invoice
 */

import Joi from 'joi';
import { InvoiceType } from '../entities/invoice.entity';

export interface CreateInvoiceDto {
  // Required
  patientId: string;
  facilityId: string;
  invoiceType: InvoiceType;
  invoiceDate: Date | string;
  dueDate: Date | string;
  
  // Optional
  billingAccountId?: string;
  encounterId?: string;
  appointmentId?: string;
  
  // Line items
  lineItems: InvoiceLineItemDto[];
  
  // Financial (optional - calculated from line items)
  taxAmount?: number;
  discountAmount?: number;
  adjustmentAmount?: number;
  
  // Payment terms
  paymentTerms?: string;
  gracePeriodDays?: number;
  lateFeePercentage?: number;
  
  // Insurance
  insurancePolicyId?: string;
  insuranceCompany?: string;
  insuranceAuthorizationNumber?: string;
  
  // Notes
  description?: string;
  internalNotes?: string;
  patientNotes?: string;
  
  // Currency
  currency?: string;
}

export interface InvoiceLineItemDto {
  itemType: string;
  itemCode?: string;
  itemName: string;
  itemDescription?: string;
  
  procedureCode?: string;
  diagnosisCodes?: string[];
  revenueCode?: string;
  modifierCodes?: string;
  
  quantity: number;
  unitOfMeasure?: string;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  
  serviceDate?: Date | string;
  serviceProviderId?: string;
  departmentId?: string;
  
  referenceId?: string;
  referenceType?: string;
  
  notes?: string;
}

export class CreateInvoiceDtoValidator {
  /**
   * Validation schema
   */
  static schema = Joi.object({
    patientId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Patient ID must be a valid UUID',
        'any.required': 'Patient ID is required'
      }),
    
    facilityId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Facility ID must be a valid UUID',
        'any.required': 'Facility ID is required'
      }),
    
    invoiceType: Joi.string().valid(
      'standard', 'insurance', 'emergency', 'pharmacy',
      'lab', 'radiology', 'surgery', 'consultation', 'other'
    ).required(),
    
    invoiceDate: Joi.date().iso().required(),
    
    dueDate: Joi.date().iso().min(Joi.ref('invoiceDate')).required()
      .messages({
        'date.min': 'Due date must be after invoice date'
      }),
    
    billingAccountId: Joi.string().uuid().optional(),
    encounterId: Joi.string().uuid().optional(),
    appointmentId: Joi.string().uuid().optional(),
    
    lineItems: Joi.array().items(
      Joi.object({
        itemType: Joi.string().valid(
          'service', 'medication', 'supply', 'equipment', 
          'room_charge', 'lab_test', 'radiology', 'procedure',
          'consultation', 'other'
        ).required(),
        
        itemCode: Joi.string().max(100).optional(),
        itemName: Joi.string().max(255).required(),
        itemDescription: Joi.string().max(1000).optional(),
        
        procedureCode: Joi.string().max(20).optional(),
        diagnosisCodes: Joi.array().items(Joi.string()).optional(),
        revenueCode: Joi.string().max(10).optional(),
        modifierCodes: Joi.string().max(50).optional(),
        
        quantity: Joi.number().positive().required(),
        unitOfMeasure: Joi.string().max(50).default('each'),
        unitPrice: Joi.number().min(0).required(),
        discountPercent: Joi.number().min(0).max(100).default(0),
        discountAmount: Joi.number().min(0).default(0),
        taxPercent: Joi.number().min(0).max(100).default(0),
        taxAmount: Joi.number().min(0).default(0),
        
        serviceDate: Joi.date().iso().optional(),
        serviceProviderId: Joi.string().uuid().optional(),
        departmentId: Joi.string().uuid().optional(),
        
        referenceId: Joi.string().uuid().optional(),
        referenceType: Joi.string().max(50).optional(),
        
        notes: Joi.string().max(1000).optional()
      })
    ).min(1).required()
      .messages({
        'array.min': 'At least one line item is required'
      }),
    
    taxAmount: Joi.number().min(0).default(0),
    discountAmount: Joi.number().min(0).default(0),
    adjustmentAmount: Joi.number().default(0),
    
    paymentTerms: Joi.string().max(100).default('Net 30'),
    gracePeriodDays: Joi.number().integer().min(0).max(365).default(7),
    lateFeePercentage: Joi.number().min(0).max(100).default(2.0),
    
    insurancePolicyId: Joi.string().uuid().optional(),
    insuranceCompany: Joi.string().max(255).optional(),
    insuranceAuthorizationNumber: Joi.string().max(100).optional(),
    
    description: Joi.string().max(1000).optional(),
    internalNotes: Joi.string().max(2000).optional(),
    patientNotes: Joi.string().max(1000).optional(),
    
    currency: Joi.string().length(3).uppercase().default('SDG')
  });

  /**
   * Validate create invoice DTO
   */
  static validate(data: CreateInvoiceDto): { 
    error?: Joi.ValidationError; 
    value: CreateInvoiceDto 
  } {
    return this.schema.validate(data, { abortEarly: false });
  }
}

export default CreateInvoiceDto;

