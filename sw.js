/**
 * Lumina Service Worker
 * Handles background notifications and PWA features
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim clients immediately so notifications work on the first visit
  event.waitUntil(clients.claim());
});

// Handle incoming push notifications from a backend (FCM/Web-Push)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Lumina', body: 'Time for your growth ritual.' };
  
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

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});