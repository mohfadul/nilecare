"use strict";
/**
 * Validation Middleware
 * Request validation for device integration endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePagination = exports.validateAlertCreation = exports.validateVitalSignsData = exports.validateDeviceId = exports.validateDeviceUpdate = exports.validateDeviceRegistration = void 0;
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
const validateDeviceRegistration = (req, res, next) => {
    try {
        const { deviceName, deviceType, protocol, connectionParams, facilityId, tenantId, createdBy } = req.body;
        if (!deviceName || deviceName.trim().length === 0) {
            throw new errors_1.ValidationError('Device name is required');
        }
        if (!deviceType || !(0, validators_1.isValidDeviceType)(deviceType)) {
            throw new errors_1.ValidationError('Invalid device type');
        }
        if (!protocol || !(0, validators_1.isValidDeviceProtocol)(protocol)) {
            throw new errors_1.ValidationError('Invalid protocol');
        }
        if (!connectionParams || typeof connectionParams !== 'object') {
            throw new errors_1.ValidationError('Connection parameters are required');
        }
        if (!(0, validators_1.validateConnectionParams)(protocol, connectionParams)) {
            throw new errors_1.ValidationError('Invalid connection parameters for the specified protocol');
        }
        if (!facilityId || !(0, validators_1.isValidUUID)(facilityId)) {
            throw new errors_1.ValidationError('Valid facility ID is required');
        }
        if (!tenantId || !(0, validators_1.isValidUUID)(tenantId)) {
            throw new errors_1.ValidationError('Valid tenant ID is required');
        }
        if (!createdBy || !(0, validators_1.isValidUUID)(createdBy)) {
            throw new errors_1.ValidationError('Valid creator ID is required');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateDeviceRegistration = validateDeviceRegistration;
const validateDeviceUpdate = (req, res, next) => {
    try {
        const { deviceType, protocol, status, connectionParams } = req.body;
        if (deviceType && !(0, validators_1.isValidDeviceType)(deviceType)) {
            throw new errors_1.ValidationError('Invalid device type');
        }
        if (protocol && !(0, validators_1.isValidDeviceProtocol)(protocol)) {
            throw new errors_1.ValidationError('Invalid protocol');
        }
        if (status && !(0, validators_1.isValidDeviceStatus)(status)) {
            throw new errors_1.ValidationError('Invalid device status');
        }
        if (connectionParams && protocol) {
            if (!(0, validators_1.validateConnectionParams)(protocol, connectionParams)) {
                throw new errors_1.ValidationError('Invalid connection parameters for the specified protocol');
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateDeviceUpdate = validateDeviceUpdate;
const validateDeviceId = (req, res, next) => {
    try {
        const { deviceId } = req.params;
        if (!deviceId || !(0, validators_1.isValidUUID)(deviceId)) {
            throw new errors_1.ValidationError('Valid device ID is required');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateDeviceId = validateDeviceId;
const validateVitalSignsData = (req, res, next) => {
    try {
        const { deviceId, patientId, temperature, heartRate, bloodPressureSystolic, oxygenSaturation } = req.body;
        if (!deviceId || !(0, validators_1.isValidUUID)(deviceId)) {
            throw new errors_1.ValidationError('Valid device ID is required');
        }
        if (!patientId || !(0, validators_1.isValidUUID)(patientId)) {
            throw new errors_1.ValidationError('Valid patient ID is required');
        }
        // Validate vital signs ranges
        if (temperature !== undefined && !(0, validators_1.validateVitalSignsRange)('temperature', temperature)) {
            throw new errors_1.ValidationError('Temperature value out of valid range (30-45°C)');
        }
        if (heartRate !== undefined && !(0, validators_1.validateVitalSignsRange)('heartRate', heartRate)) {
            throw new errors_1.ValidationError('Heart rate value out of valid range (0-300 BPM)');
        }
        if (bloodPressureSystolic !== undefined &&
            !(0, validators_1.validateVitalSignsRange)('bloodPressureSystolic', bloodPressureSystolic)) {
            throw new errors_1.ValidationError('Blood pressure systolic value out of valid range (0-300 mmHg)');
        }
        if (oxygenSaturation !== undefined &&
            !(0, validators_1.validateVitalSignsRange)('oxygenSaturation', oxygenSaturation)) {
            throw new errors_1.ValidationError('Oxygen saturation value out of valid range (0-100%)');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateVitalSignsData = validateVitalSignsData;
const validateAlertCreation = (req, res, next) => {
    try {
        const { deviceId, patientId, alertType, severity, message } = req.body;
        if (!deviceId || !(0, validators_1.isValidUUID)(deviceId)) {
            throw new errors_1.ValidationError('Valid device ID is required');
        }
        if (!patientId || !(0, validators_1.isValidUUID)(patientId)) {
            throw new errors_1.ValidationError('Valid patient ID is required');
        }
        if (!alertType || !(0, validators_1.isValidAlertType)(alertType)) {
            throw new errors_1.ValidationError('Invalid alert type');
        }
        if (!severity || !(0, validators_1.isValidAlertSeverity)(severity)) {
            throw new errors_1.ValidationError('Invalid alert severity');
        }
        if (!message || message.trim().length === 0) {
            throw new errors_1.ValidationError('Alert message is required');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateAlertCreation = validateAlertCreation;
const validatePagination = (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10);
        const limit = parseInt(req.query.limit, 10);
        if (req.query.page && (isNaN(page) || page < 1)) {
            throw new errors_1.ValidationError('Page must be a positive integer');
        }
        if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 500)) {
            throw new errors_1.ValidationError('Limit must be between 1 and 500');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validatePagination = validatePagination;
exports.default = {
    validateDeviceRegistration: exports.validateDeviceRegistration,
    validateDeviceUpdate: exports.validateDeviceUpdate,
    validateDeviceId: exports.validateDeviceId,
    validateVitalSignsData: exports.validateVitalSignsData,
    validateAlertCreation: exports.validateAlertCreation,
    validatePagination: exports.validatePagination,
};
//# sourceMappingURL=validation.js.map