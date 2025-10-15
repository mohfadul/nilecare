/**
 * API Versioning Middleware
 * Phase 3: Support multiple API versions simultaneously
 *
 * Supports version detection from:
 * 1. URL path: /api/v1/patients or /api/v2/patients
 * 2. Header: X-API-Version: v1
 * 3. Accept header: Accept: application/vnd.nilecare.v1+json
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            apiVersion?: string;
        }
    }
}
/**
 * Detect API version from request
 */
export declare function detectApiVersion(req: Request, res: Response, next: NextFunction): void;
/**
 * Require specific API version
 */
export declare function requireVersion(version: string): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Version-based response transformation
 */
export declare function transformResponse(version: string, data: any): any;
declare const _default: {
    detectApiVersion: typeof detectApiVersion;
    requireVersion: typeof requireVersion;
    transformResponse: typeof transformResponse;
};
export default _default;
//# sourceMappingURL=version.d.ts.map