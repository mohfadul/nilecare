/**
 * FHIR Patient Routes
 * HL7 FHIR R4 Patient resource endpoints
 * Sudan-specific: Sudan National ID extension support
 */

import { Router } from 'express';
import { FHIRController } from '../controllers/FHIRController';
import { Pool } from 'pg';

const router = Router();

// Initialize controller with database pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fhir_repository',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const fhirController = new FHIRController(pool);

/**
 * @swagger
 * /fhir/Patient:
 *   post:
 *     summary: Create a new Patient resource
 *     tags: [FHIR Patient]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/fhir+json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *           example:
 *             resourceType: "Patient"
 *             identifier:
 *               - system: "http://nilecare.sd/identifier/mrn"
 *                 value: "MRN-12345"
 *             name:
 *               - use: "official"
 *                 family: "Hassan"
 *                 given: ["Ahmed", "Mohamed"]
 *             gender: "male"
 *             birthDate: "1985-06-15"
 *             telecom:
 *               - system: "phone"
 *                 value: "+249912345678"
 *                 use: "mobile"
 *             address:
 *               - line: ["Street 15, Block 3"]
 *                 city: "Omdurman"
 *                 state: "Khartoum"
 *                 postalCode: "11111"
 *                 country: "Sudan"
 *             extension:
 *               - url: "http://nilecare.sd/fhir/StructureDefinition/sudan-national-id"
 *                 valueString: "ABC123456789"
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: URL of created resource
 *           ETag:
 *             schema:
 *               type: string
 *             description: Version identifier
 *         content:
 *           application/fhir+json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/fhir+json:
 *             schema:
 *               $ref: '#/components/schemas/OperationOutcome'
 */
router.post('/', fhirController.createPatient);

/**
 * @swagger
 * /fhir/Patient:
 *   get:
 *     summary: Search for Patient resources
 *     tags: [FHIR Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: _id
 *         schema:
 *           type: string
 *         description: Logical resource ID
 *       - in: query
 *         name: identifier
 *         schema:
 *           type: string
 *         description: Patient identifier (e.g., MRN)
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Patient name (any part)
 *       - in: query
 *         name: family
 *         schema:
 *           type: string
 *         description: Family name
 *       - in: query
 *         name: given
 *         schema:
 *           type: string
 *         description: Given name
 *       - in: query
 *         name: birthdate
 *         schema:
 *           type: string
 *           format: date
 *         description: Birth date (YYYY-MM-DD)
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other, unknown]
 *         description: Gender
 *       - in: query
 *         name: address-city
 *         schema:
 *           type: string
 *         description: City (e.g., Khartoum, Omdurman)
 *       - in: query
 *         name: address-state
 *         schema:
 *           type: string
 *         description: Sudan State
 *       - in: query
 *         name: telecom
 *         schema:
 *           type: string
 *         description: Phone or email
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Active status
 *       - in: query
 *         name: _count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: _offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *       - in: query
 *         name: _sort
 *         schema:
 *           type: string
 *         description: Sort parameter (e.g., birthdate, name)
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/fhir+json:
 *             schema:
 *               $ref: '#/components/schemas/Bundle'
 */
router.get('/', fhirController.searchPatients);

/**
 * @swagger
 * /fhir/Patient/{id}:
 *   get:
 *     summary: Read Patient resource by ID
 *     tags: [FHIR Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient resource ID
 *     responses:
 *       200:
 *         description: Patient resource
 *         headers:
 *           ETag:
 *             schema:
 *               type: string
 *           Last-Modified:
 *             schema:
 *               type: string
 *               format: date-time
 *         content:
 *           application/fhir+json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 *         content:
 *           application/fhir+json:
 *             schema:
 *               $ref: '#/components/schemas/OperationOutcome'
 */
router.get('/:id', fhirController.getPatientById);

/**
 * @swagger
 * /fhir/Patient/{id}:
 *   put:
 *     summary: Update Patient resource
 *     tags: [FHIR Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/fhir+json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *         headers:
 *           ETag:
 *             schema:
 *               type: string
 *           Last-Modified:
 *             schema:
 *               type: string
 *         content:
 *           application/fhir+json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 */
router.put('/:id', fhirController.updatePatient);

/**
 * @swagger
 * /fhir/Patient/{id}:
 *   delete:
 *     summary: Delete Patient resource (soft delete)
 *     tags: [FHIR Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient resource ID
 *     responses:
 *       204:
 *         description: Patient deleted successfully
 *       404:
 *         description: Patient not found
 */
router.delete('/:id', fhirController.deletePatient);

/**
 * @swagger
 * /fhir/Patient/{id}/_history:
 *   get:
 *     summary: Get Patient version history
 *     tags: [FHIR Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient resource ID
 *       - in: query
 *         name: _count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of versions to return
 *     responses:
 *       200:
 *         description: Patient history
 *         content:
 *           application/fhir+json:
 *             schema:
 *               $ref: '#/components/schemas/Bundle'
 */
router.get('/:id/_history', fhirController.getPatientHistory);

export default router;
