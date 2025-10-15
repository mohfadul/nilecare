/**
 * Device Routes
 * API routes for device management
 */

import express, { Router } from 'express';
import { DeviceController } from '../controllers/DeviceController';
import { authenticate, authorize } from '../middleware/auth';
import {
  validateDeviceRegistration,
  validateDeviceUpdate,
  validateDeviceId,
  validatePagination,
} from '../middleware/validation';
import { registrationLimiter, standardLimiter } from '../middleware/rateLimiter';
import { getPool } from '../config/database';

const router: Router = express.Router();

// Initialize controller (will be done in index.ts)
let deviceController: DeviceController;

export const initializeDeviceRoutes = (): Router => {
  const pool = getPool();
  deviceController = new DeviceController(pool);

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
  router.post(
    '/',
    authenticate,
    authorize('admin', 'clinician', 'technician'),
    registrationLimiter,
    validateDeviceRegistration,
    deviceController.registerDevice
  );

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
  router.get(
    '/:deviceId',
    authenticate,
    standardLimiter,
    validateDeviceId,
    deviceController.getDevice
  );

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
  router.get(
    '/',
    authenticate,
    standardLimiter,
    validatePagination,
    deviceController.getAllDevices
  );

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
  router.patch(
    '/:deviceId',
    authenticate,
    authorize('admin', 'clinician', 'technician'),
    standardLimiter,
    validateDeviceId,
    validateDeviceUpdate,
    deviceController.updateDevice
  );

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
  router.patch(
    '/:deviceId/status',
    authenticate,
    authorize('admin', 'clinician', 'technician'),
    standardLimiter,
    validateDeviceId,
    deviceController.updateDeviceStatus
  );

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
  router.delete(
    '/:deviceId',
    authenticate,
    authorize('admin'),
    standardLimiter,
    validateDeviceId,
    deviceController.deleteDevice
  );

  // Additional routes
  router.get(
    '/facility/:facilityId',
    authenticate,
    standardLimiter,
    deviceController.getDevicesByFacility
  );

  router.get(
    '/status/online',
    authenticate,
    standardLimiter,
    deviceController.getOnlineDevices
  );

  router.get(
    '/:deviceId/health',
    authenticate,
    standardLimiter,
    validateDeviceId,
    deviceController.checkDeviceHealth
  );

  router.post(
    '/:deviceId/heartbeat',
    authenticate,
    standardLimiter,
    validateDeviceId,
    deviceController.updateHeartbeat
  );

  return router;
};

export default router;

