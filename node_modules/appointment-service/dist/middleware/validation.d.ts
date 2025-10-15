import { Request, Response, NextFunction } from 'express';
export declare const validateRequest: (schema: any) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRequired: (fields: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateUUID: (field: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateDate: (field: string) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map