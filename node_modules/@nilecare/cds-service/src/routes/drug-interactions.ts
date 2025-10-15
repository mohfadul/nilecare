/**
 * Drug Interactions API Routes
 * 
 * Endpoints for checking drug-drug interactions
 * All endpoints require authentication
 */

import { Router } from 'express';
import { DrugInteractionService } from '../services/DrugInteractionService';
import { validateRequest, schemas } from '../middleware/validation';
import { safetyCheckLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const drugInteractionService = new DrugInteractionService();

/**
 * @swagger
 * /api/v1/drug-interactions/check:
 *   post:
 *     summary: Check for drug-drug interactions
 *     tags: [Drug Interactions]
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
 *             properties:
 *               medications:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     rxNormCode:
 *                       type: string
 *     responses:
 *       200:
 *         description: Interaction check result
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/check',
  safetyCheckLimiter,
  validateRequest({ body: schemas.drugInteractionCheck }),
  asyncHandler(async (req, res) => {
    const { medications } = req.body;

    const result = await drugInteractionService.checkInteractions(medications);

    res.status(200).json({
      success: true,
      data: result
    });
  })
);

/**
 * @swagger
 * /api/v1/drug-interactions/medication/{medicationName}:
 *   get:
 *     summary: Get known interactions for a medication
 *     tags: [Drug Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: medicationName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of interactions
 */
router.get(
  '/medication/:medicationName',
  asyncHandler(async (req, res) => {
    const { medicationName } = req.params;

    const interactions = await drugInteractionService.getInteractionsForMedication(medicationName);

    res.status(200).json({
      success: true,
      data: {
        medication: medicationName,
        interactions,
        count: interactions.length
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/drug-interactions/statistics:
 *   get:
 *     summary: Get drug interaction database statistics
 *     tags: [Drug Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database statistics
 */
router.get(
  '/statistics',
  asyncHandler(async (req, res) => {
    const stats = await drugInteractionService.getStatistics();

    res.status(200).json({
      success: true,
      data: stats
    });
  })
);

export default router;

