
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Robust Service Worker Registration
 * Handles sandboxed environments and origin mismatches gracefully.
 */
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    // Check if we are in a cross-origin iframe which often blocks SW registration
    const isSandboxed = window.self !== window.top;
    
    // Use a relative path to ensure compatibility with different base URLs
    const swPath = 'sw.js';
    
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: './'
    });
    
    console.log('Lumina SW registered successfully:', registration.scope);

    // Immediate takeover logic
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  } catch (err: any) {
    // This is expected in environments like AI Studio or sandboxed previews.
    // We log it as a warning so it doesn't appear as a critical failure.
    console.warn(
      'Service Worker registration bypassed. This is likely due to browser security policies in a sandboxed/preview environment.',
      err.message
    );
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
    if (!refreshing) {
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
