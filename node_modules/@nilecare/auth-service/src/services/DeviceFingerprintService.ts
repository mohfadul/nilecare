import crypto from 'crypto';
import { Request } from 'express';
import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { Device } from '../models/User';

export class DeviceFingerprintService {
  /**
   * Generate device fingerprint from request
   */
  generateFingerprint(req: Request): string {
    const components = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['accept-encoding'] || '',
      req.headers['accept'] || '',
    ];

    const fingerprintString = components.join('|');
    
    return crypto
      .createHash('sha256')
      .update(fingerprintString)
      .digest('hex');
  }

  /**
   * Get client IP address
   */
  getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Check if device is known/trusted
   */
  async isKnownDevice(userId: string, fingerprint: string): Promise<boolean> {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        'SELECT id FROM auth_devices WHERE user_id = ? AND fingerprint = ?',
        [userId, fingerprint]
      );

      return Array.isArray(rows) && rows.length > 0;
    } catch (error: any) {
      logger.error('Failed to check known device', { 
        userId, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Register new device
   */
  async registerDevice(
    userId: string,
    req: Request,
    isVerified: boolean = false
  ): Promise<Device> {
    try {
      const fingerprint = this.generateFingerprint(req);
      const ipAddress = this.getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';

      // Extract device name from user agent
      const deviceName = this.extractDeviceName(userAgent);

      const pool = getPool();
      
      // Check if device already exists
      const [existingRows]: any = await pool.query(
        'SELECT * FROM auth_devices WHERE user_id = ? AND fingerprint = ?',
        [userId, fingerprint]
      );

      if (Array.isArray(existingRows) && existingRows.length > 0) {
        // Update last used
        await pool.query(
          `UPDATE auth_devices 
           SET last_used = NOW(),
               ip_address = ?,
               user_agent = ?
           WHERE user_id = ? AND fingerprint = ?`,
          [ipAddress, userAgent, userId, fingerprint]
        );

        const [updatedRows]: any = await pool.query(
          'SELECT * FROM auth_devices WHERE user_id = ? AND fingerprint = ?',
          [userId, fingerprint]
        );

        logger.debug('Device updated', { userId, fingerprint });
        return this.mapToDevice(updatedRows[0]);
      }

      // Insert new device
      await pool.query(
        `INSERT INTO auth_devices (
          id, user_id, fingerprint, name, ip_address, 
          user_agent, is_verified, last_used
        )
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())`,
        [userId, fingerprint, deviceName, ipAddress, userAgent, isVerified]
      );

      // Get inserted device
      const [insertedRows]: any = await pool.query(
        'SELECT * FROM auth_devices WHERE user_id = ? AND fingerprint = ?',
        [userId, fingerprint]
      );

      logger.info('New device registered', { 
        userId, 
        fingerprint, 
        deviceName,
        isVerified 
      });

      return this.mapToDevice(insertedRows[0]);
    } catch (error: any) {
      logger.error('Failed to register device', { 
        userId, 
        error: error.message 
      });
      throw new Error('Failed to register device');
    }
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string): Promise<Device[]> {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        `SELECT * FROM auth_devices 
         WHERE user_id = ? 
         ORDER BY last_used DESC`,
        [userId]
      );

      if (!Array.isArray(rows)) {
        return [];
      }
      return rows.map(row => this.mapToDevice(row));
    } catch (error: any) {
      logger.error('Failed to get user devices', { 
        userId, 
        error: error.message 
      });
      return [];
    }
  }

  /**
   * Verify a device
   */
  async verifyDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      const pool = getPool();
      const [result]: any = await pool.query(
        `UPDATE auth_devices 
         SET is_verified = TRUE 
         WHERE id = ? AND user_id = ?`,
        [deviceId, userId]
      );

      if (result.affectedRows > 0) {
        logger.info('Device verified', { userId, deviceId });
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Failed to verify device', { 
        userId, 
        deviceId, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Remove a device
   */
  async removeDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      const pool = getPool();
      
      // Also revoke all refresh tokens from this device
      await pool.query(
        `UPDATE auth_refresh_tokens 
         SET is_revoked = TRUE,
             revoked_at = NOW(),
             revoked_reason = 'device_removed'
         WHERE user_id = ? 
           AND device_fingerprint = (
             SELECT fingerprint FROM auth_devices WHERE id = ?
           )`,
        [userId, deviceId]
      );

      const [result]: any = await pool.query(
        'DELETE FROM auth_devices WHERE id = ? AND user_id = ?',
        [deviceId, userId]
      );

      if (result.affectedRows > 0) {
        logger.info('Device removed', { userId, deviceId });
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Failed to remove device', { 
        userId, 
        deviceId, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Clean up old devices (not used in 90 days)
   */
  async cleanupOldDevices(days: number = 90): Promise<number> {
    try {
      const pool = getPool();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const [result]: any = await pool.query(
        `DELETE FROM auth_devices 
         WHERE last_used < ? 
           AND is_verified = FALSE`,
        [cutoffDate]
      );

      const count = result.affectedRows || 0;
      if (count > 0) {
        logger.info(`Cleaned up ${count} old devices`);
      }

      return count;
    } catch (error: any) {
      logger.error('Failed to cleanup old devices', { error: error.message });
      return 0;
    }
  }

  /**
   * Extract device name from user agent
   */
  private extractDeviceName(userAgent: string): string {
    // Simple device detection
    if (/iPhone/i.test(userAgent)) return 'iPhone';
    if (/iPad/i.test(userAgent)) return 'iPad';
    if (/Android/i.test(userAgent)) return 'Android Device';
    if (/Windows/i.test(userAgent)) return 'Windows PC';
    if (/Macintosh/i.test(userAgent)) return 'Mac';
    if (/Linux/i.test(userAgent)) return 'Linux PC';
    
    return 'Unknown Device';
  }

  /**
   * Map database row to Device model
   */
  private mapToDevice(row: any): Device {
    return {
      id: row.id,
      userId: row.user_id,
      fingerprint: row.fingerprint,
      name: row.name,
      lastUsed: row.last_used,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      isVerified: row.is_verified,
      createdAt: row.created_at
    };
  }

  /**
   * Get device statistics for monitoring
   */
  async getDeviceStats(userId: string): Promise<{
    totalDevices: number;
    verifiedDevices: number;
    recentDevices: number;
  }> {
    try {
      const pool = getPool();
      
      const [rows]: any = await pool.query(
        `SELECT 
          COUNT(*) as total_devices,
          SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified_devices,
          SUM(CASE WHEN last_used > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recent_devices
         FROM auth_devices
         WHERE user_id = ?`,
        [userId]
      );

      const row = rows[0];
      return {
        totalDevices: parseInt(row.total_devices) || 0,
        verifiedDevices: parseInt(row.verified_devices) || 0,
        recentDevices: parseInt(row.recent_devices) || 0
      };
    } catch (error: any) {
      logger.error('Failed to get device stats', { userId, error: error.message });
      return {
        totalDevices: 0,
        verifiedDevices: 0,
        recentDevices: 0
      };
    }
  }
}

export default DeviceFingerprintService;

