import { Router } from 'express';
import { DiagnosticController } from '../controllers/DiagnosticController';
import { validateRequest, schemas } from '../middleware/validation';
// ✅ MIGRATED: Using shared authentication middleware
import { authenticate, requireRole, requirePermission } from '../../../shared/middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const diagnosticController = new DiagnosticController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Diagnostic:
 *       type: object
 *       required:
 *         - patientId
 *         - testType
 *         - orderedBy
 *         - orderDate
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         testType:
 *           type: string
 *           description: Type of diagnostic test
 *         testName:
 *           type: string
 *           description: Specific name of the test
 *         orderedBy:
 *           type: string
 *           format: uuid
 *         orderDate:
 *           type: string
 *           format: date-time
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *         completedDate:
 *           type: string
 *           format: date-time
 *         results:
 *           type: object
 *           description: Test results
 *         status:
 *           type: string
 *           enum: [ordered, scheduled, in-progress, completed, cancelled]
 *         priority:
 *           type: string
 *           enum: [routine, urgent, stat]
 *         notes:
 *           type: string
 *           description: Additional notes about the test
 *         facility:
 *           type: string
 *           description: Where the test was performed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/diagnostics:
 *   get:
 *     summary: Get all diagnostic tests
 *     tags: [Diagnostics]
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
 *         description: Number of diagnostics per page
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by patient ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ordered, scheduled, in-progress, completed, cancelled]
 *         description: Filter by test status
 *       - in: query
 *         name: testType
 *         schema:
 *           type: string
 *         description: Filter by test type
 *     responses:
 *       200:
 *         description: List of diagnostic tests retrieved successfully
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
 *                     diagnostics:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Diagnostic'
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
  requireRole(['doctor', 'nurse', 'technician', 'admin']),
  validateRequest({ query: schemas.pagination }),
  asyncHandler(diagnosticController.getAllDiagnostics)
);

/**
 * @swagger
 * /api/v1/diagnostics/{id}:
 *   get:
 *     summary: Get diagnostic test by ID
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Diagnostic test ID
 *     responses:
 *       200:
 *         description: Diagnostic test retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Diagnostic'
 *       404:
 *         description: Diagnostic test not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  requireRole(['doctor', 'nurse', 'technician', 'admin']),
  validateRequest({ params: schemas.id }),
  asyncHandler(diagnosticController.getDiagnosticById)
);

/**
 * @swagger
 * /api/v1/diagnostics:
 *   post:
 *     summary: Order a new diagnostic test
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Diagnostic'
 *     responses:
 *       201:
 *         description: Diagnostic test ordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Diagnostic'
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
  requirePermission('diagnostics:order'),
  asyncHandler(diagnosticController.orderDiagnostic)
);

/**
 * @swagger
 * /api/v1/diagnostics/{id}:
 *   put:
 *     summary: Update diagnostic test
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Diagnostic test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Diagnostic'
 *     responses:
 *       200:
 *         description: Diagnostic test updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Diagnostic'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Diagnostic test not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  requireRole(['doctor', 'nurse', 'technician']),
  requirePermission('diagnostics:update'),
  validateRequest({ params: schemas.id }),
  asyncHandler(diagnosticController.updateDiagnostic)
);

/**
 * @swagger
 * /api/v1/diagnostics/{id}/results:
 *   patch:
 *     summary: Add test results
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Diagnostic test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - results
 *               - completedDate
 *             properties:
 *               results:
 *                 type: object
 *                 description: Test results data
 *               completedDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *                 description: Additional notes about the results
 *               facility:
 *                 type: string
 *                 description: Where the test was performed
 *     responses:
 *       200:
 *         description: Test results added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Diagnostic'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Diagnostic test not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/results',
  requireRole(['doctor', 'nurse', 'technician']),
  requirePermission('diagnostics:add-results'),
  validateRequest({ params: schemas.id }),
  asyncHandler(diagnosticController.addResults)
);

export default router;
