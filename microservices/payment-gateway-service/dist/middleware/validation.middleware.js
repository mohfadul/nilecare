"use strict";
/**
 * Validation Middleware
 * Request validation using Joi schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
/**
 * Validate request body using Joi schema
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    details: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message,
                        type: detail.type
                    }))
                }
            });
            return;
        }
        // Replace request body with validated value
        req.body = value;
        next();
    };
};
exports.validateBody = validateBody;
/**
 * Validate request query parameters
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Query parameter validation failed',
                    details: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                }
            });
            return;
        }
        req.query = value;
        next();
    };
};
exports.validateQuery = validateQuery;
/**
 * Validate request parameters
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false
        });
        if (error) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'URL parameter validation failed',
                    details: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                }
            });
            return;
        }
        req.params = value;
        next();
    };
};
exports.validateParams = validateParams;
exports.default = { validateBody: exports.validateBody, validateQuery: exports.validateQuery, validateParams: exports.validateParams };
//# sourceMappingURL=validation.middleware.js.map