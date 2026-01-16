
/**
 * Lumina Service Worker
 * Handles background notifications and PWA features
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Optional: Clear old caches if any
    ])
  );
});

// Allow immediate takeover
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Lumina', body: 'Time for your growth ritual.' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data = { title: 'Lumina', body: event.data.text() };
  }
  
  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
    vibrate: [200, 100, 200],
    data: {
      url: self.registration.scope
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
