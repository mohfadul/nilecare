import { Router, Request, Response } from 'express';
import { SMARTService } from '../services/SMARTService';
import { asyncHandler } from '../middleware/errorHandler';
import { smartAuthLimiter } from '../middleware/rateLimiter';

const router = Router();
const smartService = new SMARTService();

/**
 * GET /.well-known/smart-configuration
 * SMART on FHIR configuration endpoint
 */
router.get('/.well-known/smart-configuration', asyncHandler(async (req: Request, res: Response) => {
  const config = smartService.getSmartConfiguration();
  res.json(config);
}));

/**
 * POST /oauth2/register
 * Register SMART client application
 */
router.post('/oauth2/register', smartAuthLimiter, asyncHandler(async (req: Request, res: Response) => {
  const clientData = {
    clientName: req.body.client_name,
    redirectUris: req.body.redirect_uris,
    scope: req.body.scope,
    grantTypes: req.body.grant_types || ['authorization_code'],
  };

  const result = await smartService.registerClient(clientData);

  res.status(201).json({
    client_id: result.clientId,
    client_secret: result.clientSecret,
    client_name: clientData.clientName,
    redirect_uris: clientData.redirectUris,
  });
}));

/**
 * GET /oauth2/authorize
 * OAuth2 authorization endpoint
 */
router.get('/oauth2/authorize', smartAuthLimiter, asyncHandler(async (req: Request, res: Response) => {
  const params = {
    client_id: req.query.client_id as string,
    redirect_uri: req.query.redirect_uri as string,
    response_type: req.query.response_type as string,
    scope: req.query.scope as string,
    state: req.query.state as string,
  };

  // TODO: Redirect to login/consent screen
  // For now, return authorization endpoint info

  res.json({
    message: 'Authorization endpoint',
    params,
    next_step: 'User login and consent required',
  });
}));

/**
 * POST /oauth2/token
 * OAuth2 token endpoint
 */
router.post('/oauth2/token', smartAuthLimiter, asyncHandler(async (req: Request, res: Response) => {
  const grantType = req.body.grant_type;

  if (grantType === 'authorization_code') {
    const params = {
      code: req.body.code,
      clientId: req.body.client_id,
      clientSecret: req.body.client_secret,
      redirectUri: req.body.redirect_uri,
    };

    const token = await smartService.exchangeCodeForToken(params);

    res.json({
      access_token: token.accessToken,
      token_type: token.tokenType,
      expires_in: token.expiresIn,
      scope: token.scope,
      patient: token.patient,
    });
  } else {
    res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'Only authorization_code grant type is supported',
    });
  }
}));

export default router;

