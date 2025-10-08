import { Router } from 'express';
import { SOAPNotesController } from '../controllers/SOAPNotesController';
import { validateRequest, schemas } from '../middleware/validation';
import { requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const soapNotesController = new SOAPNotesController();

/**
 * @swagger
 * components:
 *   schemas:
 *     SOAPNote:
 *       type: object
 *       required:
 *         - patientId
 *         - encounterId
 *         - subjective
 *         - objective
 *         - assessment
 *         - plan
 *         - authorId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         encounterId:
 *           type: string
 *           format: uuid
 *         subjective:
 *           type: string
 *           description: Patient's complaints and symptoms
 *         objective:
 *           type: string
 *           description: Physical examination findings and vital signs
 *         assessment:
 *           type: string
 *           description: Clinical assessment and diagnosis
 *         plan:
 *           type: string
 *           description: Treatment plan and follow-up
 *         authorId:
 *           type: string
 *           format: uuid
 *         authorName:
 *           type: string
 *         status:
 *           type: string
 *           enum: [draft, finalized, amended]
 *         noteType:
 *           type: string
 *           enum: [progress, discharge, consultation, procedure]
 *         priority:
 *           type: string
 *           enum: [routine, urgent, stat]
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *               fileSize:
 *                 type: number
 *               uploadDate:
 *                 type: string
 *                 format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/soap-notes:
 *   get:
 *     summary: Get all SOAP notes
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of notes per page
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by patient ID
 *       - in: query
 *         name: encounterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by encounter ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, finalized, amended]
 *         description: Filter by note status
 *       - in: query
 *         name: noteType
 *         schema:
 *           type: string
 *           enum: [progress, discharge, consultation, procedure]
 *         description: Filter by note type
 *     responses:
 *       200:
 *         description: List of SOAP notes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     soapNotes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SOAPNote'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  requireRole(['doctor', 'nurse', 'admin']),
  validateRequest({ query: schemas.pagination }),
  asyncHandler(soapNotesController.getAllSOAPNotes)
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}:
 *   get:
 *     summary: Get SOAP note by ID
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: SOAP note ID
 *     responses:
 *       200:
 *         description: SOAP note retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SOAPNote'
 *       404:
 *         description: SOAP note not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  requireRole(['doctor', 'nurse', 'admin']),
  validateRequest({ params: schemas.id }),
  asyncHandler(soapNotesController.getSOAPNoteById)
);

/**
 * @swagger
 * /api/v1/soap-notes:
 *   post:
 *     summary: Create a new SOAP note
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SOAPNote'
 *     responses:
 *       201:
 *         description: SOAP note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SOAPNote'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  requireRole(['doctor', 'nurse']),
  requirePermission('soap-notes:create'),
  asyncHandler(soapNotesController.createSOAPNote)
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}:
 *   put:
 *     summary: Update SOAP note
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: SOAP note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SOAPNote'
 *     responses:
 *       200:
 *         description: SOAP note updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SOAPNote'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: SOAP note not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  requireRole(['doctor', 'nurse']),
  requirePermission('soap-notes:update'),
  validateRequest({ params: schemas.id }),
  asyncHandler(soapNotesController.updateSOAPNote)
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}/finalize:
 *   patch:
 *     summary: Finalize SOAP note
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: SOAP note ID
 *     responses:
 *       200:
 *         description: SOAP note finalized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SOAPNote'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: SOAP note not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/finalize',
  requireRole(['doctor', 'nurse']),
  requirePermission('soap-notes:finalize'),
  validateRequest({ params: schemas.id }),
  asyncHandler(soapNotesController.finalizeSOAPNote)
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}/amend:
 *   patch:
 *     summary: Amend SOAP note
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: SOAP note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amendmentReason
 *               - amendment
 *             properties:
 *               amendmentReason:
 *                 type: string
 *                 description: Reason for amendment
 *               amendment:
 *                 type: string
 *                 description: Amendment content
 *     responses:
 *       200:
 *         description: SOAP note amended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SOAPNote'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: SOAP note not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/amend',
  requireRole(['doctor', 'nurse']),
  requirePermission('soap-notes:amend'),
  validateRequest({ params: schemas.id }),
  asyncHandler(soapNotesController.amendSOAPNote)
);

/**
 * @swagger
 * /api/v1/soap-notes/{id}/export:
 *   get:
 *     summary: Export SOAP note to PDF
 *     tags: [SOAP Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: SOAP note ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, html, xml]
 *           default: pdf
 *         description: Export format
 *     responses:
 *       200:
 *         description: SOAP note exported successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: SOAP note not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id/export',
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('soap-notes:export'),
  validateRequest({ params: schemas.id }),
  asyncHandler(soapNotesController.exportSOAPNote)
);

export default router;
