/**
 * PHI Audit Middleware
 * Automatically logs all PHI access through API endpoints
 * Sudan-specific: Tracks Sudan National ID access
 */

import { Request, Response, NextFunction } from 'express';
import { PHIAuditService } from '../services/PHIAuditService';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name?: string;
        role?: string;
        facilityId: string;
        tenantId: string;
        permissions?: string[];
      };
      requestId?: string;
      sessionId?: string;
      startTime?: number;
    }
  }
}

export interface PHIResourceConfig {
  resourceType: string;
  patientIdField?: string; // Field name containing patient ID
  requiresAudit: boolean;
  sensitiveFields?: string[]; // Fields that require special tracking
}

/**
 * Middleware to log PHI access
 */
export const auditPHIAccess = (config: PHIResourceConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    req.startTime = startTime;
    req.requestId = req.requestId || uuidv4();

    // Skip audit for health checks and non-PHI endpoints
    if (!config.requiresAudit) {
      return next();
    }

    // Determine action based on HTTP method
    const actionMap: Record<string, 'view' | 'create' | 'update' | 'delete' | 'export'> = {
      'GET': 'view',
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'update',
      'DELETE': 'delete'
    };
    const action = actionMap[req.method] || 'view';

    // Check for export action
    const isExport = req.path.includes('export') || req.query.export === 'true';
    const finalAction = isExport ? 'export' : action;

    // Extract patient ID from request
    const patientId = extractPatientId(req, config.patientIdField);

    if (!patientId) {
      // If no patient ID, skip PHI audit (might be a list query)
      return next();
    }

    // Check if Sudan National ID is being accessed
    const accessedSudanNationalId = checkSudanNationalIdAccess(req, config);

    // Intercept response to log after completion
    const originalSend = res.send;
    let responseLogged = false;

    res.send = function (data: any): Response {
      if (!responseLogged) {
        responseLogged = true;
        const duration = Date.now() - startTime;
        const success = res.statusCode >= 200 && res.statusCode < 400;

        // Log PHI access asynchronously (don't block response)
        setImmediate(async () => {
          try {
            const phiAuditService = new PHIAuditService(getDbPool());
            
            if (success) {
              await phiAuditService.logPHIAccess({
                userId: req.user?.id || 'anonymous',
                userName: req.user?.name,
                userRole: req.user?.role,
                patientId,
                action: finalAction,
                resourceType: config.resourceType,
                resourceId: req.params.id || patientId,
                ipAddress: getClientIp(req),
                userAgent: req.get('user-agent') || 'unknown',
                facilityId: req.user?.facilityId || 'unknown',
                tenantId: req.user?.tenantId || 'unknown',
                sessionId: req.sessionId,
                requestId: req.requestId,
                accessReason: req.body?.access_reason || req.query?.reason as string,
                dataFields: config.sensitiveFields,
                duration
              });
            } else {
              await phiAuditService.logFailedPHIAccess(
                {
                  userId: req.user?.id || 'anonymous',
                  userName: req.user?.name,
                  userRole: req.user?.role,
                  patientId,
                  action: finalAction,
                  resourceType: config.resourceType,
                  resourceId: req.params.id || patientId,
                  ipAddress: getClientIp(req),
                  userAgent: req.get('user-agent') || 'unknown',
                  facilityId: req.user?.facilityId || 'unknown',
                  tenantId: req.user?.tenantId || 'unknown',
                  sessionId: req.sessionId,
                  requestId: req.requestId,
                  duration
                },
                `HTTP ${res.statusCode}: ${res.statusMessage}`
              );
            }
          } catch (error) {
            console.error('Error logging PHI access:', error);
          }
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to require access reason for sensitive operations
 */
export const requireAccessReason = (req: Request, res: Response, next: NextFunction) => {
  const sensitiveActions = ['export', 'delete', 'bulk_update'];
  const action = req.method.toLowerCase();
  const isSensitive = sensitiveActions.some(a => req.path.includes(a) || action === 'delete');

  if (isSensitive && !req.body?.access_reason && !req.query?.reason) {
    return res.status(400).json({
      success: false,
      error: 'Access reason required for this operation',
      hint: 'Provide access_reason in request body or reason in query parameters'
    });
  }

  next();
};

/**
 * Middleware to check patient consent before access
 */
export const checkPatientConsent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const patientId = req.params.patientId || req.body?.patient_id;
  const userId = req.user?.id;

  if (!patientId || !userId) {
    return next();
  }

  try {
    // Check if patient has granted consent for this user/organization
    const consentQuery = `
      SELECT consent_status
      FROM audit.data_access_consent
      WHERE patient_id = $1
        AND (granted_to_user_id = $2 OR granted_to_organization_id = $3)
        AND consent_type = 'treatment'
        AND consent_status = 'granted'
        AND effective_date <= CURRENT_DATE
        AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
    `;

    const pool = getDbPool();
    const result = await pool.query(consentQuery, [
      patientId,
      userId,
      req.user?.tenantId
    ]);

    if (result.rows.length === 0) {
      // Log consent violation
      await logConsentViolation(req, patientId);

      return res.status(403).json({
        success: false,
        error: 'Patient consent required for this access',
        patientId
      });
    }

    next();
  } catch (error) {
    console.error('Error checking patient consent:', error);
    next(error);
  }
};

/**
 * Middleware to track Sudan National ID access
 */
export const trackSudanNationalIdAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Flag that Sudan National ID might be accessed
  const requestedFields = req.query?.fields as string;
  const includesNationalId = 
    requestedFields?.includes('sudan_national_id') ||
    req.body?.sudan_national_id !== undefined ||
    req.path.includes('national-id');

  if (includesNationalId) {
    // Add flag to request for audit logging
    (req as any).accessesSudanNationalId = true;
    
    // Require access reason for Sudan National ID access
    if (!req.body?.access_reason && !req.query?.reason) {
      return res.status(400).json({
        success: false,
        error: 'Access reason required when accessing Sudan National ID',
        hint: 'Provide access_reason in request body'
      });
    }
  }

  next();
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function extractPatientId(req: Request, patientIdField?: string): string | null {
  // Try multiple sources for patient ID
  return (
    req.params.patientId ||
    req.params.id ||
    req.body?.patient_id ||
    req.body?.patientId ||
    req.query?.patient_id as string ||
    (patientIdField && req.body?.[patientIdField]) ||
    null
  );
}

function checkSudanNationalIdAccess(req: Request, config: PHIResourceConfig): boolean {
  // Check if Sudan National ID is in requested fields
  const requestedFields = req.query?.fields as string;
  const includesNationalId = 
    requestedFields?.includes('sudan_national_id') ||
    config.sensitiveFields?.includes('sudan_national_id') ||
    (req as any).accessesSudanNationalId === true;

  return includesNationalId;
}

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

function getDbPool(): any {
  // This should return the actual database pool
  // Implementation depends on your database setup
  const { Pool } = require('pg');
  return new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });
}

async function logConsentViolation(req: Request, patientId: string): Promise<void> {
  try {
    const pool = getDbPool();
    await pool.query(`
      INSERT INTO audit.compliance_violations (
        facility_id, tenant_id, violation_type, severity,
        description, user_id, patient_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      req.user?.facilityId || 'unknown',
      req.user?.tenantId || 'unknown',
      'unauthorized_access',
      'high',
      'Attempted access without patient consent',
      req.user?.id || 'anonymous',
      patientId
    ]);
  } catch (error) {
    console.error('Error logging consent violation:', error);
  }
}

// =====================================================
// USAGE EXAMPLES
// =====================================================

/*
// Apply to patient routes
router.get('/patients/:id',
  authMiddleware,
  trackSudanNationalIdAccess,
  auditPHIAccess({
    resourceType: 'patient_demographics',
    patientIdField: 'id',
    requiresAudit: true,
    sensitiveFields: ['sudan_national_id', 'phone', 'email']
  }),
  patientController.getPatientById
);

// Apply to medication routes
router.post('/medications',
  authMiddleware,
  requireAccessReason,
  auditPHIAccess({
    resourceType: 'medication_order',
    patientIdField: 'patient_id',
    requiresAudit: true,
    sensitiveFields: ['medication_name', 'dosage']
  }),
  medicationController.createMedication
);

// Apply to export endpoints
router.get('/patients/export',
  authMiddleware,
  requireAccessReason,
  checkPatientConsent,
  auditPHIAccess({
    resourceType: 'patient_data_export',
    requiresAudit: true,
    sensitiveFields: ['all']
  }),
  patientController.exportPatients
);
*/

export default {
  auditPHIAccess,
  requireAccessReason,
  checkPatientConsent,
  trackSudanNationalIdAccess
};
