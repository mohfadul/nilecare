/**
 * Vital Signs Model
 * Represents vital signs data collected from medical devices
 */
import { DataQuality, WaveformData } from '../types';
export interface IVitalSigns {
    observationId: string;
    deviceId: string;
    patientId: string;
    observationTime: Date;
    temperature?: number;
    heartRate?: number;
    respiratoryRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    oxygenSaturation?: number;
    pulseRate?: number;
    signalQuality?: string;
    leadOff?: boolean;
    artifacts?: boolean;
    confidence?: number;
    waveformData?: any;
    metadata?: Record<string, any>;
    tenantId: string;
}
export interface VitalSignsDTO {
    deviceId: string;
    patientId: string;
    observationTime?: Date;
    temperature?: number;
    heartRate?: number;
    respiratoryRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    oxygenSaturation?: number;
    pulseRate?: number;
    quality?: DataQuality;
    waveforms?: WaveformData[];
    metadata?: Record<string, any>;
    tenantId: string;
}
export interface VitalSignsQueryParams {
    deviceId?: string;
    patientId?: string;
    startTime?: Date;
    endTime?: Date;
    tenantId: string;
    page?: number;
    limit?: number;
}
export declare class VitalSigns implements IVitalSigns {
    observationId: string;
    deviceId: string;
    patientId: string;
    observationTime: Date;
    temperature?: number;
    heartRate?: number;
    respiratoryRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    oxygenSaturation?: number;
    pulseRate?: number;
    signalQuality?: string;
    leadOff?: boolean;
    artifacts?: boolean;
    confidence?: number;
    waveformData?: any;
    metadata?: Record<string, any>;
    tenantId: string;
    constructor(data: Partial<IVitalSigns>);
    toJSON(): any;
}
export default VitalSigns;
//# sourceMappingURL=VitalSigns.d.ts.map