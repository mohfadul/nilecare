/**
 * Clinical Guidelines API Routes
 * 
 * Endpoints for accessing clinical practice guidelines
 * All endpoints require authentication
 */

import { Router } from 'express';
import { ClinicalGuidelinesService } from '../services/ClinicalGuidelinesService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const guidelinesService = new ClinicalGuidelinesService();

/**
 * @swagger
 * /api/v1/clinical-guidelines/search:
 *   get:
 *     summary: Search clinical guidelines
 *     tags: [Clinical Guidelines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q } = req.query;

    const guidelines = await guidelinesService.searchGuidelines(q as string);

    res.status(200).json({
      success: true,
      data: {
        query: q,
        guidelines,
        count: guidelines.length
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/clinical-guidelines/{id}:
 *   get:
 *     summary: Get guideline by ID
 *     tags: [Clinical Guidelines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Guideline details
 *       404:
 *         description: Guideline not found
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const guideline = await guidelinesService.getGuidelineById(id);

    if (!guideline) {
      return res.status(404).json({
        success: false,
        error: { message: 'Guideline not found' }
      });
    }

    res.status(200).json({
      success: true,
      data: guideline
    });
  })
);

/**
 * @swagger
 * /api/v1/clinical-guidelines/statistics:
 *   get:
 *     summary: Get guideline database statistics
 *     tags: [Clinical Guidelines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics
 */
router.get(
  '/statistics',
  asyncHandler(async (req, res) => {
    const stats = await guidelinesService.getStatistics();

    res.status(200).json({
      success: true,
      data: stats
    });
  })
);

export default router;

