
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
        return null;
    }

    const defaultOptions: any = {
        icon: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
        silent: false,
        vibrate: [200, 100, 200],
        ...options
    };

    // Fast check for Service Worker. We don't await .ready here to avoid infinite hangs on some mobile browsers.
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                return registration.showNotification(title, defaultOptions);
            }
        } catch (e) {
            console.warn("SW notification failed", e);
        }
    }

    // Fallback to standard notification (works on desktop and some mobile)
    try {
        return new Notification(title, defaultOptions);
    } catch (e) {
        console.warn("Standard notification failed", e);
        return null;
    }
};
