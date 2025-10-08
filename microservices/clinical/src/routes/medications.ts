import { Router } from 'express';
import { MedicationController } from '../controllers/MedicationController';
import { validateRequest, schemas } from '../middleware/validation';
import { requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const medicationController = new MedicationController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Medication:
 *       type: object
 *       required:
 *         - name
 *         - dosage
 *         - frequency
 *         - route
 *         - startDate
 *         - patientId
 *         - prescribedBy
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: Medication name
 *         dosage:
 *           type: string
 *           description: Medication dosage
 *         frequency:
 *           type: string
 *           description: How often to take the medication
 *         route:
 *           type: string
 *           enum: [oral, intravenous, intramuscular, subcutaneous, topical, inhalation]
 *           description: How the medication is administered
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         patientId:
 *           type: string
 *           format: uuid
 *         prescribedBy:
 *           type: string
 *           format: uuid
 *         instructions:
 *           type: string
 *           description: Special instructions for taking the medication
 *         sideEffects:
 *           type: array
 *           items:
 *             type: string
 *           description: Known side effects
 *         status:
 *           type: string
 *           enum: [active, discontinued, completed]
 *           description: Current status of the medication
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/medications:
 *   get:
 *     summary: Get all medications
 *     tags: [Medications]
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
 *         description: Number of medications per page
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
 *           enum: [active, discontinued, completed]
 *         description: Filter by medication status
 *     responses:
 *       200:
 *         description: List of medications retrieved successfully
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
 *                     medications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Medication'
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
  requireRole(['doctor', 'nurse', 'pharmacist', 'admin']),
  validateRequest({ query: schemas.pagination }),
  asyncHandler(medicationController.getAllMedications)
);

/**
 * @swagger
 * /api/v1/medications/{id}:
 *   get:
 *     summary: Get medication by ID
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Medication ID
 *     responses:
 *       200:
 *         description: Medication retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Medication'
 *       404:
 *         description: Medication not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  requireRole(['doctor', 'nurse', 'pharmacist', 'admin']),
  validateRequest({ params: schemas.id }),
  asyncHandler(medicationController.getMedicationById)
);

/**
 * @swagger
 * /api/v1/medications:
 *   post:
 *     summary: Prescribe a new medication
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Medication'
 *     responses:
 *       201:
 *         description: Medication prescribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Medication'
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
  requirePermission('medications:prescribe'),
  validateRequest({ body: schemas.medication.create }),
  asyncHandler(medicationController.prescribeMedication)
);

/**
 * @swagger
 * /api/v1/medications/{id}:
 *   put:
 *     summary: Update medication prescription
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Medication ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Medication'
 *     responses:
 *       200:
 *         description: Medication updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Medication'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Medication not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  requireRole(['doctor', 'nurse']),
  requirePermission('medications:update'),
  validateRequest({ 
    params: schemas.id,
    body: schemas.medication.create 
  }),
  asyncHandler(medicationController.updateMedication)
);

/**
 * @swagger
 * /api/v1/medications/{id}/discontinue:
 *   patch:
 *     summary: Discontinue medication
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Medication ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for discontinuing the medication
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the medication was discontinued
 *     responses:
 *       200:
 *         description: Medication discontinued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Medication'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Medication not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/discontinue',
  requireRole(['doctor', 'nurse']),
  requirePermission('medications:discontinue'),
  validateRequest({ params: schemas.id }),
  asyncHandler(medicationController.discontinueMedication)
);

export default router;
