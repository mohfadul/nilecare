/**
 * Error Handler Middleware
 * Centralized error handling for the Device Integration Service
 */
import { Request, Response, NextFunction } from 'express';
import { ServiceError } from '../utils/errors';
export declare const errorHandler: (error: Error | ServiceError, req: Request, res: Response, next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map