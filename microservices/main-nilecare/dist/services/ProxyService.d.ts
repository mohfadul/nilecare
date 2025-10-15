/**
 * Proxy Service
 * Handles HTTP and WebSocket proxying to backend services
 *
 * ✅ Integrated from gateway-service into main-nilecare
 */
import { Options as ProxyOptions } from 'http-proxy-middleware';
export declare class ProxyService {
    /**
     * Create HTTP proxy middleware
     */
    createProxy(_pathPrefix: string, options: ProxyOptions): any;
    /**
     * Create WebSocket proxy middleware
     */
    createWebSocketProxy(options: ProxyOptions): any;
}
//# sourceMappingURL=ProxyService.d.ts.map