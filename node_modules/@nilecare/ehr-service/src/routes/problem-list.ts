/**
 * Problem List API Routes
 * 
 * Endpoints for managing patient problem lists
 * All endpoints require authentication
 */

import { Router } from 'express';
import ProblemListService from '../services/ProblemListService';
import { validateRequest, schemas } from '../middleware/validation';
import { authenticate, requireRole, requirePermission } from '../../../shared/middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { documentationLimiter, readLimiter } from '../middleware/rateLimiter';
import Joi from 'joi';

const router = Router();
const problemListService = new ProblemListService();

/**
 * @swagger
 * /api/v1/problem-list/patient/{patientId}:
 *   get:
 *     summary: Get problem list for a patient
 *     tags: [Problem List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, chronic, intermittent, recurrent, inactive, resolved, all]
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeResolved
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Problem list retrieved
 */
router.get(
  '/patient/:patientId',
  authenticate,
  requireRole(['doctor', 'nurse', 'pharmacist', 'admin']),
  readLimiter,
  validateRequest({
    params: Joi.object({ patientId: schemas.uuid })
  }),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { status, activeOnly, includeResolved, category } = req.query;

    const problems = await problemListService.getPatientProblemList(patientId, {
      status: status as any,
      activeOnly: activeOnly === 'true',
      includeResolved: includeResolved === 'true',
      category: category as any
    });

    res.status(200).json({
      success: true,
      data: {
        patientId,
        problems,
        count: problems.length
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/problem-list:
 *   post:
 *     summary: Add problem to patient's problem list
 *     tags: [Problem List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Problem added successfully
 */
router.post(
  '/',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('problem-list:create'),
  documentationLimiter,
  validateRequest({ body: schemas.problemList.create }),
  asyncHandler(async (req, res) => {
    const problemData = {
      ...req.body,
      organizationId: (req as any).user?.organizationId,
      createdBy: (req as any).user?.userId
    };

    if (!problemData.organizationId || !problemData.createdBy) {
      throw createError('User context required', 400);
    }

    const problem = await problemListService.addProblem(problemData);

    res.status(201).json({
      success: true,
      data: problem
    });
  })
);

/**
 * @swagger
 * /api/v1/problem-list/{id}:
 *   get:
 *     summary: Get problem by ID
 *     tags: [Problem List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Problem retrieved
 *       404:
 *         description: Problem not found
 */
router.get(
  '/:id',
  authenticate,
  requireRole(['doctor', 'nurse', 'pharmacist', 'admin']),
  readLimiter,
  validateRequest({ params: schemas.id }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const problem = await problemListService.getProblemById(id);

    if (!problem) {
      throw createError('Problem not found', 404);
    }

    res.status(200).json({
      success: true,
      data: problem
    });
  })
);

/**
 * @swagger
 * /api/v1/problem-list/{id}:
 *   put:
 *     summary: Update problem
 *     tags: [Problem List]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('problem-list:update'),
  documentationLimiter,
  validateRequest({
    params: schemas.id,
    body: schemas.problemList.update
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw createError('User context required', 400);
    }

    const updatedProblem = await problemListService.updateProblem(id, req.body, userId);

    if (!updatedProblem) {
      throw createError('Problem not found', 404);
    }

    res.status(200).json({
      success: true,
      data: updatedProblem
    });
  })
);

/**
 * @swagger
 * /api/v1/problem-list/{id}/resolve:
 *   patch:
 *     summary: Resolve a problem
 *     tags: [Problem List]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/resolve',
  authenticate,
  requireRole(['doctor', 'admin']),
  requirePermission('problem-list:resolve'),
  documentationLimiter,
  validateRequest({
    params: schemas.id,
    body: Joi.object({
      reason: Joi.string().required().min(10).max(500),
      resolvedDate: Joi.date().optional(),
      outcome: Joi.string().valid('improved', 'stable', 'worsened', 'resolved', 'deceased').optional(),
      outcomeNotes: Joi.string().max(1000).optional()
    })
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw createError('User context required', 400);
    }

    const resolvedProblem = await problemListService.resolveProblem(id, {
      userId,
      ...req.body
    });

    if (!resolvedProblem) {
      throw createError('Problem not found', 404);
    }

    res.status(200).json({
      success: true,
      data: resolvedProblem
    });
  })
);

/**
 * @swagger
 * /api/v1/problem-list/{id}/reactivate:
 *   patch:
 *     summary: Reactivate a resolved problem
 *     tags: [Problem List]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/reactivate',
  authenticate,
  requireRole(['doctor', 'admin']),
  requirePermission('problem-list:update'),
  documentationLimiter,
  validateRequest({
    params: schemas.id,
    body: Joi.object({
      reason: Joi.string().required().min(10).max(500),
      newSeverity: Joi.string().valid('mild', 'moderate', 'severe').optional()
    })
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw createError('User context required', 400);
    }

    const reactivatedProblem = await problemListService.reactivateProblem(id, {
      userId,
      ...req.body
    });

    if (!reactivatedProblem) {
      throw createError('Problem not found or not in resolved status', 404);
    }

    res.status(200).json({
      success: true,
      data: reactivatedProblem
    });
  })
);

/**
 * @swagger
 * /api/v1/problem-list/search:
 *   post:
 *     summary: Search problem lists
 *     tags: [Problem List]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/search',
  authenticate,
  requireRole(['doctor', 'nurse', 'pharmacist', 'admin']),
  readLimiter,
  asyncHandler(async (req, res) => {
    const organizationId = (req as any).user?.organizationId;

    if (!organizationId) {
      throw createError('Organization context required', 400);
    }

    const searchOptions = {
      organizationId,
      ...req.body
    };

    const result = await problemListService.searchProblems(searchOptions);

    res.status(200).json({
      success: true,
      data: result
    });
  })
);

/**
 * @swagger
 * /api/v1/problem-list/statistics:
 *   get:
 *     summary: Get problem list statistics
 *     tags: [Problem List]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/statistics',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  asyncHandler(async (req, res) => {
    const organizationId = (req as any).user?.organizationId;
    const facilityId = req.query.facilityId as string;

    if (!organizationId) {
      throw createError('Organization context required', 400);
    }

    const stats = await problemListService.getStatistics(organizationId, facilityId);

    res.status(200).json({
      success: true,
      data: stats
    });
  })
);

/**
 * @swagger
 * /api/v1/problem-list/{id}:
 *   delete:
 *     summary: Delete problem (soft delete)
 *     tags: [Problem List]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(['doctor', 'admin']),
  requirePermission('problem-list:delete'),
  validateRequest({
    params: schemas.id,
    body: Joi.object({
      reason: Joi.string().required().min(10).max(500)
    })
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw createError('User context required', 400);
    }

    const deleted = await problemListService.deleteProblem(id, userId, reason);

    if (!deleted) {
      throw createError('Problem not found', 404);
    }

    res.status(204).send();
  })
);

export default router;

