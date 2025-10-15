"use strict";
/**
 * Vital Signs Routes
 * API routes for vital signs data management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeVitalSignsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const VitalSignsController_1 = require("../controllers/VitalSignsController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const database_1 = require("../config/database");
const router = express_1.default.Router();
let vitalSignsController;
const initializeVitalSignsRoutes = () => {
    const pool = (0, database_1.getPool)();
    vitalSignsController = new VitalSignsController_1.VitalSignsController(pool);
    /**
     * @swagger
     * /api/v1/vital-signs:
     *   post:
     *     summary: Submit vital signs data
     *     tags: [Vital Signs]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - deviceId
     *               - patientId
     *             properties:
     *               deviceId:
     *                 type: string
     *                 format: uuid
     *               patientId:
     *                 type: string
     *                 format: uuid
     *               temperature:
     *                 type: number
     *               heartRate:
     *                 type: integer
     *               respiratoryRate:
     *                 type: integer
     *               bloodPressureSystolic:
     *                 type: integer
     *               bloodPressureDiastolic:
     *                 type: integer
     *               oxygenSaturation:
     *                 type: integer
     *               pulseRate:
     *                 type: integer
     *     responses:
     *       201:
     *         description: Vital signs processed successfully
     */
    router.post('/', auth_1.authenticate, rateLimiter_1.vitalSignsLimiter, validation_1.validateVitalSignsData, vitalSignsController.submitVitalSigns);
    /**
     * @swagger
     * /api/v1/vital-signs/device/{deviceId}:
     *   get:
     *     summary: Get vital signs by device
     *     tags: [Vital Signs]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: deviceId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: query
     *         name: startTime
     *         schema:
     *           type: string
     *           format: date-time
     *       - in: query
     *         name: endTime
     *         schema:
     *           type: string
     *           format: date-time
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: List of vital signs
     */
    router.get('/device/:deviceId', auth_1.authenticate, rateLimiter_1.standardLimiter, validation_1.validatePagination, vitalSignsController.getVitalSignsByDevice);
    /**
     * @swagger
     * /api/v1/vital-signs/patient/{patientId}:
     *   get:
     *     summary: Get vital signs by patient
     *     tags: [Vital Signs]
     *     security:
     *       - bearerAuth: []
     */
    router.get('/patient/:patientId', auth_1.authenticate, (0, auth_1.authorize)('admin', 'clinician', 'nurse'), rateLimiter_1.standardLimiter, validation_1.validatePagination, vitalSignsController.getVitalSignsByPatient);
    /**
     * @swagger
     * /api/v1/vital-signs/device/{deviceId}/latest:
     *   get:
     *     summary: Get latest vital signs for a device
     *     tags: [Vital Signs]
     *     security:
     *       - bearerAuth: []
     */
    router.get('/device/:deviceId/latest', auth_1.authenticate, rateLimiter_1.standardLimiter, vitalSignsController.getLatestVitalSigns);
    /**
     * @swagger
     * /api/v1/vital-signs/patient/{patientId}/trends:
     *   get:
     *     summary: Get vital signs trends
     *     tags: [Vital Signs]
     *     security:
     *       - bearerAuth: []
     */
    router.get('/patient/:patientId/trends', auth_1.authenticate, (0, auth_1.authorize)('admin', 'clinician', 'nurse'), rateLimiter_1.standardLimiter, vitalSignsController.getVitalSignsTrends);
    return router;
};
exports.initializeVitalSignsRoutes = initializeVitalSignsRoutes;
exports.default = router;
//# sourceMappingURL=vital-signs.js.map