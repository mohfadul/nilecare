"use strict";
/**
 * Vital Signs Model
 * Represents vital signs data collected from medical devices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitalSigns = void 0;
class VitalSigns {
    constructor(data) {
        Object.assign(this, data);
        this.observationTime = data.observationTime || new Date();
    }
    toJSON() {
        return {
            observationId: this.observationId,
            deviceId: this.deviceId,
            patientId: this.patientId,
            observationTime: this.observationTime,
            temperature: this.temperature,
            heartRate: this.heartRate,
            respiratoryRate: this.respiratoryRate,
            bloodPressureSystolic: this.bloodPressureSystolic,
            bloodPressureDiastolic: this.bloodPressureDiastolic,
            oxygenSaturation: this.oxygenSaturation,
            pulseRate: this.pulseRate,
            signalQuality: this.signalQuality,
            confidence: this.confidence,
        };
    }
}
exports.VitalSigns = VitalSigns;
exports.default = VitalSigns;
//# sourceMappingURL=VitalSigns.js.map