/**
 * Service Starter Utility
 * 
 * Provides standardized service initialization with proper health checks,
 * environment validation, and graceful shutdown
 */

import { Express } from 'express';
import { Server } from 'http';
import { createLivenessHandler, createReadinessHandler, createStartupHandler } from './health-check.utils';

export interface ServiceConfig {
  name: string;
  version: string;
  port: number;
  healthChecks: {
    liveness: {
      enabled: boolean;
      path?: string;
      features?: Record<string, boolean>;
    };
    readiness: {
      enabled: boolean;
      path?: string;
      checkFn?: () => Promise<any>;
    };
    startup: {
      enabled: boolean;
      path?: string;
      isInitializedFn?: () => boolean;
    };
  };
}

export class ServiceStarter {
  private server: Server;
  private isInitialized: boolean = false;
  private startTime: number = Date.now();
  
  constructor(
    private app: Express,
    private config: ServiceConfig
  ) {
    this.server = this.app.listen(this.config.port);
  }
  
  /**
   * Setup health check endpoints
   */
  setupHealthChecks(): void {
    const { healthChecks, name, version } = this.config;
    
    // Liveness probe
    if (healthChecks.liveness.enabled) {
      const path = healthChecks.liveness.path || '/health';
      this.app.get(
        path,
        createLivenessHandler(name, version, healthChecks.liveness.features)
      );
      console.log(`✅ Liveness probe: GET ${path}`);
    }
    
    // Readiness probe
    if (healthChecks.readiness.enabled && healthChecks.readiness.checkFn) {
      const path = healthChecks.readiness.path || '/health/ready';
      this.app.get(
        path,
        createReadinessHandler(healthChecks.readiness.checkFn)
      );
      console.log(`✅ Readiness probe: GET ${path}`);
    }
    
    // Startup probe
    if (healthChecks.startup.enabled && healthChecks.startup.isInitializedFn) {
      const path = healthChecks.startup.path || '/health/startup';
      this.app.get(
        path,
        createStartupHandler(healthChecks.startup.isInitializedFn)
      );
      console.log(`✅ Startup probe: GET ${path}`);
    }
  }
  
  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown(cleanupFn?: () => Promise<void>): void {
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      
      // Stop accepting new connections
      this.server.close(async () => {
        console.log('HTTP server closed');
        
        // Run cleanup function if provided
        if (cleanupFn) {
          try {
            await cleanupFn();
            console.log('Cleanup completed');
          } catch (error) {
            console.error('Cleanup error:', error);
          }
        }
        
        console.log(`${this.config.name} shut down successfully`);
        process.exit(0);
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
  
  /**
   * Start the service
   */
  start(): void {
    this.isInitialized = true;
    
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log(`║   ${this.config.name.toUpperCase().padEnd(45)} ║`);
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log(`✅ Service: ${this.config.name}`);
    console.log(`✅ Version: ${this.config.version}`);
    console.log(`✅ Port: ${this.config.port}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Started at: ${new Date().toISOString()}`);
    console.log(`✅ Health check: http://localhost:${this.config.port}/health`);
    if (this.config.healthChecks.readiness.enabled) {
      console.log(`✅ Readiness: http://localhost:${this.config.port}/health/ready`);
    }
    console.log(`✅ API Docs: http://localhost:${this.config.port}/api-docs`);
    console.log('═══════════════════════════════════════════════════\n');
  }
  
  /**
   * Get initialization status
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

/**
 * Create and start a service with proper configuration
 */
export async function startService(
  app: Express,
  config: ServiceConfig,
  cleanupFn?: () => Promise<void>
): Promise<ServiceStarter> {
  const starter = new ServiceStarter(app, config);
  
  // Setup health checks
  starter.setupHealthChecks();
  
  // Setup graceful shutdown
  starter.setupGracefulShutdown(cleanupFn);
  
  // Start service
  starter.start();
  
  return starter;
}

