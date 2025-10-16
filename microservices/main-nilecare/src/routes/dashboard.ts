/**
 * Dashboard Routes
 * 
 * Aggregates data from multiple microservices for dashboard display
 * Uses service clients instead of direct database access
 */

import { Router, Request, Response, NextFunction } from 'express';
import { serviceClients } from '../clients/ServiceClients';
import { createLogger } from '@nilecare/logger';

const router = Router();
const logger = createLogger('dashboard-routes');

/**
 * GET /api/v1/dashboard/stats
 * Get aggregated dashboard statistics from all services
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization token required',
        },
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Fetch aggregated stats from all services
    const stats = await serviceClients.getDashboardStats(token);

    logger.info('Dashboard stats retrieved successfully', {
      servicesResponded: stats.servicesResponded,
      totalServices: stats.totalServices,
    });

    res.status(200).json(stats);
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/clinical-summary
 * Get clinical statistics summary
 */
router.get('/clinical-summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization token required',
        },
      });
    }

    const token = authHeader.substring(7);
    serviceClients.setAuthToken(token);

    // Fetch clinical data
    const [
      patientsCount,
      encountersCount,
      todayEncounters,
    ] = await Promise.all([
      serviceClients.clinical.getPatientsCount(),
      serviceClients.clinical.getEncountersCount(),
      serviceClients.clinical.getTodayEncounters(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        patients: {
          total: patientsCount,
        },
        encounters: {
          total: encountersCount,
          today: todayEncounters.length,
          todayDetails: todayEncounters,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching clinical summary:', error);
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/alerts
 * Get critical alerts from all services
 */
router.get('/alerts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization token required',
        },
      });
    }

    const token = authHeader.substring(7);
    serviceClients.setAuthToken(token);

    // Fetch alerts from multiple services
    const [
      criticalLabResults,
      medicationAlerts,
      lowStockItems,
    ] = await Promise.allSettled([
      serviceClients.lab.getRecentCriticalResults(10),
      serviceClients.medication.getRecentAlerts(10),
      serviceClients.inventory.getLowStockItems(10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        lab: {
          criticalResults: criticalLabResults.status === 'fulfilled' ? criticalLabResults.value : [],
        },
        medication: {
          alerts: medicationAlerts.status === 'fulfilled' ? medicationAlerts.value : [],
        },
        inventory: {
          lowStock: lowStockItems.status === 'fulfilled' ? lowStockItems.value : [],
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching dashboard alerts:', error);
    next(error);
  }
});

/**
 * GET /api/v1/dashboard/today-summary
 * Get today's activity summary
 */
router.get('/today-summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization token required',
        },
      });
    }

    const token = authHeader.substring(7);
    serviceClients.setAuthToken(token);

    // Fetch today's data from multiple services
    const [
      todayAppointments,
      todayEncounters,
    ] = await Promise.all([
      serviceClients.appointment.getTodayAppointments(),
      serviceClients.clinical.getTodayEncounters(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        appointments: {
          count: todayAppointments.length,
          details: todayAppointments,
        },
        encounters: {
          count: todayEncounters.length,
          details: todayEncounters,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching today summary:', error);
    next(error);
  }
});

export default router;

