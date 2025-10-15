import { Router } from 'express';
import { RoleService } from '../services/RoleService';
import { AuditService } from '../services/AuditService';
import { authenticate, requireRole } from '../middleware/authentication';
import { validate, roleSchema } from '../utils/validators';
import { csrfProtection } from '../middleware/csrfProtection';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const roleService = new RoleService();
const auditService = new AuditService();

/**
 * @route   GET /api/v1/roles
 * @desc    List all roles
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const roles = await roleService.listRoles(user.organizationId);

    res.json({
      success: true,
      roles: roles.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: r.permissions,
        isSystem: r.isSystem
      }))
    });
  })
);

/**
 * @route   GET /api/v1/roles/:roleId
 * @desc    Get role by ID
 * @access  Private
 */
router.get(
  '/:roleId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { roleId } = req.params;
    const role = await roleService.getRoleById(roleId);

    if (!role) {
      res.status(404).json({
        success: false,
        error: 'Role not found'
      });
      return;
    }

    res.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isSystem: role.isSystem
      }
    });
  })
);

/**
 * @route   POST /api/v1/roles
 * @desc    Create new role
 * @access  Private (admin)
 */
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  csrfProtection,
  validate(roleSchema),
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const roleData = {
      ...req.body,
      organizationId: user.organizationId
    };

    const role = await roleService.createRole(roleData);

    res.status(201).json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      }
    });
  })
);

/**
 * @route   PATCH /api/v1/roles/:roleId
 * @desc    Update role
 * @access  Private (admin)
 */
router.patch(
  '/:roleId',
  authenticate,
  requireRole('admin'),
  csrfProtection,
  asyncHandler(async (req, res) => {
    const { roleId } = req.params;
    const updates = {
      description: req.body.description,
      permissions: req.body.permissions
    };

    const role = await roleService.updateRole(roleId, updates);

    res.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      }
    });
  })
);

/**
 * @route   DELETE /api/v1/roles/:roleId
 * @desc    Delete role
 * @access  Private (admin)
 */
router.delete(
  '/:roleId',
  authenticate,
  requireRole('admin'),
  csrfProtection,
  asyncHandler(async (req, res) => {
    const { roleId } = req.params;

    const success = await roleService.deleteRole(roleId);

    if (success) {
      res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Role not found or is a system role'
      });
    }
  })
);

/**
 * @route   GET /api/v1/roles/permissions/me
 * @desc    Get current user's permissions
 * @access  Private
 */
router.get(
  '/permissions/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const permissions = await roleService.getUserPermissions(user.id);

    res.json({
      success: true,
      permissions
    });
  })
);

/**
 * @route   POST /api/v1/roles/assign
 * @desc    Assign role to user
 * @access  Private (admin)
 */
router.post(
  '/assign',
  authenticate,
  requireRole('admin'),
  csrfProtection,
  asyncHandler(async (req, res) => {
    const { userId, roleName } = req.body;
    const adminUser = (req as any).user;

    if (!userId || !roleName) {
      res.status(400).json({
        success: false,
        error: 'User ID and role name are required'
      });
      return;
    }

    await roleService.assignRole(userId, roleName);

    // Log role assignment
    await auditService.logRoleAssignment(
      adminUser.id,
      userId,
      roleName,
      req.ip || 'unknown'
    );

    res.json({
      success: true,
      message: 'Role assigned successfully'
    });
  })
);

export default router;

