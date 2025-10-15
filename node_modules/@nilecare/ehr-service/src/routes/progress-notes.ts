/**
 * Progress Notes API Routes
 * 
 * Endpoints for managing progress notes (daily, shift, discharge, etc.)
 * All endpoints require authentication
 */

import { Router } from 'express';
import ProgressNoteService from '../services/ProgressNoteService';
import { validateRequest, schemas } from '../middleware/validation';
import { authenticate, requireRole, requirePermission } from '../../../shared/middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { documentationLimiter, readLimiter } from '../middleware/rateLimiter';
import Joi from 'joi';

const router = Router();
const progressNoteService = new ProgressNoteService();

/**
 * @swagger
 * /api/v1/progress-notes:
 *   post:
 *     summary: Create a new progress note
 *     tags: [Progress Notes]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('progress-notes:create'),
  documentationLimiter,
  validateRequest({ body: schemas.progressNote.create }),
  asyncHandler(async (req, res) => {
    const noteData = {
      ...req.body,
      organizationId: (req as any).user?.organizationId,
      createdBy: (req as any).user?.userId
    };

    if (!noteData.organizationId || !noteData.createdBy) {
      throw createError('User context required', 400);
    }

    const note = await progressNoteService.createProgressNote(noteData);

    res.status(201).json({
      success: true,
      data: note
    });
  })
);

/**
 * @swagger
 * /api/v1/progress-notes/{id}:
 *   get:
 *     summary: Get progress note by ID
 *     tags: [Progress Notes]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  readLimiter,
  validateRequest({ params: schemas.id }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const note = await progressNoteService.getProgressNoteById(id, userId);

    if (!note) {
      throw createError('Progress note not found', 404);
    }

    res.status(200).json({
      success: true,
      data: note
    });
  })
);

/**
 * @swagger
 * /api/v1/progress-notes/{id}:
 *   put:
 *     summary: Update progress note
 *     tags: [Progress Notes]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('progress-notes:update'),
  documentationLimiter,
  validateRequest({
    params: schemas.id,
    body: schemas.progressNote.update
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw createError('User context required', 400);
    }

    const updatedNote = await progressNoteService.updateProgressNote(id, req.body, userId);

    if (!updatedNote) {
      throw createError('Progress note not found', 404);
    }

    res.status(200).json({
      success: true,
      data: updatedNote
    });
  })
);

/**
 * @swagger
 * /api/v1/progress-notes/{id}/finalize:
 *   post:
 *     summary: Finalize progress note
 *     tags: [Progress Notes]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/finalize',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('progress-notes:finalize'),
  documentationLimiter,
  validateRequest({ params: schemas.id }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw createError('User context required', 400);
    }

    const finalizedNote = await progressNoteService.finalizeProgressNote(id, userId);

    if (!finalizedNote) {
      throw createError('Progress note not found or cannot be finalized', 404);
    }

    res.status(200).json({
      success: true,
      data: finalizedNote
    });
  })
);

/**
 * @swagger
 * /api/v1/progress-notes/patient/{patientId}:
 *   get:
 *     summary: Get progress notes for a patient
 *     tags: [Progress Notes]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/patient/:patientId',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  readLimiter,
  validateRequest({
    params: Joi.object({ patientId: schemas.uuid })
  }),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { noteType, encounterId, condition, fromDate, toDate, page, limit } = req.query;

    const result = await progressNoteService.getProgressNotesByPatient(patientId, {
      noteType: noteType as any,
      encounterId: encounterId as string,
      condition: condition as any,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.status(200).json({
      success: true,
      data: result
    });
  })
);

/**
 * @swagger
 * /api/v1/progress-notes/attention-required:
 *   get:
 *     summary: Get notes requiring attention
 *     tags: [Progress Notes]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/attention-required',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  asyncHandler(async (req, res) => {
    const organizationId = (req as any).user?.organizationId;
    const facilityId = req.query.facilityId as string;

    if (!organizationId) {
      throw createError('Organization context required', 400);
    }

    const notes = await progressNoteService.getNotesRequiringAttention(organizationId, facilityId);

    res.status(200).json({
      success: true,
      data: {
        notes,
        count: notes.length
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/progress-notes/statistics:
 *   get:
 *     summary: Get progress note statistics
 *     tags: [Progress Notes]
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

    const stats = await progressNoteService.getStatistics(organizationId, facilityId);

    res.status(200).json({
      success: true,
      data: stats
    });
  })
);

/**
 * @swagger
 * /api/v1/progress-notes/{id}/lock:
 *   post:
 *     summary: Lock note for editing
 *     tags: [Progress Notes]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/lock',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  validateRequest({ params: schemas.id }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const locked = await progressNoteService.lockNote(id, userId);

    if (!locked) {
      throw createError('Could not lock note - may be locked by another user', 409);
    }

    res.status(200).json({
      success: true,
      message: 'Note locked successfully'
    });
  })
);

/**
 * @swagger
 * /api/v1/progress-notes/{id}/unlock:
 *   post:
 *     summary: Unlock note
 *     tags: [Progress Notes]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/unlock',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  validateRequest({ params: schemas.id }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const unlocked = await progressNoteService.unlockNote(id, userId);

    if (!unlocked) {
      throw createError('Could not unlock note', 409);
    }

    res.status(200).json({
      success: true,
      message: 'Note unlocked successfully'
    });
  })
);

export default router;

