
import React, { useState, useRef, useEffect } from 'react';
import { useApp, THEMES } from '../context/AppContext';
import { ThemeColor, AppLanguage } from '../types';
import { 
    User, Palette, Moon, Globe, Trash2, Shield, Settings, 
    Check, Lock, X, Move, ZoomIn, Camera,
    ShieldCheck, Loader2, Cloud, CloudOff, Link2, LogOut, ArrowRight,
    RefreshCw, BellRing, Clock, Key, ShieldAlert, Smartphone, Zap, Info, Activity, Database
} from 'lucide-react';
import { uploadImage } from '../services/storageService';
import { AuthModal } from '../components/AuthModal';
import { requestNotificationPermission, sendSystemNotification, subscribeToPush, triggerBackendTestNudge } from '../services/notificationService';

const LANGUAGES: AppLanguage[] = ['English', 'French', 'German', 'Ukrainian', 'Spanish'];
const AVATARS = ['🌱', '🌿', '🌳', '🚀', '🧠', '✨', '🧘', '🔥', '💎', '🌊', '☀️', '🌕'];

export const Profile: React.FC = () => {
    const { 
        name, avatar, theme, themeColor, language, themeClasses, 
        securitySettings, syncStatus, user, notificationSettings,
        updateUserPreferences, deleteAccount, t, setPinCode, 
        syncWithCloud, signOut, triggerNotification
    } = useApp();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cropCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState(name);
    const [showAuth, setShowAuth] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [settingPin, setSettingPin] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [isTestingPush, setIsTestingPush] = useState(false);
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImgSrc, setSelectedImgSrc] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const isImageAvatar = !!(avatar && (avatar.startsWith('data:image') || avatar.startsWith('http')));
    
    const [isStandalone, setIsStandalone] = useState(false);
    const [swActive, setSwActive] = useState(false);
    const [isRetryingSw, setIsRetryingSw] = useState(false);

    const checkSwStatus = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                // A worker is practically active if it's registered and either active, waiting, or controlling.
                // Mobile browsers often delay the 'controller' until the next load.
                const isActive = !!(
                    registration?.active || 
                    registration?.waiting || 
                    registration?.installing || 
                    navigator.serviceWorker.controller
                );
                setSwActive(isActive);
                return isActive;
            } catch (e) {
                return false;
            }
        }
        return false;
    };

    useEffect(() => {
        const initStatus = () => {
            const isInstalled = 
                window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true ||
                window.location.search.includes('source=pwa');
                
            setIsStandalone(isInstalled);
            checkSwStatus();
        };

        initStatus();

        // Listen for changes
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', checkSwStatus);
            // Re-check periodically during first minute of usage
            const interval = setInterval(checkSwStatus, 5000);
            return () => {
                navigator.serviceWorker.removeEventListener('controllerchange', checkSwStatus);
                clearInterval(interval);
            };
        }
    }, []);

    const handleRetrySignal = async () => {
        setIsRetryingSw(true);
        if ('serviceWorker' in navigator) {
            try {
                // Force a re-registration attempt
                await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                // Short delay for browser processing
                await new Promise(resolve => setTimeout(resolve, 1500));
                const active = await checkSwStatus();
                if (active) {
                    triggerNotification("Signal Verified", "Lumina background system is now synced.", "achievement");
                } else {
                    triggerNotification("System Pending", "Worker registered but still initializing. Please wait.", "reminder");
                }
            } catch (e) {
                triggerNotification("Registration Error", "Check your browser privacy settings.", "reminder");
            }
        }
        setIsRetryingSw(false);
    };

    const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
        setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
    };

    const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
        setOffset({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y
        });
    };

    const handleEnableNotifications = async () => {
        const currentlyEnabled = !!notificationSettings?.enabled;

        if (currentlyEnabled) {
            updateUserPreferences({ notificationSettings: { ...notificationSettings, enabled: false } });
            triggerNotification("Alerts Paused", "Lumina will stay quiet for now.", "reminder");
            return;
        }

        if (!user) {
            triggerNotification("Identity Required", "Connect your account below to enable push notifications.", "reminder");
            setShowAuth(true);
            return;
        }

        // Final SW verify
        const swReady = await checkSwStatus();
        if (!swReady) {
            triggerNotification("System Cold-Start", "Background system is warming up. Tap 'Retry' in diagnostics if this persists.", "reminder");
            return;
        }

        const permissionState = await requestNotificationPermission();
        
        if (permissionState === 'unsupported') {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS && !isStandalone) {
                triggerNotification("iOS Requirement", "On iPhone, you must 'Add to Home Screen' via the share menu for notifications.", "reminder");
            } else {
                triggerNotification("API Unsupported", "Your browser does not support the Push API.", "reminder");
            }
            return;
        }

        if (permissionState === 'denied') {
            triggerNotification("Access Blocked", "Please reset site permissions in browser settings.", "reminder");
            return;
        }

        if (permissionState === 'granted') {
            const sub = await subscribeToPush(user.id);
            if (sub) {
                updateUserPreferences({ notificationSettings: { ...notificationSettings, enabled: true } });
                triggerNotification("Lumina Linked", "Signal active! 🚀", "achievement");
                await sendSystemNotification("Secure Link Active", { body: "You are now receiving growth nudges." });
            } else {
                triggerNotification("Network Error", "Could not establish push link. Check your connection.", "reminder");
            }
        }
    };

    const handleTestPush = async () => {
        const isPermitted = Notification.permission === 'granted';
        if (isTestingPush) return;
        setIsTestingPush(true);
        if ('vibrate' in navigator) navigator.vibrate(50);

        if (!isPermitted) {
            triggerNotification("Permission Needed", "Allow notifications first.", "reminder");
            setIsTestingPush(false);
            return;
        }

        await sendSystemNotification("Local Signal Test", {
            body: "Ping received! Your device is responding to Lumina.",
            tag: 'test-push'
        });

        if (user) {
            await triggerBackendTestNudge();
        }
        
        setTimeout(() => setIsTestingPush(false), 2000);
    };

    const updateTimelineTime = (phase: 'Morning' | 'Afternoon' | 'Evening', time: string) => {
        if (!notificationSettings) return;
        updateUserPreferences({
            notificationSettings: {
                ...notificationSettings,
                routineTimeline: { ...notificationSettings.routineTimeline, [phase]: time }
            }
        });
    };

    const handleSavePin = () => {
        if (pinInput.length === 4) {
            setPinCode(pinInput);
            setSettingPin(false);
            setPinInput('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImgSrc(reader.result as string);
                setZoom(1);
                setOffset({ x: 0, y: 0 });
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCroppedImage = async () => {
        if (!selectedImgSrc || !cropCanvasRef.current) return;
        setIsUploading(true);
        const canvas = cropCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = async () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const size = 400;
            canvas.width = size;
            canvas.height = size;
            const imgAspect = img.width / img.height;
            let drawW, drawH;
            if (imgAspect > 1) {
                drawH = size * zoom;
                drawW = drawH * imgAspect;
            } else {
                drawW = size * zoom;
                drawH = drawW / imgAspect;
            }
            const x = (size - drawW) / 2 + offset.x;
            const y = (size - drawH) / 2 + offset.y;
            ctx.drawImage(img, x, y, drawW, drawH);
            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            if (user) {
                const cloudUrl = await uploadImage('avatars', user.id, croppedDataUrl);
                if (cloudUrl) updateUserPreferences({ avatar: cloudUrl });
                else updateUserPreferences({ avatar: croppedDataUrl });
            } else {
                updateUserPreferences({ avatar: croppedDataUrl });
            }
            setIsUploading(false);
            setShowCropModal(false);
            setSelectedImgSrc(null);
        };
        img.src = selectedImgSrc;
    };

    const renderToggle = (active: boolean, onToggle: () => void, label: string, icon?: React.ReactNode, subLabel?: string) => {
        return (
            <div className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-50">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {icon && <div className={`w-9 h-9 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-50 dark:border-slate-800 flex items-center justify-center shrink-0 ${active ? themeClasses?.text || 'text-indigo-600' : 'text-slate-300'}`}>{icon}</div>}
                    <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100 leading-none">{label}</span>
                        {subLabel && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 opacity-60">
                                {subLabel}
                            </span>
                        )}
                    </div>
                </div>
                <button onClick={onToggle} className={`relative w-9 h-5 rounded-full transition-all duration-300 shrink-0 ml-4 ${active ? (themeClasses?.primary || 'bg-indigo-600') : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${active ? 'right-0.5' : 'left-0.5'}`} />
                </button>
            </div>
        );
    };

    const getNotificationStatus = () => {
        if (!('Notification' in window)) return "API Unsupported";
        if (Notification.permission === 'denied') return "Blocked by Browser";
        if (!user) return "Login Required";
        if (!swActive) return "Signal Booting...";
        return notificationSettings?.enabled ? "Active Channel" : "Disabled";
    };

    return (
        <div className="pb-40 space-y-6 animate-in fade-in duration-500 max-w-full overflow-x-hidden">
            <header className="px-1 pt-2 flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{t('profile')}</h1>
                <button 
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <Activity size={18} />
                </button>
            </header>

            {showDiagnostics && (
                <div className="bg-slate-900 text-emerald-400 p-6 rounded-[2rem] font-mono text-[10px] space-y-2 animate-in slide-in-from-top-4">
                    <div className="flex justify-between border-b border-white/10 pb-1 mb-2">
                        <span className="font-bold text-white uppercase">Signal Diagnostics</span>
                        <X size={14} className="cursor-pointer" onClick={() => setShowDiagnostics(false)} />
                    </div>
                    <div className="flex justify-between"><span>Display Mode:</span> <span className={isStandalone ? 'text-emerald-400' : 'text-rose-400'}>{isStandalone ? 'STANDALONE' : 'BROWSER'}</span></div>
                    <div className="flex justify-between items-center">
                        <span>Background Core:</span> 
                        <div className="flex items-center gap-2">
                            <span className={swActive ? 'text-emerald-400' : 'text-rose-400'}>{swActive ? 'ACTIVE' : 'INACTIVE'}</span>
                            {!swActive && (
                                <button onClick={handleRetrySignal} disabled={isRetryingSw} className="px-2 py-0.5 bg-white/10 rounded-md text-white hover:bg-white/20 disabled:opacity-50 text-[8px] font-black uppercase">
                                    {isRetryingSw ? 'WAITING...' : 'RETRY'}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between"><span>Supabase Push:</span> <span className={user ? 'text-emerald-400' : 'text-rose-400'}>{user ? 'ENABLED' : 'AUTH REQUIRED'}</span></div>
                    <div className="flex justify-between"><span>Permission:</span> <span className={Notification.permission === 'granted' ? 'text-emerald-400' : 'text-rose-400'}>{Notification.permission.toUpperCase()}</span></div>
                    <div className="flex justify-between"><span>Haptic Engine:</span> <span>{'vibrate' in navigator ? 'READY' : 'N/A'}</span></div>
                    <div className="mt-4 p-3 bg-white/5 rounded-xl text-white/60 leading-relaxed italic">
                        {isStandalone 
                            ? "✓ PWA Integrity Verified. Signal retry will wake up the core." 
                            : "⚠ Browser Tab detected. Use 'Add to Home Screen' for deep mobile integration."}
                    </div>
                </div>
            )}

            {/* IDENTITY CARD */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <User size={14} className={`shrink-0 ${themeClasses?.text || 'text-indigo-600'}`} />
                        <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em] leading-none">{t('identity')}</h2>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
                
                <div className="flex gap-5 sm:gap-6 items-center">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl border border-slate-100 dark:border-slate-700 shrink-0 overflow-hidden relative group transition-transform active:scale-95"
                    >
                        {isImageAvatar ? <img src={avatar} className="w-full h-full object-cover" alt={name} /> : avatar}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera size={14} className="text-white" />
                        </div>
                    </button>
                    <div className="flex-1 space-y-1 min-w-0">
                        {editingName ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    autoFocus
                                    maxLength={20}
                                    value={tempName} 
                                    onChange={e => setTempName(e.target.value)} 
                                    className={`bg-slate-50 dark:bg-slate-800 border-b ${themeClasses?.border || 'border-indigo-100'} outline-none px-1 py-0.5 text-slate-800 dark:text-slate-100 w-full font-bold text-lg tracking-tight`} 
                                />
                                <button onClick={() => { updateUserPreferences({ name: tempName }); setEditingName(false); }} className="text-emerald-500 shrink-0"><Check size={18} strokeWidth={3}/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5 min-w-0 h-8">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight truncate leading-none flex items-center">{name}</h3>
                                <button onClick={() => setEditingName(true)} className={`${themeClasses?.text || 'text-indigo-600'} text-[8px] font-black uppercase tracking-widest hover:underline shrink-0 leading-none inline-flex items-center mt-1`}>{t('edit')}</button>
                            </div>
                        )}
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] truncate leading-none pt-0.5">{t('growth_traveler')}</p>
                    </div>
                </div>

                <div className="space-y-3 pt-1">
                    <p className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] ml-1">{t('choose_avatar')}</p>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x py-2 -mx-6 px-6">
                        {AVATARS.map(av => (
                            <button 
                                key={av} 
                                onClick={() => updateUserPreferences({ avatar: av })}
                                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg transition-all snap-center ${avatar === av ? `bg-white dark:bg-slate-800 scale-110 shadow-md ring-2 ${themeClasses?.ring || 'ring-indigo-500'} ring-offset-2 dark:ring-offset-slate-900 z-10` : `bg-slate-50 dark:bg-slate-800/40 opacity-50 hover:opacity-100 border border-slate-100 dark:border-slate-800`}`}
                            >
                                {av}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MOBILE SYNC & PUSH */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-2">
                    <div className={themeClasses?.text || 'text-indigo-600'}><Smartphone size={14} className="shrink-0" /></div>
                    <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em] leading-none">System Sync</h2>
                </div>

                <div className="space-y-4">
                    {renderToggle(
                        !!notificationSettings?.enabled, 
                        handleEnableNotifications, 
                        "Mobile Push", 
                        <Smartphone size={16} />, 
                        getNotificationStatus()
                    )}

                    <div className="p-4 bg-slate-50/40 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <Zap size={14} className="text-amber-500" /> Signal Integrity
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${notificationSettings?.enabled ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                                {notificationSettings?.enabled ? 'Live' : 'Offline'}
                            </span>
                        </div>
                        <button 
                            onClick={handleTestPush}
                            disabled={!notificationSettings?.enabled || isTestingPush}
                            className={`w-full py-3.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm ${notificationSettings?.enabled ? `${themeClasses?.primary || 'bg-indigo-600'} text-white active:scale-95` : 'bg-slate-100 text-slate-300 opacity-50 cursor-not-allowed'}`}
                        >
                            {isTestingPush ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
                            {isTestingPush ? 'Testing Signal...' : 'Send Test Nudge'}
                        </button>
                    </div>

                    {!isStandalone && (
                         <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3">
                            <ShieldAlert size={16} className="text-amber-500 shrink-0" />
                            <div className="text-[9px] font-bold text-amber-700 dark:text-amber-300 leading-relaxed italic">
                                <strong>PWA Hint:</strong> To unlock background alerts, please tap your browser menu and select <strong>"Add to Home Screen"</strong>.
                            </div>
                         </div>
                    )}
                </div>
            </div>

            {/* ROUTINE TIMELINE CARD */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-7">
                <div className="flex items-center gap-2">
                    <div className={themeClasses?.text || 'text-indigo-600'}><BellRing size={14} className="shrink-0" /></div>
                    <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em] leading-none">Routine Timeline</h2>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {(['Morning', 'Afternoon', 'Evening'] as const).map(phase => (
                        <div key={phase} className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all">
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-slate-400" />
                                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{phase} Nudge</span>
                            </div>
                            <input 
                                type="time"
                                value={notificationSettings?.routineTimeline?.[phase] || "08:00"}
                                onChange={(e) => updateTimelineTime(phase, e.target.value)}
                                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold dark:text-white outline-none"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* SETTINGS CARD - ACCENT & LANGUAGE */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
                <div className="flex items-center gap-2">
                    <div className={themeClasses?.text || 'text-indigo-600'}><Settings size={14} className="shrink-0" /></div>
                    <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em] leading-none">{t('settings')}</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 ml-1">
                        <Palette size={12} className="shrink-0" />
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{t('accent_palette')}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 px-1">
                        {(Object.keys(THEMES) as ThemeColor[]).map(color => (
                            <button
                                key={color}
                                onClick={() => updateUserPreferences({ themeColor: color })}
                                className={`w-10 h-10 rounded-full transition-all flex items-center justify-center relative ${THEMES[color].primary} ${themeColor === color ? 'ring-4 ring-offset-2 ring-slate-200 dark:ring-slate-700 scale-110' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                            >
                                {themeColor === color && <Check size={16} className="text-white" strokeWidth={4} />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 border-t border-slate-50 dark:border-slate-800/50 pt-7">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 ml-1">
                        <Globe size={12} className="shrink-0" />
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{t('language')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        {LANGUAGES.map(lang => (
                            <button 
                                key={lang} 
                                onClick={() => updateUserPreferences({ language: lang })} 
                                className={`px-3 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${language === lang ? `${themeClasses?.primary || 'bg-indigo-600'} text-white border-transparent shadow-sm` : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500'} whitespace-normal break-words overflow-hidden`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-slate-50 dark:border-slate-800/50 pt-7">
                    {renderToggle(
                        theme === 'dark',
                        () => updateUserPreferences({ theme: theme === 'dark' ? 'light' : 'dark' }),
                        t('dark_mode'),
                        <Moon size={16} />
                    )}
                </div>
            </div>

            {/* SECURITY CARD */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-2">
                    <div className={themeClasses?.text || 'text-indigo-600'}><Shield size={14} className="shrink-0" /></div>
                    <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em] leading-none">Identity Guard</h2>
                </div>

                {renderToggle(
                    !!securitySettings?.pinCode,
                    () => {
                        if (securitySettings?.pinCode) setPinCode(null);
                        else setSettingPin(true);
                    },
                    "App Lock",
                    <Lock size={16} />,
                    securitySettings?.pinCode ? 'Secured' : 'Open'
                )}

                {settingPin && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 shadow-inner">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Set 4-Digit Identity PIN</label>
                            <button onClick={() => setSettingPin(false)} className="text-slate-300 hover:text-slate-500"><X size={16}/></button>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                            <input 
                                type="text"
                                inputMode="numeric"
                                pattern="\d{4}"
                                maxLength={4}
                                value={pinInput}
                                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                                placeholder="••••"
                                className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-2 sm:px-4 py-3 text-center text-2xl font-black tracking-[0.25em] dark:text-white outline-none"
                            />
                            <button 
                                onClick={handleSavePin}
                                disabled={pinInput.length !== 4}
                                className={`px-4 sm:px-5 shrink-0 rounded-xl ${themeClasses?.primary || 'bg-indigo-600'} text-white disabled:opacity-30 shadow-lg active:scale-95`}
                            >
                                <Check size={20} strokeWidth={4} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* GROWTH VAULT CARD */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-48 h-48 ${themeClasses?.primary || 'bg-indigo-600'} opacity-5 rounded-full blur-[80px] -mr-24 -mt-24 transition-transform duration-1000 group-hover:scale-110`} />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center ${syncStatus?.status === 'pending' ? 'animate-pulse' : ''}`}>
                                {user ? <Cloud size={24} className="text-emerald-500" /> : <CloudOff size={24} className="text-slate-300" />}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-[12px] font-bold uppercase text-slate-800 dark:text-white tracking-[0.2em] truncate">Growth Vault</h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{user ? 'Secured & Synchronized' : 'Offline Persistence Only'}</p>
                            </div>
                        </div>
                        {user && (
                            <button onClick={syncWithCloud} disabled={syncStatus?.status === 'pending'} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 transition-all active:scale-90 shrink-0">
                                <RefreshCw size={18} className={syncStatus?.status === 'pending' ? 'animate-spin' : ''} />
                            </button>
                        )}
                    </div>

                    {!user ? (
                        <div className="space-y-6">
                            <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-[1.75rem] p-5 border border-slate-100 dark:border-slate-800">
                                <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">Your evolution is currently <span className="text-emerald-500 font-bold">local-only</span>. Synchronize your journey across devices.</p>
                            </div>
                            <button onClick={() => setShowAuth(true)} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-[1.75rem] text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-md hover:scale-[1.02] transition-all">
                                <Link2 size={14} /> Claim Your Identity <ArrowRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-[1.75rem] p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><ShieldCheck size={18} /></div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">Vault Owner</span>
                                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 truncate">{user.email}</span>
                                    </div>
                                </div>
                                <button onClick={signOut} className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shrink-0 border border-slate-100 dark:border-slate-700"><LogOut size={18} /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DANGER ZONE */}
            <div className="px-2 pt-4">
                <button onClick={deleteAccount} className="w-full py-4 text-rose-500 text-[10px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl transition-all">
                    <Trash2 size={14} /> {t('delete_account')}
                </button>
            </div>

            {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
            
            {showCropModal && selectedImgSrc && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-[280px] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 dark:text-slate-50 text-xl tracking-tight truncate">{t('adjust_photo')}</h3>
                            <button onClick={() => {setShowCropModal(false); setSelectedImgSrc(null);}} className="text-slate-300 hover:text-slate-500 p-2"><X size={18}/></button>
                        </div>

                        <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 shadow-inner group">
                            <div 
                                className="w-full h-full cursor-move touch-none"
                                onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                                onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
                                onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={() => setIsDragging(false)}
                            >
                                <img 
                                    src={selectedImgSrc} alt={t('adjust_photo')} 
                                    className="pointer-events-none select-none max-w-none origin-center"
                                    style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, width: '100%', height: 'auto' }}
                                />
                            </div>
                            <div className="absolute inset-0 pointer-events-none ring-[100px] ring-white/80 dark:ring-slate-950/80 rounded-full" />
                        </div>

                        <div className="space-y-4 mb-8 px-1">
                            <div className="flex justify-between items-center text-slate-400 dark:text-slate-50">
                                <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><ZoomIn size={12}/> {t('zoom_label')}</span>
                                <span className="text-[10px] font-bold">{(zoom * 100).toFixed(0)}%</span>
                            </div>
                            <input 
                                type="range" min="0.5" max="3" step="0.01" value={zoom} 
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className={`w-full h-1 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-${themeColor}-500`}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => {setShowCropModal(false); setSelectedImgSrc(null);}} className="py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 transition-all border border-slate-100 dark:border-slate-800 shadow-sm truncate">{t('back')}</button>
                            <button onClick={handleSaveCroppedImage} disabled={isUploading} className={`py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white bg-gradient-to-br ${themeClasses?.gradient || 'from-indigo-600 to-blue-600'} shadow-lg transition-all truncate flex items-center justify-center gap-2`}>
                                {isUploading ? <Loader2 size={14} className="animate-spin" /> : t('save')}
                            </button>
                        </div>
                        <canvas ref={cropCanvasRef} className="hidden" />
                    </div>
                </div>
            )}
        </div>
    );
};
