import { Router } from 'express';
import { ORUService } from '../services/ORUService';
import { HL7Service } from '../services/HL7Service';
import { TransformationService } from '../services/TransformationService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const oruService = new ORUService();
const hl7Service = new HL7Service();
const transformationService = new TransformationService();

router.post('/parse', asyncHandler(async (req, res) => {
  const hl7Message = req.body.message;
  const parsed = await hl7Service.parseMessage(hl7Message);
  const oruMessage = await oruService.processORUMessage(parsed);

  res.json({
    success: true,
    data: oruMessage,
  });
}));

router.post('/process', asyncHandler(async (req, res) => {
  const hl7Message = req.body.message;
  const facilityId = (req as any).user.facilityId;

  const parsed = await hl7Service.parseMessage(hl7Message);
  await hl7Service.storeMessage(parsed, facilityId);
  const oruMessage = await oruService.processORUMessage(parsed);

  // Transform to FHIR
  const fhirObservations = await transformationService.transformORUToFHIRObservations(oruMessage, facilityId);

  res.json({
    success: true,
    data: {
      hl7: oruMessage,
      fhir: fhirObservations,
    },
    message: 'ORU message processed successfully',
  });
}));

export default router;

