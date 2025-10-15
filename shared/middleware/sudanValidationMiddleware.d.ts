/**
 * Express middleware for Sudan-specific validation
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to validate Sudan mobile phone number
 */
export declare const validateSudanPhone: (field?: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to validate Sudan National ID
 */
export declare const validateSudanNationalId: (field?: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to validate Sudan address
 */
export declare const validateSudanAddressMiddleware: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to validate patient data for Sudan
 */
export declare const validateSudanPatientData: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to validate facility data for Sudan
 */
export declare const validateSudanFacilityData: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
declare const _default: {
    validateSudanPhone: (field?: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateSudanNationalId: (field?: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateSudanAddressMiddleware: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateSudanPatientData: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateSudanFacilityData: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
};
export default _default;
//# sourceMappingURL=sudanValidationMiddleware.d.ts.map