/**
 * Email Verification Routes
 * 
 * Endpoints for email verification workflow
 */

import { Router, Request, Response } from 'express';
import { EmailVerificationService } from '../services/EmailVerificationService';
import { EmailService } from '../services/EmailService';
import { UserService } from '../services/UserService';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const emailVerificationService = new EmailVerificationService();
const emailService = new EmailService();
const userService = new UserService();

/**
 * POST /api/v1/email-verification/send
 * Send verification email to authenticated user
 */
router.post(
  '/send',
  authenticate,
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const email = req.user?.email;

      if (!userId || !email) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      }

      // Check if already verified
      const status = await emailVerificationService.getVerificationStatus(userId);
      if (status.emailVerified) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ALREADY_VERIFIED',
            message: 'Email is already verified',
          },
        });
      }

      // Check rate limiting
      const canResend = await emailVerificationService.canResendVerification(userId);
      if (!canResend.allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: canResend.reason,
          },
        });
      }

      // Get user details
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      // Generate token
      const token = await emailVerificationService.generateVerificationToken(userId, email);

      // Send email
      const sent = await emailService.sendVerificationEmail(
        email,
        user.firstName || 'User',
        token
      );

      if (!sent) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'EMAIL_SEND_FAILED',
            message: 'Failed to send verification email. Please try again later.',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: {
          message: 'Verification email sent successfully',
          email: email.substring(0, 3) + '***@' + email.split('@')[1],
          remainingAttempts: canResend.remainingAttempts - 1,
        },
      });
    } catch (error: any) {
      logger.error('Failed to send verification email', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send verification email',
        },
      });
    }
  }
);

/**
 * GET /api/v1/email-verification/verify?token=xxx
 * Verify email with token
 */
router.get(
  '/verify',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Verification token is required',
          },
        });
      }

      // Verify the token
      const result = await emailVerificationService.verifyEmail(token);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VERIFICATION_FAILED',
            message: result.message,
          },
        });
      }

      // Get user details
      if (result.userId) {
        const user = await userService.findById(result.userId);
        
        // Send welcome email
        if (user) {
          await emailService.sendWelcomeEmail(
            user.email,
            user.firstName || 'User'
          );
        }
      }

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
          verified: true,
        },
      });
    } catch (error: any) {
      logger.error('Email verification failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Email verification failed',
        },
      });
    }
  }
);

/**
 * GET /api/v1/email-verification/status
 * Get email verification status for authenticated user
 */
router.get(
  '/status',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      }

      const status = await emailVerificationService.getVerificationStatus(userId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      logger.error('Failed to get verification status', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get verification status',
        },
      });
    }
  }
);

export default router;

