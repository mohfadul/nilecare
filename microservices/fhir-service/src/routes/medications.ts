import { Router } from 'express';
import { MedicationRequestService } from '../services/MedicationRequestService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const medicationRequestService = new MedicationRequestService();

router.post('/', asyncHandler(async (req, res) => {
  const medicationRequest = await medicationRequestService.createMedicationRequest(req.body, (req as any).user);
  res.status(201).json(medicationRequest);
}));

router.get('/', asyncHandler(async (req, res) => {
  const bundle = await medicationRequestService.searchMedicationRequests(req.query, (req as any).user);
  res.json(bundle);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const medicationRequest = await medicationRequestService.getMedicationRequestById(req.params.id, (req as any).user);
  res.json(medicationRequest);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const medicationRequest = await medicationRequestService.updateMedicationRequest(req.params.id, req.body, (req as any).user);
  res.json(medicationRequest);
}));

export default router;

