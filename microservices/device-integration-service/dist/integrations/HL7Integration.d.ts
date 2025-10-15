/**
 * HL7 Integration
 * Handles HL7 v2.x message parsing and generation
 */
import { VitalSignsData } from '../types';
export declare class HL7Integration {
    private client;
    constructor();
    /**
     * Convert vital signs to HL7 ORU^R01 message (Observation Result)
     */
    convertVitalSignsToHL7(vitalSigns: VitalSignsData): string;
    /**
     * Send HL7 message to HL7 server
     */
    sendMessage(hl7Message: string): Promise<void>;
    /**
     * Parse HL7 message
     */
    parseHL7Message(message: string): any;
    /**
     * Generate ADT^A04 (Register Patient) message for device assignment
     */
    generateDeviceRegistrationMessage(deviceId: string, patientId: string): string;
    /**
     * Format date/time for HL7 (YYYYMMDDHHmmss)
     */
    private formatHL7DateTime;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
}
export default HL7Integration;
//# sourceMappingURL=HL7Integration.d.ts.map