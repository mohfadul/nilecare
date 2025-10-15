/**
 * Alerts API Routes
 * 
 * Endpoints for managing clinical alerts
 * All endpoints require authentication
 */

import { Router } from 'express';
import { AlertService } from '../services/AlertService';
import { validateRequest, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const alertService = new AlertService();

/**
 * @swagger
 * /api/v1/alerts/patient/{patientId}:
 *   get:
 *     summary: Get alerts for a patient
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, acknowledged, resolved, dismissed]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, critical]
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of alerts
 */
router.get(
  '/patient/:patientId',
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { status, severity, activeOnly } = req.query;

    const alerts = await alertService.getAlerts(patientId, {
      status: status as any,
      severity: severity as any,
      activeOnly: activeOnly === 'true'
    });

    res.status(200).json({
      success: true,
      data: {
        patientId,
        alerts,
        count: alerts.length
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alert acknowledged
 */
router.post(
  '/:alertId/acknowledge',
  asyncHandler(async (req, res) => {
    const { alertId } = req.params;
    const { note } = req.body;
    const userId = (req as any).user?.userId || 'system';

    const alert = await alertService.acknowledgeAlert(alertId, userId, note);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { message: 'Alert not found' }
      });
    }

    res.status(200).json({
      success: true,
      data: alert
    });
  })
);

/**
 * @swagger
 * /api/v1/alerts/{alertId}/dismiss:
 *   post:
 *     summary: Dismiss an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alert dismissed
 */
router.post(
  '/:alertId/dismiss',
  asyncHandler(async (req, res) => {
    const { alertId } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.userId || 'system';

    const alert = await alertService.dismissAlert(alertId, userId, reason);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { message: 'Alert not found' }
      });
    }

    res.status(200).json({
      success: true,
      data: alert
    });
  })
);

/**
 * @swagger
 * /api/v1/alerts/summary:
 *   get:
 *     summary: Get alert summary
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: facilityId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert summary
 */
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const { organizationId, facilityId } = req.query;

    const summary = await alertService.getAlertSummary(
      organizationId as string,
      facilityId as string
    );

    res.status(200).json({
      success: true,
      data: summary
    });
  })
);

export default router;

