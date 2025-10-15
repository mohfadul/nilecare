import { Router } from 'express';
import { ConditionService } from '../services/ConditionService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const conditionService = new ConditionService();

router.post('/', asyncHandler(async (req, res) => {
  const condition = await conditionService.createCondition(req.body, (req as any).user);
  res.status(201).json(condition);
}));

router.get('/', asyncHandler(async (req, res) => {
  const bundle = await conditionService.searchConditions(req.query, (req as any).user);
  res.json(bundle);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const condition = await conditionService.getConditionById(req.params.id, (req as any).user);
  res.json(condition);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const condition = await conditionService.updateCondition(req.params.id, req.body, (req as any).user);
  res.json(condition);
}));

export default router;

