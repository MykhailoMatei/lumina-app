
/**
 * Browser-level System Notifications Service
 * Enhanced for Service Worker / Mobile PWA support
 */

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') return true;
    
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    
    return false;
};

export const sendSystemNotification = async (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        console.warn("Notification not sent: Permission not granted or not supported.");
        return null;
    }

    const defaultOptions: any = {
        icon: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
        silent: false,
        vibrate: [200, 100, 200],
        ...options
    };

    // Attempt Service Worker first for background support, but with a timeout to prevent hanging
    if ('serviceWorker' in navigator) {
        try {
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise((resolve) => setTimeout(() => resolve(null), 500))
            ]) as ServiceWorkerRegistration | null;

            if (registration) {
                return registration.showNotification(title, defaultOptions);
            }
        } catch (e) {
            console.warn("Service worker notification check failed or timed out", e);
        }
    }

    // Fallback to standard notification
    return new Notification(title, defaultOptions);
};
