"use strict";
/**
 * Validation Utilities
 * Common validation functions for device integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVitalSignsRange = exports.validateConnectionParams = exports.sanitizeString = exports.isValidVitalSign = exports.isValidAlertSeverity = exports.isValidAlertType = exports.isValidDeviceStatus = exports.isValidDeviceProtocol = exports.isValidDeviceType = exports.isValidUUID = void 0;
const Device_1 = require("../models/Device");
const Alert_1 = require("../models/Alert");
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.isValidUUID = isValidUUID;
const isValidDeviceType = (type) => {
    return Object.values(Device_1.DeviceType).includes(type);
};
exports.isValidDeviceType = isValidDeviceType;
const isValidDeviceProtocol = (protocol) => {
    return Object.values(Device_1.DeviceProtocol).includes(protocol);
};
exports.isValidDeviceProtocol = isValidDeviceProtocol;
const isValidDeviceStatus = (status) => {
    return Object.values(Device_1.DeviceStatus).includes(status);
};
exports.isValidDeviceStatus = isValidDeviceStatus;
const isValidAlertType = (type) => {
    return Object.values(Alert_1.AlertType).includes(type);
};
exports.isValidAlertType = isValidAlertType;
const isValidAlertSeverity = (severity) => {
    return Object.values(Alert_1.AlertSeverity).includes(severity);
};
exports.isValidAlertSeverity = isValidAlertSeverity;
const isValidVitalSign = (value, min, max) => {
    return value >= min && value <= max;
};
exports.isValidVitalSign = isValidVitalSign;
const sanitizeString = (input) => {
    return input.trim().replace(/[<>]/g, '');
};
exports.sanitizeString = sanitizeString;
const validateConnectionParams = (protocol, params) => {
    switch (protocol) {
        case Device_1.DeviceProtocol.MQTT:
            return !!(params.mqttBroker && params.mqttTopic);
        case Device_1.DeviceProtocol.SERIAL:
            return !!(params.serialPort && params.baudRate);
        case Device_1.DeviceProtocol.MODBUS:
            return !!(params.modbusHost && params.modbusPort);
        case Device_1.DeviceProtocol.WEBSOCKET:
            return !!params.wsUrl;
        case Device_1.DeviceProtocol.HL7:
            return !!(params.hl7Host && params.hl7Port);
        case Device_1.DeviceProtocol.FHIR:
            return !!params.fhirEndpoint;
        case Device_1.DeviceProtocol.REST_API:
            return !!params.apiUrl;
        default:
            return false;
    }
};
exports.validateConnectionParams = validateConnectionParams;
const validateVitalSignsRange = (parameter, value) => {
    const ranges = {
        temperature: { min: 30, max: 45 },
        heartRate: { min: 0, max: 300 },
        respiratoryRate: { min: 0, max: 60 },
        bloodPressureSystolic: { min: 0, max: 300 },
        bloodPressureDiastolic: { min: 0, max: 200 },
        oxygenSaturation: { min: 0, max: 100 },
        pulseRate: { min: 0, max: 300 },
    };
    const range = ranges[parameter];
    if (!range)
        return true; // Unknown parameter, allow it
    return value >= range.min && value <= range.max;
};
exports.validateVitalSignsRange = validateVitalSignsRange;
exports.default = {
    isValidUUID: exports.isValidUUID,
    isValidDeviceType: exports.isValidDeviceType,
    isValidDeviceProtocol: exports.isValidDeviceProtocol,
    isValidDeviceStatus: exports.isValidDeviceStatus,
    isValidAlertType: exports.isValidAlertType,
    isValidAlertSeverity: exports.isValidAlertSeverity,
    isValidVitalSign: exports.isValidVitalSign,
    sanitizeString: exports.sanitizeString,
    validateConnectionParams: exports.validateConnectionParams,
    validateVitalSignsRange: exports.validateVitalSignsRange,
};
//# sourceMappingURL=validators.js.map