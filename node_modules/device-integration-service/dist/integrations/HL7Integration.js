"use strict";
/**
 * HL7 Integration
 * Handles HL7 v2.x message parsing and generation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HL7Integration = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class HL7Integration {
    constructor() {
        this.client = axios_1.default.create({
            baseURL: env_1.config.HL7_SERVER_URL,
            headers: {
                'Content-Type': 'application/hl7-v2',
                'X-API-Key': env_1.config.HL7_API_KEY,
            },
            timeout: 10000,
        });
    }
    /**
     * Convert vital signs to HL7 ORU^R01 message (Observation Result)
     */
    convertVitalSignsToHL7(vitalSigns) {
        const timestamp = this.formatHL7DateTime(vitalSigns.timestamp);
        const messageId = this.generateMessageId();
        const segments = [];
        // MSH - Message Header
        segments.push(`MSH|^~\\&|NILECARE_DEVICE|${vitalSigns.deviceId}|NILECARE_EHR|HOSPITAL|${timestamp}||ORU^R01|${messageId}|P|2.5`);
        // PID - Patient Identification
        segments.push(`PID|1||${vitalSigns.patientId}^^^NILECARE||||||||||||||||||||||||||||||`);
        // OBR - Observation Request
        segments.push(`OBR|1|${messageId}||VITALS^Vital Signs||${timestamp}||||||||||||||||||F|||||||`);
        // OBX - Observation Result segments
        let obxIndex = 1;
        if (vitalSigns.temperature !== undefined) {
            segments.push(`OBX|${obxIndex}|NM|TEMP^Body Temperature||${vitalSigns.temperature}|degC|||||F|||${timestamp}`);
            obxIndex++;
        }
        if (vitalSigns.heartRate !== undefined) {
            segments.push(`OBX|${obxIndex}|NM|HR^Heart Rate||${vitalSigns.heartRate}|bpm|||||F|||${timestamp}`);
            obxIndex++;
        }
        if (vitalSigns.bloodPressureSystolic !== undefined) {
            segments.push(`OBX|${obxIndex}|NM|BPS^Blood Pressure Systolic||${vitalSigns.bloodPressureSystolic}|mmHg|||||F|||${timestamp}`);
            obxIndex++;
        }
        if (vitalSigns.bloodPressureDiastolic !== undefined) {
            segments.push(`OBX|${obxIndex}|NM|BPD^Blood Pressure Diastolic||${vitalSigns.bloodPressureDiastolic}|mmHg|||||F|||${timestamp}`);
            obxIndex++;
        }
        if (vitalSigns.oxygenSaturation !== undefined) {
            segments.push(`OBX|${obxIndex}|NM|SPO2^Oxygen Saturation||${vitalSigns.oxygenSaturation}|%|||||F|||${timestamp}`);
            obxIndex++;
        }
        if (vitalSigns.respiratoryRate !== undefined) {
            segments.push(`OBX|${obxIndex}|NM|RR^Respiratory Rate||${vitalSigns.respiratoryRate}|br/min|||||F|||${timestamp}`);
            obxIndex++;
        }
        return segments.join('\r');
    }
    /**
     * Send HL7 message to HL7 server
     */
    async sendMessage(hl7Message) {
        try {
            await this.client.post('/messages', hl7Message, {
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
            logger_1.default.info('HL7 message sent successfully');
        }
        catch (error) {
            logger_1.default.error('Error sending HL7 message:', error);
            throw new errors_1.ExternalServiceError('HL7 Server', 'Failed to send message', error.response?.data);
        }
    }
    /**
     * Parse HL7 message
     */
    parseHL7Message(message) {
        const segments = message.split('\r').filter((seg) => seg.trim().length > 0);
        const parsed = {
            messageType: null,
            messageId: null,
            patientId: null,
            observations: [],
        };
        for (const segment of segments) {
            const fields = segment.split('|');
            const segmentType = fields[0];
            switch (segmentType) {
                case 'MSH':
                    parsed.messageType = fields[8];
                    parsed.messageId = fields[9];
                    break;
                case 'PID':
                    parsed.patientId = fields[3]?.split('^')[0];
                    break;
                case 'OBX':
                    const observation = {
                        setId: fields[1],
                        valueType: fields[2],
                        identifier: fields[3],
                        value: fields[5],
                        units: fields[6],
                        timestamp: fields[14],
                    };
                    parsed.observations.push(observation);
                    break;
            }
        }
        return parsed;
    }
    /**
     * Generate ADT^A04 (Register Patient) message for device assignment
     */
    generateDeviceRegistrationMessage(deviceId, patientId) {
        const timestamp = this.formatHL7DateTime(new Date());
        const messageId = this.generateMessageId();
        const segments = [];
        segments.push(`MSH|^~\\&|NILECARE_DEVICE|${deviceId}|NILECARE_EHR|HOSPITAL|${timestamp}||ADT^A04|${messageId}|P|2.5`);
        segments.push(`EVN|A04|${timestamp}`);
        segments.push(`PID|1||${patientId}^^^NILECARE||||||||||||||||||||||||||||||`);
        return segments.join('\r');
    }
    /**
     * Format date/time for HL7 (YYYYMMDDHHmmss)
     */
    formatHL7DateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `NILECARE${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
}
exports.HL7Integration = HL7Integration;
exports.default = HL7Integration;
//# sourceMappingURL=HL7Integration.js.map