import { Router } from 'express';
import { EncounterService } from '../services/EncounterService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const encounterService = new EncounterService();

router.post('/', asyncHandler(async (req, res) => {
  const encounter = await encounterService.createEncounter(req.body, (req as any).user);
  res.status(201).json(encounter);
}));

router.get('/', asyncHandler(async (req, res) => {
  const bundle = await encounterService.searchEncounters(req.query, (req as any).user);
  res.json(bundle);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const encounter = await encounterService.getEncounterById(req.params.id, (req as any).user);
  res.json(encounter);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const encounter = await encounterService.updateEncounter(req.params.id, req.body, (req as any).user);
  res.json(encounter);
}));

export default router;

