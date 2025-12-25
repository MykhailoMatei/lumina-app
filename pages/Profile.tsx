import React, { useState, useRef, useEffect } from 'react';
import { useApp, THEMES, APP_VERSION } from '../context/AppContext';
import { ThemeColor, AppLanguage } from '../types';
import { 
    User, Palette, Moon, Globe, Trash2, Shield, Settings, 
    Check, Zap, RefreshCw, Lock, FileJson, FileUp, Database, 
    X, Move, ZoomIn, Camera, ImageIcon, Smartphone, Bell,
    ShieldCheck, Loader2
} from 'lucide-react';
import { testApiConnection } from '../services/geminiService';

const LANGUAGES: AppLanguage[] = ['English', 'French', 'German', 'Ukrainian', 'Spanish'];
const AVATARS = ['🌱', '🌿', '🌳', '🚀', '🧠', '✨', '🧘', '🔥', '💎', '🌊', '☀️', '🌕'];

export const Profile: React.FC = () => {
    const { 
        name, avatar, theme, themeColor, language, themeClasses, 
        notificationSettings, securitySettings,
        updateUserPreferences, deleteAccount, t, setPinCode, exportData, importData, 
        isPersistent, requestPersistence
    } = useApp();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const cropCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState(name);
    
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    const [settingPin, setSettingPin] = useState(false);
    const [pinInput, setPinInput] = useState('');

    const [localPersistence, setLocalPersistence] = useState(isPersistent);

    useEffect(() => {
        setLocalPersistence(isPersistent);
    }, [isPersistent]);

    const handleTestConnection = async () => {
        setTestStatus('loading');
        const result = await testApiConnection();
        setTestStatus(result.success ? 'success' : 'error');
        setTestMessage(result.message);
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

    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImgSrc, setSelectedImgSrc] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleSaveCroppedImage = () => {
        if (!selectedImgSrc || !cropCanvasRef.current) return;
        
        const canvas = cropCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
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
            updateUserPreferences({ avatar: croppedDataUrl });
            setShowCropModal(false);
            setSelectedImgSrc(null);
        };
        img.src = selectedImgSrc;
    };

    const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
        const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;
        setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
    };

    const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
        const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;
        setOffset({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y
        });
    };

    const stopDragging = () => setIsDragging(false);

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                importData(content);
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    };

    const isImageAvatar = avatar && (avatar.startsWith('data:image') || avatar.startsWith('http'));

    const renderToggle = (active: boolean, onToggle: () => void, label: string, icon?: React.ReactNode, subLabel?: string) => {
        return (
            <div className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-slate-800/20 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:bg-slate-50">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {icon && <div className={`w-9 h-9 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-50 dark:border-slate-800 flex items-center justify-center shrink-0 ${active ? themeClasses.text : 'text-slate-300'}`}>{icon}</div>}
                    <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-medium text-slate-800 dark:text-slate-100 leading-none">
                            {label}
                        </span>
                        {subLabel && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 opacity-60">
                                {subLabel}
                            </span>
                        )}
                    </div>
                </div>
                <button onClick={onToggle} className={`relative w-9 h-5 rounded-full transition-all duration-300 shrink-0 ml-4 ${active ? themeClasses.primary : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${active ? 'right-0.5' : 'left-0.5'}`} />
                </button>
            </div>
        );
    };

    const renderCheckbox = (active: boolean, onToggle: () => void, label: string) => {
        return (
            <button 
                onClick={onToggle}
                className="flex items-center gap-3 py-1 text-left min-w-0"
            >
                <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${active ? `${themeClasses.primary} border-transparent shadow-sm` : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                    {active && <Check size={8} className="text-white" strokeWidth={4} />}
                </div>
                <span className={`text-[11px] font-medium leading-tight ${active ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                    {label}
                </span>
            </button>
        );
    };

    return (
        <div className="pb-32 space-y-6 animate-in fade-in duration-500 max-w-md mx-auto overflow-x-hidden">
            <header className="px-1 pt-2">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t('profile')}</h1>
            </header>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.75rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <User size={13} className={`shrink-0 ${themeClasses.text}`} />
                        <h2 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">
                            {t('identity')}
                        </h2>
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`${themeClasses.secondary} ${themeClasses.text} px-2.5 py-1.5 rounded-xl text-[8px] font-bold uppercase tracking-widest shadow-sm hover:opacity-80 transition-all flex items-center gap-1.5 border ${themeClasses.border} whitespace-nowrap shrink-0`}
                    >
                        <ImageIcon size={11} strokeWidth={2.5} className="shrink-0" /> {t('upload_photo')}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
                
                <div className="flex gap-5 items-center">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl border border-slate-100 dark:border-slate-700 shadow-inner shrink-0 overflow-hidden relative group"
                    >
                        {isImageAvatar ? (
                            <img src={avatar} className="w-full h-full object-cover" alt={name} />
                        ) : (
                            avatar
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera size={14} className="text-white" />
                        </div>
                    </button>
                    <div className="flex-1 space-y-0.5 min-w-0">
                        {editingName ? (
                            <div className="flex gap-2">
                                <input 
                                    autoFocus
                                    value={tempName} 
                                    onChange={e => setTempName(e.target.value)} 
                                    className={`bg-slate-50 dark:bg-slate-800 border-b ${themeClasses.border} outline-none px-1 py-0.5 text-slate-800 dark:text-slate-100 w-full font-bold text-lg tracking-tight`} 
                                />
                                <button onClick={() => { updateUserPreferences({ name: tempName }); setEditingName(false); }} className="text-emerald-500 shrink-0"><Check size={18} strokeWidth={3}/></button>
                            </div>
                        ) : (
                            <div className="flex items-baseline gap-2 min-w-0">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">{name}</h3>
                                <button onClick={() => setEditingName(true)} className={`${themeClasses.text} text-[8px] font-bold uppercase tracking-widest hover:underline shrink-0`}>{t('edit')}</button>
                            </div>
                        )}
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] truncate">{t('growth_traveler')}</p>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('choose_avatar')}</p>
                    <div className="flex flex-wrap gap-2.5">
                        {AVATARS.map(av => (
                            <button 
                                key={av} 
                                onClick={() => updateUserPreferences({ avatar: av })}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-all ${avatar === av ? `bg-white dark:bg-slate-800 scale-105 shadow-md ring-2 ${themeClasses.ring} ring-offset-2 dark:ring-offset-slate-900` : `bg-slate-50 dark:bg-slate-800/40 opacity-50 hover:opacity-100 border border-slate-100 dark:border-slate-800`}`}
                            >
                                {av}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.75rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-2">
                    <Settings size={13} className={`shrink-0 ${themeClasses.text}`} />
                    <h2 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] break-words leading-none">{t('settings')}</h2>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 ml-1">
                            <Globe size={10} className="shrink-0" />
                            <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{t('language')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {LANGUAGES.map(lang => (
                                <button 
                                    key={lang} 
                                    onClick={() => updateUserPreferences({ language: lang })} 
                                    className={`px-2 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all ${language === lang ? `${themeClasses.primary} text-white border-transparent shadow-sm` : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500'} whitespace-normal break-words overflow-hidden`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-50 dark:border-slate-800/50 pt-5">
                        {renderToggle(
                            theme === 'dark',
                            () => updateUserPreferences({ theme: theme === 'dark' ? 'light' : 'dark' }),
                            t('dark_mode'),
                            <Moon size={14} />
                        )}
                    </div>

                    <div className="space-y-5 pt-1">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 ml-1">
                            <Palette size={13} className="shrink-0" />
                            <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{t('accent_palette')}</span>
                        </div>
                        <div className="flex justify-between gap-4 px-1 py-2">
                            {(Object.keys(THEMES) as ThemeColor[]).map((color) => {
                                const themeItem = THEMES[color];
                                const isSelected = themeColor === color;
                                return (
                                    <button
                                        key={color}
                                        onClick={() => updateUserPreferences({ themeColor: color })}
                                        className="flex flex-col items-center gap-2 flex-1 outline-none"
                                    >
                                        <div className={`w-9 h-9 rounded-full ${themeItem.primary} transition-all duration-300 relative flex items-center justify-center shadow-sm active:scale-90
                                            ${isSelected ? `ring-2 ring-offset-2 dark:ring-offset-slate-900 ${themeItem.ring}` : 'hover:scale-110'}
                                        `}>
                                            {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                                        </div>
                                        <span className={`text-[10px] font-medium leading-tight text-center truncate w-full ${isSelected ? themeClasses.text : 'text-slate-400 opacity-60'}`}>
                                            {t(themeItem.name)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.75rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <Zap size={13} className={`shrink-0 ${themeClasses.text}`} />
                            <h2 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] break-words leading-none">{t('ai_connection')}</h2>
                        </div>
                        <button 
                            onClick={handleTestConnection}
                            disabled={testStatus === 'loading'}
                            className="bg-slate-50 dark:bg-slate-800 text-slate-500 px-2.5 py-1.5 rounded-xl text-[8px] font-bold uppercase tracking-widest border border-slate-100 dark:border-slate-700 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                            {testStatus === 'loading' ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                            {t('api_test')}
                        </button>
                    </div>
                    {testStatus !== 'idle' && (
                        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${
                            testStatus === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}>
                            <div className={`p-1.5 rounded-full shrink-0 ${testStatus === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                <ShieldCheck size={11} />
                            </div>
                            <p className="text-[9px] font-bold uppercase tracking-wide leading-tight">{testMessage}</p>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.75rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="flex items-center gap-2">
                        <Bell size={13} className={`shrink-0 ${themeClasses.text}`} />
                        <h2 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] break-words leading-none">{t('notifications_hub')}</h2>
                    </div>

                    <div className="space-y-4">
                        {renderToggle(
                            notificationSettings.enabled, 
                            () => updateUserPreferences({ notificationSettings: { ...notificationSettings, enabled: !notificationSettings.enabled } }),
                            t('enable_push'),
                            <Smartphone size={14} />
                        )}

                        {notificationSettings.enabled && (
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6 p-5 bg-slate-50/40 dark:bg-slate-800/20 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 shadow-inner animate-in slide-in-from-top-2">
                                {renderCheckbox(notificationSettings.types.habits, () => updateUserPreferences({ notificationSettings: { ...notificationSettings, types: { ...notificationSettings.types, habits: !notificationSettings.types.habits } } }), t('habits_notif'))}
                                {renderCheckbox(notificationSettings.types.goals, () => updateUserPreferences({ notificationSettings: { ...notificationSettings, types: { ...notificationSettings.types, goals: !notificationSettings.types.goals } } }), t('goals_notif'))}
                                {renderCheckbox(notificationSettings.types.journal, () => updateUserPreferences({ notificationSettings: { ...notificationSettings, types: { ...notificationSettings.types, journal: !notificationSettings.types.journal } } }), t('journal_notif'))}
                                {renderCheckbox(notificationSettings.types.motivation, () => updateUserPreferences({ notificationSettings: { ...notificationSettings, types: { ...notificationSettings.types, motivation: !notificationSettings.types.motivation } } }), t('motivation_notif'))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.75rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-2">
                    <Shield size={13} className={`shrink-0 ${themeClasses.text}`} />
                    <h2 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] break-words leading-none">{t('security')}</h2>
                </div>

                {renderToggle(
                    localPersistence, 
                    async () => {
                        if (localPersistence) {
                            setLocalPersistence(false);
                        } else {
                            const success = await requestPersistence();
                            setLocalPersistence(success);
                        }
                    },
                    t('persistence_on'),
                    <Database size={14} />,
                    t('storage_label')
                )}

                <div className="flex flex-col p-5 bg-slate-50/40 dark:bg-slate-800/20 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 shadow-sm gap-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <Lock size={13} className="text-slate-800 dark:text-slate-100 shrink-0 opacity-80"/>
                                <span className="text-[12px] font-medium dark:text-slate-100 leading-none">{t('app_lock')}</span>
                            </div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest break-words leading-tight mt-1 opacity-70">
                                {t('app_lock_desc')}
                            </p>
                        </div>
                        {settingPin ? (
                            <div className="flex items-center gap-2 shrink-0">
                                <input type="password" maxLength={4} value={pinInput} onChange={e => setPinInput(e.target.value)} className={`w-12 px-1 py-2 rounded-xl border dark:bg-slate-800 dark:border-slate-700 text-center dark:text-white text-xs font-bold shadow-inner ${themeClasses.border}`} placeholder="----" />
                                <button onClick={() => { if(pinInput.length === 4) { setPinCode(pinInput); setSettingPin(false); setPinInput(''); } }} className={`${themeClasses.primary} text-white p-2 rounded-xl shadow-lg active:scale-90 transition-transform`}><Check size={14} strokeWidth={4}/></button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => securitySettings.pinCode ? setPinCode(null) : setSettingPin(true)} 
                                className={`text-[8px] font-bold uppercase tracking-widest px-3.5 py-2 rounded-xl transition-all shadow-sm whitespace-nowrap shrink-0 ${securitySettings.pinCode ? 'bg-red-50 text-red-500 border border-red-100' : `${themeClasses.secondary} ${themeClasses.text} border ${themeClasses.border}`}`}
                            >
                                {securitySettings.pinCode ? t('disable') : t('set_pin')}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={exportData} className="flex items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 gap-3 hover:bg-slate-50 transition-all shadow-sm active:scale-95 group min-w-0">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform shrink-0"><FileJson size={15} /></div>
                        <span className="text-[8px] font-bold uppercase tracking-widest truncate">{t('export_data')}</span>
                    </button>
                    <button onClick={() => importInputRef.current?.click()} className="flex items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 gap-3 hover:bg-slate-50 transition-all shadow-sm active:scale-95 group min-w-0">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform shrink-0"><FileUp size={15} /></div>
                        <span className="text-[8px] font-bold uppercase tracking-widest truncate">{t('import_data')}</span>
                    </button>
                    <input type="file" ref={importInputRef} onChange={handleImportData} accept=".json" className="hidden" />
                </div>

                <button onClick={() => { if(confirm(t('delete_account_confirm'))) deleteAccount(); }} className="w-full py-5 text-rose-500 font-bold text-[9px] uppercase tracking-[0.2em] bg-rose-50/40 dark:bg-rose-950/10 rounded-2xl flex items-center justify-center gap-3 border border-rose-100 dark:border-rose-900/20 hover:bg-rose-50 transition-colors shadow-sm">
                    <Trash2 size={13} className="shrink-0" /> <span className="truncate">{t('delete_account')}</span>
                </button>
            </div>

            {showCropModal && selectedImgSrc && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-[280px] rounded-[2rem] p-8 shadow-2xl overflow-hidden relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="min-w-0">
                                <h3 className="font-bold text-slate-800 dark:text-slate-50 text-lg tracking-tight truncate">{t('adjust_photo')}</h3>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">{t('resize_identity')}</p>
                            </div>
                            <button onClick={() => {setShowCropModal(false); setSelectedImgSrc(null);}} className="text-slate-300 hover:text-slate-500 transition-colors p-2 bg-slate-50 dark:bg-slate-800 rounded-full shadow-sm shrink-0 ml-4"><X size={16}/></button>
                        </div>

                        <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-6 shadow-inner group">
                            <div 
                                className="w-full h-full cursor-move touch-none"
                                onMouseDown={onMouseDown}
                                onMouseMove={onMouseMove}
                                onMouseUp={stopDragging}
                                onMouseLeave={stopDragging}
                                onTouchStart={onMouseDown}
                                onTouchMove={onMouseMove}
                                onTouchEnd={stopDragging}
                            >
                                <img 
                                    src={selectedImgSrc} 
                                    alt={t('adjust_photo')} 
                                    className="pointer-events-none select-none max-w-none origin-center transition-transform duration-75"
                                    style={{
                                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                                        width: '100%',
                                        height: 'auto'
                                    }}
                                />
                            </div>
                            <div className="absolute inset-0 pointer-events-none ring-[100px] ring-white/80 dark:ring-slate-950/80 rounded-full" />
                            <div className="absolute inset-0 pointer-events-none border-[2px] border-dashed border-white/50 rounded-full" />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 text-white/60">
                                <Move size={10}/> <span className="text-[8px] font-bold uppercase tracking-wider">{t('drag_move')}</span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-8 px-1">
                            <div className="flex justify-between items-center text-slate-400 dark:text-slate-50">
                                <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5"><ZoomIn size={11}/> {t('zoom_label')}</span>
                                <span className="text-[9px] font-bold">{(zoom * 100).toFixed(0)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="3" 
                                step="0.01" 
                                value={zoom} 
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className={`w-full h-1 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-${themeColor}-500`}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => {setShowCropModal(false); setSelectedImgSrc(null);}}
                                className="py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 transition-all active:scale-95 border border-slate-100 dark:border-slate-800 shadow-sm truncate"
                            >
                                {t('back')}
                            </button>
                            <button 
                                onClick={handleSaveCroppedImage}
                                className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white bg-gradient-to-br ${themeClasses.gradient} shadow-lg active:scale-95 transition-all truncate`}
                            >
                                {t('save')}
                            </button>
                        </div>
                        <canvas ref={cropCanvasRef} className="hidden" />
                    </div>
                </div>
            )}
        </div>
    );
};