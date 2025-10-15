import crypto from 'crypto';
import { logger } from '../utils/logger';
import { getPool } from '../config/database';

interface OAuthClient {
  id: string;
  clientId: string;
  clientSecret: string;
  name: string;
  redirectUris: string[];
  grantTypes: string[];
  scope: string[];
  organizationId?: string;
  createdAt: Date;
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string[];
  expiresAt: Date;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

export class OAuthService {
  /**
   * Register OAuth2 client
   */
  async registerClient(clientData: {
    name: string;
    redirectUris: string[];
    grantTypes?: string[];
    scope?: string[];
    organizationId?: string;
  }): Promise<{ clientId: string; clientSecret: string }> {
    try {
      const clientId = this.generateClientId();
      const clientSecret = this.generateClientSecret();
      const clientSecretHash = await this.hashSecret(clientSecret);

      const pool = getPool();
      await pool.query(
        `INSERT INTO oauth_clients (
          id, client_id, client_secret_hash, name, redirect_uris,
          grant_types, scope, organization_id
        )
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
        [
          clientId,
          clientSecretHash,
          clientData.name,
          JSON.stringify(clientData.redirectUris),
          JSON.stringify(clientData.grantTypes || ['authorization_code', 'refresh_token']),
          JSON.stringify(clientData.scope || ['openid', 'profile', 'email']),
          clientData.organizationId || null
        ]
      );

      logger.info('OAuth client registered', { clientId, name: clientData.name });

      return { clientId, clientSecret };
    } catch (error: any) {
      logger.error('Failed to register OAuth client', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate OAuth2 client credentials
   */
  async validateClient(clientId: string, clientSecret?: string): Promise<boolean> {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        'SELECT client_secret_hash FROM oauth_clients WHERE client_id = ?',
        [clientId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return false;
      }

      // If client secret provided, validate it
      if (clientSecret) {
        const clientSecretHash = rows[0].client_secret_hash;
        return await this.verifySecret(clientSecret, clientSecretHash);
      }

      // Public client (no secret)
      return true;
    } catch (error: any) {
      logger.error('Failed to validate client', { clientId, error: error.message });
      return false;
    }
  }

  /**
   * Generate authorization code
   */
  async generateAuthorizationCode(data: {
    clientId: string;
    userId: string;
    redirectUri: string;
    scope: string[];
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }): Promise<string> {
    try {
      const code = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute expiry

      const pool = getPool();
      await pool.query(
        `INSERT INTO authorization_codes (
          id, code, client_id, user_id, redirect_uri, scope,
          expires_at, code_challenge, code_challenge_method
        )
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code,
          data.clientId,
          data.userId,
          data.redirectUri,
          JSON.stringify(data.scope),
          expiresAt,
          data.codeChallenge || null,
          data.codeChallengeMethod || null
        ]
      );

      logger.info('Authorization code generated', { 
        clientId: data.clientId, 
        userId: data.userId 
      });

      return code;
    } catch (error: any) {
      logger.error('Failed to generate authorization code', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate authorization code
   */
  async validateAuthorizationCode(
    code: string,
    clientId: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{ valid: boolean; userId?: string; scope?: string[] }> {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        `SELECT * FROM authorization_codes 
         WHERE code = ? AND client_id = ? AND redirect_uri = ?`,
        [code, clientId, redirectUri]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return { valid: false };
      }

      const authCode = rows[0];

      // Check expiry
      if (new Date() > new Date(authCode.expires_at)) {
        logger.warn('Authorization code expired', { code });
        return { valid: false };
      }

      // Check if already used
      if (authCode.used) {
        logger.warn('Authorization code already used', { code });
        return { valid: false };
      }

      // Validate PKCE if present
      if (authCode.code_challenge) {
        if (!codeVerifier) {
          logger.warn('Code verifier required but not provided', { code });
          return { valid: false };
        }

        const isValidPKCE = this.verifyPKCE(
          codeVerifier,
          authCode.code_challenge,
          authCode.code_challenge_method
        );

        if (!isValidPKCE) {
          logger.warn('Invalid PKCE verification', { code });
          return { valid: false };
        }
      }

      // Mark as used
      await pool.query(
        'UPDATE authorization_codes SET used = TRUE WHERE code = ?',
        [code]
      );

      // Parse scope JSON
      let scope: string[] = [];
      if (authCode.scope) {
        try {
          scope = typeof authCode.scope === 'string' 
            ? JSON.parse(authCode.scope) 
            : authCode.scope;
        } catch (e) {
          scope = [];
        }
      }

      return {
        valid: true,
        userId: authCode.user_id,
        scope: scope
      };
    } catch (error: any) {
      logger.error('Failed to validate authorization code', { error: error.message });
      return { valid: false };
    }
  }

  /**
   * Verify PKCE code challenge
   */
  private verifyPKCE(
    codeVerifier: string,
    codeChallenge: string,
    method: string
  ): boolean {
    if (method === 'S256') {
      const hash = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      return hash === codeChallenge;
    } else if (method === 'plain') {
      return codeVerifier === codeChallenge;
    }

    return false;
  }

  /**
   * Clean up expired authorization codes
   */
  async cleanupExpiredCodes(): Promise<number> {
    try {
      const pool = getPool();
      const [result]: any = await pool.query(
        'DELETE FROM authorization_codes WHERE expires_at < NOW()'
      );

      const count = result.affectedRows || 0;
      if (count > 0) {
        logger.info(`Cleaned up ${count} expired authorization codes`);
      }

      return count;
    } catch (error: any) {
      logger.error('Failed to cleanup expired codes', { error: error.message });
      return 0;
    }
  }

  /**
   * Generate client ID
   */
  private generateClientId(): string {
    return `client_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate client secret
   */
  private generateClientSecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Hash client secret
   */
  private async hashSecret(secret: string): Promise<string> {
    return crypto
      .createHash('sha256')
      .update(secret)
      .digest('hex');
  }

  /**
   * Verify client secret
   */
  private async verifySecret(secret: string, hash: string): Promise<boolean> {
    const secretHash = await this.hashSecret(secret);
    return crypto.timingSafeEqual(
      Buffer.from(secretHash),
      Buffer.from(hash)
    );
  }
}

export default OAuthService;

