"use strict";
/**
 * Device Routes
 * API routes for device management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDeviceRoutes = void 0;
const express_1 = __importDefault(require("express"));
const DeviceController_1 = require("../controllers/DeviceController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const database_1 = require("../config/database");
const router = express_1.default.Router();
// Initialize controller (will be done in index.ts)
let deviceController;
const initializeDeviceRoutes = () => {
    const pool = (0, database_1.getPool)();
    deviceController = new DeviceController_1.DeviceController(pool);
    /**
     * @swagger
     * /api/v1/devices:
     *   post:
     *     summary: Register a new device
     *     tags: [Devices]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - deviceName
     *               - deviceType
     *               - protocol
     *               - connectionParams
     *               - facilityId
     *             properties:
     *               deviceName:
     *                 type: string
     *               deviceType:
     *                 type: string
     *                 enum: [vital_monitor, infusion_pump, ventilator, ecg, pulse_oximeter, blood_pressure, lab_analyzer, imaging]
     *               protocol:
     *                 type: string
     *                 enum: [mqtt, serial, modbus, websocket, hl7, fhir, bluetooth, usb, rest_api]
     *               connectionParams:
     *                 type: object
     *               facilityId:
     *                 type: string
     *                 format: uuid
     *     responses:
     *       201:
     *         description: Device registered successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     */
    router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin', 'clinician', 'technician'), rateLimiter_1.registrationLimiter, validation_1.validateDeviceRegistration, deviceController.registerDevice);
    /**
     * @swagger
     * /api/v1/devices/{deviceId}:
     *   get:
     *     summary: Get device by ID
     *     tags: [Devices]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: deviceId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Device details
     *       404:
     *         description: Device not found
     */
    router.get('/:deviceId', auth_1.authenticate, rateLimiter_1.standardLimiter, validation_1.validateDeviceId, deviceController.getDevice);
    /**
     * @swagger
     * /api/v1/devices:
     *   get:
     *     summary: Get all devices with filtering and pagination
     *     tags: [Devices]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: facilityId
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: query
     *         name: deviceType
     *         schema:
     *           type: string
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *     responses:
     *       200:
     *         description: List of devices
     */
    router.get('/', auth_1.authenticate, rateLimiter_1.standardLimiter, validation_1.validatePagination, deviceController.getAllDevices);
    /**
     * @swagger
     * /api/v1/devices/{deviceId}:
     *   patch:
     *     summary: Update device
     *     tags: [Devices]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: deviceId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Device updated successfully
     */
    router.patch('/:deviceId', auth_1.authenticate, (0, auth_1.authorize)('admin', 'clinician', 'technician'), rateLimiter_1.standardLimiter, validation_1.validateDeviceId, validation_1.validateDeviceUpdate, deviceController.updateDevice);
    /**
     * @swagger
     * /api/v1/devices/{deviceId}/status:
     *   patch:
     *     summary: Update device status
     *     tags: [Devices]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: deviceId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - status
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [active, inactive, maintenance, error, decommissioned]
     *               changeReason:
     *                 type: string
     *     responses:
     *       200:
     *         description: Device status updated successfully
     */
    router.patch('/:deviceId/status', auth_1.authenticate, (0, auth_1.authorize)('admin', 'clinician', 'technician'), rateLimiter_1.standardLimiter, validation_1.validateDeviceId, deviceController.updateDeviceStatus);
    /**
     * @swagger
     * /api/v1/devices/{deviceId}:
     *   delete:
     *     summary: Delete device
     *     tags: [Devices]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: deviceId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Device deleted successfully
     */
    router.delete('/:deviceId', auth_1.authenticate, (0, auth_1.authorize)('admin'), rateLimiter_1.standardLimiter, validation_1.validateDeviceId, deviceController.deleteDevice);
    // Additional routes
    router.get('/facility/:facilityId', auth_1.authenticate, rateLimiter_1.standardLimiter, deviceController.getDevicesByFacility);
    router.get('/status/online', auth_1.authenticate, rateLimiter_1.standardLimiter, deviceController.getOnlineDevices);
    router.get('/:deviceId/health', auth_1.authenticate, rateLimiter_1.standardLimiter, validation_1.validateDeviceId, deviceController.checkDeviceHealth);
    router.post('/:deviceId/heartbeat', auth_1.authenticate, rateLimiter_1.standardLimiter, validation_1.validateDeviceId, deviceController.updateHeartbeat);
    return router;
};
exports.initializeDeviceRoutes = initializeDeviceRoutes;
exports.default = router;
//# sourceMappingURL=devices.js.map