import { Router } from 'express';
import { ORMService } from '../services/ORMService';
import { HL7Service } from '../services/HL7Service';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const ormService = new ORMService();
const hl7Service = new HL7Service();

router.post('/parse', asyncHandler(async (req, res) => {
  const hl7Message = req.body.message;
  const parsed = await hl7Service.parseMessage(hl7Message);
  const ormMessage = await ormService.processORMMessage(parsed);

  res.json({
    success: true,
    data: ormMessage,
  });
}));

router.post('/process', asyncHandler(async (req, res) => {
  const hl7Message = req.body.message;
  const facilityId = (req as any).user.facilityId;

  const parsed = await hl7Service.parseMessage(hl7Message);
  await hl7Service.storeMessage(parsed, facilityId);
  const ormMessage = await ormService.processORMMessage(parsed);

  // TODO: Send to Lab Service

  res.json({
    success: true,
    data: ormMessage,
    message: 'ORM message processed successfully',
  });
}));

export default router;

