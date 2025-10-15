/**
 * Document Export API Routes
 * 
 * Endpoints for exporting clinical documents to various formats
 * Supports PDF, HTML, XML, FHIR
 * All endpoints require authentication
 */

import { Router } from 'express';
import ExportService from '../services/ExportService';
import { validateRequest, schemas } from '../middleware/validation';
import { authenticate, requireRole, requirePermission } from '../../../shared/middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { exportLimiter } from '../middleware/rateLimiter';
import { logClinicalDocumentAction } from '../utils/logger';
import Joi from 'joi';

const router = Router();
const exportService = new ExportService();

/**
 * @swagger
 * /api/v1/export/soap-note/{id}/html:
 *   get:
 *     summary: Export SOAP note to HTML
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: includeSignatures
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeWatermark
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: letterhead
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: HTML document
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get(
  '/soap-note/:id/html',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('documents:export'),
  exportLimiter,
  validateRequest({ params: schemas.id }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { includeSignatures, includeWatermark, letterhead } = req.query;

    const html = await exportService.exportSOAPNoteToHTML(id, {
      includeSignatures: includeSignatures !== 'false',
      includeWatermark: includeWatermark === 'true',
      letterhead: letterhead === 'true'
    });

    const userId = (req as any).user?.userId;
    logClinicalDocumentAction({
      action: 'exported',
      documentType: 'soap-note',
      documentId: id,
      patientId: 'logged-separately',
      userId
    });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="soap-note-${id}.html"`);
    res.status(200).send(html);
  })
);

/**
 * @swagger
 * /api/v1/export/soap-note/{id}/fhir:
 *   get:
 *     summary: Export SOAP note to FHIR format
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/soap-note/:id/fhir',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('documents:export'),
  exportLimiter,
  validateRequest({ params: schemas.id }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const fhirResource = await exportService.exportSOAPNoteToFHIR(id);

    res.setHeader('Content-Type', 'application/fhir+json');
    res.status(200).json(fhirResource);
  })
);

/**
 * @swagger
 * /api/v1/export/problem-list/{patientId}/html:
 *   get:
 *     summary: Export problem list to HTML
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/problem-list/:patientId/html',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('documents:export'),
  exportLimiter,
  validateRequest({
    params: Joi.object({ patientId: schemas.uuid })
  }),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { activeOnly, includeResolved } = req.query;

    const html = await exportService.exportProblemListToHTML(patientId, {
      activeOnly: activeOnly === 'true',
      includeResolved: includeResolved === 'true'
    });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="problem-list-${patientId}.html"`);
    res.status(200).send(html);
  })
);

/**
 * @swagger
 * /api/v1/export/progress-note/{id}/html:
 *   get:
 *     summary: Export progress note to HTML
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/progress-note/:id/html',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('documents:export'),
  exportLimiter,
  validateRequest({ params: schemas.id }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const html = await exportService.exportProgressNoteToHTML(id);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="progress-note-${id}.html"`);
    res.status(200).send(html);
  })
);

/**
 * @swagger
 * /api/v1/export/document/{id}/xml:
 *   get:
 *     summary: Export document to CDA XML
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/document/:id/xml',
  authenticate,
  requireRole(['doctor', 'admin']),
  requirePermission('documents:export'),
  exportLimiter,
  validateRequest({
    params: schemas.id,
    query: Joi.object({
      documentType: Joi.string().valid('soap-note', 'progress-note', 'problem-list').required()
    })
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { documentType } = req.query;

    const xml = await exportService.exportToXML(id, documentType as string);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${documentType}-${id}.xml"`);
    res.status(200).send(xml);
  })
);

export default router;

