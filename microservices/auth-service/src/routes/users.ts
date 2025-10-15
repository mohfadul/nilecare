import { Router } from 'express';
import { UserService } from '../services/UserService';
import { DeviceFingerprintService } from '../services/DeviceFingerprintService';
import { authenticate, requireRole, requirePermission } from '../middleware/authentication';
import { validate, userUpdateSchema } from '../utils/validators';
import { csrfProtection } from '../middleware/csrfProtection';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const userService = new UserService();
const deviceFingerprintService = new DeviceFingerprintService();

/**
 * @route   GET /api/v1/users
 * @desc    List all users (admin only)
 * @access  Private (admin)
 */
router.get(
  '/',
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const result = await userService.listUsers(page, limit, {
      role,
      status,
      search
    });

    res.json({
      success: true,
      ...result
    });
  })
);

/**
 * @route   GET /api/v1/users/:userId
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:userId',
  authenticate,
  asyncHandler(async (req, res) => {
    const requestingUser = (req as any).user;
    const { userId } = req.params;

    // Users can only view their own profile unless they're admin
    if (userId !== requestingUser.id && requestingUser.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden'
      });
      return;
    }

    const user = await userService.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        mfaEnabled: user.mfaEnabled,
        emailVerified: user.emailVerified,
        organizationId: user.organizationId,
        permissions: user.permissions,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  })
);

/**
 * @route   PATCH /api/v1/users/:userId
 * @desc    Update user
 * @access  Private
 */
router.patch(
  '/:userId',
  authenticate,
  csrfProtection,
  validate(userUpdateSchema),
  asyncHandler(async (req, res) => {
    const requestingUser = (req as any).user;
    const { userId } = req.params;

    // Users can only update their own profile unless they're admin
    if (userId !== requestingUser.id && requestingUser.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden'
      });
      return;
    }

    // Non-admin users cannot change their role
    if (req.body.role && requestingUser.role !== 'admin') {
      delete req.body.role;
    }

    const updatedUser = await userService.update(userId, req.body);

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
  })
);

/**
 * @route   DELETE /api/v1/users/:userId
 * @desc    Delete user (soft delete - set status to inactive)
 * @access  Private (admin)
 */
router.delete(
  '/:userId',
  authenticate,
  requireRole('admin'),
  csrfProtection,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Prevent deleting your own account
    if (userId === (req as any).user.id) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
      return;
    }

    await userService.update(userId, { status: 'inactive' as any });

    // Invalidate all sessions
    await userService.invalidateAllSessions(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

/**
 * @route   GET /api/v1/users/:userId/devices
 * @desc    Get user's devices
 * @access  Private
 */
router.get(
  '/:userId/devices',
  authenticate,
  asyncHandler(async (req, res) => {
    const requestingUser = (req as any).user;
    const { userId } = req.params;

    // Users can only view their own devices unless they're admin
    if (userId !== requestingUser.id && requestingUser.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden'
      });
      return;
    }

    const devices = await deviceFingerprintService.getUserDevices(userId);
    const stats = await deviceFingerprintService.getDeviceStats(userId);

    res.json({
      success: true,
      devices: devices.map(d => ({
        id: d.id,
        name: d.name,
        lastUsed: d.lastUsed,
        isVerified: d.isVerified,
        ipAddress: d.ipAddress,
        createdAt: d.createdAt
      })),
      stats
    });
  })
);

/**
 * @route   DELETE /api/v1/users/:userId/devices/:deviceId
 * @desc    Remove device
 * @access  Private
 */
router.delete(
  '/:userId/devices/:deviceId',
  authenticate,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const requestingUser = (req as any).user;
    const { userId, deviceId } = req.params;

    // Users can only remove their own devices unless they're admin
    if (userId !== requestingUser.id && requestingUser.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden'
      });
      return;
    }

    const success = await deviceFingerprintService.removeDevice(userId, deviceId);

    if (success) {
      res.json({
        success: true,
        message: 'Device removed successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
  })
);

export default router;

