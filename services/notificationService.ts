/**
 * Browser-level System Notifications Service
 * Enhanced for Service Worker / Mobile PWA support
 */

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') return true;
    
    if (Notification.permission !== 'denied') {
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (e) {
            console.error("Permission request failed", e);
            return false;
        }
    }
    
    return false;
};

export const sendSystemNotification = async (title: string, options?: NotificationOptions): Promise<'success' | 'denied' | 'error'> => {
    if (!('Notification' in window)) {
        console.warn("Notifications not supported in this browser.");
        return 'error';
    }

    if (Notification.permission !== 'granted') {
        console.warn("Notification permission not granted.");
        return 'denied';
    }

    const defaultOptions: any = {
        icon: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
        silent: false,
        vibrate: [200, 100, 200],
        tag: 'lumina-nudge',
        renotify: true,
        ...options
    };

    // Mobile Strategy: Always try Service Worker first for PWA consistency.
    if ('serviceWorker' in navigator) {
        try {
            // Wait for the service worker to be ready with a slightly longer timeout for mobile
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<null>((_, reject) => setTimeout(() => reject(new Error('SW Timeout')), 2000))
            ]);

            if (registration) {
                await (registration as ServiceWorkerRegistration).showNotification(title, defaultOptions);
                return 'success';
            }
        } catch (e) {
            console.warn("Service Worker notification attempt failed, trying window fallback", e);
        }
    }

    // Desktop/Standard Fallback
    try {
        new Notification(title, defaultOptions);
        return 'success';
    } catch (e) {
        console.error("Standard notification constructor failed", e);
        return 'error';
    }
};
