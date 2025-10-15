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
export declare enum ResolutionAction {
    ADJUST_PAYMENT = "adjust_payment",
    REFUND = "refund",
    WRITE_OFF = "write_off",
    CONTACT_PROVIDER = "contact_provider",
    NONE = "none"
}
export declare class ReconciliationDtoValidator {
    /**
     * Validation schema for reconciliation
     */
    static schema: Joi.ObjectSchema<any>;
    /**
     * Validation schema for resolving discrepancy
     */
    static resolveSchema: Joi.ObjectSchema<any>;
    /**
     * Validate reconciliation DTO
     */
    static validate(data: ReconciliationDto): {
        error?: Joi.ValidationError;
        value: ReconciliationDto;
    };
    /**
     * Validate resolve discrepancy DTO
     */
    static validateResolve(data: ResolveDiscrepancyDto): {
        error?: Joi.ValidationError;
        value: ResolveDiscrepancyDto;
    };
}
export default ReconciliationDto;
//# sourceMappingURL=reconciliation.dto.d.ts.map