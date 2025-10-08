import { Router } from 'express';
import { FHIRController } from '../controllers/FHIRController';
import { validateRequest, schemas } from '../middleware/validation';
import { requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const fhirController = new FHIRController();

/**
 * @swagger
 * components:
 *   schemas:
 *     FHIRPatient:
 *       type: object
 *       properties:
 *         resourceType:
 *           type: string
 *           example: Patient
 *         id:
 *           type: string
 *         identifier:
 *           type: array
 *           items:
 *             type: object
 *         name:
 *           type: array
 *           items:
 *             type: object
 *         gender:
 *           type: string
 *         birthDate:
 *           type: string
 *         telecom:
 *           type: array
 *           items:
 *             type: object
 *         address:
 *           type: array
 *           items:
 *             type: object
 *     FHIREncounter:
 *       type: object
 *       properties:
 *         resourceType:
 *           type: string
 *           example: Encounter
 *         id:
 *           type: string
 *         status:
 *           type: string
 *         class:
 *           type: object
 *         subject:
 *           type: object
 *         participant:
 *           type: array
 *           items:
 *             type: object
 *         period:
 *           type: object
 *         reasonCode:
 *           type: array
 *           items:
 *             type: object
 */

/**
 * @swagger
 * /api/v1/fhir/Patient:
 *   get:
 *     summary: Get FHIR Patient resources
 *     tags: [FHIR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: _count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of resources to return
 *       - in: query
 *         name: _page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search by patient name
 *       - in: query
 *         name: birthdate
 *         schema:
 *           type: string
 *         description: Search by birth date
 *     responses:
 *       200:
 *         description: FHIR Bundle containing Patient resources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Bundle
 *                 type:
 *                   type: string
 *                   example: searchset
 *                 total:
 *                   type: integer
 *                 entry:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       resource:
 *                         $ref: '#/components/schemas/FHIRPatient'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
  '/Patient',
  requireRole(['doctor', 'nurse', 'admin']),
  asyncHandler(fhirController.getPatients)
);

/**
 * @swagger
 * /api/v1/fhir/Patient/{id}:
 *   get:
 *     summary: Get FHIR Patient resource by ID
 *     tags: [FHIR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: FHIR Patient resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FHIRPatient'
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/Patient/:id',
  requireRole(['doctor', 'nurse', 'admin']),
  validateRequest({ params: schemas.id }),
  asyncHandler(fhirController.getPatient)
);

/**
 * @swagger
 * /api/v1/fhir/Patient:
 *   post:
 *     summary: Create FHIR Patient resource
 *     tags: [FHIR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FHIRPatient'
 *     responses:
 *       201:
 *         description: FHIR Patient resource created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FHIRPatient'
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
  '/Patient',
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('fhir:write'),
  asyncHandler(fhirController.createPatient)
);

/**
 * @swagger
 * /api/v1/fhir/Patient/{id}:
 *   put:
 *     summary: Update FHIR Patient resource
 *     tags: [FHIR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FHIRPatient'
 *     responses:
 *       200:
 *         description: FHIR Patient resource updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FHIRPatient'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/Patient/:id',
  requireRole(['doctor', 'nurse', 'admin']),
  requirePermission('fhir:write'),
  validateRequest({ params: schemas.id }),
  asyncHandler(fhirController.updatePatient)
);

/**
 * @swagger
 * /api/v1/fhir/Encounter:
 *   get:
 *     summary: Get FHIR Encounter resources
 *     tags: [FHIR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: _count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of resources to return
 *       - in: query
 *         name: _page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: patient
 *         schema:
 *           type: string
 *         description: Search by patient ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Search by encounter status
 *     responses:
 *       200:
 *         description: FHIR Bundle containing Encounter resources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Bundle
 *                 type:
 *                   type: string
 *                   example: searchset
 *                 total:
 *                   type: integer
 *                 entry:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       resource:
 *                         $ref: '#/components/schemas/FHIREncounter'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
  '/Encounter',
  requireRole(['doctor', 'nurse', 'admin']),
  asyncHandler(fhirController.getEncounters)
);

/**
 * @swagger
 * /api/v1/fhir/Encounter/{id}:
 *   get:
 *     summary: Get FHIR Encounter resource by ID
 *     tags: [FHIR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Encounter ID
 *     responses:
 *       200:
 *         description: FHIR Encounter resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FHIREncounter'
 *       404:
 *         description: Encounter not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/Encounter/:id',
  requireRole(['doctor', 'nurse', 'admin']),
  validateRequest({ params: schemas.id }),
  asyncHandler(fhirController.getEncounter)
);

/**
 * @swagger
 * /api/v1/fhir/metadata:
 *   get:
 *     summary: Get FHIR CapabilityStatement (metadata)
 *     tags: [FHIR]
 *     responses:
 *       200:
 *         description: FHIR CapabilityStatement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: CapabilityStatement
 *                 status:
 *                   type: string
 *                   example: active
 *                 date:
 *                   type: string
 *                   format: date-time
 *                 kind:
 *                   type: string
 *                   example: instance
 *                 software:
 *                   type: object
 *                 implementation:
 *                   type: object
 *                 fhirVersion:
 *                   type: string
 *                   example: 4.0.1
 *                 format:
 *                   type: array
 *                   items:
 *                     type: string
 *                 rest:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/metadata',
  asyncHandler(fhirController.getMetadata)
);

export default router;
