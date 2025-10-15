"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDate = exports.validateUUID = exports.validateRequired = exports.validateRequest = void 0;
const errorHandler_1 = require("./errorHandler");
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const details = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            return next(new errorHandler_1.ValidationError('Validation failed', details));
        }
        req.body = value;
        next();
    };
};
exports.validateRequest = validateRequest;
const validateRequired = (fields) => {
    return (req, res, next) => {
        const missing = fields.filter((field) => !req.body[field]);
        if (missing.length > 0) {
            return next(new errorHandler_1.ValidationError('Missing required fields', {
                fields: missing,
            }));
        }
        next();
    };
};
exports.validateRequired = validateRequired;
const validateUUID = (field) => {
    return (req, res, next) => {
        const value = req.params[field] || req.body[field];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (value && !uuidRegex.test(value)) {
            return next(new errorHandler_1.ValidationError(`Invalid UUID format for field: ${field}`));
        }
        next();
    };
};
exports.validateUUID = validateUUID;
const validateDate = (field) => {
    return (req, res, next) => {
        const value = req.body[field];
        if (value && isNaN(Date.parse(value))) {
            return next(new errorHandler_1.ValidationError(`Invalid date format for field: ${field}`));
        }
        next();
    };
};
exports.validateDate = validateDate;
//# sourceMappingURL=validation.js.map