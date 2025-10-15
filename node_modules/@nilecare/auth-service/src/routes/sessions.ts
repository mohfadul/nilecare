import { Router } from 'express';
import { SessionService } from '../services/SessionService';
import { AuditService } from '../services/AuditService';
import { authenticate, requireRole } from '../middleware/authentication';
import { csrfProtection } from '../middleware/csrfProtection';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const sessionService = new SessionService();
const auditService = new AuditService();

/**
 * @route   GET /api/v1/sessions
 * @desc    Get current user's active sessions
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const sessions = await sessionService.getUserSessions(user.id);
    const stats = await sessionService.getSessionStats(user.id);

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        deviceFingerprint: s.deviceFingerprint,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt
      })),
      stats
    });
  })
);

/**
 * @route   GET /api/v1/sessions/stats
 * @desc    Get session statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const stats = await sessionService.getSessionStats(user.id);

    res.json({
      success: true,
      ...stats
    });
  })
);

/**
 * @route   DELETE /api/v1/sessions/:sessionId
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete(
  '/:sessionId',
  authenticate,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const { sessionId } = req.params;

    const success = await sessionService.revokeSession(user.id, sessionId);

    if (success) {
      // Log session revocation
      await auditService.logSessionRevocation(
        user.id,
        sessionId,
        'user_requested',
        req.ip || 'unknown'
      );

      res.json({
        success: true,
        message: 'Session revoked successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
  })
);

/**
 * @route   DELETE /api/v1/sessions
 * @desc    Revoke all sessions except current
 * @access  Private
 */
router.delete(
  '/',
  authenticate,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const currentSessionId = req.body.currentSessionId;

    if (!currentSessionId) {
      res.status(400).json({
        success: false,
        error: 'Current session ID required'
      });
      return;
    }

    const count = await sessionService.revokeAllSessionsExcept(
      user.id,
      currentSessionId
    );

    res.json({
      success: true,
      message: `${count} session(s) revoked`,
      revokedCount: count
    });
  })
);

/**
 * @route   GET /api/v1/sessions/global/stats
 * @desc    Get global session statistics (admin only)
 * @access  Private (admin)
 */
router.get(
  '/global/stats',
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const stats = await sessionService.getGlobalSessionStats();

    res.json({
      success: true,
      ...stats
    });
  })
);

export default router;

