import { Router, Request, Response } from 'express';
import { ADTService } from '../services/ADTService';
import { HL7Service } from '../services/HL7Service';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const adtService = new ADTService();
const hl7Service = new HL7Service();

/**
 * POST /api/v1/hl7/adt/parse
 * Parse ADT message
 */
router.post('/parse', asyncHandler(async (req: Request, res: Response) => {
  const hl7Message = req.body.message;
  const parsed = await hl7Service.parseMessage(hl7Message);
  const adtMessage = await adtService.processADTMessage(parsed);

  res.json({
    success: true,
    data: adtMessage,
  });
}));

/**
 * POST /api/v1/hl7/adt/process
 * Process and store ADT message
 */
router.post('/process', asyncHandler(async (req: Request, res: Response) => {
  const hl7Message = req.body.message;
  const facilityId = (req as any).user.facilityId;

  const parsed = await hl7Service.parseMessage(hl7Message);
  await hl7Service.storeMessage(parsed, facilityId);
  const adtMessage = await adtService.processADTMessage(parsed);

  res.json({
    success: true,
    data: adtMessage,
    message: 'ADT message processed successfully',
  });
}));

export default router;

