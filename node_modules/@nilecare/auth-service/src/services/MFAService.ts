import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { User } from '../models/User';

export class MFAService {
  /**
   * Generate MFA secret and QR code for TOTP
   */
  async setupTOTP(userId: string, email: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `NileCare (${email})`,
        issuer: 'NileCare Health Platform',
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

      // Generate backup codes
      const backupCodes = this.generateBackupCodes(10);

      // Store encrypted secret in database (not activated yet)
      const pool = getPool();
      const encryptedSecret = this.encryptSecret(secret.base32);
      const hashedBackupCodes = backupCodes.map(code => 
        crypto.createHash('sha256').update(code).digest('hex')
      );

      await pool.query(
        `UPDATE auth_users 
         SET mfa_secret = ?, 
             mfa_method = 'totp',
             mfa_backup_codes = ?
         WHERE id = ?`,
        [encryptedSecret, JSON.stringify(hashedBackupCodes), userId]
      );

      logger.info('MFA TOTP setup initiated', { userId, email });

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes
      };
    } catch (error: any) {
      logger.error('MFA TOTP setup failed', { userId, error: error.message });
      throw new Error('Failed to setup MFA');
    }
  }

  /**
   * Verify TOTP token and enable MFA
   */
  async verifyAndEnableTOTP(userId: string, token: string): Promise<boolean> {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        'SELECT mfa_secret, email FROM auth_users WHERE id = ?',
        [userId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('User not found');
      }

      const user = rows[0];
      const decryptedSecret = this.decryptSecret(user.mfa_secret);

      // Verify token with 2-step window (allows for time drift)
      const verified = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (verified) {
        // Enable MFA
        await pool.query(
          'UPDATE auth_users SET mfa_enabled = TRUE WHERE id = ?',
          [userId]
        );

        logger.info('MFA enabled successfully', { userId, email: user.email });
        return true;
      }

      logger.warn('Invalid MFA verification token', { userId });
      return false;
    } catch (error: any) {
      logger.error('MFA verification failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Verify TOTP token during login
   */
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        'SELECT mfa_secret, mfa_enabled, mfa_backup_codes FROM auth_users WHERE id = ?',
        [userId]
      );

      if (!Array.isArray(rows) || rows.length === 0 || !rows[0].mfa_enabled) {
        return false;
      }

      const user = rows[0];

      // Try TOTP verification first
      const decryptedSecret = this.decryptSecret(user.mfa_secret);
      const verified = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (verified) {
        logger.info('MFA TOTP verification successful', { userId });
        return true;
      }

      // Try backup code if TOTP fails
      const backupCodeValid = await this.verifyBackupCode(userId, token, user.mfa_backup_codes);
      if (backupCodeValid) {
        logger.info('MFA backup code verification successful', { userId });
        return true;
      }

      logger.warn('MFA verification failed', { userId });
      return false;
    } catch (error: any) {
      logger.error('MFA verification error', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Disable MFA for a user
   */
  async disableMFA(userId: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE auth_users 
         SET mfa_enabled = FALSE,
             mfa_secret = NULL,
             mfa_method = NULL,
             mfa_backup_codes = NULL
         WHERE id = ?`,
        [userId]
      );

      logger.info('MFA disabled', { userId });
    } catch (error: any) {
      logger.error('Failed to disable MFA', { userId, error: error.message });
      throw new Error('Failed to disable MFA');
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const backupCodes = this.generateBackupCodes(10);
      const hashedBackupCodes = backupCodes.map(code => 
        crypto.createHash('sha256').update(code).digest('hex')
      );

      const pool = getPool();
      await pool.query(
        'UPDATE auth_users SET mfa_backup_codes = ? WHERE id = ?',
        [JSON.stringify(hashedBackupCodes), userId]
      );

      logger.info('MFA backup codes regenerated', { userId });
      return backupCodes;
    } catch (error: any) {
      logger.error('Failed to regenerate backup codes', { userId, error: error.message });
      throw new Error('Failed to regenerate backup codes');
    }
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(
    userId: string, 
    code: string, 
    hashedCodes: string[]
  ): Promise<boolean> {
    const hashedInput = crypto.createHash('sha256').update(code).digest('hex');
    
    const index = hashedCodes.indexOf(hashedInput);
    if (index === -1) {
      return false;
    }

    // Remove used backup code
    hashedCodes.splice(index, 1);
    
    const pool = getPool();
    await pool.query(
      'UPDATE auth_users SET mfa_backup_codes = ? WHERE id = ?',
      [JSON.stringify(hashedCodes), userId]
    );

    return true;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      // Format as XXXX-XXXX
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
    }
    return codes;
  }

  /**
   * Encrypt MFA secret
   */
  private encryptSecret(secret: string): string {
    if (!process.env.MFA_ENCRYPTION_KEY) {
      throw new Error('MFA_ENCRYPTION_KEY environment variable is required');
    }

    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      process.env.MFA_ENCRYPTION_KEY,
      'salt',
      32
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt MFA secret
   */
  private decryptSecret(encryptedData: string): string {
    if (!process.env.MFA_ENCRYPTION_KEY) {
      throw new Error('MFA_ENCRYPTION_KEY environment variable is required');
    }

    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      process.env.MFA_ENCRYPTION_KEY,
      'salt',
      32
    );
    
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Get MFA status for a user
   */
  async getMFAStatus(userId: string): Promise<{
    enabled: boolean;
    method?: string;
    backupCodesRemaining?: number;
  }> {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        'SELECT mfa_enabled, mfa_method, mfa_backup_codes FROM auth_users WHERE id = ?',
        [userId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('User not found');
      }

      const user = rows[0];
      let backupCodes: any[] = [];
      if (user.mfa_backup_codes) {
        try {
          backupCodes = typeof user.mfa_backup_codes === 'string' 
            ? JSON.parse(user.mfa_backup_codes) 
            : user.mfa_backup_codes;
        } catch (e) {
          backupCodes = [];
        }
      }

      return {
        enabled: user.mfa_enabled,
        method: user.mfa_method,
        backupCodesRemaining: Array.isArray(backupCodes) ? backupCodes.length : 0
      };
    } catch (error: any) {
      logger.error('Failed to get MFA status', { userId, error: error.message });
      throw error;
    }
  }
}

export default MFAService;

