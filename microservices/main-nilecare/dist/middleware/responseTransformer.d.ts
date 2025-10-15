/**
 * Response Transformation Middleware
 * Transforms and normalizes responses from backend services
 *
 * ✅ Integrated from gateway-service into main-nilecare
 */
import { Request, Response, NextFunction } from 'express';
export interface TransformConfig {
    wrapResponse?: boolean;
    addMetadata?: boolean;
    removeFields?: string[];
}
/**
 * Response transformer middleware
 * Can be configured to wrap responses, add metadata, or remove sensitive fields
 */
export declare const responseTransformer: (config?: TransformConfig) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Default export with common configuration
 */
declare const _default: (req: Request, res: Response, next: NextFunction) => void;
export default _default;
//# sourceMappingURL=responseTransformer.d.ts.map