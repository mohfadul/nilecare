import { Router } from 'express';
import { MessageProcessorService } from '../services/MessageProcessorService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const messageProcessor = new MessageProcessorService();

/**
 * POST /api/v1/hl7/messages/process
 * Process any HL7 message (auto-routes to correct processor)
 */
router.post('/process', asyncHandler(async (req, res) => {
  const hl7Message = req.body.message;
  const facilityId = (req as any).user.facilityId;

  const result = await messageProcessor.processMessage(hl7Message, facilityId);

  if (result.success) {
    res.json({
      success: true,
      data: result.data,
      message: 'HL7 message processed successfully',
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.error,
    });
  }
}));

export default router;

