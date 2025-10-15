/**
 * Analytics Service
 * Google Analytics integration for usage tracking
 */

import ReactGA from 'react-ga4';

export function initializeAnalytics() {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;

  if (!trackingId) {
    console.log('Google Analytics tracking ID not configured - analytics disabled');
    return;
  }

  ReactGA.initialize(trackingId, {
    gaOptions: {
      anonymizeIp: true, // HIPAA compliance - anonymize IP addresses
      cookieFlags: 'SameSite=None;Secure',
    },
  });

  console.log('✅ Analytics initialized');
}

export function trackPageView(path: string, title?: string) {
  if (!import.meta.env.VITE_GA_TRACKING_ID) return;

  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title || document.title,
  });
}

export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
) {
  if (!import.meta.env.VITE_GA_TRACKING_ID) return;

  ReactGA.event({
    category,
    action,
    label,
    value,
  });
}

// Predefined event tracking functions
export function trackPatientCreated() {
  trackEvent('Patient', 'Create', 'Patient Created');
}

export function trackAppointmentBooked() {
  trackEvent('Appointment', 'Book', 'Appointment Booked');
}

export function trackPaymentInitiated(provider: string, amount: number) {
  trackEvent('Payment', 'Initiate', provider, amount);
}

export function trackPaymentCompleted(provider: string, amount: number) {
  trackEvent('Payment', 'Complete', provider, amount);
}

export function trackLabOrderCreated(testCount: number) {
  trackEvent('Lab', 'Order Created', 'Lab Order', testCount);
}

export function trackLoginSuccess(role: string) {
  trackEvent('Auth', 'Login Success', role);
}

export function trackLogout() {
  trackEvent('Auth', 'Logout');
}

export function trackError(errorType: string, errorMessage: string) {
  trackEvent('Error', errorType, errorMessage);
}

export default {
  initialize: initializeAnalytics,
  trackPageView,
  trackEvent,
  trackPatientCreated,
  trackAppointmentBooked,
  trackPaymentInitiated,
  trackPaymentCompleted,
  trackLabOrderCreated,
  trackLoginSuccess,
  trackLogout,
  trackError,
};

