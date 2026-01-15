

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

    // Fix: Use 'any' type for defaultOptions as standard NotificationOptions 
    // might not include properties like 'vibrate' or 'badge' in some environments.
    const defaultOptions: any = {
        icon: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
        silent: false,
        vibrate: [200, 100, 200],
        ...options
    };

    // If we have a service worker, use it (required for background/mobile)
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
            return registration.showNotification(title, defaultOptions);
        }
    }

    // Fallback to standard notification (only works when tab is active)
    return new Notification(title, defaultOptions);
};
