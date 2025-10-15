import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { User } from '../models/User';

export class UserService {
  // ✅ SECURITY: Whitelist of allowed update fields
  private readonly ALLOWED_UPDATE_FIELDS = [
    'email',
    'username',
    'first_name',
    'lastName',
    'role',
    'status',
    'mfa_enabled',
    'mfa_secret',
    'mfa_method',
    'mfa_backup_codes',
    'email_verified',
    'organization_id',
    'permissions'
  ];
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const pool = getPool();
      const [rows] = await pool.query(
        'SELECT * FROM auth_users WHERE LOWER(email) = LOWER(?)',
        [email]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapToUser(rows[0]);
    } catch (error: any) {
      logger.error('Failed to find user by email', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    try {
      const pool = getPool();
      const [rows] = await pool.query(
        'SELECT * FROM auth_users WHERE id = ?',
        [userId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapToUser(rows[0]);
    } catch (error: any) {
      logger.error('Failed to find user by ID', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user by ID (alias for findById)
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.findById(userId);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const pool = getPool();
      const [rows] = await pool.query(
        'SELECT * FROM auth_users WHERE LOWER(username) = LOWER(?)',
        [username]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapToUser(rows[0]);
    } catch (error: any) {
      logger.error('Failed to find user by username', { username, error: error.message });
      throw error;
    }
  }

  /**
   * Create new user
   */
  async create(userData: {
    email: string;
    username: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    status?: string;
    organizationId?: string;
  }): Promise<User> {
    try {
      const pool = getPool();
      const [result]: any = await pool.query(
        `INSERT INTO auth_users (
          id, email, username, password_hash, first_name, last_name, 
          role, status, organization_id
        )
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.email,
          userData.username,
          userData.passwordHash,
          userData.firstName || null,
          userData.lastName || null,
          userData.role || 'patient',
          userData.status || 'active',
          userData.organizationId || null
        ]
      );

      // Get the created user
      const userId = result.insertId;
      const [rows]: any = await pool.query('SELECT * FROM auth_users WHERE id = ?', [userId]);

      logger.info('User created successfully', { 
        userId: rows[0]?.id,
        email: userData.email,
        username: userData.username
      });

      return this.mapToUser(rows[0]);
    } catch (error: any) {
      logger.error('Failed to create user', { email: userData.email, error: error.message });
      throw error;
    }
  }

  /**
   * Update user
   * ✅ SECURITY: SQL injection protection with field whitelist
   */
  async update(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const pool = getPool();
      
      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];

      // ✅ SECURITY: Validate field names against whitelist
      const fieldMapping: Record<string, string> = {
        'email': 'email',
        'username': 'username',
        'firstName': 'first_name',
        'lastName': 'last_name',
        'role': 'role',
        'status': 'status',
        'mfaEnabled': 'mfa_enabled',
        'mfaSecret': 'mfa_secret',
        'mfaMethod': 'mfa_method',
        'mfaBackupCodes': 'mfa_backup_codes',
        'emailVerified': 'email_verified',
        'organizationId': 'organization_id',
        'permissions': 'permissions'
      };

      for (const [jsField, dbField] of Object.entries(fieldMapping)) {
        if ((updates as any)[jsField] !== undefined) {
          // ✅ SECURITY: Only allow whitelisted fields
          if (!this.ALLOWED_UPDATE_FIELDS.includes(dbField)) {
            logger.warn('Attempted to update non-whitelisted field', { field: dbField, userId });
            continue;
          }

          updateFields.push(`${dbField} = ?`);
          let value = (updates as any)[jsField];
          
          // Handle JSON fields
          if (['mfa_backup_codes', 'permissions'].includes(dbField) && typeof value !== 'string') {
            value = JSON.stringify(value);
          }
          
          values.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(userId);

      const query = `
        UPDATE auth_users 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await pool.query(query, values);

      // Get updated user
      const [rows]: any = await pool.query(
        'SELECT * FROM auth_users WHERE id = ?',
        [userId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('User not found');
      }

      logger.info('User updated successfully', { userId });
      return this.mapToUser(rows[0]);
    } catch (error: any) {
      logger.error('Failed to update user', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update password
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE auth_users 
         SET password_hash = ?, updated_at = NOW()
         WHERE id = ?`,
        [passwordHash, userId]
      );

      logger.info('Password updated successfully', { userId });
    } catch (error: any) {
      logger.error('Failed to update password', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLoginAttempts(userId: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE auth_users 
         SET failed_login_attempts = failed_login_attempts + 1,
             last_failed_login = NOW()
         WHERE id = ?`,
        [userId]
      );
    } catch (error: any) {
      logger.error('Failed to increment login attempts', { userId, error: error.message });
    }
  }

  /**
   * Reset failed login attempts
   */
  async resetFailedLoginAttempts(userId: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE auth_users 
         SET failed_login_attempts = 0,
             last_failed_login = NULL,
             account_locked_until = NULL
         WHERE id = ?`,
        [userId]
      );
    } catch (error: any) {
      logger.error('Failed to reset login attempts', { userId, error: error.message });
    }
  }

  /**
   * Update last login
   */
  async updateLastLogin(userId: string, ipAddress: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE auth_users 
         SET last_login = NOW(),
             last_login_ip = ?
         WHERE id = ?`,
        [ipAddress, userId]
      );
    } catch (error: any) {
      logger.error('Failed to update last login', { userId, error: error.message });
    }
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(
    userId: string,
    token: string,
    tokenId: string,
    deviceFingerprint?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const pool = getPool();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await pool.query(
        `INSERT INTO auth_refresh_tokens (
          id, token, token_id, user_id, expires_at,
          device_fingerprint, ip_address, user_agent
        )
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
        [token, tokenId, userId, expiresAt, deviceFingerprint, ipAddress, userAgent]
      );
    } catch (error: any) {
      logger.error('Failed to store refresh token', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(token: string): Promise<boolean> {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        `SELECT is_revoked, expires_at 
         FROM auth_refresh_tokens 
         WHERE token = ?`,
        [token]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return false;
      }

      const tokenData = rows[0];
      
      if (tokenData.is_revoked) {
        return false;
      }

      if (new Date() > new Date(tokenData.expires_at)) {
        return false;
      }

      return true;
    } catch (error: any) {
      logger.error('Failed to validate refresh token', { error: error.message });
      return false;
    }
  }

  /**
   * Invalidate refresh token
   */
  async invalidateRefreshToken(token: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE auth_refresh_tokens 
         SET is_revoked = TRUE,
             revoked_at = NOW(),
             revoked_reason = 'user_logout'
         WHERE token = ?`,
        [token]
      );
    } catch (error: any) {
      logger.error('Failed to invalidate refresh token', { error: error.message });
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllSessions(userId: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE auth_refresh_tokens 
         SET is_revoked = TRUE,
             revoked_at = NOW(),
             revoked_reason = 'invalidate_all'
         WHERE user_id = ? AND is_revoked = FALSE`,
        [userId]
      );

      logger.info('All sessions invalidated', { userId });
    } catch (error: any) {
      logger.error('Failed to invalidate all sessions', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Store password reset token
   */
  async storePasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: number
  ): Promise<void> {
    try {
      const pool = getPool();
      const expiresDate = new Date(expiresAt);
      await pool.query(
        `UPDATE auth_users 
         SET reset_token = ?,
             reset_token_expires = ?
         WHERE id = ?`,
        [tokenHash, expiresDate, userId]
      );
    } catch (error: any) {
      logger.error('Failed to store reset token', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Clear password reset token
   */
  async clearPasswordResetToken(userId: string): Promise<void> {
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
   * Find user by reset token
   */
  async findByResetToken(tokenHash: string): Promise<(User & { resetTokenExpires: number }) | null> {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        `SELECT *, UNIX_TIMESTAMP(reset_token_expires) * 1000 as reset_token_expires_ms
         FROM auth_users 
         WHERE reset_token = ?`,
        [tokenHash]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const user = this.mapToUser(rows[0]);
      return {
        ...user,
        resetTokenExpires: rows[0].reset_token_expires_ms
      };
    } catch (error: any) {
      logger.error('Failed to find user by reset token', { error: error.message });
      return null;
    }
  }

  /**
   * Save MFA secret
   */
  async saveMfaSecret(userId: string, encryptedSecret: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE auth_users SET mfa_secret = ? WHERE id = ?',
        [encryptedSecret, userId]
      );
    } catch (error: any) {
      logger.error('Failed to save MFA secret', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Check if device is known
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
      logger.error('Failed to check known device', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Add device
   */
  async addDevice(userId: string, fingerprint: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        `INSERT INTO auth_devices (id, user_id, fingerprint, last_used)
         VALUES (UUID(), ?, ?, NOW())
         ON DUPLICATE KEY UPDATE last_used = NOW()`,
        [userId, fingerprint]
      );
    } catch (error: any) {
      logger.error('Failed to add device', { userId, error: error.message });
    }
  }

  /**
   * List all users (admin)
   */
  async listUsers(
    page: number = 1,
    limit: number = 20,
    filters?: { role?: string; status?: string; search?: string }
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    try {
      const pool = getPool();
      const offset = (page - 1) * limit;

      let whereClause = '';
      const values: any[] = [];

      const conditions: string[] = [];

      if (filters?.role) {
        conditions.push(`role = ?`);
        values.push(filters.role);
      }

      if (filters?.status) {
        conditions.push(`status = ?`);
        values.push(filters.status);
      }

      if (filters?.search) {
        conditions.push(`(email LIKE ? OR username LIKE ?)`);
        values.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Get total count
      const [countRows]: any = await pool.query(
        `SELECT COUNT(*) as total FROM auth_users ${whereClause}`,
        values
      );
      const total = parseInt(countRows[0].total);

      // Get paginated users
      const paginationValues = [...values, limit, offset];
      const [userRows]: any = await pool.query(
        `SELECT * FROM auth_users ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        paginationValues
      );

      const users = Array.isArray(userRows) ? userRows.map(row => this.mapToUser(row)) : [];

      return { users, total, page, limit };
    } catch (error: any) {
      logger.error('Failed to list users', { error: error.message });
      throw error;
    }
  }

  /**
   * Map database row to User model
   */
  private mapToUser(row: any): User {
    // Parse JSON fields from MySQL
    let mfaBackupCodes: string[] = [];
    if (row.mfa_backup_codes) {
      try {
        mfaBackupCodes = typeof row.mfa_backup_codes === 'string'
          ? JSON.parse(row.mfa_backup_codes)
          : row.mfa_backup_codes;
      } catch (e) {
        mfaBackupCodes = [];
      }
    }

    let permissions: string[] = [];
    if (row.permissions) {
      try {
        permissions = typeof row.permissions === 'string'
          ? JSON.parse(row.permissions)
          : row.permissions;
      } catch (e) {
        permissions = [];
      }
    }

    return {
      id: row.id,
      email: row.email,
      username: row.username,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      status: row.status,
      mfaEnabled: row.mfa_enabled,
      mfaSecret: row.mfa_secret,
      mfaMethod: row.mfa_method,
      mfaBackupCodes: mfaBackupCodes,
      failedLoginAttempts: row.failed_login_attempts,
      lastFailedLogin: row.last_failed_login,
      accountLockedUntil: row.account_locked_until,
      lastLogin: row.last_login,
      lastLoginIp: row.last_login_ip,
      resetToken: row.reset_token,
      resetTokenExpires: row.reset_token_expires,
      emailVerified: row.email_verified,
      emailVerificationToken: row.email_verification_token,
      emailVerificationExpires: row.email_verification_expires,
      organizationId: row.organization_id,
      permissions: permissions,
      refreshTokens: [],
      devices: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

export default UserService;

