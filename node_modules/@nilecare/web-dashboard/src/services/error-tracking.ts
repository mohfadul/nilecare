/**
 * Error Tracking Service
 * Sentry integration for production error monitoring
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initializeErrorTracking() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.log('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      new BrowserTracing(),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% sampling in prod
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
    
    beforeSend(event, hint) {
      // Sanitize PHI data before sending to Sentry
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data) {
            delete breadcrumb.data.password;
            delete breadcrumb.data.token;
            delete breadcrumb.data.phoneNumber;
            delete breadcrumb.data.email;
          }
          return breadcrumb;
        });
      }

      return event;
    },
  });

  console.log('✅ Error tracking initialized');
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

export function setUserContext(userId: string, username: string, role: string) {
  Sentry.setUser({
    id: userId,
    username,
    role,
  });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export default {
  initialize: initializeErrorTracking,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
};

