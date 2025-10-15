import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { FacilityController } from '../controllers/FacilityController';
import { validateRequest } from '../middleware/validation';

const router = Router();
const facilityController = new FacilityController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Facility:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - address
 *         - contactInfo
 *       properties:
 *         id:
 *           type: string
 *           description: Unique facility identifier
 *         name:
 *           type: string
 *           description: Facility name
 *         type:
 *           type: string
 *           enum: [hospital, clinic, lab, pharmacy, rehabilitation]
 *           description: Type of healthcare facility
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *         contactInfo:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *             email:
 *               type: string
 *             website:
 *               type: string
 *         capacity:
 *           type: object
 *           properties:
 *             totalBeds:
 *               type: number
 *             availableBeds:
 *               type: number
 *             icuBeds:
 *               type: number
 *             emergencyBeds:
 *               type: number
 *         services:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/facilities:
 *   get:
 *     summary: Get all facilities
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of facilities per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by facility type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or location
 *     responses:
 *       200:
 *         description: List of facilities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Facility'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 */
router.get('/', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['hospital', 'clinic', 'lab', 'pharmacy', 'rehabilitation']).withMessage('Invalid facility type'),
    query('search').optional().isString().trim().isLength({ min: 1 }).withMessage('Search term must be a non-empty string')
  ],
  validateRequest,
  facilityController.getAllFacilities
);

/**
 * @swagger
 * /api/v1/facilities:
 *   post:
 *     summary: Create a new facility
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Facility'
 *     responses:
 *       201:
 *         description: Facility created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Facility'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/',
  [
    body('name').notEmpty().withMessage('Facility name is required'),
    body('type').isIn(['hospital', 'clinic', 'lab', 'pharmacy', 'rehabilitation']).withMessage('Invalid facility type'),
    body('address.street').notEmpty().withMessage('Street address is required'),
    body('address.city').notEmpty().withMessage('City is required'),
    body('address.state').notEmpty().withMessage('State is required'),
    body('address.zipCode').notEmpty().withMessage('Zip code is required'),
    body('address.country').notEmpty().withMessage('Country is required'),
    body('contactInfo.phone').notEmpty().withMessage('Phone number is required'),
    body('contactInfo.email').isEmail().withMessage('Valid email is required'),
    body('services').optional().isArray().withMessage('Services must be an array'),
    body('capacity.totalBeds').optional().isInt({ min: 0 }).withMessage('Total beds must be a non-negative integer'),
    body('capacity.icuBeds').optional().isInt({ min: 0 }).withMessage('ICU beds must be a non-negative integer'),
    body('capacity.emergencyBeds').optional().isInt({ min: 0 }).withMessage('Emergency beds must be a non-negative integer')
  ],
  validateRequest,
  facilityController.createFacility
);

/**
 * @swagger
 * /api/v1/facilities/{id}:
 *   get:
 *     summary: Get facility by ID
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Facility ID
 *     responses:
 *       200:
 *         description: Facility details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Facility'
 *       404:
 *         description: Facility not found
 */
router.get('/:id',
  [
    param('id').isUUID().withMessage('Invalid facility ID')
  ],
  validateRequest,
  facilityController.getFacilityById
);

/**
 * @swagger
 * /api/v1/facilities/{id}:
 *   put:
 *     summary: Update facility
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Facility ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Facility'
 *     responses:
 *       200:
 *         description: Facility updated successfully
 *       404:
 *         description: Facility not found
 */
router.put('/:id',
  [
    param('id').isUUID().withMessage('Invalid facility ID'),
    body('name').optional().notEmpty().withMessage('Facility name cannot be empty'),
    body('type').optional().isIn(['hospital', 'clinic', 'lab', 'pharmacy', 'rehabilitation']).withMessage('Invalid facility type'),
    body('address.street').optional().notEmpty().withMessage('Street address cannot be empty'),
    body('address.city').optional().notEmpty().withMessage('City cannot be empty'),
    body('address.state').optional().notEmpty().withMessage('State cannot be empty'),
    body('address.zipCode').optional().notEmpty().withMessage('Zip code cannot be empty'),
    body('address.country').optional().notEmpty().withMessage('Country cannot be empty'),
    body('contactInfo.phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
    body('contactInfo.email').optional().isEmail().withMessage('Valid email is required'),
    body('services').optional().isArray().withMessage('Services must be an array'),
    body('capacity.totalBeds').optional().isInt({ min: 0 }).withMessage('Total beds must be a non-negative integer'),
    body('capacity.icuBeds').optional().isInt({ min: 0 }).withMessage('ICU beds must be a non-negative integer'),
    body('capacity.emergencyBeds').optional().isInt({ min: 0 }).withMessage('Emergency beds must be a non-negative integer'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  validateRequest,
  facilityController.updateFacility
);

/**
 * @swagger
 * /api/v1/facilities/{id}:
 *   delete:
 *     summary: Delete facility
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Facility ID
 *     responses:
 *       200:
 *         description: Facility deleted successfully
 *       404:
 *         description: Facility not found
 */
router.delete('/:id',
  [
    param('id').isUUID().withMessage('Invalid facility ID')
  ],
  validateRequest,
  facilityController.deleteFacility
);

/**
 * @swagger
 * /api/v1/facilities/{id}/departments:
 *   get:
 *     summary: Get departments for a facility
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Facility ID
 *     responses:
 *       200:
 *         description: List of departments
 */
router.get('/:id/departments',
  [
    param('id').isUUID().withMessage('Invalid facility ID')
  ],
  validateRequest,
  facilityController.getFacilityDepartments
);

/**
 * @swagger
 * /api/v1/facilities/{id}/capacity:
 *   get:
 *     summary: Get facility capacity information
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Facility ID
 *     responses:
 *       200:
 *         description: Facility capacity information
 */
router.get('/:id/capacity',
  [
    param('id').isUUID().withMessage('Invalid facility ID')
  ],
  validateRequest,
  facilityController.getFacilityCapacity
);

/**
 * @swagger
 * /api/v1/facilities/{id}/analytics:
 *   get:
 *     summary: Get facility analytics
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Facility ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         description: Analytics period
 *     responses:
 *       200:
 *         description: Facility analytics data
 */
router.get('/:id/analytics',
  [
    param('id').isUUID().withMessage('Invalid facility ID'),
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid period')
  ],
  validateRequest,
  facilityController.getFacilityAnalytics
);

export default router;
