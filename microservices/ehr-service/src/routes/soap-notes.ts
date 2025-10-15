/**
 * SOAP Notes API Routes
 * 
 * Endpoints for managing SOAP (Subjective, Objective, Assessment, Plan) notes
 * All endpoints require authentication
 */

import { Router } from 'express';
import SOAPNotesService from '../services/SOAPNotesService';
import { validateRequest, schemas } from '../middleware/validation';
import { authenticate, requireRole, requirePermission } from '../../../shared/middleware/auth';
import { asyncHandler, createError, requireUnfinalized } from '../middleware/errorHandler';
import { documentationLimiter, readLimiter } from '../middleware/rateLimiter';
import Joi from 'joi';

const router = Router();
const soapNotesService = new SOAPNotesService();

/**
 * @swagger
 * /api/v1/soap-notes:
 *   post:
 *     summary: Create a new SOAP note
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('soap-notes:create'),
  documentationLimiter,
  validateRequest({ body: schemas.soapNote.create }),
  asyncHandler(async (req, res) => {
    const noteData = {
      ...req.body,
      organizationId: (req as any).user?.organizationId,
      createdBy: (req as any).user?.userId
    };

    if (!noteData.organizationId || !noteData.createdBy) {
      throw createError('User context required', 400);
    }

    const note = await soapNotesService.createSOAPNote(noteData);

    res.status(201).json({
      success: true,
      data: note
    });
  })
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}:
 *   get:
 *     summary: Get SOAP note by ID
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authenticate,
  requireRole(['doctor', 'nurse', 'pharmacist', 'admin']),
  readLimiter,
  validateRequest({ params: schemas.id }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const note = await soapNotesService.getSOAPNoteById(id, userId);

    if (!note) {
      throw createError('SOAP note not found', 404);
    }

    res.status(200).json({
      success: true,
      data: note
    });
  })
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}:
 *   put:
 *     summary: Update SOAP note (draft only)
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('soap-notes:update'),
  documentationLimiter,
  validateRequest({
    params: schemas.id,
    body: schemas.soapNote.update
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw createError('User context required', 400);
    }

    const updatedNote = await soapNotesService.updateSOAPNote(id, req.body, userId);

    if (!updatedNote) {
      throw createError('SOAP note not found or cannot be updated', 404);
    }

    res.status(200).json({
      success: true,
      data: updatedNote
    });
  })
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}/finalize:
 *   post:
 *     summary: Finalize SOAP note (make permanent)
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/finalize',
  authenticate,
  requireRole(['doctor', 'admin']),
  requirePermission('soap-notes:finalize'),
  documentationLimiter,
  validateRequest({
    params: schemas.id,
    body: schemas.soapNote.finalize
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw createError('User context required', 400);
    }

    const finalizedNote = await soapNotesService.finalizeSOAPNote(id, {
      userId,
      attestation: req.body.attestation,
      signature: req.body.signature,
      finalDiagnoses: req.body.finalDiagnoses
    });

    if (!finalizedNote) {
      throw createError('SOAP note not found or cannot be finalized', 404);
    }

    res.status(200).json({
      success: true,
      data: finalizedNote,
      message: 'SOAP note finalized successfully'
    });
  })
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}/amend:
 *   post:
 *     summary: Create amendment to finalized SOAP note
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/amend',
  authenticate,
  requireRole(['doctor', 'admin']),
  requirePermission('soap-notes:amend'),
  documentationLimiter,
  validateRequest({
    params: schemas.id,
    body: schemas.soapNote.amend
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw createError('User context required', 400);
    }

    const amendment = await soapNotesService.createAmendment(id, {
      userId,
      reason: req.body.reason,
      changes: req.body.changes,
      section: req.body.section
    });

    if (!amendment) {
      throw createError('Could not create amendment', 400);
    }

    res.status(201).json({
      success: true,
      data: amendment,
      message: 'Amendment created successfully'
    });
  })
);

/**
 * @swagger
 * /api/v1/soap-notes/patient/{patientId}:
 *   get:
 *     summary: Get SOAP notes for a patient
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
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
    const { encounterId, status, fromDate, toDate, page, limit } = req.query;

    const result = await soapNotesService.getSOAPNotesByPatient(patientId, {
      encounterId: encounterId as string,
      status: status as any,
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
 * /api/v1/soap-notes/{id}/versions:
 *   get:
 *     summary: Get version history for SOAP note
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id/versions',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  readLimiter,
  validateRequest({ params: schemas.id }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const versions = await soapNotesService.getNoteVersions(id);

    res.status(200).json({
      success: true,
      data: {
        noteId: id,
        versions,
        count: versions.length
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}/lock:
 *   post:
 *     summary: Lock SOAP note for editing
 *     tags: [SOAP Notes]
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

    const locked = await soapNotesService.lockNote(id, userId);

    if (!locked) {
      throw createError('Could not lock note - may be locked by another user', 409);
    }

    res.status(200).json({
      success: true,
      message: 'SOAP note locked successfully'
    });
  })
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}/unlock:
 *   post:
 *     summary: Unlock SOAP note
 *     tags: [SOAP Notes]
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

    const unlocked = await soapNotesService.unlockNote(id, userId);

    if (!unlocked) {
      throw createError('Could not unlock note', 409);
    }

    res.status(200).json({
      success: true,
      message: 'SOAP note unlocked successfully'
    });
  })
);

/**
 * @swagger
 * /api/v1/soap-notes/search:
 *   post:
 *     summary: Search SOAP notes
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/search',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
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

    const result = await soapNotesService.searchNotes(searchOptions);

    res.status(200).json({
      success: true,
      data: result
    });
  })
);

/**
 * @swagger
 * /api/v1/soap-notes/statistics:
 *   get:
 *     summary: Get SOAP note statistics
 *     tags: [SOAP Notes]
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

    const stats = await soapNotesService.getStatistics(organizationId, facilityId);

    res.status(200).json({
      success: true,
      data: stats
    });
  })
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}:
 *   delete:
 *     summary: Delete SOAP note (soft delete, draft only)
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(['doctor', 'admin']),
  requirePermission('soap-notes:delete'),
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

    const deleted = await soapNotesService.deleteSOAPNote(id, userId, reason);

    if (!deleted) {
      throw createError('SOAP note not found or cannot be deleted', 404);
    }

    res.status(204).send();
  })
);

export default router;
