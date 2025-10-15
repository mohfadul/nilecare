"use strict";
/**
 * Device Controller
 * Handles HTTP requests for device management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceController = void 0;
const DeviceService_1 = __importDefault(require("../services/DeviceService"));
class DeviceController {
    constructor(pool) {
        /**
         * Register a new device
         * POST /api/v1/devices
         */
        this.registerDevice = async (req, res, next) => {
            try {
                const device = await this.deviceService.registerDevice({
                    ...req.body,
                    createdBy: req.user.userId,
                    tenantId: req.user.tenantId,
                });
                res.status(201).json({
                    success: true,
                    data: device,
                    message: 'Device registered successfully',
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get device by ID
         * GET /api/v1/devices/:deviceId
         */
        this.getDevice = async (req, res, next) => {
            try {
                const { deviceId } = req.params;
                const device = await this.deviceService.getDevice(deviceId, req.user.tenantId);
                res.status(200).json({
                    success: true,
                    data: device,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get all devices with filtering and pagination
         * GET /api/v1/devices
         */
        this.getAllDevices = async (req, res, next) => {
            try {
                const queryParams = {
                    tenantId: req.user.tenantId,
                    facilityId: req.query.facilityId,
                    deviceType: req.query.deviceType,
                    status: req.query.status,
                    linkedPatientId: req.query.linkedPatientId,
                    protocol: req.query.protocol,
                    calibrationStatus: req.query.calibrationStatus,
                    page: parseInt(req.query.page, 10) || 1,
                    limit: parseInt(req.query.limit, 10) || 50,
                    sortBy: req.query.sortBy,
                    sortOrder: req.query.sortOrder,
                };
                const result = await this.deviceService.getAllDevices(queryParams);
                res.status(200).json({
                    success: true,
                    data: result.devices,
                    pagination: {
                        page: queryParams.page,
                        limit: queryParams.limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / (queryParams.limit || 50)),
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Update device
         * PATCH /api/v1/devices/:deviceId
         */
        this.updateDevice = async (req, res, next) => {
            try {
                const { deviceId } = req.params;
                const device = await this.deviceService.updateDevice(deviceId, {
                    ...req.body,
                    updatedBy: req.user.userId,
                }, req.user.tenantId);
                res.status(200).json({
                    success: true,
                    data: device,
                    message: 'Device updated successfully',
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Update device status
         * PATCH /api/v1/devices/:deviceId/status
         */
        this.updateDeviceStatus = async (req, res, next) => {
            try {
                const { deviceId } = req.params;
                const device = await this.deviceService.updateDeviceStatus(deviceId, {
                    status: req.body.status,
                    changeReason: req.body.changeReason,
                    errorMessage: req.body.errorMessage,
                    errorCode: req.body.errorCode,
                    updatedBy: req.user.userId,
                }, req.user.tenantId);
                res.status(200).json({
                    success: true,
                    data: device,
                    message: 'Device status updated successfully',
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Delete device
         * DELETE /api/v1/devices/:deviceId
         */
        this.deleteDevice = async (req, res, next) => {
            try {
                const { deviceId } = req.params;
                await this.deviceService.deleteDevice(deviceId, req.user.tenantId);
                res.status(200).json({
                    success: true,
                    message: 'Device deleted successfully',
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get devices by facility
         * GET /api/v1/devices/facility/:facilityId
         */
        this.getDevicesByFacility = async (req, res, next) => {
            try {
                const { facilityId } = req.params;
                const devices = await this.deviceService.getDevicesByFacility(facilityId, req.user.tenantId);
                res.status(200).json({
                    success: true,
                    data: devices,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get online devices
         * GET /api/v1/devices/status/online
         */
        this.getOnlineDevices = async (req, res, next) => {
            try {
                const devices = await this.deviceService.getOnlineDevices(req.user.tenantId);
                res.status(200).json({
                    success: true,
                    data: devices,
                    count: devices.length,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Check device health
         * GET /api/v1/devices/:deviceId/health
         */
        this.checkDeviceHealth = async (req, res, next) => {
            try {
                const { deviceId } = req.params;
                const health = await this.deviceService.checkDeviceHealth(deviceId, req.user.tenantId);
                res.status(200).json({
                    success: true,
                    data: health,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Update device heartbeat
         * POST /api/v1/devices/:deviceId/heartbeat
         */
        this.updateHeartbeat = async (req, res, next) => {
            try {
                const { deviceId } = req.params;
                await this.deviceService.updateHeartbeat(deviceId, req.user.tenantId);
                res.status(200).json({
                    success: true,
                    message: 'Heartbeat updated',
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.deviceService = new DeviceService_1.default(pool);
    }
}
exports.DeviceController = DeviceController;
exports.default = DeviceController;
//# sourceMappingURL=DeviceController.js.map