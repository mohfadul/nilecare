"use strict";
/**
 * Response Transformation Middleware
 * Transforms and normalizes responses from backend services
 *
 * ✅ Integrated from gateway-service into main-nilecare
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseTransformer = void 0;
const responseWrapper_1 = require("../utils/responseWrapper");
/**
 * Response transformer middleware
 * Can be configured to wrap responses, add metadata, or remove sensitive fields
 */
const responseTransformer = (config = {}) => {
    const { wrapResponse: shouldWrap = false, addMetadata = true, removeFields = ['password', 'passwordHash', 'salt', 'secret', 'privateKey'], } = config;
    return (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);
        // Override json method
        res.json = function (data) {
            let transformedData = data;
            // Remove sensitive fields if specified
            if (removeFields.length > 0 && typeof transformedData === 'object') {
                transformedData = removeFieldsRecursive(transformedData, removeFields);
            }
            // Wrap response if requested
            if (shouldWrap && !isAlreadyWrapped(data)) {
                transformedData = (0, responseWrapper_1.wrapResponse)(transformedData);
            }
            // Add metadata if requested
            if (addMetadata && typeof transformedData === 'object' && !isAlreadyWrapped(data)) {
                transformedData = {
                    ...transformedData,
                    metadata: {
                        ...(transformedData.metadata || {}),
                        timestamp: new Date().toISOString(),
                        requestId: req.id || req.get('x-request-id'),
                    },
                };
            }
            return originalJson(transformedData);
        };
        next();
    };
};
exports.responseTransformer = responseTransformer;
/**
 * Check if response is already in standard format
 */
function isAlreadyWrapped(data) {
    return (typeof data === 'object' &&
        data !== null &&
        ('success' in data || 'error' in data || 'metadata' in data));
}
/**
 * Helper function to remove fields recursively from an object
 */
function removeFieldsRecursive(obj, fields) {
    if (Array.isArray(obj)) {
        return obj.map(item => removeFieldsRecursive(item, fields));
    }
    if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            if (!fields.includes(key)) {
                newObj[key] = removeFieldsRecursive(obj[key], fields);
            }
        }
        return newObj;
    }
    return obj;
}
/**
 * Default export with common configuration
 */
exports.default = (0, exports.responseTransformer)({
    wrapResponse: false, // Don't wrap by default (services already wrap)
    addMetadata: false, // Don't add metadata by default
    removeFields: ['password', 'passwordHash', 'salt', 'secret', 'privateKey'], // Remove sensitive fields
});
//# sourceMappingURL=responseTransformer.js.map