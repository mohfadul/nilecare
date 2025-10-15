"use strict";
/**
 * API Versioning Middleware
 * Phase 3: Support multiple API versions simultaneously
 *
 * Supports version detection from:
 * 1. URL path: /api/v1/patients or /api/v2/patients
 * 2. Header: X-API-Version: v1
 * 3. Accept header: Accept: application/vnd.nilecare.v1+json
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectApiVersion = detectApiVersion;
exports.requireVersion = requireVersion;
exports.transformResponse = transformResponse;
/**
 * Detect API version from request
 */
function detectApiVersion(req, res, next) {
    // 1. Version from URL: /api/v1/patients or /api/v2/patients
    const urlVersion = req.path.match(/^\/api\/(v\d+)\//)?.[1];
    // 2. Version from header: X-API-Version: v1
    const headerVersion = req.headers['x-api-version'];
    // 3. Accept header: application/vnd.nilecare.v1+json
    const acceptHeader = req.headers.accept;
    const acceptVersion = acceptHeader?.match(/vnd\.nilecare\.(v\d+)/)?.[1];
    // Priority: URL > Header > Accept > Default (v1)
    req.apiVersion = urlVersion || headerVersion || acceptVersion || 'v1';
    // Add version to response headers for client visibility
    res.setHeader('X-API-Version', req.apiVersion);
    next();
}
/**
 * Require specific API version
 */
function requireVersion(version) {
    return (req, res, next) => {
        if (req.apiVersion !== version) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_API_VERSION',
                    message: `This endpoint requires API version ${version}, but got ${req.apiVersion}`,
                    supportedVersions: ['v1', 'v2']
                }
            });
            return;
        }
        next();
    };
}
/**
 * Version-based response transformation
 */
function transformResponse(version, data) {
    switch (version) {
        case 'v1':
            // V1 format: simple success/data
            return {
                success: true,
                data: data.data || data
            };
        case 'v2':
            // V2 format: includes metadata, pagination, links
            return {
                success: true,
                data: data.data || data,
                meta: {
                    version: 'v2',
                    timestamp: new Date().toISOString(),
                    ...(data.pagination && { pagination: data.pagination })
                },
                ...(data.links && { links: data.links })
            };
        default:
            return data;
    }
}
exports.default = { detectApiVersion, requireVersion, transformResponse };
//# sourceMappingURL=version.js.map