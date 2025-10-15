"use strict";
/**
 * Crypto Helper for Node.js
 * Provides crypto.randomBytes functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomBytes = generateRandomBytes;
exports.generateRandomHex = generateRandomHex;
const crypto_1 = require("crypto");
function generateRandomBytes(length) {
    return (0, crypto_1.randomBytes)(length);
}
function generateRandomHex(length) {
    return (0, crypto_1.randomBytes)(length).toString('hex');
}
//# sourceMappingURL=crypto-helper.js.map