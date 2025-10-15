/**
 * Request Logger Middleware
 * Logs all HTTP requests and responses
 */
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
declare const logger: winston.Logger;
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export { logger };
export default requestLogger;
//# sourceMappingURL=request-logger.d.ts.map