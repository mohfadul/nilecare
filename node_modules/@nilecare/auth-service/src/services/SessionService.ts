import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { RefreshToken } from '../models/User';

export class SessionService {
  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<RefreshToken[]> {
    try {
      const pool = getPool();
      
      const [rows]: any = await pool.query(
        `SELECT * FROM auth_refresh_tokens
         WHERE user_id = ? 
           AND is_revoked = FALSE 
           AND expires_at > NOW()
         ORDER BY created_at DESC`,
        [userId]
      );

      if (!Array.isArray(rows)) {
        return [];
      }
      return rows.map(row => this.mapToRefreshToken(row));
    } catch (error: any) {
      logger.error('Failed to get user sessions', { userId, error: error.message });
      return [];
    }
  }

  /**
   * Get session by token ID
   */
  async getSessionByTokenId(tokenId: string): Promise<RefreshToken | null> {
    try {
      const pool = getPool();
      
      const [rows]: any = await pool.query(
        'SELECT * FROM auth_refresh_tokens WHERE token_id = ?',
        [tokenId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapToRefreshToken(rows[0]);
    } catch (error: any) {
      logger.error('Failed to get session', { tokenId, error: error.message });
      return null;
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const pool = getPool();
      
      const [result]: any = await pool.query(
        `UPDATE auth_refresh_tokens
         SET is_revoked = TRUE,
             revoked_at = NOW(),
             revoked_reason = 'user_revoked'
         WHERE id = ? AND user_id = ?`,
        [sessionId, userId]
      );

      if (result.affectedRows > 0) {
        logger.info('Session revoked', { userId, sessionId });
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Failed to revoke session', { userId, sessionId, error: error.message });
      return false;
    }
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllSessionsExcept(userId: string, currentSessionId: string): Promise<number> {
    try {
      const pool = getPool();
      
      const [result]: any = await pool.query(
        `UPDATE auth_refresh_tokens
         SET is_revoked = TRUE,
             revoked_at = NOW(),
             revoked_reason = 'user_revoked_others'
         WHERE user_id = ? 
           AND id != ? 
           AND is_revoked = FALSE`,
        [userId, currentSessionId]
      );

      const count = result.affectedRows || 0;
      logger.info('Sessions revoked', { userId, count });
      return count;
    } catch (error: any) {
      logger.error('Failed to revoke sessions', { userId, error: error.message });
      return 0;
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllSessions(userId: string): Promise<number> {
    try {
      const pool = getPool();
      
      const [result]: any = await pool.query(
        `UPDATE auth_refresh_tokens
         SET is_revoked = TRUE,
             revoked_at = NOW(),
             revoked_reason = 'revoke_all'
         WHERE user_id = ? AND is_revoked = FALSE`,
        [userId]
      );

      const count = result.affectedRows || 0;
      logger.info('All sessions revoked', { userId, count });
      return count;
    } catch (error: any) {
      logger.error('Failed to revoke all sessions', { userId, error: error.message });
      return 0;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const pool = getPool();
      
      const [result]: any = await pool.query(
        `UPDATE auth_refresh_tokens
         SET is_revoked = TRUE,
             revoked_at = NOW(),
             revoked_reason = 'expired'
         WHERE expires_at < NOW() 
           AND is_revoked = FALSE`
      );

      const count = result.affectedRows || 0;
      if (count > 0) {
        logger.info(`Cleaned up ${count} expired sessions`);
      }

      return count;
    } catch (error: any) {
      logger.error('Failed to cleanup expired sessions', { error: error.message });
      return 0;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(userId: string): Promise<{
    activeSessions: number;
    totalSessions: number;
    revokedSessions: number;
  }> {
    try {
      const pool = getPool();
      
      const [rows]: any = await pool.query(
        `SELECT 
          SUM(CASE WHEN is_revoked = FALSE AND expires_at > NOW() THEN 1 ELSE 0 END) as active_sessions,
          COUNT(*) as total_sessions,
          SUM(CASE WHEN is_revoked = TRUE THEN 1 ELSE 0 END) as revoked_sessions
         FROM auth_refresh_tokens
         WHERE user_id = ?`,
        [userId]
      );

      const row = rows[0];
      return {
        activeSessions: parseInt(row.active_sessions) || 0,
        totalSessions: parseInt(row.total_sessions) || 0,
        revokedSessions: parseInt(row.revoked_sessions) || 0
      };
    } catch (error: any) {
      logger.error('Failed to get session stats', { userId, error: error.message });
      return {
        activeSessions: 0,
        totalSessions: 0,
        revokedSessions: 0
      };
    }
  }

  /**
   * Get global session statistics (admin)
   */
  async getGlobalSessionStats(): Promise<{
    activeSessions: number;
    totalSessions: number;
    uniqueUsers: number;
  }> {
    try {
      const pool = getPool();
      
      const [rows]: any = await pool.query(`
        SELECT 
          SUM(CASE WHEN is_revoked = FALSE AND expires_at > NOW() THEN 1 ELSE 0 END) as active_sessions,
          COUNT(*) as total_sessions,
          COUNT(DISTINCT CASE WHEN is_revoked = FALSE AND expires_at > NOW() THEN user_id END) as unique_users
        FROM auth_refresh_tokens
      `);

      const row = rows[0];
      return {
        activeSessions: parseInt(row.active_sessions) || 0,
        totalSessions: parseInt(row.total_sessions) || 0,
        uniqueUsers: parseInt(row.unique_users) || 0
      };
    } catch (error: any) {
      logger.error('Failed to get global session stats', { error: error.message });
      return {
        activeSessions: 0,
        totalSessions: 0,
        uniqueUsers: 0
      };
    }
  }

  /**
   * Map database row to RefreshToken model
   */
  private mapToRefreshToken(row: any): RefreshToken {
    return {
      id: row.id,
      token: row.token,
      tokenId: row.token_id,
      userId: row.user_id,
      expiresAt: row.expires_at,
      isRevoked: row.is_revoked,
      revokedAt: row.revoked_at,
      revokedReason: row.revoked_reason,
      createdAt: row.created_at,
      deviceFingerprint: row.device_fingerprint,
      ipAddress: row.ip_address,
      userAgent: row.user_agent
    };
  }
}

export default SessionService;

