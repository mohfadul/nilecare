/**
 * Dashboard Routes - Aggregated statistics for all dashboard roles
 * 
 * This module provides role-specific dashboard endpoints that aggregate data
 * from multiple microservices to display comprehensive statistics.
 * 
 * @module routes/dashboard
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../../../../shared/middleware/auth';
import { NileCareResponse } from '@nilecare/response-wrapper';
import { 
  appointmentServiceClient, 
  patientServiceClient,
  labServiceClient,
  medicationServiceClient,
  billingServiceClient,
  facilityServiceClient,
  authServiceClient
} from '@nilecare/service-clients';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get Doctor Dashboard Statistics
 * 
 * Aggregates data from multiple services to show:
 * - Today's appointments
 * - Total patients under care
 * - Pending lab results
 * - Active prescriptions
 * 
 * @route GET /api/v1/dashboard/doctor-stats
 * @access Private - Doctor role required
 */
router.get('/doctor-stats', 
  authenticate, 
  requireRole('doctor'), 
  async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id;
      const correlationId = req.headers['x-correlation-id'] as string;
      
      logger.info('Fetching doctor dashboard stats', { doctorId, correlationId });
      
      // Parallel API calls for better performance
      const [
        appointmentStats,
        patientStats,
        labStats,
        medicationStats
      ] = await Promise.all([
        appointmentServiceClient.getStats({ 
          doctorId, 
          date: new Date().toISOString().split('T')[0] 
        }).catch(err => {
          logger.warn('Appointment service unavailable', { error: err.message });
          return { today: 0, upcoming: 0, completed: 0 };
        }),
        
        patientServiceClient.getStats({ 
          doctorId 
        }).catch(err => {
          logger.warn('Patient service unavailable', { error: err.message });
          return { total: 0, active: 0 };
        }),
        
        labServiceClient.getStats({ 
          doctorId,
          status: 'pending'
        }).catch(err => {
          logger.warn('Lab service unavailable', { error: err.message });
          return { pending: 0, critical: 0 };
        }),
        
        medicationServiceClient.getStats({ 
          doctorId,
          status: 'active'
        }).catch(err => {
          logger.warn('Medication service unavailable', { error: err.message });
          return { active: 0, expiring: 0 };
        })
      ]);
      
      const stats = {
        today_appointments: appointmentStats.today || 0,
        upcoming_appointments: appointmentStats.upcoming || 0,
        completed_today: appointmentStats.completed || 0,
        total_patients: patientStats.total || 0,
        active_patients: patientStats.active || 0,
        pending_labs: labStats.pending || 0,
        critical_labs: labStats.critical || 0,
        active_prescriptions: medicationStats.active || 0,
        expiring_prescriptions: medicationStats.expiring || 0
      };
      
      logger.info('Doctor dashboard stats retrieved successfully', { doctorId, stats });
      
      res.json(new NileCareResponse(200, true, 'Dashboard stats retrieved', stats));
      
    } catch (error: any) {
      logger.error('Failed to fetch doctor dashboard stats', { 
        error: error.message,
        stack: error.stack,
        userId: req.user?.id 
      });
      
      res.status(500).json(
        new NileCareResponse(500, false, 'Failed to load dashboard statistics', null, {
          code: 'DASHBOARD_ERROR',
          details: error.message
        })
      );
    }
});

/**
 * Get Nurse Dashboard Statistics
 * 
 * @route GET /api/v1/dashboard/nurse-stats
 * @access Private - Nurse role required
 */
router.get('/nurse-stats', 
  authenticate, 
  requireRole('nurse'), 
  async (req: Request, res: Response) => {
    try {
      const nurseId = req.user?.id;
      const correlationId = req.headers['x-correlation-id'] as string;
      
      logger.info('Fetching nurse dashboard stats', { nurseId, correlationId });
      
      const [
        patientStats,
        medicationStats,
        vitalStats
      ] = await Promise.all([
        patientServiceClient.getStats({ assignedNurseId: nurseId }),
        medicationServiceClient.getAdministrationStats({ nurseId }),
        // Vital signs would come from device integration service
        Promise.resolve({ pending: 0, critical: 0 })
      ]);
      
      const stats = {
        assigned_patients: patientStats.total || 0,
        medications_due: medicationStats.due || 0,
        medications_administered: medicationStats.administered || 0,
        pending_vitals: vitalStats.pending || 0,
        critical_vitals: vitalStats.critical || 0
      };
      
      res.json(new NileCareResponse(200, true, 'Dashboard stats retrieved', stats));
      
    } catch (error: any) {
      logger.error('Failed to fetch nurse dashboard stats', { error: error.message });
      res.status(500).json(
        new NileCareResponse(500, false, 'Failed to load dashboard statistics')
      );
    }
});

/**
 * Get Receptionist Dashboard Statistics
 * 
 * @route GET /api/v1/dashboard/receptionist-stats
 * @access Private - Receptionist role required
 */
router.get('/receptionist-stats', 
  authenticate, 
  requireRole('receptionist'), 
  async (req: Request, res: Response) => {
    try {
      const facilityId = req.user?.facility_id;
      
      const [
        appointmentStats,
        checkInStats
      ] = await Promise.all([
        appointmentServiceClient.getStats({ 
          facilityId,
          date: new Date().toISOString().split('T')[0] 
        }),
        appointmentServiceClient.getCheckInStats({ facilityId })
      ]);
      
      const stats = {
        today_appointments: appointmentStats.today || 0,
        checked_in: checkInStats.checked_in || 0,
        waiting: checkInStats.waiting || 0,
        completed: appointmentStats.completed || 0,
        cancelled: appointmentStats.cancelled || 0
      };
      
      res.json(new NileCareResponse(200, true, 'Dashboard stats retrieved', stats));
      
    } catch (error: any) {
      logger.error('Failed to fetch receptionist dashboard stats', { error: error.message });
      res.status(500).json(
        new NileCareResponse(500, false, 'Failed to load dashboard statistics')
      );
    }
});

