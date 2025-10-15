import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { BedController } from '../controllers/BedController';
import { validateRequest } from '../middleware/validation';
import { bedStatusLimiter } from '../middleware/rateLimiter';

const router = Router();
const bedController = new BedController();

/**
 * @swagger
 * /api/v1/beds:
 *   get:
 *     summary: Get all beds
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 */
router.get('/',
  [
    query('facilityId').optional().isUUID(),
    query('departmentId').optional().isUUID(),
    query('wardId').optional().isUUID(),
    query('bedType').optional().isIn(['standard', 'icu', 'pediatric', 'maternity', 'isolation', 'observation', 'recovery']),
    query('bedStatus').optional().isIn(['available', 'occupied', 'reserved', 'maintenance', 'cleaning', 'out_of_service']),
    query('hasOxygen').optional().isBoolean(),
    query('hasMonitor').optional().isBoolean(),
    query('hasVentilator').optional().isBoolean(),
    query('isolationCapable').optional().isBoolean(),
    query('isAvailable').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  bedController.getAllBeds
);

/**
 * @swagger
 * /api/v1/beds:
 *   post:
 *     summary: Create new bed
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 */
router.post('/',
  [
    body('facilityId').isUUID().withMessage('Valid facility ID is required'),
    body('departmentId').isUUID().withMessage('Valid department ID is required'),
    body('wardId').isUUID().withMessage('Valid ward ID is required'),
    body('bedNumber').notEmpty().withMessage('Bed number is required'),
    body('bedType').isIn(['standard', 'icu', 'pediatric', 'maternity', 'isolation', 'observation', 'recovery']),
    body('location').optional().isString(),
    body('hasOxygen').optional().isBoolean(),
    body('hasMonitor').optional().isBoolean(),
    body('hasVentilator').optional().isBoolean(),
    body('isolationCapable').optional().isBoolean(),
  ],
  validateRequest,
  bedController.createBed
);

/**
 * @swagger
 * /api/v1/beds/{id}:
 *   get:
 *     summary: Get bed by ID
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id',
  [param('id').isUUID()],
  validateRequest,
  bedController.getBedById
);

/**
 * @swagger
 * /api/v1/beds/{id}:
 *   put:
 *     summary: Update bed
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id',
  [
    param('id').isUUID(),
    body('bedNumber').optional().notEmpty(),
    body('bedType').optional().isIn(['standard', 'icu', 'pediatric', 'maternity', 'isolation', 'observation', 'recovery']),
    body('bedStatus').optional().isIn(['available', 'occupied', 'reserved', 'maintenance', 'cleaning', 'out_of_service']),
    body('location').optional().isString(),
    body('hasOxygen').optional().isBoolean(),
    body('hasMonitor').optional().isBoolean(),
    body('hasVentilator').optional().isBoolean(),
    body('isolationCapable').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
    body('notes').optional().isString(),
  ],
  validateRequest,
  bedController.updateBed
);

/**
 * @swagger
 * /api/v1/beds/{id}/status:
 *   put:
 *     summary: Update bed status (for real-time updates)
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/status',
  bedStatusLimiter, // Higher rate limit for real-time updates
  [
    param('id').isUUID(),
    body('status').isIn(['available', 'occupied', 'reserved', 'maintenance', 'cleaning', 'out_of_service']),
  ],
  validateRequest,
  bedController.updateBedStatus
);

/**
 * @swagger
 * /api/v1/beds/{id}/assign:
 *   post:
 *     summary: Assign bed to patient
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/assign',
  [
    param('id').isUUID(),
    body('patientId').isUUID().withMessage('Valid patient ID is required'),
    body('assignmentDate').optional().isISO8601(),
    body('expectedDischargeDate').optional().isISO8601(),
    body('notes').optional().isString(),
  ],
  validateRequest,
  bedController.assignBed
);

/**
 * @swagger
 * /api/v1/beds/{id}/release:
 *   post:
 *     summary: Release bed from patient
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/release',
  [
    param('id').isUUID(),
    body('releaseReason').optional().isString(),
  ],
  validateRequest,
  bedController.releaseBed
);

/**
 * @swagger
 * /api/v1/beds/available:
 *   get:
 *     summary: Get available beds
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 */
router.get('/available',
  [
    query('facilityId').isUUID().withMessage('Facility ID is required'),
    query('wardId').optional().isUUID(),
    query('bedType').optional().isIn(['standard', 'icu', 'pediatric', 'maternity', 'isolation', 'observation', 'recovery']),
    query('hasOxygen').optional().isBoolean(),
    query('hasMonitor').optional().isBoolean(),
    query('hasVentilator').optional().isBoolean(),
    query('isolationCapable').optional().isBoolean(),
  ],
  validateRequest,
  bedController.getAvailableBeds
);

/**
 * @swagger
 * /api/v1/beds/{id}/history:
 *   get:
 *     summary: Get bed assignment history
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/history',
  [param('id').isUUID()],
  validateRequest,
  bedController.getBedHistory
);

export default router;

