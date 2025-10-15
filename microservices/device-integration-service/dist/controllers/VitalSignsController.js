"use strict";
/**
 * Vital Signs Controller
 * Handles HTTP requests for vital signs data
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitalSignsController = void 0;
const VitalSignsService_1 = __importDefault(require("../services/VitalSignsService"));
class VitalSignsController {
    constructor(pool) {
        /**
         * Submit vital signs data
         * POST /api/v1/vital-signs
         */
        this.submitVitalSigns = async (req, res, next) => {
            try {
                const vitalSigns = await this.vitalSignsService.processVitalSigns({
                    ...req.body,
                    tenantId: req.user.tenantId,
                });
                res.status(201).json({
                    success: true,
                    data: vitalSigns,
                    message: 'Vital signs processed successfully',
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get vital signs by device
         * GET /api/v1/vital-signs/device/:deviceId
         */
        this.getVitalSignsByDevice = async (req, res, next) => {
            try {
                const { deviceId } = req.params;
                const queryParams = {
                    tenantId: req.user.tenantId,
                    deviceId,
                    startTime: req.query.startTime ? new Date(req.query.startTime) : undefined,
                    endTime: req.query.endTime ? new Date(req.query.endTime) : undefined,
                    page: parseInt(req.query.page, 10) || 1,
                    limit: parseInt(req.query.limit, 10) || 100,
                };
                const result = await this.vitalSignsService.getVitalSignsByDevice(deviceId, queryParams);
                res.status(200).json({
                    success: true,
                    data: result.data,
                    pagination: {
                        page: queryParams.page,
                        limit: queryParams.limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / (queryParams.limit || 100)),
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get vital signs by patient
         * GET /api/v1/vital-signs/patient/:patientId
         */
        this.getVitalSignsByPatient = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const queryParams = {
                    tenantId: req.user.tenantId,
                    patientId,
                    startTime: req.query.startTime ? new Date(req.query.startTime) : undefined,
                    endTime: req.query.endTime ? new Date(req.query.endTime) : undefined,
                    page: parseInt(req.query.page, 10) || 1,
                    limit: parseInt(req.query.limit, 10) || 100,
                };
                const result = await this.vitalSignsService.getVitalSignsByPatient(patientId, queryParams);
                res.status(200).json({
                    success: true,
                    data: result.data,
                    pagination: {
                        page: queryParams.page,
                        limit: queryParams.limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / (queryParams.limit || 100)),
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get latest vital signs for a device
         * GET /api/v1/vital-signs/device/:deviceId/latest
         */
        this.getLatestVitalSigns = async (req, res, next) => {
            try {
                const { deviceId } = req.params;
                const vitalSigns = await this.vitalSignsService.getLatestVitalSigns(deviceId, req.user.tenantId);
                res.status(200).json({
                    success: true,
                    data: vitalSigns,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get vital signs trends
         * GET /api/v1/vital-signs/patient/:patientId/trends
         */
        this.getVitalSignsTrends = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { parameter, startTime, endTime, interval } = req.query;
                if (!parameter || !startTime || !endTime) {
                    res.status(400).json({
                        success: false,
                        error: 'Parameter, startTime, and endTime are required',
                    });
                    return;
                }
                const trends = await this.vitalSignsService.getVitalSignsTrends(patientId, parameter, new Date(startTime), new Date(endTime), req.user.tenantId, interval);
                res.status(200).json({
                    success: true,
                    data: trends,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.vitalSignsService = new VitalSignsService_1.default(pool);
    }
}
exports.VitalSignsController = VitalSignsController;
exports.default = VitalSignsController;
//# sourceMappingURL=VitalSignsController.js.map