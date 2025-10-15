/**
 * Vital Signs Service
 * Processes and stores vital signs data from devices
 */
import { Pool } from 'pg';
import { VitalSignsDTO, VitalSignsQueryParams, IVitalSigns } from '../models/VitalSigns';
export declare class VitalSignsService {
    private vitalSignsRepository;
    private deviceRepository;
    private alertRepository;
    private fhirIntegration;
    private hl7Integration;
    private notificationIntegration;
    constructor(pool: Pool);
    /**
     * Process and store vital signs data
     */
    processVitalSigns(vitalSignsData: VitalSignsDTO): Promise<IVitalSigns>;
    /**
     * Check for critical values
     */
    private checkCriticalValues;
    /**
     * Get vital signs by device
     */
    getVitalSignsByDevice(deviceId: string, params: VitalSignsQueryParams): Promise<{
        data: IVitalSigns[];
        total: number;
    }>;
    /**
     * Get vital signs by patient
     */
    getVitalSignsByPatient(patientId: string, params: VitalSignsQueryParams): Promise<{
        data: IVitalSigns[];
        total: number;
    }>;
    /**
     * Get latest vital signs for a device
     */
    getLatestVitalSigns(deviceId: string, tenantId: string): Promise<IVitalSigns | null>;
    /**
     * Get vital signs trends
     */
    getVitalSignsTrends(patientId: string, parameter: string, startTime: Date, endTime: Date, tenantId: string, interval?: string): Promise<any[]>;
    /**
     * Get default alert thresholds (Sudan healthcare standards)
     */
    private getDefaultThresholds;
}
export default VitalSignsService;
//# sourceMappingURL=VitalSignsService.d.ts.map