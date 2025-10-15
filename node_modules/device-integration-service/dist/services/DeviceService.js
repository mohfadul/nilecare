"use strict";
/**
 * Device Service
 * Core business logic for device management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceService = void 0;
const DeviceRepository_1 = __importDefault(require("../repositories/DeviceRepository"));
const FHIRIntegration_1 = __importDefault(require("../integrations/FHIRIntegration"));
const NotificationIntegration_1 = __importDefault(require("../integrations/NotificationIntegration"));
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class DeviceService {
    constructor(pool) {
        this.deviceRepository = new DeviceRepository_1.default(pool);
        this.fhirIntegration = new FHIRIntegration_1.default();
        this.notificationIntegration = new NotificationIntegration_1.default();
    }
    /**
     * Register a new device
     */
    async registerDevice(deviceData) {
        logger_1.default.info('Registering new device', { deviceName: deviceData.deviceName });
        // Check if serial number already exists
        if (deviceData.serialNumber) {
            const existing = await this.deviceRepository.findBySerialNumber(deviceData.serialNumber, deviceData.tenantId);
            if (existing) {
                throw new errors_1.ValidationError('Device with this serial number already exists');
            }
        }
        // Create device in database
        const device = await this.deviceRepository.create(deviceData);
        // Create FHIR Device resource (async, don't block)
        this.fhirIntegration
            .createDevice({
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            manufacturer: device.manufacturer,
            modelNumber: device.modelNumber,
            serialNumber: device.serialNumber,
            deviceType: device.deviceType,
        })
            .catch((error) => {
            logger_1.default.error('Failed to create FHIR device:', error);
        });
        // Send notification (async, don't block)
        this.notificationIntegration
            .sendDeviceRegistrationNotification(device.deviceId, device.deviceName, device.facilityId, device.createdBy)
            .catch((error) => {
            logger_1.default.error('Failed to send registration notification:', error);
        });
        logger_1.default.info('Device registered successfully', { deviceId: device.deviceId });
        return device;
    }
    /**
     * Get device by ID
     */
    async getDevice(deviceId, tenantId) {
        const device = await this.deviceRepository.findById(deviceId, tenantId);
        if (!device) {
            throw new errors_1.NotFoundError('Device', deviceId);
        }
        return device;
    }
    /**
     * Get all devices with filtering and pagination
     */
    async getAllDevices(params) {
        return await this.deviceRepository.findAll(params);
    }
    /**
     * Update device
     */
    async updateDevice(deviceId, updateData, tenantId) {
        logger_1.default.info('Updating device', { deviceId });
        const device = await this.deviceRepository.update(deviceId, updateData, tenantId);
        // Update FHIR Device resource (async, don't block)
        this.fhirIntegration
            .updateDevice(deviceId, {
            deviceName: device.deviceName,
            manufacturer: device.manufacturer,
            modelNumber: device.modelNumber,
            serialNumber: device.serialNumber,
            status: device.status,
        })
            .catch((error) => {
            logger_1.default.error('Failed to update FHIR device:', error);
        });
        logger_1.default.info('Device updated successfully', { deviceId });
        return device;
    }
    /**
     * Update device status
     */
    async updateDeviceStatus(deviceId, statusData, tenantId) {
        logger_1.default.info('Updating device status', { deviceId, status: statusData.status });
        const device = await this.deviceRepository.updateStatus(deviceId, statusData, tenantId);
        // Send notification if device went offline or into error state
        if (statusData.status === 'error') {
            this.notificationIntegration
                .sendDeviceConnectionLostNotification(device.deviceId, device.deviceName, device.lastSeen || new Date())
                .catch((error) => {
                logger_1.default.error('Failed to send connection lost notification:', error);
            });
        }
        return device;
    }
    /**
     * Delete device
     */
    async deleteDevice(deviceId, tenantId) {
        logger_1.default.info('Deleting device', { deviceId });
        await this.deviceRepository.delete(deviceId, tenantId);
        logger_1.default.info('Device deleted successfully', { deviceId });
    }
    /**
     * Get devices by facility
     */
    async getDevicesByFacility(facilityId, tenantId) {
        return await this.deviceRepository.getDevicesByFacility(facilityId, tenantId);
    }
    /**
     * Get online devices
     */
    async getOnlineDevices(tenantId) {
        return await this.deviceRepository.getOnlineDevices(tenantId);
    }
    /**
     * Update device heartbeat
     */
    async updateHeartbeat(deviceId, tenantId) {
        await this.deviceRepository.updateLastSeen(deviceId, tenantId);
    }
    /**
     * Check device health
     */
    async checkDeviceHealth(deviceId, tenantId) {
        const device = await this.getDevice(deviceId, tenantId);
        const isOnline = device.lastSeen && device.lastSeen > new Date(Date.now() - 5 * 60 * 1000);
        const isLowBattery = device.batteryLevel !== undefined && device.batteryLevel < 20;
        const needsCalibration = device.nextCalibrationDue && device.nextCalibrationDue <= new Date();
        let healthStatus = 'healthy';
        if (!isOnline) {
            healthStatus = 'offline';
        }
        else if (device.status === 'error') {
            healthStatus = 'critical';
        }
        else if (isLowBattery || needsCalibration) {
            healthStatus = 'warning';
        }
        return {
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            status: device.status,
            healthStatus,
            isOnline,
            lastSeen: device.lastSeen,
            batteryLevel: device.batteryLevel,
            needsCalibration,
            calibrationStatus: device.calibrationStatus,
            nextCalibrationDue: device.nextCalibrationDue,
        };
    }
}
exports.DeviceService = DeviceService;
exports.default = DeviceService;
//# sourceMappingURL=DeviceService.js.map