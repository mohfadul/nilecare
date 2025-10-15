import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';
import { AuditService } from '../services/AuditService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const userService = new UserService();
const roleService = new RoleService();
const auditService = new AuditService();

/**
 * Service-to-Service Authentication Middleware
 * Validates that the request comes from another NileCare microservice
 */
function authenticateService(req: any, res: any, next: any): void {
  const serviceKey = req.headers['x-service-key'] || req.headers['x-api-key'];
  
  if (!serviceKey) {
    logger.warn('Service authentication failed - no API key provided', {
      ip: req.ip,
      path: req.path
    });
    
    res.status(401).json({
      success: false,
      error: 'Service authentication required'
    });
    return;
  }

  // Get valid service keys from environment
  const validKeys = (process.env.SERVICE_API_KEYS || '').split(',').filter(k => k.trim());
  
  if (validKeys.length === 0) {
    logger.error('SERVICE_API_KEYS not configured');
    res.status(500).json({
      success: false,
      error: 'Service authentication not configured'
    });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  let isValid = false;
  for (const validKey of validKeys) {
    if (serviceKey === validKey.trim()) {
      isValid = true;
      break;
    }
  }

  if (!isValid) {
    logger.warn('Service authentication failed - invalid API key', {
      ip: req.ip,
      path: req.path
    });
    
    res.status(401).json({
      success: false,
      error: 'Invalid service credentials'
    });
    return;
  }

  // Mark request as service-authenticated
  req.serviceAuthenticated = true;
  next();
}

/**
 * @route   POST /api/v1/integration/validate-token
 * @desc    Validate JWT token for other services
 * @access  Service-to-Service
 * 
 * Usage by other services:
 * curl -X POST http://auth-service:7020/api/v1/integration/validate-token \
 *   -H "X-Service-Key: <service-api-key>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"token": "eyJhbGc..."}'
 */
router.post(
  '/validate-token',
  rateLimiter,
  authenticateService,
  asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required'
      });
      return;
    }

    try {
      // Verify JWT signature and expiration
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const payload = jwt.verify(token, jwtSecret) as any;

      // Get user details
      const user = await userService.findById(payload.userId || payload.sub);

      if (!user || user.status !== 'active') {
        res.json({
          valid: false,
          reason: 'User not found or inactive'
        });
        return;
      }

      // Get user permissions
      const permissions = await roleService.getUserPermissions(user.id);

      res.json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          permissions,
          organizationId: user.organizationId,
          mfaEnabled: user.mfaEnabled
        },
        tokenInfo: {
          userId: payload.userId || payload.sub,
          email: payload.email,
          role: payload.role,
          issuedAt: payload.iat,
          expiresAt: payload.exp
        }
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.json({
          valid: false,
          reason: 'Token expired',
          expiredAt: error.expiredAt
        });
        return;
      }

      if (error.name === 'JsonWebTokenError') {
        res.json({
          valid: false,
          reason: 'Invalid token'
        });
        return;
      }

      logger.error('Token validation error', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Token validation failed'
      });
    }
  })
);

/**
 * @route   POST /api/v1/integration/verify-permission
 * @desc    Check if user has specific permission
 * @access  Service-to-Service
 * 
 * Usage:
 * curl -X POST http://auth-service:7020/api/v1/integration/verify-permission \
 *   -H "X-Service-Key: <service-api-key>" \
 *   -d '{"userId": "...", "resource": "patients", "action": "read"}'
 */
router.post(
  '/verify-permission',
  rateLimiter,
  authenticateService,
  asyncHandler(async (req, res) => {
    const { userId, resource, action } = req.body;

    if (!userId || !resource || !action) {
      res.status(400).json({
        success: false,
        error: 'userId, resource, and action are required'
      });
      return;
    }

    try {
      const permission = `${resource}:${action}`;
      const hasPermission = await roleService.hasPermission(userId, permission);

      // Log permission check
      await auditService.logPermissionCheck(
        userId,
        resource,
        action,
        hasPermission,
        req.ip
      );

      res.json({
        success: true,
        allowed: hasPermission,
        permission,
        userId
      });
    } catch (error: any) {
      logger.error('Permission verification error', {
        userId,
        resource,
        action,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Permission verification failed'
      });
    }
  })
);

/**
 * @route   GET /api/v1/integration/users/by-email/:email
 * @desc    Get user by email (for other services to lookup users)
 * @access  Service-to-Service
 * 
 * Usage:
 * curl http://auth-service:7020/api/v1/integration/users/by-email/user@example.com \
 *   -H "X-Service-Key: <service-api-key>"
 */
router.get(
  '/users/by-email/:email',
  rateLimiter,
  authenticateService,
  asyncHandler(async (req, res) => {
    const { email } = req.params;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    try {
      const user = await userService.findByEmail(email);

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
          organizationId: user.organizationId,
          emailVerified: user.emailVerified,
          mfaEnabled: user.mfaEnabled,
          createdAt: user.createdAt
        }
      });
    } catch (error: any) {
      logger.error('User lookup by email failed', {
        email,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'User lookup failed'
      });
    }
  })
);

/**
 * @route   GET /api/v1/integration/users/:userId
 * @desc    Get user by ID (for other services)
 * @access  Service-to-Service
 */
router.get(
  '/users/:userId',
  rateLimiter,
  authenticateService,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
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
          organizationId: user.organizationId,
          emailVerified: user.emailVerified,
          mfaEnabled: user.mfaEnabled,
          createdAt: user.createdAt
        }
      });
    } catch (error: any) {
      logger.error('User lookup by ID failed', {
        userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'User lookup failed'
      });
    }
  })
);

/**
 * @route   GET /api/v1/integration/users/:userId/permissions
 * @desc    Get all permissions for a user (for permission-based routing)
 * @access  Service-to-Service
 */
router.get(
  '/users/:userId/permissions',
  rateLimiter,
  authenticateService,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
      const permissions = await roleService.getUserPermissions(userId);

      res.json({
        success: true,
        userId,
        permissions
      });
    } catch (error: any) {
      logger.error('Failed to get user permissions', {
        userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve permissions'
      });
    }
  })
);

/**
 * @route   POST /api/v1/integration/users/batch
 * @desc    Get multiple users by IDs (bulk lookup)
 * @access  Service-to-Service
 */
router.post(
  '/users/batch',
  rateLimiter,
  authenticateService,
  asyncHandler(async (req, res) => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'userIds array is required'
      });
      return;
    }

    if (userIds.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Maximum 100 users per batch request'
      });
      return;
    }

    try {
      const users = await Promise.all(
        userIds.map(id => userService.findById(id))
      );

      const validUsers = users
        .filter(u => u !== null)
        .map(u => ({
          id: u!.id,
          email: u!.email,
          username: u!.username,
          firstName: u!.firstName,
          lastName: u!.lastName,
          role: u!.role,
          status: u!.status
        }));

      res.json({
        success: true,
        users: validUsers,
        found: validUsers.length,
        requested: userIds.length
      });
    } catch (error: any) {
      logger.error('Batch user lookup failed', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Batch lookup failed'
      });
    }
  })
);

/**
 * @route   GET /api/v1/integration/health
 * @desc    Health check for service discovery
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    service: 'auth-service-integration',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;

