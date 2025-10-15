/**
 * Crypto Helper for Node.js
 * Provides crypto.randomBytes functionality
 */

import { randomBytes } from 'crypto';

export function generateRandomBytes(length: number): Buffer {
  return randomBytes(length);
}

export function generateRandomHex(length: number): string {
  return randomBytes(length).toString('hex');
}

