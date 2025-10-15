/**
 * Validation Middleware
 * Request validation for device integration endpoints
 */
import { Request, Response, NextFunction } from 'express';
export declare const validateDeviceRegistration: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateDeviceUpdate: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateDeviceId: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateVitalSignsData: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateAlertCreation: (req: Request, res: Response, next: NextFunction) => void;
export declare const validatePagination: (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    validateDeviceRegistration: (req: Request, res: Response, next: NextFunction) => void;
    validateDeviceUpdate: (req: Request, res: Response, next: NextFunction) => void;
    validateDeviceId: (req: Request, res: Response, next: NextFunction) => void;
    validateVitalSignsData: (req: Request, res: Response, next: NextFunction) => void;
    validateAlertCreation: (req: Request, res: Response, next: NextFunction) => void;
    validatePagination: (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=validation.d.ts.map