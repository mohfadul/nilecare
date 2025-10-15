/**
 * Contraindications API Routes
 * 
 * Endpoints for checking drug-disease contraindications
 * All endpoints require authentication
 */

import { Router } from 'express';
import { ContraindicationService } from '../services/ContraindicationService';
import { validateRequest, schemas } from '../middleware/validation';
import { safetyCheckLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const contraindicationService = new ContraindicationService();

/**
 * @swagger
 * /api/v1/contraindications/check:
 *   post:
 *     summary: Check for contraindications
 *     tags: [Contraindications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medications
 *               - conditions
 *             properties:
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Contraindication check result
 */
router.post(
  '/check',
  safetyCheckLimiter,
  validateRequest({ body: schemas.contraindicationCheck }),
  asyncHandler(async (req, res) => {
    const { medications, conditions } = req.body;

    const result = await contraindicationService.checkContraindications(medications, conditions);

    res.status(200).json({
      success: true,
      data: result
    });
  })
);

/**
 * @swagger
 * /api/v1/contraindications/medication/{medicationName}/absolute:
 *   get:
 *     summary: Get absolute contraindications for a medication
 *     tags: [Contraindications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: medicationName
 *         required: true
 *     responses:
 *       200:
 *         description: List of absolute contraindications
 */
router.get(
  '/medication/:medicationName/absolute',
  asyncHandler(async (req, res) => {
    const { medicationName } = req.params;

    const contraindications = await contraindicationService.getAbsoluteContraindications(medicationName);

    res.status(200).json({
      success: true,
      data: {
        medication: medicationName,
        contraindications,
        count: contraindications.length
      }
    });
  })
);

export default router;

