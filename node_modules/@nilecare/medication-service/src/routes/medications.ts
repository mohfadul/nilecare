import { Router } from 'express';
import { MedicationController } from '../controllers/MedicationController';
import { validateRequest, medicationSchemas } from '../middleware/validation';
import { attachFacilityContext, requireFacility, validateMedicationAccess, logMedicationAccess, enforceFacilityForWrites } from '../middleware/facilityMiddleware';
import { strictRateLimiter } from '../middleware/rateLimiter';

/**
 * Medication Routes
 * All routes use centralized authentication (applied in index.ts)
 */

const router = Router();
const controller = new MedicationController();

// Apply facility middleware to all routes
router.use(attachFacilityContext);
router.use(requireFacility);
router.use(logMedicationAccess);

/**
 * @swagger
 * /api/v1/medications:
 *   post:
 *     summary: Create new medication
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, dosageForm, strength, unit, facilityId]
 *     responses:
 *       201:
 *         description: Medication created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  enforceFacilityForWrites,
  validateRequest(medicationSchemas.createMedication),
  controller.createMedication
);

/**
 * @swagger
 * /api/v1/medications/search:
 *   get:
 *     summary: Search medications
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', controller.searchMedications);

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
 *     responses:
 *       200:
 *         description: Medication details
 *       404:
 *         description: Medication not found
 */
router.get('/:id', validateMedicationAccess, controller.getMedication);

/**
 * @swagger
 * /api/v1/medications/{id}:
 *   put:
 *     summary: Update medication
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
 *     responses:
 *       200:
 *         description: Medication updated
 *       404:
 *         description: Medication not found
 */
router.put(
  '/:id',
  validateMedicationAccess,
  enforceFacilityForWrites,
  controller.updateMedication
);

/**
 * PRESCRIPTION ROUTES
 */

/**
 * @swagger
 * /api/v1/prescriptions:
 *   post:
 *     summary: Create new prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Prescription created
 */
router.post(
  '/prescriptions',
  enforceFacilityForWrites,
  controller.createPrescription
);

/**
 * @swagger
 * /api/v1/prescriptions/{id}/dispense:
 *   post:
 *     summary: Dispense medication from prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Medication dispensed successfully
 */
router.post(
  '/prescriptions/:id/dispense',
  strictRateLimiter,
  validateMedicationAccess,
  validateRequest(medicationSchemas.dispenseMedication),
  controller.dispenseMedication
);

/**
 * @swagger
 * /api/v1/patients/{patientId}/prescriptions:
 *   get:
 *     summary: Get patient's active prescriptions
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/patients/:patientId/prescriptions',
  validateMedicationAccess,
  controller.getPatientPrescriptions
);

/**
 * @swagger
 * /api/v1/prescriptions/{id}/cancel:
 *   post:
 *     summary: Cancel prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/prescriptions/:id/cancel',
  validateMedicationAccess,
  controller.cancelPrescription
);

export default router;

