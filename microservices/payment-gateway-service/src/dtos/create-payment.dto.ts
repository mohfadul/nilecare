/**
 * Create Payment DTO
 * Data Transfer Object for initiating a payment
 */

import Joi from 'joi';

export interface CreatePaymentDto {
  // Required fields
  invoiceId: string;
  patientId: string;
  facilityId: string;
  providerName: string; // e.g., 'zain_cash', 'bank_of_khartoum'
  amount: number;
  
  // Optional fields
  currency?: string; // Defaults to 'SDG'
  externalReference?: string; // Customer reference
  paymentMethodDetails?: PaymentMethodDetailsDto;
  metadata?: Record<string, any>;
  
  // Sudan-specific
  sudanState?: string;
  phoneNumber?: string; // For mobile wallet payments
}

export interface PaymentMethodDetailsDto {
  // For mobile wallet
  phoneNumber?: string;
  walletName?: string;
  
  // For cash
  denominationBreakdown?: Record<string, number>;
  receivedBy?: string;
  
  // For cheque
  chequeNumber?: string;
  bank?: string;
  chequeDate?: string;
  
  // For bank transfer
  accountNumber?: string;
  bankName?: string;
  transferReference?: string;
}

export class CreatePaymentDtoValidator {
  /**
   * Validation schema
   */
  static schema = Joi.object({
    invoiceId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Invoice ID must be a valid UUID',
        'any.required': 'Invoice ID is required'
      }),
    
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
    
    providerName: Joi.string().required().valid(
      // Bank cards
      'visa', 'mastercard',
      // Local banks
      'bank_of_khartoum', 'faisal_islamic', 'omdurman_national',
      // Mobile wallets
      'zain_cash', 'mtn_money', 'sudani_cash', 'bankak',
      // Traditional
      'cash', 'cheque', 'bank_transfer'
    ).messages({
      'any.required': 'Payment provider is required',
      'any.only': 'Invalid payment provider'
    }),
    
    amount: Joi.number().positive().precision(2).required()
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount is required'
      }),
    
    currency: Joi.string().length(3).uppercase().default('SDG')
      .messages({
        'string.length': 'Currency must be a 3-letter code',
        'string.uppercase': 'Currency must be uppercase'
      }),
    
    externalReference: Joi.string().max(255).optional(),
    
    paymentMethodDetails: Joi.object({
      phoneNumber: Joi.string().pattern(/^\+249[0-9]{9}$/).optional()
        .messages({
          'string.pattern.base': 'Phone number must be in Sudan format (+249XXXXXXXXX)'
        }),
      walletName: Joi.string().max(100).optional(),
      denominationBreakdown: Joi.object().pattern(Joi.string(), Joi.number()).optional(),
      receivedBy: Joi.string().max(255).optional(),
      chequeNumber: Joi.string().max(50).optional(),
      bank: Joi.string().max(100).optional(),
      chequeDate: Joi.date().iso().optional(),
      accountNumber: Joi.string().max(50).optional(),
      bankName: Joi.string().max(100).optional(),
      transferReference: Joi.string().max(255).optional()
    }).optional(),
    
    metadata: Joi.object().optional(),
    
    sudanState: Joi.string().valid(
      'Khartoum', 'Gezira', 'Red Sea', 'Kassala', 'Gedaref',
      'White Nile', 'Blue Nile', 'Northern', 'River Nile',
      'North Kordofan', 'South Kordofan', 'West Kordofan',
      'North Darfur', 'South Darfur', 'West Darfur',
      'East Darfur', 'Central Darfur', 'Sennar'
    ).optional(),
    
    phoneNumber: Joi.string().pattern(/^\+249[0-9]{9}$/).optional()
      .messages({
        'string.pattern.base': 'Phone number must be in Sudan format (+249XXXXXXXXX)'
      })
  });

  /**
   * Validate create payment DTO
   */
  static validate(data: CreatePaymentDto): { error?: Joi.ValidationError; value: CreatePaymentDto } {
    return this.schema.validate(data, { abortEarly: false });
  }
}

export default CreatePaymentDto;

