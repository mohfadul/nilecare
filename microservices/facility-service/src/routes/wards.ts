import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { WardController } from '../controllers/WardController';
import { validateRequest } from '../middleware/validation';

const router = Router();
const wardController = new WardController();

/**
 * @swagger
 * /api/v1/wards:
 *   get:
 *     summary: Get all wards
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 */
router.get('/',
  [
    query('facilityId').optional().isUUID(),
    query('departmentId').optional().isUUID(),
    query('wardType').optional().isIn(['general', 'icu', 'emergency', 'maternity', 'pediatric', 'surgical', 'medical', 'psychiatric', 'isolation']),
    query('status').optional().isIn(['active', 'full', 'maintenance', 'closed']),
    query('hasAvailableBeds').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  wardController.getAllWards
);

/**
 * @swagger
 * /api/v1/wards:
 *   post:
 *     summary: Create new ward
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 */
router.post('/',
  [
    body('facilityId').isUUID().withMessage('Valid facility ID is required'),
    body('departmentId').isUUID().withMessage('Valid department ID is required'),
    body('name').notEmpty().withMessage('Ward name is required'),
    body('wardCode').notEmpty().withMessage('Ward code is required'),
    body('wardType').isIn(['general', 'icu', 'emergency', 'maternity', 'pediatric', 'surgical', 'medical', 'psychiatric', 'isolation']),
    body('totalBeds').isInt({ min: 1 }).withMessage('Total beds must be at least 1'),
    body('floor').optional().isInt({ min: 0 }),
    body('nurseStationPhone').optional().isString(),
    body('genderRestriction').optional().isIn(['male', 'female', 'mixed']),
  ],
  validateRequest,
  wardController.createWard
);

/**
 * @swagger
 * /api/v1/wards/{id}:
 *   get:
 *     summary: Get ward by ID
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id',
  [param('id').isUUID()],
  validateRequest,
  wardController.getWardById
);

/**
 * @swagger
 * /api/v1/wards/{id}:
 *   put:
 *     summary: Update ward
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id',
  [
    param('id').isUUID(),
    body('name').optional().notEmpty(),
    body('wardType').optional().isIn(['general', 'icu', 'emergency', 'maternity', 'pediatric', 'surgical', 'medical', 'psychiatric', 'isolation']),
    body('totalBeds').optional().isInt({ min: 1 }),
    body('floor').optional().isInt({ min: 0 }),
    body('nurseStationPhone').optional().isString(),
    body('status').optional().isIn(['active', 'full', 'maintenance', 'closed']),
    body('isActive').optional().isBoolean(),
    body('genderRestriction').optional().isIn(['male', 'female', 'mixed']),
  ],
  validateRequest,
  wardController.updateWard
);

/**
 * @swagger
 * /api/v1/wards/{id}:
 *   delete:
 *     summary: Delete ward
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id',
  [param('id').isUUID()],
  validateRequest,
  wardController.deleteWard
);

/**
 * @swagger
 * /api/v1/wards/{id}/beds:
 *   get:
 *     summary: Get ward beds
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/beds',
  [param('id').isUUID()],
  validateRequest,
  wardController.getWardBeds
);

/**
 * @swagger
 * /api/v1/wards/{id}/occupancy:
 *   get:
 *     summary: Get ward occupancy
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/occupancy',
  [param('id').isUUID()],
  validateRequest,
  wardController.getWardOccupancy
);

export default router;

