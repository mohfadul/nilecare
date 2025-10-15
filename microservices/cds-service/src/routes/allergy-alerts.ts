/**
 * Allergy Alerts API Routes
 * 
 * Endpoints for checking medication allergies
 * All endpoints require authentication
 */

import { Router } from 'express';
import { AllergyService } from '../services/AllergyService';
import { validateRequest, schemas } from '../middleware/validation';
import { safetyCheckLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const allergyService = new AllergyService();

/**
 * @swagger
 * /api/v1/allergy-alerts/check:
 *   post:
 *     summary: Check for allergy alerts
 *     tags: [Allergy Alerts]
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
 *               - allergies
 *             properties:
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     rxNormCode:
 *                       type: string
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Allergy check result
 */
router.post(
  '/check',
  safetyCheckLimiter,
  asyncHandler(async (req, res) => {
    const { medications, allergies } = req.body;

    const result = await allergyService.checkAllergies(medications, allergies);

    res.status(200).json({
      success: true,
      data: result
    });
  })
);

export default router;

