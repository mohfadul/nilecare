/**
 * Swagger Service
 * Aggregates and merges Swagger/OpenAPI documentation from all backend services
 *
 * ✅ Integrated from gateway-service into main-nilecare
 */
export interface SwaggerSpec {
    openapi?: string;
    swagger?: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    paths: Record<string, any>;
    components?: any;
    definitions?: any;
}
export declare class SwaggerService {
    private serviceUrls;
    constructor();
    /**
     * Initialize service URLs for Swagger docs
     */
    private initializeServiceUrls;
    /**
     * Fetch Swagger spec from a service
     */
    private fetchServiceSwagger;
    /**
     * Get merged Swagger specification from all services
     */
    getMergedSwaggerSpec(): Promise<SwaggerSpec>;
    /**
     * Merge multiple Swagger specs into one
     */
    private mergeSpecs;
    /**
     * Get Main NileCare's own Swagger specification
     */
    private getMainNileCareSpec;
}
//# sourceMappingURL=SwaggerService.d.ts.map