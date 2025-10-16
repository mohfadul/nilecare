/**
 * Email Verification Service
 * 
 * Handles email verification for user accounts
 * - Generates secure verification tokens
 * - Sends verification emails
 * - Validates verification tokens
 * - Tracks verification attempts
 */

import crypto from 'crypto';
import { db } from '../config/database';
import { logger } from '../utils/logger';

export interface VerificationToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

export class EmailVerificationService {
  private readonly TOKEN_EXPIRY_HOURS = 24; // 24 hours to verify
  private readonly MAX_RESEND_PER_DAY = 5;

  /**
   * Generate verification token for user
   */
  async generateVerificationToken(userId: string, email: string): Promise<string> {
    try {
      // Generate secure random token (32 bytes = 64 hex characters)
      const token = crypto.randomBytes(32).toString('hex');
      
      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      // Store token in database
      await db.query(
        `INSERT INTO email_verification_tokens 
         (id, user_id, email, token, expires_at, created_at, used) 
         VALUES (UUID(), ?, ?, ?, ?, NOW(), FALSE)`,
        [userId, email, token, expiresAt]
      );

      logger.info('Email verification token generated', {
        userId,
        email: this.maskEmail(email),
        expiresAt,
      });

      return token;
    } catch (error: any) {
      logger.error('Failed to generate verification token', {
        userId,
        error: error.message,
      });
      throw new Error('Failed to generate verification token');
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; userId?: string; message: string }> {
    try {
      // Find token in database
      const [tokens] = await db.query(
        `SELECT id, user_id, email, expires_at, used 
         FROM email_verification_tokens 
         WHERE token = ? 
         LIMIT 1`,
        [token]
      );

      if (!tokens || tokens.length === 0) {
        logger.warn('Invalid verification token attempted', { token: token.substring(0, 10) + '...' });
        return {
          success: false,
          message: 'Invalid verification token',
        };
      }

      const verificationToken = tokens[0];

      // Check if already used
      if (verificationToken.used) {
        logger.warn('Verification token already used', {
          tokenId: verificationToken.id,
          userId: verificationToken.user_id,
        });
        return {
          success: false,
          message: 'Verification token has already been used',
        };
      }

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(verificationToken.expires_at);
      if (now > expiresAt) {
        logger.warn('Expired verification token attempted', {
          tokenId: verificationToken.id,
          userId: verificationToken.user_id,
          expiresAt,
        });
        return {
          success: false,
          message: 'Verification token has expired. Please request a new one.',
        };
      }

      // Mark token as used
      await db.query(
        'UPDATE email_verification_tokens SET used = TRUE, used_at = NOW() WHERE id = ?',
        [verificationToken.id]
      );

      // Update user's email_verified status
      await db.query(
        'UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE id = ?',
        [verificationToken.user_id]
      );

      logger.info('Email verified successfully', {
        userId: verificationToken.user_id,
        email: this.maskEmail(verificationToken.email),
      });

      return {
        success: true,
        userId: verificationToken.user_id,
        message: 'Email verified successfully',
      };
    } catch (error: any) {
      logger.error('Email verification failed', {
        error: error.message,
      });
      throw new Error('Email verification failed');
    }
  }

  /**
   * Check if user can request another verification email
   */
  async canResendVerification(userId: string): Promise<{ allowed: boolean; reason?: string; remainingAttempts?: number }> {
    try {
      // Check how many tokens were sent today
      const [result] = await db.query(
        `SELECT COUNT(*) as count 
         FROM email_verification_tokens 
         WHERE user_id = ? 
           AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [userId]
      );

      const count = result[0]?.count || 0;

      if (count >= this.MAX_RESEND_PER_DAY) {
        return {
          allowed: false,
          reason: `Maximum ${this.MAX_RESEND_PER_DAY} verification emails per day reached. Please try again tomorrow.`,
          remainingAttempts: 0,
        };
      }

      return {
        allowed: true,
        remainingAttempts: this.MAX_RESEND_PER_DAY - count,
      };
    } catch (error: any) {
      logger.error('Failed to check resend eligibility', {
        userId,
        error: error.message,
      });
      throw new Error('Failed to check verification email eligibility');
    }
  }

  /**
   * Invalidate all verification tokens for a user
   */
  async invalidateUserTokens(userId: string): Promise<void> {
    try {
      await db.query(
        'UPDATE email_verification_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE',
        [userId]
      );

      logger.info('Invalidated all verification tokens for user', { userId });
    } catch (error: any) {
      logger.error('Failed to invalidate tokens', {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * Clean up expired tokens (run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const [result] = await db.query(
        'DELETE FROM email_verification_tokens WHERE expires_at < NOW()'
      );

      const deletedCount = (result as any).affectedRows || 0;

      if (deletedCount > 0) {
        logger.info('Cleaned up expired verification tokens', { count: deletedCount });
      }

      return deletedCount;
    } catch (error: any) {
      logger.error('Failed to cleanup expired tokens', {
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Get verification status for user
   */
  async getVerificationStatus(userId: string): Promise<{
    emailVerified: boolean;
    verifiedAt?: Date;
    pendingTokens: number;
  }> {
    try {
      // Get user email verification status
      const [users] = await db.query(
        'SELECT email_verified, email_verified_at FROM users WHERE id = ?',
        [userId]
      );

      if (!users || users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];

      // Count pending tokens
      const [tokenCount] = await db.query(
        `SELECT COUNT(*) as count 
         FROM email_verification_tokens 
         WHERE user_id = ? 
           AND used = FALSE 
           AND expires_at > NOW()`,
        [userId]
      );

      return {
        emailVerified: user.email_verified || false,
        verifiedAt: user.email_verified_at,
        pendingTokens: tokenCount[0]?.count || 0,
      };
    } catch (error: any) {
      logger.error('Failed to get verification status', {
        userId,
        error: error.message,
      });
      throw new Error('Failed to get verification status');
    }
  }

  /**
   * Mask email for logging (privacy)
   */
  private maskEmail(email: string): string {
    if (!email) return '***';
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***';
    
    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : '***';
    
    return `${maskedLocal}@${domain}`;
  }
}

export default EmailVerificationService;

