/**
 * Vital Signs Routes
 * API routes for vital signs data management
 */

import express, { Router } from 'express';
import { VitalSignsController } from '../controllers/VitalSignsController';
import { authenticate, authorize } from '../middleware/auth';
import { validateVitalSignsData, validatePagination } from '../middleware/validation';
import { vitalSignsLimiter, standardLimiter } from '../middleware/rateLimiter';
import { getPool } from '../config/database';

const router: Router = express.Router();
let vitalSignsController: VitalSignsController;

export const initializeVitalSignsRoutes = (): Router => {
  const pool = getPool();
  vitalSignsController = new VitalSignsController(pool);

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
  router.post(
    '/',
    authenticate,
    vitalSignsLimiter,
    validateVitalSignsData,
    vitalSignsController.submitVitalSigns
  );

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
  router.get(
    '/device/:deviceId',
    authenticate,
    standardLimiter,
    validatePagination,
    vitalSignsController.getVitalSignsByDevice
  );

  /**
   * @swagger
   * /api/v1/vital-signs/patient/{patientId}:
   *   get:
   *     summary: Get vital signs by patient
   *     tags: [Vital Signs]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    '/patient/:patientId',
    authenticate,
    authorize('admin', 'clinician', 'nurse'),
    standardLimiter,
    validatePagination,
    vitalSignsController.getVitalSignsByPatient
  );

  /**
   * @swagger
   * /api/v1/vital-signs/device/{deviceId}/latest:
   *   get:
   *     summary: Get latest vital signs for a device
   *     tags: [Vital Signs]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    '/device/:deviceId/latest',
    authenticate,
    standardLimiter,
    vitalSignsController.getLatestVitalSigns
  );

  /**
   * @swagger
   * /api/v1/vital-signs/patient/{patientId}/trends:
   *   get:
   *     summary: Get vital signs trends
   *     tags: [Vital Signs]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    '/patient/:patientId/trends',
    authenticate,
    authorize('admin', 'clinician', 'nurse'),
    standardLimiter,
    vitalSignsController.getVitalSignsTrends
  );

  return router;
};

export default router;

