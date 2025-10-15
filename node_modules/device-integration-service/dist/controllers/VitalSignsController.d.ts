/**
 * Vital Signs Controller
 * Handles HTTP requests for vital signs data
 */
import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
export declare class VitalSignsController {
    private vitalSignsService;
    constructor(pool: Pool);
    /**
     * Submit vital signs data
     * POST /api/v1/vital-signs
     */
    submitVitalSigns: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get vital signs by device
     * GET /api/v1/vital-signs/device/:deviceId
     */
    getVitalSignsByDevice: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get vital signs by patient
     * GET /api/v1/vital-signs/patient/:patientId
     */
    getVitalSignsByPatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get latest vital signs for a device
     * GET /api/v1/vital-signs/device/:deviceId/latest
     */
    getLatestVitalSigns: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get vital signs trends
     * GET /api/v1/vital-signs/patient/:patientId/trends
     */
    getVitalSignsTrends: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export default VitalSignsController;
//# sourceMappingURL=VitalSignsController.d.ts.map