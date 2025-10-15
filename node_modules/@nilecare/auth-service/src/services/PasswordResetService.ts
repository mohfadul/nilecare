import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { getPool } from '../config/database';

export class PasswordResetService {
  private readonly TOKEN_EXPIRY_HOURS = 1;
  private readonly BCRYPT_ROUNDS = 12;

  /**
   * Request password reset - generates secure token and stores hash
   */
  async requestPasswordReset(email: string): Promise<{ 
    success: boolean; 
    token?: string;
  }> {
    try {
      const pool = getPool();
      
      // Check if user exists
      const [rows]: any = await pool.query(
        'SELECT id, email, username FROM auth_users WHERE email = ? AND status = ?',
        [email, 'active']
      );

      // ✅ SECURITY: Always return success to prevent email enumeration
      if (!Array.isArray(rows) || rows.length === 0) {
        logger.warn('Password reset requested for non-existent email', { email });
        return { success: true }; // Don't reveal user doesn't exist
      }

      const user = rows[0];

      // Generate cryptographically secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash the token before storing
      const resetTokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Calculate expiry time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      // Store hashed token with expiration
      await pool.query(
        `UPDATE auth_users 
         SET reset_token = ?,
             reset_token_expires = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [resetTokenHash, expiresAt, user.id]
      );

      logger.info('Password reset token generated', { 
        userId: user.id, 
        email: user.email,
        expiresAt 
      });

      // Return unhashed token (to be sent via email)
      return { 
        success: true, 
        token: resetToken 
      };
    } catch (error: any) {
      logger.error('Password reset request failed', { 
        email, 
        error: error.message 
      });
      throw new Error('Failed to process password reset request');
    }
  }

  /**
   * Verify reset token validity
   */
  async verifyResetToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    email?: string;
  }> {
    try {
      // Hash the provided token
      const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const pool = getPool();
      const [rows]: any = await pool.query(
        `SELECT id, email, reset_token_expires 
         FROM auth_users 
         WHERE reset_token = ?`,
        [tokenHash]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        logger.warn('Invalid password reset token provided');
        return { valid: false };
      }

      const user = rows[0];

      // Check if token has expired
      if (new Date() > new Date(user.reset_token_expires)) {
        logger.warn('Expired password reset token', { userId: user.id });
        
        // Clear expired token
        await this.clearResetToken(user.id);
        
        return { valid: false };
      }

      return { 
        valid: true, 
        userId: user.id,
        email: user.email
      };
    } catch (error: any) {
      logger.error('Token verification failed', { error: error.message });
      return { valid: false };
    }
  }

  /**
   * Reset password using valid token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Verify token
      const verification = await this.verifyResetToken(token);
      
      if (!verification.valid || !verification.userId) {
        return false;
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

      const pool = getPool();
      
      // Update password and clear reset token
      await pool.query(
        `UPDATE auth_users 
         SET password_hash = ?,
             reset_token = NULL,
             reset_token_expires = NULL,
             failed_login_attempts = 0,
             account_locked_until = NULL,
             updated_at = NOW()
         WHERE id = ?`,
        [passwordHash, verification.userId]
      );

      // Invalidate all refresh tokens (log out all devices)
      await pool.query(
        `UPDATE auth_refresh_tokens 
         SET is_revoked = TRUE,
             revoked_at = NOW(),
             revoked_reason = 'password_reset'
         WHERE user_id = ? AND is_revoked = FALSE`,
        [verification.userId]
      );

      logger.info('Password reset successful', { 
        userId: verification.userId,
        email: verification.email 
      });

      return true;
    } catch (error: any) {
      logger.error('Password reset failed', { error: error.message });
      throw new Error('Failed to reset password');
    }
  }

  /**
   * Change password (for authenticated users)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const pool = getPool();
      
      // Get current password hash
      const [rows]: any = await pool.query(
        'SELECT password_hash, email FROM auth_users WHERE id = ?',
        [userId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return { success: false, error: 'User not found' };
      }

      const user = rows[0];

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );

      if (!isValidPassword) {
        logger.warn('Invalid current password in change request', { userId });
        return { success: false, error: 'Current password is incorrect' };
      }

      // Ensure new password is different
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
      if (isSamePassword) {
        return { 
          success: false, 
          error: 'New password must be different from current password' 
        };
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

      // Update password
      await pool.query(
        `UPDATE auth_users 
         SET password_hash = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [passwordHash, userId]
      );

      // Invalidate all other refresh tokens (keep current session)
      await pool.query(
        `UPDATE auth_refresh_tokens 
         SET is_revoked = TRUE,
             revoked_at = NOW(),
             revoked_reason = 'password_changed'
         WHERE user_id = ? AND is_revoked = FALSE`,
        [userId]
      );

      logger.info('Password changed successfully', { userId, email: user.email });

      return { success: true };
    } catch (error: any) {
      logger.error('Password change failed', { userId, error: error.message });
      throw new Error('Failed to change password');
    }
  }

  /**
   * Clear reset token
   */
  private async clearResetToken(userId: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE auth_users 
         SET reset_token = NULL,
             reset_token_expires = NULL
         WHERE id = ?`,
        [userId]
      );
    } catch (error: any) {
      logger.error('Failed to clear reset token', { userId, error: error.message });
    }
  }

  /**
   * Clean up expired reset tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const pool = getPool();
      const [result]: any = await pool.query(
        `UPDATE auth_users 
         SET reset_token = NULL,
             reset_token_expires = NULL
         WHERE reset_token IS NOT NULL 
           AND reset_token_expires < NOW()`
      );

      const count = result.affectedRows || 0;
      if (count > 0) {
        logger.info(`Cleaned up ${count} expired password reset tokens`);
      }

      return count;
    } catch (error: any) {
      logger.error('Failed to cleanup expired tokens', { error: error.message });
      return 0;
    }
  }
}

export default PasswordResetService;

