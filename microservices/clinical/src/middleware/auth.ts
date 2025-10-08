import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { createError } from './errorHandler';

interface JwtPayload {
  userId: string;
  role: string;
  organizationId: string;
  permissions: string[];
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET environment variable is not set');
      throw createError('Authentication configuration error', 500);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    
    // Verify token hasn't expired (additional check)
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw createError('Token has expired', 401);
    }

    // Attach user info to request
    req.user = decoded;
    
    logger.info(`Authenticated user: ${decoded.userId} with role: ${decoded.role}`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or malformed'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please refresh your token'
      });
    }
    
    next(error);
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Access denied for user ${req.user.userId} with role ${userRole}`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource'
      });
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      logger.warn(`Permission denied for user ${req.user.userId} - required: ${permission}`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This resource requires the permission: ${permission}`
      });
    }

    next();
  };
};

export const requireOrganization = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.organizationId) {
    return res.status(401).json({
      error: 'Organization context required',
      message: 'User must be associated with an organization'
    });
  }

  // Check if user is accessing resources within their organization
  const requestedOrgId = req.params.organizationId || req.query.organizationId;
  
  if (requestedOrgId && requestedOrgId !== req.user.organizationId) {
    logger.warn(`Cross-organization access attempt by user ${req.user.userId}`);
    return res.status(403).json({
      error: 'Cross-organization access denied',
      message: 'Users can only access resources within their organization'
    });
  }

  next();
};
