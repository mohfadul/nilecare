/**
 * FHIR Integration
 * Handles FHIR R4 resource conversion and synchronization
 */
import { VitalSignsData } from '../types';
export declare class FHIRIntegration {
    private client;
    constructor();
    /**
     * Convert vital signs to FHIR Observation resources
     */
    convertVitalSignsToFHIR(vitalSigns: VitalSignsData): any[];
    /**
     * Send observations to FHIR server
     */
    sendObservations(observations: any[]): Promise<void>;
    /**
     * Create FHIR Device resource
     */
    createDevice(deviceData: any): Promise<any>;
    /**
     * Update FHIR Device resource
     */
    updateDevice(deviceId: string, deviceData: any): Promise<any>;
    /**
     * Get FHIR Observations for a patient
     */
    getPatientObservations(patientId: string, params?: any): Promise<any>;
}
export default FHIRIntegration;
//# sourceMappingURL=FHIRIntegration.d.ts.map