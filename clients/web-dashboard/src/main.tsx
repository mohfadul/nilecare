/**
 * Main Entry Point
 * NileCare Web Dashboard
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import App from './App';
import './index.css';

// Initialize error tracking (production only)
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  import('./services/error-tracking').then(({ initializeErrorTracking }) => {
    initializeErrorTracking();
  });
}

// Initialize analytics (production only)
if (import.meta.env.PROD && import.meta.env.VITE_GA_TRACKING_ID) {
  import('./services/analytics').then(({ initializeAnalytics }) => {
    initializeAnalytics();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        autoHideDuration={5000}
      >
        <App />
      </SnackbarProvider>
    </BrowserRouter>
  </React.StrictMode>
);

