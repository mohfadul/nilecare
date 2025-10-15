/**
 * Vital Signs Repository
 * Handles time-series vital signs data storage and retrieval
 */
import { Pool } from 'pg';
import { IVitalSigns, VitalSignsDTO, VitalSignsQueryParams } from '../models/VitalSigns';
export declare class VitalSignsRepository {
    private pool;
    constructor(pool: Pool);
    create(vitalSignsData: VitalSignsDTO): Promise<IVitalSigns>;
    findByDevice(deviceId: string, params: VitalSignsQueryParams): Promise<{
        data: IVitalSigns[];
        total: number;
    }>;
    findByPatient(patientId: string, params: VitalSignsQueryParams): Promise<{
        data: IVitalSigns[];
        total: number;
    }>;
    getLatest(deviceId: string, tenantId: string): Promise<IVitalSigns | null>;
    getAverages(deviceId: string, startTime: Date, endTime: Date, tenantId: string): Promise<any>;
    getTrends(patientId: string, parameter: string, startTime: Date, endTime: Date, tenantId: string, interval?: string): Promise<any[]>;
    private mapRowToVitalSigns;
}
export default VitalSignsRepository;
//# sourceMappingURL=VitalSignsRepository.d.ts.map