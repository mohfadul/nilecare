"use strict";
/**
 * Device Model
 * Represents a medical device in the NileCare system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = exports.CalibrationStatus = exports.DeviceStatus = exports.DeviceProtocol = exports.DeviceType = void 0;
var DeviceType;
(function (DeviceType) {
    DeviceType["VITAL_MONITOR"] = "vital_monitor";
    DeviceType["INFUSION_PUMP"] = "infusion_pump";
    DeviceType["VENTILATOR"] = "ventilator";
    DeviceType["ECG"] = "ecg";
    DeviceType["PULSE_OXIMETER"] = "pulse_oximeter";
    DeviceType["BLOOD_PRESSURE"] = "blood_pressure";
    DeviceType["LAB_ANALYZER"] = "lab_analyzer";
    DeviceType["IMAGING"] = "imaging";
    DeviceType["THERMOMETER"] = "thermometer";
    DeviceType["GLUCOMETER"] = "glucometer";
    DeviceType["OTHER"] = "other";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var DeviceProtocol;
(function (DeviceProtocol) {
    DeviceProtocol["MQTT"] = "mqtt";
    DeviceProtocol["SERIAL"] = "serial";
    DeviceProtocol["MODBUS"] = "modbus";
    DeviceProtocol["WEBSOCKET"] = "websocket";
    DeviceProtocol["HL7"] = "hl7";
    DeviceProtocol["FHIR"] = "fhir";
    DeviceProtocol["BLUETOOTH"] = "bluetooth";
    DeviceProtocol["USB"] = "usb";
    DeviceProtocol["REST_API"] = "rest_api";
})(DeviceProtocol || (exports.DeviceProtocol = DeviceProtocol = {}));
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["ACTIVE"] = "active";
    DeviceStatus["INACTIVE"] = "inactive";
    DeviceStatus["MAINTENANCE"] = "maintenance";
    DeviceStatus["ERROR"] = "error";
    DeviceStatus["DECOMMISSIONED"] = "decommissioned";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
var CalibrationStatus;
(function (CalibrationStatus) {
    CalibrationStatus["VALID"] = "valid";
    CalibrationStatus["DUE"] = "due";
    CalibrationStatus["OVERDUE"] = "overdue";
    CalibrationStatus["FAILED"] = "failed";
})(CalibrationStatus || (exports.CalibrationStatus = CalibrationStatus = {}));
class Device {
    constructor(data) {
        Object.assign(this, data);
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }
    isOnline() {
        if (!this.lastSeen)
            return false;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return this.lastSeen > fiveMinutesAgo;
    }
    needsCalibration() {
        if (!this.nextCalibrationDue)
            return false;
        return this.nextCalibrationDue <= new Date();
    }
    isLowBattery() {
        if (this.batteryLevel === undefined)
            return false;
        return this.batteryLevel < 20;
    }
    getHealthStatus() {
        if (!this.isOnline())
            return 'offline';
        if (this.status === DeviceStatus.ERROR)
            return 'critical';
        if (this.isLowBattery() || this.needsCalibration())
            return 'warning';
        return 'healthy';
    }
    toJSON() {
        return {
            deviceId: this.deviceId,
            deviceName: this.deviceName,
            deviceType: this.deviceType,
            manufacturer: this.manufacturer,
            modelNumber: this.modelNumber,
            serialNumber: this.serialNumber,
            protocol: this.protocol,
            firmwareVersion: this.firmwareVersion,
            status: this.status,
            facilityId: this.facilityId,
            linkedPatientId: this.linkedPatientId,
            location: this.location,
            lastSeen: this.lastSeen,
            batteryLevel: this.batteryLevel,
            signalStrength: this.signalStrength,
            calibrationStatus: this.calibrationStatus,
            nextCalibrationDue: this.nextCalibrationDue,
            healthStatus: this.getHealthStatus(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
exports.Device = Device;
exports.default = Device;
//# sourceMappingURL=Device.js.map