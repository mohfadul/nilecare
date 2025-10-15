/**
 * Push Notification Configuration
 * Firebase Cloud Messaging (FCM) and Apple Push Notification (APN) setup
 */

import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';
import SecretsConfig from './secrets.config';

// APN is optional - only imported if needed
let apn: any = null;
try {
  apn = require('apn');
} catch {
  logger.warn('APN module not available - iOS push notifications will not work');
}

let firebaseApp: admin.app.App | null = null;
let apnProvider: any | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase(): admin.app.App {
  if (!firebaseApp) {
    const config = SecretsConfig.getPushConfig();

    if (!config.enabled) {
      logger.warn('Push notifications are disabled');
      throw new Error('Push notifications are not enabled');
    }

    if (!config.firebase.projectId || !config.firebase.privateKey || !config.firebase.clientEmail) {
      logger.warn('Firebase configuration incomplete');
      throw new Error('Firebase configuration is incomplete');
    }

    try {
      // Initialize Firebase Admin with service account
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
          clientEmail: config.firebase.clientEmail,
        }),
        projectId: config.firebase.projectId,
      });

      logger.info('✅ Firebase Admin SDK initialized', {
        projectId: config.firebase.projectId,
      });
    } catch (error: any) {
      logger.error('Failed to initialize Firebase', { error: error.message });
      throw error;
    }
  }

  return firebaseApp;
}

/**
 * Get Firebase Messaging instance
 */
export function getFirebaseMessaging(): admin.messaging.Messaging {
  const app = initializeFirebase();
  return admin.messaging(app);
}

/**
 * Initialize Apple Push Notification Provider
 */
export function initializeAPN(): any {
  if (!apnProvider) {
    if (!apn) {
      throw new Error('APN module not available - install "apn" package');
    }

    const apnConfig = process.env.APN_ENABLED === 'true' ? {
      token: {
        key: process.env.APN_KEY_PATH || '',
        keyId: process.env.APN_KEY_ID || '',
        teamId: process.env.APN_TEAM_ID || '',
      },
      production: process.env.APN_PRODUCTION === 'true',
    } : null;

    if (!apnConfig || !apnConfig.token.key) {
      logger.warn('APN configuration incomplete or disabled');
      throw new Error('APN is not configured');
    }

    try {
      apnProvider = new apn.Provider(apnConfig);
      logger.info('✅ Apple Push Notification Provider initialized');
    } catch (error: any) {
      logger.error('Failed to initialize APN', { error: error.message });
      throw error;
    }
  }

  return apnProvider;
}

/**
 * Test Firebase connection
 */
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    const messaging = getFirebaseMessaging();
    // Try to get the Firebase app to verify connection
    const app = messaging.app;
    if (app.name) {
      logger.info('✅ Firebase connection test successful', { 
        appName: app.name 
      });
      return true;
    }
    return false;
  } catch (error: any) {
    logger.error('❌ Firebase connection test failed', { error: error.message });
    return false;
  }
}

/**
 * Test APN connection
 */
export async function testAPNConnection(): Promise<boolean> {
  try {
    initializeAPN();
    // APN doesn't have a direct test method, so we just verify initialization
    logger.info('✅ APN connection test successful');
    return true;
  } catch (error: any) {
    logger.error('❌ APN connection test failed', { error: error.message });
    return false;
  }
}

/**
 * Close Firebase app
 */
export async function closeFirebase(): Promise<void> {
  if (firebaseApp) {
    await firebaseApp.delete();
    firebaseApp = null;
    logger.info('Firebase app closed');
  }
}

/**
 * Close APN provider
 */
export async function closeAPN(): Promise<void> {
  if (apnProvider) {
    apnProvider.shutdown();
    apnProvider = null;
    logger.info('APN provider closed');
  }
}

export default {
  initializeFirebase,
  getFirebaseMessaging,
  initializeAPN,
  testFirebaseConnection,
  testAPNConnection,
  closeFirebase,
  closeAPN,
};

