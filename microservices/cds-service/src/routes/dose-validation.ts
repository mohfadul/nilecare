/**
 * Dose Validation API Routes
 * 
 * Endpoints for validating medication dosages
 * All endpoints require authentication
 */

import { Router } from 'express';
import { DoseValidationService } from '../services/DoseValidationService';
import { validateRequest, schemas } from '../middleware/validation';
import { safetyCheckLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const doseValidationService = new DoseValidationService();

/**
 * @swagger
 * /api/v1/dose-validation/validate:
 *   post:
 *     summary: Validate medication doses
 *     tags: [Dose Validation]
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
 *               - patientData
 *             properties:
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     dose:
 *                       type: string
 *                     frequency:
 *                       type: string
 *                     route:
 *                       type: string
 *               patientData:
 *                 type: object
 *                 properties:
 *                   patientId:
 *                     type: string
 *                   age:
 *                     type: number
 *                   weight:
 *                     type: number
 *                   renalFunction:
 *                     type: number
 *                   hepaticFunction:
 *                     type: string
 *     responses:
 *       200:
 *         description: Dose validation results
 */
router.post(
  '/validate',
  safetyCheckLimiter,
  asyncHandler(async (req, res) => {
    const { medications, patientData } = req.body;

    const result = await doseValidationService.validateDoses(medications, patientData);

    res.status(200).json({
      success: true,
      data: result
    });
  })
);

export default router;

