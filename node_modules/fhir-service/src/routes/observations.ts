import { Router } from 'express';
import { ObservationService } from '../services/ObservationService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const observationService = new ObservationService();

router.post('/', asyncHandler(async (req, res) => {
  const observation = await observationService.createObservation(req.body, (req as any).user);
  res.status(201).json(observation);
}));

router.get('/', asyncHandler(async (req, res) => {
  const bundle = await observationService.searchObservations(req.query, (req as any).user);
  res.json(bundle);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const observation = await observationService.getObservationById(req.params.id, (req as any).user);
  res.json(observation);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const observation = await observationService.updateObservation(req.params.id, req.body, (req as any).user);
  res.json(observation);
}));

export default router;

