import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { logSMARTAuthorization } from '../utils/logger';
import * as crypto from 'crypto';

/**
 * SMART on FHIR Service
 * Implements SMART on FHIR OAuth2 authorization
 * https://hl7.org/fhir/smart-app-launch/
 */

export class SMARTService {
  private pool: Pool;

  constructor() {
    this.pool = getPostgreSQLPool();
  }

  /**
   * Register SMART client application
   */
  async registerClient(clientData: {
    clientName: string;
    redirectUris: string[];
    scope: string;
    grantTypes: string[];
  }): Promise<{ clientId: string; clientSecret: string }> {
    const clientId = uuidv4();
    const clientSecret = crypto.randomBytes(32).toString('hex');

    const query = `
      INSERT INTO smart_clients (
        client_id, client_secret, client_name, redirect_uris,
        scope, grant_types, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING client_id
    `;

    await this.pool.query(query, [
      clientId,
      clientSecret,
      clientData.clientName,
      JSON.stringify(clientData.redirectUris),
      clientData.scope,
      JSON.stringify(clientData.grantTypes),
    ]);

    return { clientId, clientSecret };
  }

  /**
   * Generate authorization code
   */
  async generateAuthorizationCode(params: {
    clientId: string;
    userId: string;
    scope: string;
    redirectUri: string;
  }): Promise<string> {
    const authCode = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const query = `
      INSERT INTO smart_authorization_codes (
        code, client_id, user_id, scope, redirect_uri, expires_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;

    await this.pool.query(query, [
      authCode,
      params.clientId,
      params.userId,
      params.scope,
      params.redirectUri,
      expiresAt,
    ]);

    return authCode;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(params: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }): Promise<{ accessToken: string; tokenType: string; expiresIn: number; scope: string; patient?: string }> {
    // Validate authorization code
    const codeQuery = `
      SELECT * FROM smart_authorization_codes
      WHERE code = $1 AND client_id = $2 AND redirect_uri = $3
      AND expires_at > NOW() AND used = false
    `;

    const codeResult = await this.pool.query(codeQuery, [
      params.code,
      params.clientId,
      params.redirectUri,
    ]);

    if (codeResult.rows.length === 0) {
      logSMARTAuthorization({
        clientId: params.clientId,
        scopes: [],
        grantType: 'authorization_code',
        success: false,
        reason: 'Invalid or expired authorization code',
      });

      throw new Error('Invalid or expired authorization code');
    }

    const authCode = codeResult.rows[0];

    // Validate client secret
    const clientQuery = 'SELECT * FROM smart_clients WHERE client_id = $1 AND client_secret = $2';
    const clientResult = await this.pool.query(clientQuery, [params.clientId, params.clientSecret]);

    if (clientResult.rows.length === 0) {
      throw new Error('Invalid client credentials');
    }

    // Mark code as used
    await this.pool.query('UPDATE smart_authorization_codes SET used = true WHERE code = $1', [params.code]);

    // Generate access token
    const accessToken = crypto.randomBytes(32).toString('hex');
    const expiresIn = 3600; // 1 hour
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const tokenQuery = `
      INSERT INTO smart_access_tokens (
        access_token, client_id, user_id, scope, expires_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    await this.pool.query(tokenQuery, [
      accessToken,
      params.clientId,
      authCode.user_id,
      authCode.scope,
      expiresAt,
    ]);

    // Log successful authorization
    logSMARTAuthorization({
      userId: authCode.user_id,
      clientId: params.clientId,
      scopes: authCode.scope.split(' '),
      grantType: 'authorization_code',
      success: true,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      scope: authCode.scope,
      patient: authCode.patient_id,
    };
  }

  /**
   * Validate access token
   */
  async validateAccessToken(accessToken: string): Promise<any> {
    const query = `
      SELECT * FROM smart_access_tokens
      WHERE access_token = $1 AND expires_at > NOW()
    `;

    const result = await this.pool.query(query, [accessToken]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get SMART configuration (.well-known/smart-configuration)
   */
  getSmartConfiguration(): any {
    const baseUrl = process.env.FHIR_BASE_URL || 'http://localhost:6001';

    return {
      authorization_endpoint: `${baseUrl}/oauth2/authorize`,
      token_endpoint: `${baseUrl}/oauth2/token`,
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      registration_endpoint: `${baseUrl}/oauth2/register`,
      scopes_supported: [
        'patient/*.read',
        'patient/*.write',
        'user/*.read',
        'user/*.write',
        'system/*.read',
        'system/*.write',
        'launch',
        'launch/patient',
        'offline_access',
      ],
      response_types_supported: ['code'],
      capabilities: [
        'launch-ehr',
        'launch-standalone',
        'client-public',
        'client-confidential-symmetric',
        'context-ehr-patient',
        'sso-openid-connect',
      ],
    };
  }
}

export default SMARTService;

