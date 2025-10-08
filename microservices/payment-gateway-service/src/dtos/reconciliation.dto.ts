/**
 * Reconciliation DTO
 * Data Transfer Object for payment reconciliation
 */

import Joi from 'joi';

export interface ReconciliationDto {
  paymentId: string;
  externalTransactionId?: string;
  externalAmount: number;
  externalCurrency?: string;
  externalFee?: number;
  transactionDate: Date | string;
  bankStatementId?: string;
  statementLineNumber?: number;
  statementFileUrl?: string;
}

export interface ResolveDiscrepancyDto {
  reconciliationId: string;
  resolutionAction: ResolutionAction;
  resolutionNotes: string;
  resolvedBy: string;
}

export enum ResolutionAction {
  ADJUST_PAYMENT = 'adjust_payment',
  REFUND = 'refund',
  WRITE_OFF = 'write_off',
  CONTACT_PROVIDER = 'contact_provider',
  NONE = 'none'
}

export class ReconciliationDtoValidator {
  /**
   * Validation schema for reconciliation
   */
  static schema = Joi.object({
    paymentId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Payment ID must be a valid UUID',
        'any.required': 'Payment ID is required'
      }),
    
    externalTransactionId: Joi.string().max(255).optional(),
    
    externalAmount: Joi.number().positive().precision(2).required()
      .messages({
        'number.base': 'External amount must be a number',
        'number.positive': 'External amount must be positive',
        'any.required': 'External amount is required'
      }),
    
    externalCurrency: Joi.string().length(3).uppercase().default('SDG')
      .messages({
        'string.length': 'Currency must be a 3-letter code'
      }),
    
    externalFee: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'External fee cannot be negative'
      }),
    
    transactionDate: Joi.date().iso().required()
      .messages({
        'date.base': 'Transaction date must be a valid date',
        'any.required': 'Transaction date is required'
      }),
    
    bankStatementId: Joi.string().uuid().optional(),
    statementLineNumber: Joi.number().integer().positive().optional(),
    statementFileUrl: Joi.string().uri().optional()
  });

  /**
   * Validation schema for resolving discrepancy
   */
  static resolveSchema = Joi.object({
    reconciliationId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Reconciliation ID must be a valid UUID',
        'any.required': 'Reconciliation ID is required'
      }),
    
    resolutionAction: Joi.string().required().valid(
      'adjust_payment', 'refund', 'write_off', 'contact_provider', 'none'
    ).messages({
      'any.required': 'Resolution action is required',
      'any.only': 'Invalid resolution action'
    }),
    
    resolutionNotes: Joi.string().min(10).max(1000).required()
      .messages({
        'string.min': 'Resolution notes must be at least 10 characters',
        'string.max': 'Resolution notes cannot exceed 1000 characters',
        'any.required': 'Resolution notes are required'
      }),
    
    resolvedBy: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Resolved by must be a valid user UUID',
        'any.required': 'Resolved by is required'
      })
  });

  /**
   * Validate reconciliation DTO
   */
  static validate(data: ReconciliationDto): { error?: Joi.ValidationError; value: ReconciliationDto } {
    return this.schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate resolve discrepancy DTO
   */
  static validateResolve(data: ResolveDiscrepancyDto): { error?: Joi.ValidationError; value: ResolveDiscrepancyDto } {
    return this.resolveSchema.validate(data, { abortEarly: false });
  }
}

export default ReconciliationDto;

