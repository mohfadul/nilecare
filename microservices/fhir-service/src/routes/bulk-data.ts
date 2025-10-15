import { Router, Request, Response } from 'express';
import { BulkDataService } from '../services/BulkDataService';
import { asyncHandler } from '../middleware/errorHandler';
import { bulkDataLimiter } from '../middleware/rateLimiter';

const router = Router();
const bulkDataService = new BulkDataService();

/**
 * POST /fhir/$export - System level export
 */
router.post('/', bulkDataLimiter, asyncHandler(async (req: Request, res: Response) => {
  const exportParams = {
    exportType: 'system' as 'system',
    resourceTypes: req.query._type ? (req.query._type as string).split(',') : undefined,
    since: req.query._since as string,
  };

  const result = await bulkDataService.initiateExport(exportParams, (req as any).user);

  res.status(202)
    .header('Content-Location', result.statusUrl)
    .json({
      message: 'Export initiated',
      statusUrl: result.statusUrl,
    });
}));

/**
 * GET /fhir/$export/{requestId} - Check export status
 */
router.get('/:requestId', asyncHandler(async (req: Request, res: Response) => {
  const status = await bulkDataService.getExportStatus(req.params.requestId, (req as any).user);

  if (!status) {
    return res.status(404).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'not-found',
        diagnostics: 'Export request not found',
      }],
    });
  }

  if (status.status === 'processing') {
    return res.status(202).json(status);
  }

  res.json(status);
}));

/**
 * DELETE /fhir/$export/{requestId} - Cancel export
 */
router.delete('/:requestId', asyncHandler(async (req: Request, res: Response) => {
  await bulkDataService.cancelExport(req.params.requestId, (req as any).user);
  res.status(204).send();
}));

export default router;

