import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { DepartmentController } from '../controllers/DepartmentController';
import { validateRequest } from '../middleware/validation';

const router = Router();
const departmentController = new DepartmentController();

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/',
  [
    query('facilityId').optional().isUUID(),
    query('specialization').optional().isString(),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  departmentController.getAllDepartments
);

/**
 * @swagger
 * /api/v1/departments:
 *   post:
 *     summary: Create new department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/',
  [
    body('facilityId').isUUID().withMessage('Valid facility ID is required'),
    body('name').notEmpty().withMessage('Department name is required'),
    body('code').notEmpty().withMessage('Department code is required'),
    body('specialization').notEmpty().withMessage('Specialization is required'),
    body('floor').optional().isInt({ min: 0 }),
    body('building').optional().isString(),
    body('contactPhone').optional().isString(),
    body('contactEmail').optional().isEmail(),
  ],
  validateRequest,
  departmentController.createDepartment
);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id',
  [param('id').isUUID()],
  validateRequest,
  departmentController.getDepartmentById
);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   put:
 *     summary: Update department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id',
  [
    param('id').isUUID(),
    body('name').optional().notEmpty(),
    body('specialization').optional().notEmpty(),
    body('floor').optional().isInt({ min: 0 }),
    body('building').optional().isString(),
    body('contactPhone').optional().isString(),
    body('contactEmail').optional().isEmail(),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  departmentController.updateDepartment
);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   delete:
 *     summary: Delete department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id',
  [param('id').isUUID()],
  validateRequest,
  departmentController.deleteDepartment
);

/**
 * @swagger
 * /api/v1/departments/{id}/wards:
 *   get:
 *     summary: Get department wards
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/wards',
  [param('id').isUUID()],
  validateRequest,
  departmentController.getDepartmentWards
);

export default router;

