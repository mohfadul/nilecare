/**
 * Create Payment DTO
 * Data Transfer Object for initiating a payment
 */
import Joi from 'joi';
export interface CreatePaymentDto {
    invoiceId: string;
    patientId: string;
    facilityId: string;
    providerName: string;
    amount: number;
    currency?: string;
    externalReference?: string;
    paymentMethodDetails?: PaymentMethodDetailsDto;
    metadata?: Record<string, any>;
    sudanState?: string;
    phoneNumber?: string;
}
export interface PaymentMethodDetailsDto {
    phoneNumber?: string;
    walletName?: string;
    denominationBreakdown?: Record<string, number>;
    receivedBy?: string;
    chequeNumber?: string;
    bank?: string;
    chequeDate?: string;
    accountNumber?: string;
    bankName?: string;
    transferReference?: string;
}
export declare class CreatePaymentDtoValidator {
    /**
     * Validation schema
     */
    static schema: Joi.ObjectSchema<any>;
    /**
     * Validate create payment DTO
     */
    static validate(data: CreatePaymentDto): {
        error?: Joi.ValidationError;
        value: CreatePaymentDto;
    };
}
export default CreatePaymentDto;
//# sourceMappingURL=create-payment.dto.d.ts.map