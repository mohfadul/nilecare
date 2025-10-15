/**
 * PHI Audit Middleware
 * Automatically logs all PHI access through API endpoints
 * Sudan-specific: Tracks Sudan National ID access
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name?: string;
                role?: string;
                facilityId: string;
                tenantId: string;
                permissions?: string[];
            };
            requestId?: string;
            sessionId?: string;
            startTime?: number;
        }
    }
}
export interface PHIResourceConfig {
    resourceType: string;
    patientIdField?: string;
    requiresAudit: boolean;
    sensitiveFields?: string[];
}
/**
 * Middleware to log PHI access
 */
export declare const auditPHIAccess: (config: PHIResourceConfig) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to require access reason for sensitive operations
 */
export declare const requireAccessReason: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to check patient consent before access
 */
export declare const checkPatientConsent: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to track Sudan National ID access
 */
export declare const trackSudanNationalIdAccess: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
declare const _default: {
    auditPHIAccess: (config: PHIResourceConfig) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAccessReason: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    checkPatientConsent: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    trackSudanNationalIdAccess: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
};
export default _default;
//# sourceMappingURL=phiAuditMiddleware.d.ts.map