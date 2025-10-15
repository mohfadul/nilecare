/**
 * Error Handler Middleware
 * Global error handling for payment gateway service
 */
import { Request, Response, NextFunction } from 'express';
export declare class PaymentError extends Error {
    code: string;
    message: string;
    statusCode: number;
    details?: any | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: any | undefined);
}
export declare const errorHandler: (error: Error | PaymentError, req: Request, res: Response, _next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=error-handler.d.ts.map