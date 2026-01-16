
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Robust Service Worker Registration
 * Handles mobile environments and immediate activation.
 */
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    // Ensuring we use the root sw.js
    const swPath = '/sw.js';
    
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: '/'
    });
    
    console.log('Lumina SW registered:', registration.scope);

    // If there is a worker waiting, tell it to skip waiting and activate
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Standard update check
    registration.update();

  } catch (err: any) {
    console.warn('SW registration skipped or failed:', err.message);
  }
};

// Initiate registration immediately
registerServiceWorker();

// Handle SW controller changes to sync UI state
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker controller changed. App is now controlled.');
    // We don't necessarily need a reload if the app is designed to be reactive,
    // but it helps ensure the new SW is managing all requests.
  });
}

// Main App Mounting
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
