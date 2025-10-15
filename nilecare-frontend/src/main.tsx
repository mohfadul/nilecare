import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Load accessibility checker in development
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  }).catch(() => {
    console.log('axe-core not available');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

