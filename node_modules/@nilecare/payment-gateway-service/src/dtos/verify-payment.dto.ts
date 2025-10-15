/**
 * Verify Payment DTO
 * Data Transfer Object for verifying a payment
 */

import Joi from 'joi';

export interface VerifyPaymentDto {
  paymentId: string;
  verificationCode?: string; // OTP or other verification code
  verificationMethod: VerificationMethod;
  verifiedBy: string; // User ID who verified
  verificationNotes?: string;
  evidenceFiles?: EvidenceFileDto[];
}

export enum VerificationMethod {
  MANUAL = 'manual',
  API = 'api',
  WEBHOOK = 'webhook',
  CASH_RECEIPT = 'cash_receipt',
  BANK_STATEMENT = 'bank_statement'
}

export interface EvidenceFileDto {
  type: 'receipt' | 'screenshot' | 'bank_statement' | 'cheque_photo' | 'other';
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
}

export class VerifyPaymentDtoValidator {
  /**
   * Validation schema
   */
  static schema = Joi.object({
    paymentId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Payment ID must be a valid UUID',
        'any.required': 'Payment ID is required'
      }),
    
    verificationCode: Joi.string().max(50).optional(),
    
    verificationMethod: Joi.string().required().valid(
      'manual', 'api', 'webhook', 'cash_receipt', 'bank_statement'
    ).messages({
      'any.required': 'Verification method is required',
      'any.only': 'Invalid verification method'
    }),
    
    verifiedBy: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Verified by must be a valid user UUID',
        'any.required': 'Verified by is required'
      }),
    
    verificationNotes: Joi.string().max(1000).optional(),
    
    evidenceFiles: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('receipt', 'screenshot', 'bank_statement', 'cheque_photo', 'other').required(),
        fileUrl: Joi.string().uri().required(),
        fileName: Joi.string().max(255).optional(),
        fileSize: Joi.number().integer().positive().optional()
      })
    ).optional()
  });

  /**
   * Validate verify payment DTO
   */
  static validate(data: VerifyPaymentDto): { error?: Joi.ValidationError; value: VerifyPaymentDto } {
    return this.schema.validate(data, { abortEarly: false });
  }
}

export default VerifyPaymentDto;

