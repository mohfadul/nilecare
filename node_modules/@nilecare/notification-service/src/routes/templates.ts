/**
 * Template Routes
 * API endpoints for template management
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { requireRole } from '../middleware/auth.middleware';
import templateController from '../controllers/template.controller';

const router = Router();

/**
 * GET /api/v1/templates
 * List templates
 */
router.get(
  '/',
  templateController.listTemplates
);

/**
 * GET /api/v1/templates/:id
 * Get template by ID
 */
router.get(
  '/:id',
  templateController.getTemplate
);

/**
 * POST /api/v1/templates
 * Create template (admin only)
 */
router.post(
  '/',
  requireRole(['super_admin', 'admin']),
  [
    body('name').notEmpty().withMessage('Template name is required'),
    body('type').notEmpty().withMessage('Template type is required'),
    body('channel').isIn(['email', 'sms', 'push', 'websocket']).withMessage('Invalid channel'),
    body('body_template').notEmpty().withMessage('Body template is required'),
    body('variables').isArray().withMessage('Variables must be an array'),
    validateRequest,
  ],
  templateController.createTemplate
);

/**
 * PUT /api/v1/templates/:id
 * Update template (admin only)
 */
router.put(
  '/:id',
  requireRole(['super_admin', 'admin']),
  templateController.updateTemplate
);

/**
 * DELETE /api/v1/templates/:id
 * Delete template (admin only)
 */
router.delete(
  '/:id',
  requireRole(['super_admin', 'admin']),
  templateController.deleteTemplate
);

/**
 * POST /api/v1/templates/:id/preview
 * Preview template rendering
 */
router.post(
  '/:id/preview',
  [
    body('variables').isObject().withMessage('Variables must be an object'),
    validateRequest,
  ],
  templateController.previewTemplate
);

/**
 * PATCH /api/v1/templates/:id/toggle
 * Toggle template active status (admin only)
 */
router.patch(
  '/:id/toggle',
  requireRole(['super_admin', 'admin']),
  templateController.toggleActive
);

export default router;

