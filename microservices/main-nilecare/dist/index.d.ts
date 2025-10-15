/**
 * Main NileCare Orchestrator
 * Port: 7000
 *
 * ✅ PHASE 2 REFACTORING:
 * - Stateless (NO database)
 * - Pure routing layer
 * - Circuit breakers for resilience
 * - Service discovery
 * - Centralized shared packages
 *
 * This service acts as the main API gateway, routing requests to
 * appropriate microservices and aggregating responses when needed.
 */
import { Application } from 'express';
declare const app: Application;
declare const server: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
export default app;
export { server };
//# sourceMappingURL=index.d.ts.map