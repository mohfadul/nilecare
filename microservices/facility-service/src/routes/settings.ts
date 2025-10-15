import { Router } from 'express';
import { body, param } from 'express-validator';
import { Request, Response } from 'express';
import { SettingsService } from '../services/SettingsService';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const settingsService = new SettingsService();

/**
 * @swagger
 * /api/v1/settings/facility/{facilityId}:
 *   get:
 *     summary: Get facility settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/facility/:facilityId',
  [param('facilityId').isUUID()],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const facilityId = req.params.facilityId;
    const settings = await settingsService.getOrCreateSettings(facilityId, (req as any).user);

    res.json({
      success: true,
      data: settings,
    });
  })
);

/**
 * @swagger
 * /api/v1/settings/facility/{facilityId}:
 *   put:
 *     summary: Update facility settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.put('/facility/:facilityId',
  [
    param('facilityId').isUUID(),
    body('timezone').optional().isString(),
    body('dateFormat').optional().isString(),
    body('timeFormat').optional().isIn(['12h', '24h']),
    body('language').optional().isString(),
    body('currency').optional().isString(),
    body('defaultAppointmentDuration').optional().isInt({ min: 5, max: 240 }),
    body('allowWalkIns').optional().isBoolean(),
    body('maxAdvanceBookingDays').optional().isInt({ min: 1, max: 365 }),
    body('cancellationNoticePeriod').optional().isInt({ min: 0 }),
    body('emailNotificationsEnabled').optional().isBoolean(),
    body('smsNotificationsEnabled').optional().isBoolean(),
    body('appointmentReminderHours').optional().isArray(),
    body('automaticBedRelease').optional().isBoolean(),
    body('bedCleaningDuration').optional().isInt({ min: 5 }),
    body('requireInsurance').optional().isBoolean(),
    body('requireReferral').optional().isBoolean(),
    body('allowOnlineBooking').optional().isBoolean(),
    body('customSettings').optional().isObject(),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const facilityId = req.params.facilityId;
    const dto = {
      ...req.body,
      updatedBy: (req as any).user.userId,
    };

    const settings = await settingsService.updateSettings(facilityId, dto, (req as any).user);

    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    });
  })
);

export default router;

