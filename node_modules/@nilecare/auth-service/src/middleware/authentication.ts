import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';

const userService = new UserService();
const roleService = new RoleService();

/**
 * Authenticate JWT token from cookie or Authorization header
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.accessToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = jwt.verify(token, jwtSecret) as any;

    // Get user from database
    const user = await userService.findById(payload.userId || payload.sub);

    if (!user || user.status !== 'active') {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      mfaEnabled: user.mfaEnabled,
      organizationId: user.organizationId
    };

    next();
  } catch (error: any) {
    logger.error('Authentication error', { error: error.message });

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token expired'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.accessToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      next();
      return;
    }

    const payload = jwt.verify(token, jwtSecret) as any;
    const user = await userService.findById(payload.userId || payload.sub);

    if (user && user.status === 'active') {
      (req as any).user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        mfaEnabled: user.mfaEnabled,
        organizationId: user.organizationId
      };
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
}

/**
 * Require specific role
 */
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(user.role)) {
      logger.warn('Role authorization failed', {
        userId: user.id,
        userRole: user.role,
        requiredRoles: roles
      });

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

/**
 * Require specific permission
 */
export function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Check if user has any of the required permissions
    const hasPermission = await Promise.all(
      permissions.map(p => roleService.hasPermission(user.id, p))
    ).then(results => results.some(r => r));

    if (!hasPermission) {
      logger.warn('Permission authorization failed', {
        userId: user.id,
        requiredPermissions: permissions
      });

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

/**
 * Require MFA verification
 */
export function requireMFA(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (user.mfaEnabled && !(req as any).mfaVerified) {
    res.status(403).json({
      success: false,
      error: 'MFA verification required',
      requireMFA: true
    });
    return;
  }

  next();
}

export default {
  authenticate,
  optionalAuthenticate,
  requireRole,
  requirePermission,
  requireMFA
};

