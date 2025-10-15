/**
 * Authentication Middleware for Main NileCare Orchestrator
 * Phase 2: Uses @nilecare/auth-client for centralized authentication
 */
declare const authenticate: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void>, optionalAuth: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void>, requireRole: (roles: string | string[]) => (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void, requirePermission: (permission: string) => (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void>;
export { authenticate, optionalAuth, requireRole, requirePermission };
export default authenticate;
//# sourceMappingURL=auth.d.ts.map