/**
 * Get Admin Dashboard Statistics
 * 
 * @route GET /api/v1/dashboard/admin-stats
 * @access Private - Admin role required
 */
router.get('/admin-stats', 
  authenticate, 
  requireRole('admin'), 
  async (req: Request, res: Response) => {
    try {
      const [
        userStats,
        facilityStats,
        systemHealth
      ] = await Promise.all([
        authServiceClient.getStats(),
        facilityServiceClient.getStats(),
        // System health check - placeholder
        Promise.resolve({ 
          services_up: 15, 
          services_down: 0,
          cpu_usage: 45,
          memory_usage: 60
        })
      ]);
      
      const stats = {
        total_users: userStats.total || 0,
        active_users: userStats.active || 0,
        total_facilities: facilityStats.total || 0,
        system_health: systemHealth.services_down === 0 ? 'healthy' : 'degraded',
        services_status: {
          up: systemHealth.services_up,
          down: systemHealth.services_down
        }
      };
      
      res.json(new NileCareResponse(200, true, 'Dashboard stats retrieved', stats));
      
    } catch (error: any) {
      logger.error('Failed to fetch admin dashboard stats', { error: error.message });
      res.status(500).json(
        new NileCareResponse(500, false, 'Failed to load dashboard statistics')
      );
    }
});

/**
 * Get Billing Clerk Dashboard Statistics
 * 
 * @route GET /api/v1/dashboard/billing-stats
 * @access Private - Billing Clerk role required
 */
router.get('/billing-stats', 
  authenticate, 
  requireRole('billing_clerk'), 
  async (req: Request, res: Response) => {
    try {
      const facilityId = req.user?.facility_id;
      
      const [
        invoiceStats,
        paymentStats,
        claimStats
      ] = await Promise.all([
        billingServiceClient.getInvoiceStats({ facilityId }),
        billingServiceClient.getPaymentStats({ facilityId }),
        billingServiceClient.getClaimStats({ facilityId })
      ]);
      
      const stats = {
        outstanding_invoices: invoiceStats.outstanding || 0,
        total_outstanding: invoiceStats.total_amount || 0,
        payments_today: paymentStats.today_count || 0,
        revenue_today: paymentStats.today_amount || 0,
        pending_claims: claimStats.pending || 0,
        approved_claims: claimStats.approved || 0
      };
      
      res.json(new NileCareResponse(200, true, 'Dashboard stats retrieved', stats));
      
    } catch (error: any) {
      logger.error('Failed to fetch billing dashboard stats', { error: error.message });
      res.status(500).json(
        new NileCareResponse(500, false, 'Failed to load dashboard statistics')
      );
    }
});

/**
 * Get Lab Tech Dashboard Statistics
 * 
 * @route GET /api/v1/dashboard/lab-stats
 * @access Private - Lab Tech role required
 */
router.get('/lab-stats', 
  authenticate, 
  requireRole('lab_tech'), 
  async (req: Request, res: Response) => {
    try {
      const facilityId = req.user?.facility_id;
      
      const labStats = await labServiceClient.getQueueStats({ facilityId });
      
      const stats = {
        pending_tests: labStats.pending || 0,
        in_progress: labStats.in_progress || 0,
        completed_today: labStats.completed_today || 0,
        critical_results: labStats.critical || 0,
        average_turnaround: labStats.avg_turnaround_hours || 0
      };
      
      res.json(new NileCareResponse(200, true, 'Dashboard stats retrieved', stats));
      
    } catch (error: any) {
      logger.error('Failed to fetch lab dashboard stats', { error: error.message });
      res.status(500).json(
        new NileCareResponse(500, false, 'Failed to load dashboard statistics')
      );
    }
});

/**
 * Get Pharmacist Dashboard Statistics
 * 
 * @route GET /api/v1/dashboard/pharmacist-stats
 * @access Private - Pharmacist role required
 */
router.get('/pharmacist-stats', 
  authenticate, 
  requireRole('pharmacist'), 
  async (req: Request, res: Response) => {
    try {
      const facilityId = req.user?.facility_id;
      
      const [
        prescriptionStats,
        inventoryStats
      ] = await Promise.all([
        medicationServiceClient.getPrescriptionQueueStats({ facilityId }),
        medicationServiceClient.getInventoryStats({ facilityId })
      ]);
      
      const stats = {
        pending_prescriptions: prescriptionStats.pending || 0,
        dispensed_today: prescriptionStats.dispensed_today || 0,
        low_stock_items: inventoryStats.low_stock || 0,
        out_of_stock: inventoryStats.out_of_stock || 0,
        expiring_soon: inventoryStats.expiring_30_days || 0
      };
      
      res.json(new NileCareResponse(200, true, 'Dashboard stats retrieved', stats));
      
    } catch (error: any) {
      logger.error('Failed to fetch pharmacist dashboard stats', { error: error.message });
      res.status(500).json(
        new NileCareResponse(500, false, 'Failed to load dashboard statistics')
      );
    }
});

export default router;

