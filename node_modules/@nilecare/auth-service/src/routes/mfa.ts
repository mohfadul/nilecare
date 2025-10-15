import { Router } from 'express';
import { MFAService } from '../services/MFAService';
import { AuditService } from '../services/AuditService';
import { EmailService } from '../services/EmailService';
import { authenticate } from '../middleware/authentication';
import { validate, mfaSetupSchema, mfaVerifySchema } from '../utils/validators';
import { mfaRateLimiter } from '../middleware/rateLimiter';
import { csrfProtection } from '../middleware/csrfProtection';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const mfaService = new MFAService();
const auditService = new AuditService();
const emailService = new EmailService();

/**
 * @route   POST /api/v1/mfa/setup
 * @desc    Setup MFA (generate QR code)
 * @access  Private
 */
router.post(
  '/setup',
  authenticate,
  csrfProtection,
  validate(mfaSetupSchema),
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const { method } = req.body;

    if (method !== 'totp') {
      res.status(400).json({
        success: false,
        error: 'Only TOTP method is currently supported'
      });
      return;
    }

    const setup = await mfaService.setupTOTP(user.id, user.email);

    res.json({
      success: true,
      method: 'totp',
      secret: setup.secret,
      qrCode: setup.qrCodeUrl,
      backupCodes: setup.backupCodes,
      message: 'Scan the QR code with your authenticator app and verify to enable MFA'
    });
  })
);

/**
 * @route   POST /api/v1/mfa/verify-setup
 * @desc    Verify and enable MFA
 * @access  Private
 */
router.post(
  '/verify-setup',
  authenticate,
  mfaRateLimiter,
  csrfProtection,
  validate(mfaVerifySchema),
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const { token } = req.body;

    const verified = await mfaService.verifyAndEnableTOTP(user.id, token);

    if (verified) {
      // Log MFA enablement
      await auditService.logMFAChange(
        user.id,
        user.email,
        'MFA_ENABLED',
        req.ip || 'unknown'
      );

      // Send confirmation email
      await emailService.sendMFAEnabledEmail(user.email, user.username);

      res.json({
        success: true,
        message: 'MFA enabled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }
  })
);

/**
 * @route   POST /api/v1/mfa/verify
 * @desc    Verify MFA token during login
 * @access  Public (but requires partial authentication)
 */
router.post(
  '/verify',
  mfaRateLimiter,
  validate(mfaVerifySchema),
  asyncHandler(async (req, res) => {
    const { userId, token } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID required'
      });
      return;
    }

    const verified = await mfaService.verifyTOTP(userId, token);

    if (verified) {
      // Mark MFA as verified in session/token
      res.json({
        success: true,
        message: 'MFA verification successful',
        mfaVerified: true
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }
  })
);

/**
 * @route   POST /api/v1/mfa/disable
 * @desc    Disable MFA
 * @access  Private
 */
router.post(
  '/disable',
  authenticate,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const user = (req as any).user;

    await mfaService.disableMFA(user.id);

    // Log MFA disablement
    await auditService.logMFAChange(
      user.id,
      user.email,
      'MFA_DISABLED',
      req.ip || 'unknown'
    );

    // Send security alert
    await emailService.sendSecurityAlert(
      user.email,
      user.username,
      'Two-Factor Authentication Disabled',
      `MFA was disabled on your account on ${new Date().toLocaleString()}. Your account is now less secure. If this wasn't you, please contact support immediately.`
    );

    res.json({
      success: true,
      message: 'MFA disabled successfully'
    });
  })
);

/**
 * @route   POST /api/v1/mfa/regenerate-backup-codes
 * @desc    Regenerate backup codes
 * @access  Private
 */
router.post(
  '/regenerate-backup-codes',
  authenticate,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const user = (req as any).user;

    const backupCodes = await mfaService.regenerateBackupCodes(user.id);

    res.json({
      success: true,
      backupCodes,
      message: 'New backup codes generated. Store them securely.'
    });
  })
);

/**
 * @route   GET /api/v1/mfa/status
 * @desc    Get MFA status
 * @access  Private
 */
router.get(
  '/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = (req as any).user;

    const status = await mfaService.getMFAStatus(user.id);

    res.json({
      success: true,
      ...status
    });
  })
);

export default router;

