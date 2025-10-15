/**
 * Payment Allocation DTO
 * For linking payments from Payment Gateway to invoices
 */

import Joi from 'joi';

export interface PaymentAllocationDto {
  invoiceId: string;
  paymentId: string;  // From Payment Gateway
  paymentGatewayReference: string;  // Merchant reference from Payment Gateway
  allocatedAmount: number;
  allocationType?: 'full' | 'partial' | 'installment' | 'overpayment' | 'insurance' | 'patient';
  paymentStatus?: string;  // cached status from Payment Gateway
  paymentDate?: Date | string;
  paymentMethod?: string;  // Provider name from Payment Gateway
  notes?: string;
}

export class PaymentAllocationDtoValidator {
  /**
   * Validation schema
   */
  static schema = Joi.object({
    invoiceId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Invoice ID must be a valid UUID',
        'any.required': 'Invoice ID is required'
      }),
    
    paymentId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Payment ID must be a valid UUID',
        'any.required': 'Payment ID is required'
      }),
    
    paymentGatewayReference: Joi.string().max(255).required()
      .messages({
        'any.required': 'Payment gateway reference is required'
      }),
    
    allocatedAmount: Joi.number().positive().required()
      .messages({
        'number.positive': 'Allocated amount must be positive',
        'any.required': 'Allocated amount is required'
      }),
    
    allocationType: Joi.string().valid(
      'full', 'partial', 'installment', 'overpayment', 'insurance', 'patient'
    ).default('full'),
    
    paymentStatus: Joi.string().max(50).optional(),
    paymentDate: Joi.date().iso().optional(),
    paymentMethod: Joi.string().max(100).optional(),
    notes: Joi.string().max(1000).optional()
  });

  /**
   * Validate payment allocation DTO
   */
  static validate(data: PaymentAllocationDto): { 
    error?: Joi.ValidationError; 
    value: PaymentAllocationDto 
  } {
    return this.schema.validate(data, { abortEarly: false });
  }
}

export default PaymentAllocationDto;

