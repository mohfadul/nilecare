/**
 * Validation Middleware
 * Request validation using Joi schemas
 */
import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
/**
 * Validate request body using Joi schema
 */
export declare const validateBody: (schema: ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate request query parameters
 */
export declare const validateQuery: (schema: ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate request parameters
 */
export declare const validateParams: (schema: ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    validateBody: (schema: ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
    validateQuery: (schema: ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
    validateParams: (schema: ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=validation.middleware.d.ts.map