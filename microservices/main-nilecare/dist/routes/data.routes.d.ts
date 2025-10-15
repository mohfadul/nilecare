/**
 * Data Routes - Serve dashboard data from database
 * Endpoints for patients, appointments, medications, inventory, etc.
 *
 * ✅ PRIORITY 1.1 COMPLIANCE FIX:
 * - Appointments, billing, staff, scheduling → Proxied to Business Service
 * - Ensures ALL dashboard access is logged in audit_logs table
 * - Provides consistent RBAC enforcement across all 11+ dashboards
 * - Maintains single source of truth (Business Service owns business data)
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=data.routes.d.ts.map