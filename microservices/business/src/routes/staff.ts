import { Router } from 'express';
import { validateRequest, schemas } from '../middleware/validation';
// ✅ MIGRATED: Now using local authentication middleware (copied from shared)
import { authenticate, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { StaffController } from '../controllers/StaffController';

// Factory function to create routes with controller injection
export function createStaffRoutes(staffController: StaffController) {
  const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Staff:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - phone
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         role:
 *           type: string
 *           enum: [doctor, nurse, receptionist, admin, technician, therapist]
 *         department:
 *           type: string
 *         specialization:
 *           type: string
 *         licenseNumber:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, on-leave, suspended, terminated]
 */

/**
 * @swagger
 * /api/v1/staff:
 *   get:
 *     summary: Get all staff members
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  requireRole(['admin', 'receptionist']),
  validateRequest({ query: schemas.pagination }),
  asyncHandler(staffController.getAllStaff)
);

/**
 * @swagger
 * /api/v1/staff/{id}:
 *   get:
 *     summary: Get staff member by ID
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  requireRole(['admin', 'receptionist', 'doctor', 'nurse']),
  validateRequest({ params: schemas.id }),
  asyncHandler(staffController.getStaffById)
);

/**
 * @swagger
 * /api/v1/staff:
 *   post:
 *     summary: Create a new staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  requireRole(['admin']),
  requirePermission('staff:create'),
  validateRequest({ body: schemas.staff }),
  asyncHandler(staffController.createStaff)
);

/**
 * @swagger
 * /api/v1/staff/{id}:
 *   put:
 *     summary: Update staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  requireRole(['admin']),
  requirePermission('staff:update'),
  validateRequest({ params: schemas.id }),
  asyncHandler(staffController.updateStaff)
);

/**
 * @swagger
 * /api/v1/staff/{id}:
 *   delete:
 *     summary: Terminate staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  requireRole(['admin']),
  requirePermission('staff:delete'),
  validateRequest({ params: schemas.id }),
  asyncHandler(staffController.deleteStaff)
);

/**
 * @swagger
 * /api/v1/staff/role/{role}:
 *   get:
 *     summary: Get staff by role
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/role/:role',
  requireRole(['admin', 'receptionist']),
  asyncHandler(staffController.getStaffByRole)
);

/**
 * @swagger
 * /api/v1/staff/department/{department}:
 *   get:
 *     summary: Get staff by department
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/department/:department',
  requireRole(['admin', 'receptionist']),
  asyncHandler(staffController.getStaffByDepartment)
);

  return router;
}

