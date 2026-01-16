
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
    // We use a relative path but ensure it points to the root-level sw.js
    const swPath = './sw.js';
    
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: './'
    });
    
    console.log('Lumina SW registered:', registration.scope);

    // If there is a worker waiting, tell it to skip waiting and activate
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Check for updates periodically
    registration.update();

  } catch (err: any) {
    console.warn('SW registration bypassed (likely sandbox/security):', err.message);
  }
};

// Initiate registration on window load
window.addEventListener('load', () => {
  registerServiceWorker();
});

// Handle SW controller changes for updates
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // When a new service worker takes over, reload to ensure state consistency
    if (!refreshing) {
      console.log('New Service Worker active, refreshing...');
      window.location.reload();
      refreshing = true;
    }
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
