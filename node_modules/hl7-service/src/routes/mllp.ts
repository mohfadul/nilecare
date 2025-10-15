import { Router, Request, Response } from 'express';
import { MLLPService } from '../services/MLLPService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const mllpService = new MLLPService();

/**
 * POST /api/v1/hl7/mllp/send
 * Send HL7 message via MLLP to external system
 */
router.post('/send', asyncHandler(async (req: Request, res: Response) => {
  const { message, host, port } = req.body;

  // Validate message
  const validation = mllpService.validateMessage(message);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid HL7 message',
      details: validation.errors,
    });
  }

  // Send message
  const result = await mllpService.sendMessage(message, host, parseInt(port));

  res.json({
    success: result.success,
    ack: result.ack,
    error: result.error,
  });
}));

/**
 * POST /api/v1/hl7/mllp/validate
 * Validate HL7 message format
 */
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;

  const validation = mllpService.validateMessage(message);

  res.json({
    success: true,
    valid: validation.valid,
    errors: validation.errors,
  });
}));

/**
 * POST /api/v1/hl7/mllp/generate-ack
 * Generate ACK for HL7 message
 */
router.post('/generate-ack', asyncHandler(async (req: Request, res: Response) => {
  const { message, ackCode } = req.body;

  const ack = mllpService.generateACK(message, ackCode || 'AA');

  res.json({
    success: true,
    ack,
  });
}));

export default router;

