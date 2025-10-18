/**
 * Email Verification Routes
 * ✅ FIX #5: Email verification workflow
 * 
 * Endpoints for sending and verifying email verification tokens
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { authenticate } from '../middleware/authentication';

const router = Router();

// Get database connection (adjust based on your setup)
import { query } from '../config/database';

/**
 * Send email verification
 * POST /api/v1/auth/send-verification
 * Requires: Authentication
 */
router.post('/send-verification', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }
    
    // Get user details
    const [users] = await query('SELECT * FROM auth_users WHERE id = ?', [userId]);
    const user = (users as any[])[0];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    if (user.email_verified) {
      return res.json({
        success: true,
        message: 'Email already verified',
        data: { verified: true }
      });
    }
    
    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Save token to database
    await query(`
      UPDATE auth_users 
      SET email_verification_token = ?,
          email_verification_expires = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [token, expires, userId]);
    
    // Send email via Notification Service
    try {
      const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002';
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      
      await axios.post(`${notificationUrl}/api/v1/emails/send`, {
        to: user.email,
        subject: 'Verify Your Email - NileCare',
        template: 'email-verification',
        data: {
          first_name: user.first_name || 'User',
          verification_link: `${clientUrl}/verify-email?token=${token}`,
          expires_in: '24 hours'
        }
      });
      
      console.log(`✅ Verification email sent to: ${user.email}`);
    } catch (emailError: any) {
      console.error('❌ Failed to send email:', emailError.message);
      // Continue anyway - token is saved
    }
    
    res.json({
      success: true,
      message: 'Verification email sent to ' + user.email,
      data: {
        email: user.email,
        expires_in: '24 hours'
      }
    });
    
  } catch (error: any) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send verification email'
      }
    });
  }
});

/**
 * Verify email with token
 * POST /api/v1/auth/verify-email
 * Public endpoint (no authentication required)
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Verification token is required'
        }
      });
    }
    
    // Find user by token
    const [users] = await query(`
      SELECT * FROM auth_users
      WHERE email_verification_token = ?
        AND email_verification_expires > NOW()
        AND email_verified = FALSE
    `, [token]);
    
    if ((users as any[]).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token'
        }
      });
    }
    
    const user = (users as any[])[0];
    
    // Update user status
    await query(`
      UPDATE auth_users
      SET email_verified = TRUE,
          status = 'active',
          email_verification_token = NULL,
          email_verification_expires = NULL,
          updated_at = NOW()
      WHERE id = ?
    `, [user.id]);
    
    console.log(`✅ Email verified for user: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: user.email,
        verified: true,
        status: 'active'
      }
    });
    
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VERIFICATION_FAILED',
        message: 'Failed to verify email'
      }
    });
  }
});

/**
 * Check verification status (public)
 * GET /api/v1/auth/verification-status/:email
 */
router.get('/verification-status/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    const [users] = await query('SELECT email_verified, status FROM auth_users WHERE email = ?', [email]);
    
    if ((users as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    const user = (users as any[])[0];
    
    res.json({
      success: true,
      data: {
        email_verified: user.email_verified,
        status: user.status
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check verification status'
      }
    });
  }
});

export default router;

