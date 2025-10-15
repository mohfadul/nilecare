/**
 * Verify Payment DTO
 * Data Transfer Object for verifying a payment
 */
import Joi from 'joi';
export interface VerifyPaymentDto {
    paymentId: string;
    verificationCode?: string;
    verificationMethod: VerificationMethod;
    verifiedBy: string;
    verificationNotes?: string;
    evidenceFiles?: EvidenceFileDto[];
}
export declare enum VerificationMethod {
    MANUAL = "manual",
    API = "api",
    WEBHOOK = "webhook",
    CASH_RECEIPT = "cash_receipt",
    BANK_STATEMENT = "bank_statement"
}
export interface EvidenceFileDto {
    type: 'receipt' | 'screenshot' | 'bank_statement' | 'cheque_photo' | 'other';
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
}
export declare class VerifyPaymentDtoValidator {
    /**
     * Validation schema
     */
    static schema: Joi.ObjectSchema<any>;
    /**
     * Validate verify payment DTO
     */
    static validate(data: VerifyPaymentDto): {
        error?: Joi.ValidationError;
        value: VerifyPaymentDto;
    };
}
export default VerifyPaymentDto;
//# sourceMappingURL=verify-payment.dto.d.ts.map