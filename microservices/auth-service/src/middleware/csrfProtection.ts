import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * CSRF Protection Middleware
 * 
 * Implements Double Submit Cookie pattern:
 * 1. Server generates CSRF token and sends it in cookie + response body
 * 2. Client includes token in request header for state-changing operations
 * 3. Server verifies token from header matches token in cookie
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Set CSRF token in cookie and return it
 */
export function setCsrfToken(req: Request, res: Response): string {
  const token = generateCsrfToken();
  
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  return token;
}

/**
 * CSRF protection middleware
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Get token from cookie
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

  // Get token from header
  const headerToken = req.headers[CSRF_HEADER_NAME] as string || 
                      req.body?._csrf || 
                      req.query?._csrf;

  // Validate tokens exist
  if (!cookieToken || !headerToken) {
    logger.warn('CSRF tokens missing', {
      method: req.method,
      path: req.path,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken
    });

    res.status(403).json({
      success: false,
      error: 'CSRF token missing'
    });
    return;
  }

  // Validate tokens match using constant-time comparison
  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    logger.warn('CSRF token mismatch', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });

    res.status(403).json({
      success: false,
      error: 'CSRF token invalid'
    });
    return;
  }

  // CSRF check passed
  next();
}

/**
 * Middleware to attach CSRF token to response
 */
export function attachCsrfToken(req: Request, res: Response, next: NextFunction): void {
  // Generate and set CSRF token if not present
  let csrfToken = req.cookies?.[CSRF_COOKIE_NAME];
  
  if (!csrfToken) {
    csrfToken = setCsrfToken(req, res);
  }

  // Attach token to request for access in routes
  (req as any).csrfToken = () => csrfToken;

  next();
}

/**
 * Optional CSRF protection (logs but doesn't block)
 */
export function optionalCsrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  if (!cookieToken || !headerToken) {
    logger.warn('CSRF protection skipped - tokens missing', {
      method: req.method,
      path: req.path
    });
  } else if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    logger.warn('CSRF protection skipped - token mismatch', {
      method: req.method,
      path: req.path
    });
  }

  next();
}

export default {
  generateCsrfToken,
  setCsrfToken,
  csrfProtection,
  attachCsrfToken,
  optionalCsrfProtection
};

