import { Router } from 'express';
import { EncounterController } from '../controllers/EncounterController';
import { validateRequest, schemas } from '../middleware/validation';
// ✅ MIGRATED: Using shared authentication middleware
import { authenticate, requireRole, requirePermission } from '../../../shared/middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const encounterController = new EncounterController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Encounter:
 *       type: object
 *       required:
 *         - patientId
 *         - providerId
 *         - encounterType
 *         - startDate
 *         - chiefComplaint
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         providerId:
 *           type: string
 *           format: uuid
 *         encounterType:
 *           type: string
 *           enum: [outpatient, inpatient, emergency, telehealth]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         chiefComplaint:
 *           type: string
 *         diagnosis:
 *           type: array
 *           items:
 *             type: string
 *         treatmentPlan:
 *           type: string
 *         vitalSigns:
 *           type: object
 *           properties:
 *             bloodPressure:
 *               type: object
 *               properties:
 *                 systolic:
 *                   type: number
 *                 diastolic:
 *                   type: number
 *             heartRate:
 *               type: number
 *             temperature:
 *               type: number
 *             respiratoryRate:
 *               type: number
 *             oxygenSaturation:
 *               type: number
 *             weight:
 *               type: number
 *             height:
 *               type: number
 *         status:
 *           type: string
 *           enum: [scheduled, in-progress, completed, cancelled]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/encounters:
 *   get:
 *     summary: Get all encounters
 *     tags: [Encounters]
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
 *         description: Number of encounters per page
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by patient ID
 *       - in: query
 *         name: providerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by provider ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in-progress, completed, cancelled]
 *         description: Filter by encounter status
 *     responses:
 *       200:
 *         description: List of encounters retrieved successfully
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
 *                     encounters:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Encounter'
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
  asyncHandler(encounterController.getAllEncounters)
);

/**
 * @swagger
 * /api/v1/encounters/{id}:
 *   get:
 *     summary: Get encounter by ID
 *     tags: [Encounters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Encounter ID
 *     responses:
 *       200:
 *         description: Encounter retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Encounter'
 *       404:
 *         description: Encounter not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  requireRole(['doctor', 'nurse', 'admin']),
  validateRequest({ params: schemas.id }),
  asyncHandler(encounterController.getEncounterById)
);

/**
 * @swagger
 * /api/v1/encounters:
 *   post:
 *     summary: Create a new encounter
 *     tags: [Encounters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Encounter'
 *     responses:
 *       201:
 *         description: Encounter created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Encounter'
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
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('encounters:create'),
  validateRequest({ body: schemas.encounter.create }),
  asyncHandler(encounterController.createEncounter)
);

/**
 * @swagger
 * /api/v1/encounters/{id}:
 *   put:
 *     summary: Update encounter
 *     tags: [Encounters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Encounter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Encounter'
 *     responses:
 *       200:
 *         description: Encounter updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Encounter'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Encounter not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('encounters:update'),
  validateRequest({ 
    params: schemas.id,
    body: schemas.encounter.create 
  }),
  asyncHandler(encounterController.updateEncounter)
);

/**
 * @swagger
 * /api/v1/encounters/{id}/complete:
 *   patch:
 *     summary: Complete encounter
 *     tags: [Encounters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Encounter ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnosis:
 *                 type: array
 *                 items:
 *                   type: string
 *               treatmentPlan:
 *                 type: string
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Encounter completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Encounter'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Encounter not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/complete',
  requireRole(['doctor', 'nurse']),
  requirePermission('encounters:complete'),
  validateRequest({ params: schemas.id }),
  asyncHandler(encounterController.completeEncounter)
);

export default router;
