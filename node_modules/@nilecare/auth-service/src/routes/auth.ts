import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { UserService } from '../services/UserService';
import { PasswordResetService } from '../services/PasswordResetService';
import { PasswordBreachService } from '../services/PasswordBreachService';
import { AuditService } from '../services/AuditService';
import { EmailService } from '../services/EmailService';
import { logger } from '../utils/logger';
import { validate, loginSchema, registerSchema, passwordResetRequestSchema, passwordResetSchema } from '../utils/validators';
import { authRateLimiter, registerRateLimiter, passwordResetRateLimiter, refreshTokenRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/authentication';
import { attachCsrfToken, csrfProtection } from '../middleware/csrfProtection';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';

const router = Router();
const userService = new UserService();
const authController = new AuthController(userService, logger);
const passwordResetService = new PasswordResetService();
const passwordBreachService = new PasswordBreachService();
const auditService = new AuditService();
const emailService = new EmailService();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  registerRateLimiter,
  attachCsrfToken,
  csrfProtection,
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Check password breach
    const breachCheck = await passwordBreachService.validatePassword(req.body.password);
    
    if (!breachCheck.valid) {
      res.status(400).json({
        success: false,
        error: breachCheck.errors[0]
      });
      return;
    }

    // Register user
    await authController.register(req, res);
    
    // If registration successful, send welcome email
    if (res.statusCode === 201) {
      const { email, username } = req.body;
      await emailService.sendWelcomeEmail(email, username, 'patient');
    }
  })
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  attachCsrfToken,
  csrfProtection,
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    
    // Attempt login
    await authController.login(req, res);
    
    // Log login attempt
    const success = res.statusCode === 200;
    await auditService.logLoginAttempt(
      email,
      ipAddress,
      userAgent,
      success,
      success ? undefined : 'invalid_credentials'
    );
  })
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  csrfProtection,
  asyncHandler(async (req: Request, res: Response) => {
    await authController.logout(req, res);
  })
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public (requires refresh token in cookie)
 */
router.post(
  '/refresh-token',
  refreshTokenRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    await authController.refreshToken(req, res);
  })
);

/**
 * @route   POST /api/v1/auth/password-reset/request
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/password-reset/request',
  passwordResetRateLimiter,
  csrfProtection,
  validate(passwordResetRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await passwordResetService.requestPasswordReset(email);
    
    // Log password reset request
    await auditService.logPasswordResetRequest(
      email,
      req.ip || 'unknown',
      !!result.token
    );

    // Send password reset email if token was generated
    if (result.token) {
      const user = await userService.findByEmail(email);
      if (user) {
        const emailSent = await emailService.sendPasswordResetEmail(
          email,
          user.username,
          result.token
        );

        if (!emailSent) {
          logger.warn('Password reset email failed to send', { email });
        }
      }
    }
    
    // Always return success (prevent email enumeration)
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  })
);

/**
 * @route   POST /api/v1/auth/password-reset/verify
 * @desc    Verify password reset token
 * @access  Public
 */
router.post(
  '/password-reset/verify',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    
    const verification = await passwordResetService.verifyResetToken(token);
    
    res.json({
      success: true,
      valid: verification.valid
    });
  })
);

/**
 * @route   POST /api/v1/auth/password-reset/confirm
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/password-reset/confirm',
  passwordResetRateLimiter,
  csrfProtection,
  validate(passwordResetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    
    // Validate new password
    const breachCheck = await passwordBreachService.validatePassword(newPassword);
    
    if (!breachCheck.valid) {
      res.status(400).json({
        success: false,
        error: breachCheck.errors[0],
        warnings: breachCheck.warnings
      });
      return;
    }

    const success = await passwordResetService.resetPassword(token, newPassword);
    
    if (success) {
      res.json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }
  })
);

/**
 * @route   POST /api/v1/auth/password/change
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post(
  '/password/change',
  authenticate,
  csrfProtection,
  body('currentPassword').notEmpty(),
  body('newPassword').notEmpty(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const userId = user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate new password
    const breachCheck = await passwordBreachService.validatePassword(newPassword);
    
    if (!breachCheck.valid) {
      res.status(400).json({
        success: false,
        error: breachCheck.errors[0],
        warnings: breachCheck.warnings
      });
      return;
    }

    const result = await passwordResetService.changePassword(
      userId,
      currentPassword,
      newPassword
    );

    // Log password change
    await auditService.logPasswordChange(
      userId,
      user.email,
      req.ip || 'unknown',
      result.success
    );

    if (result.success) {
      // Send security alert email
      await emailService.sendSecurityAlert(
        user.email,
        user.username,
        'Password Changed',
        `Your password was changed on ${new Date().toLocaleString()}. If this wasn't you, please contact support immediately.`
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  })
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
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
        createdAt: user.createdAt
      }
    });
  })
);

/**
 * @route   GET /api/v1/auth/csrf-token
 * @desc    Get CSRF token
 * @access  Public
 */
router.get('/csrf-token', attachCsrfToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    csrfToken: (req as any).csrfToken()
  });
});

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  '/verify-email',
  asyncHandler(async (_req: Request, res: Response) => {
    // TODO: Implement email verification
    res.json({
      success: true,
      message: 'Email verification endpoint (to be implemented)'
    });
  })
);

export default router;

