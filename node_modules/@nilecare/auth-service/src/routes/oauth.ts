import { Router } from 'express';
import passport from 'passport';
import { OAuthService } from '../services/OAuthService';
import { authenticate, requireRole } from '../middleware/authentication';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const oauthService = new OAuthService();

/**
 * @route   GET /auth/oauth2
 * @desc    OAuth2 authorization endpoint
 * @access  Public
 */
router.get(
  '/authorize',
  passport.authenticate('oauth2', { session: false }),
  (req, res) => {
    // This won't be reached, passport redirects
  }
);

/**
 * @route   GET /auth/oauth2/callback
 * @desc    OAuth2 callback endpoint
 * @access  Public
 */
router.get(
  '/callback',
  passport.authenticate('oauth2', {
    session: false,
    failureRedirect: '/auth/oauth2/failure'
  }),
  asyncHandler(async (req, res) => {
    const user = (req as any).user;

    // Generate tokens for the authenticated user
    // TODO: Implement token generation

    logger.info('OAuth2 authentication successful', { userId: user.id });

    // Redirect to client application
    const redirectUrl = process.env.OAUTH2_SUCCESS_REDIRECT || '/';
    res.redirect(redirectUrl);
  })
);

/**
 * @route   GET /auth/oauth2/failure
 * @desc    OAuth2 failure endpoint
 * @access  Public
 */
router.get('/failure', (req, res) => {
  res.status(401).json({
    success: false,
    error: 'OAuth2 authentication failed'
  });
});

/**
 * @route   GET /auth/oidc
 * @desc    OpenID Connect authorization endpoint
 * @access  Public
 */
router.get(
  '/oidc/authorize',
  passport.authenticate('oidc', { session: false }),
  (req, res) => {
    // This won't be reached, passport redirects
  }
);

/**
 * @route   GET /auth/oidc/callback
 * @desc    OpenID Connect callback endpoint
 * @access  Public
 */
router.get(
  '/oidc/callback',
  passport.authenticate('oidc', {
    session: false,
    failureRedirect: '/auth/oidc/failure'
  }),
  asyncHandler(async (req, res) => {
    const user = (req as any).user;

    logger.info('OIDC authentication successful', { userId: user.id });

    // Redirect to client application
    const redirectUrl = process.env.OIDC_SUCCESS_REDIRECT || '/';
    res.redirect(redirectUrl);
  })
);

/**
 * @route   GET /auth/oidc/failure
 * @desc    OIDC failure endpoint
 * @access  Public
 */
router.get('/oidc/failure', (req, res) => {
  res.status(401).json({
    success: false,
    error: 'OIDC authentication failed'
  });
});

/**
 * @route   POST /api/v1/oauth/clients
 * @desc    Register OAuth2 client (admin only)
 * @access  Private (admin)
 */
router.post(
  '/clients',
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { name, redirectUris, grantTypes, scope } = req.body;

    if (!name || !redirectUris || !Array.isArray(redirectUris)) {
      res.status(400).json({
        success: false,
        error: 'Name and redirect URIs are required'
      });
      return;
    }

    const user = (req as any).user;
    const client = await oauthService.registerClient({
      name,
      redirectUris,
      grantTypes,
      scope,
      organizationId: user.organizationId
    });

    res.status(201).json({
      success: true,
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      message: 'Store the client secret securely. It cannot be retrieved later.'
    });
  })
);

/**
 * @route   POST /api/v1/oauth/token
 * @desc    OAuth2 token endpoint (authorization code flow)
 * @access  Public
 */
router.post(
  '/token',
  asyncHandler(async (req, res) => {
    const {
      grant_type,
      code,
      redirect_uri,
      client_id,
      client_secret,
      code_verifier
    } = req.body;

    if (grant_type !== 'authorization_code') {
      res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code grant type is supported'
      });
      return;
    }

    if (!code || !redirect_uri || !client_id) {
      res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters'
      });
      return;
    }

    // Validate client
    const isValidClient = await oauthService.validateClient(client_id, client_secret);
    if (!isValidClient) {
      res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
      return;
    }

    // Validate authorization code
    const codeValidation = await oauthService.validateAuthorizationCode(
      code,
      client_id,
      redirect_uri,
      code_verifier
    );

    if (!codeValidation.valid) {
      res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid authorization code'
      });
      return;
    }

    // TODO: Generate access and refresh tokens for the user
    // For now, return a placeholder response

    res.json({
      access_token: 'placeholder_access_token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'placeholder_refresh_token',
      scope: codeValidation.scope?.join(' ')
    });
  })
);

export default router;

