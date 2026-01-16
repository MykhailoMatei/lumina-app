/**
 * Browser-level System Notifications Service
 * Enhanced for Service Worker / Mobile PWA support
 */

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    
    // If already granted, return true immediately
    if (Notification.permission === 'granted') return true;
    
    // If blocked, we can't request again via code
    if (Notification.permission === 'denied') return false;
    
    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (e) {
        console.error("Permission request failed", e);
        return false;
    }
};

export const sendSystemNotification = async (title: string, options?: NotificationOptions): Promise<'success' | 'denied' | 'error'> => {
    if (!('Notification' in window)) return 'error';

    if (Notification.permission !== 'granted') return 'denied';

    const defaultOptions: any = {
        icon: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3237/3237472.png',
        silent: false,
        vibrate: [200, 100, 200],
        tag: 'lumina-nudge',
        renotify: true,
        ...options
    };

    // PWA Strategy: Try Service Worker first
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.showNotification(title, defaultOptions);
                return 'success';
            }
        } catch (e) {
            console.warn("SW notification failed", e);
        }
    }

    // Fallback for standard browser
    try {
        new Notification(title, defaultOptions);
        return 'success';
    } catch (e) {
        console.error("Notification failed", e);
        return 'error';
    }
};