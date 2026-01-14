
import React, { useState, useRef } from 'react';
import { useApp, THEMES } from '../context/AppContext';
import { ThemeColor, AppLanguage } from '../types';
import { 
    User, Palette, Moon, Globe, Trash2, Shield, Settings, 
    Check, Lock, X, Move, ZoomIn, Camera, ImageIcon,
    ShieldCheck, Loader2, Cloud, CloudOff, Link2, LogOut, ArrowRight,
    RefreshCw
} from 'lucide-react';
import { uploadImage } from '../services/storageService';
import { AuthModal } from '../components/AuthModal';

const LANGUAGES: AppLanguage[] = ['English', 'French', 'German', 'Ukrainian', 'Spanish'];
const AVATARS = ['🌱', '🌿', '🌳', '🚀', '🧠', '✨', '🧘', '🔥', '💎', '🌊', '☀️', '🌕'];

export const Profile: React.FC = () => {
    const { 
        name, avatar, theme, themeColor, language, themeClasses, 
        securitySettings, syncStatus, user,
        updateUserPreferences, deleteAccount, t, setPinCode, 
        syncWithCloud, signOut
    } = useApp();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cropCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState(name);
    const [showAuth, setShowAuth] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const [settingPin, setSettingPin] = useState(false);
    const [pinInput, setPinInput] = useState('');

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
                if (cloudUrl) {
                    updateUserPreferences({ avatar: cloudUrl });
                } else {
                    updateUserPreferences({ avatar: croppedDataUrl });
                }
            } else {
                updateUserPreferences({ avatar: croppedDataUrl });
            }

            setIsUploading(false);
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

    const isImageAvatar = avatar && (avatar.startsWith('data:image') || avatar.startsWith('http'));

    const renderToggle = (active: boolean, onToggle: () => void, label: string, icon?: React.ReactNode, subLabel?: string) => {
        return (
            <div className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-50">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {icon && <div className={`w-9 h-9 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-50 dark:border-slate-800 flex items-center justify-center shrink-0 ${active ? themeClasses.text : 'text-slate-300'}`}>{icon}</div>}
                    <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100 leading-none">
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

    return (
        <div className="pb-32 space-y-6 animate-in fade-in duration-500 max-w-md mx-auto">
            <header className="px-1 pt-2">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t('profile')}</h1>
            </header>

            {/* IDENTITY CARD */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-7">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <User size={14} className={`shrink-0 ${themeClasses.text}`} />
                        <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">
                            {t('identity')}
                        </h2>
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`${themeClasses.secondary} ${themeClasses.text} px-8 py-2.5 rounded-xl text-[8px] font-bold uppercase tracking-[0.2em] shadow-sm hover:opacity-80 transition-all flex items-center gap-3.5 border ${themeClasses.border} whitespace-nowrap shrink-0`}
                    >
                        <ImageIcon size={11} strokeWidth={2.5} className="shrink-0" /> {t('upload_photo')}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
                
                <div className="flex gap-6 items-center">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-4xl border border-slate-100 dark:border-slate-700 shadow-inner shrink-0 overflow-hidden relative group transition-transform active:scale-95"
                    >
                        {isImageAvatar ? (
                            <img src={avatar} className="w-full h-full object-cover" alt={name} />
                        ) : (
                            avatar
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera size={16} className="text-white" />
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
                            <div className="flex items-baseline gap-7 min-w-0">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">{name}</h3>
                                <button onClick={() => setEditingName(true)} className={`${themeClasses.text} text-[9px] font-bold uppercase tracking-widest hover:underline shrink-0`}>{t('edit')}</button>
                            </div>
                        )}
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] truncate">{t('growth_traveler')}</p>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('choose_avatar')}</p>
                    <div className="flex flex-wrap gap-3">
                        {AVATARS.map(av => (
                            <button 
                                key={av} 
                                onClick={() => updateUserPreferences({ avatar: av })}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${avatar === av ? `bg-white dark:bg-slate-800 scale-105 shadow-md ring-2 ${themeClasses.ring} ring-offset-2 dark:ring-offset-slate-900` : `bg-slate-50 dark:bg-slate-800/40 opacity-50 hover:opacity-100 border border-slate-100 dark:border-slate-800`}`}
                            >
                                {av}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* GROWTH VAULT CARD */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-48 h-48 ${themeClasses.primary} opacity-5 rounded-full blur-[80px] -mr-24 -mt-24 transition-transform duration-1000 group-hover:scale-110`} />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center ${syncStatus?.status === 'pending' ? 'animate-pulse' : ''}`}>
                                {user ? <Cloud size={24} className="text-emerald-500" /> : <CloudOff size={24} className="text-slate-300" />}
                            </div>
                            <div>
                                <h2 className="text-[12px] font-bold uppercase text-slate-800 dark:text-white tracking-[0.2em]">Growth Vault</h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    {user ? 'Secured & Synchronized' : 'Offline Persistence Only'}
                                </p>
                            </div>
                        </div>
                        {user && (
                            <button 
                                onClick={syncWithCloud}
                                disabled={syncStatus?.status === 'pending'}
                                className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                            >
                                <RefreshCw size={18} className={syncStatus?.status === 'pending' ? 'animate-spin' : ''} />
                            </button>
                        )}
                    </div>

                    {!user ? (
                        <div className="space-y-6">
                            <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-[1.75rem] p-5 border border-slate-100 dark:border-slate-800">
                                <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Your personal evolution is currently <span className="text-emerald-500 font-bold">local-only</span>. Establish a secure vault to synchronize your journey across all devices.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowAuth(true)}
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-[1.75rem] text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Link2 size={14} /> Claim Your Identity <ArrowRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-[1.75rem] p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">Vault Owner</span>
                                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 truncate">{user.email}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={signOut}
                                    className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shrink-0 ml-2 shadow-sm border border-slate-100 dark:border-slate-700"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                            {syncStatus?.lastSync && (
                                <div className="flex justify-center">
                                    <span className="text-[8px] font-bold uppercase text-slate-300 tracking-[0.3em]">
                                        Integrity Verified: {new Date(syncStatus.lastSync).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* SETTINGS CARD */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-7">
                <div className="flex items-center gap-2">
                    <Settings size={14} className={`shrink-0 ${themeClasses.text}`} />
                    <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">{t('settings')}</h2>
                </div>

                <div className="space-y-7">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 ml-1">
                            <Globe size={12} className="shrink-0" />
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{t('language')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {LANGUAGES.map(lang => (
                                <button 
                                    key={lang} 
                                    onClick={() => updateUserPreferences({ language: lang })} 
                                    className={`px-3 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${language === lang ? `${themeClasses.primary} text-white border-transparent shadow-sm` : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500'} whitespace-normal break-words overflow-hidden`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-50 dark:border-slate-800/50 pt-6">
                        {renderToggle(
                            theme === 'dark',
                            () => updateUserPreferences({ theme: theme === 'dark' ? 'light' : 'dark' }),
                            t('dark_mode'),
                            <Moon size={16} />
                        )}
                    </div>

                    <div className="space-y-5 pt-1">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 ml-1">
                            <Palette size={16} className="shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t('accent_palette')}</span>
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
                                        <div className={`w-11 h-11 rounded-full ${themeItem.primary} transition-all duration-300 relative flex items-center justify-center shadow-sm active:scale-90
                                            ${isSelected ? `ring-2 ring-offset-2 dark:ring-offset-slate-900 ${themeItem.ring}` : 'hover:scale-110'}
                                        `}>
                                            {isSelected && <Check size={18} className="text-white" strokeWidth={5} />}
                                        </div>
                                        <span className={`text-[10px] font-bold leading-tight text-center truncate w-full mt-1.5 ${isSelected ? themeClasses.text : 'text-slate-400 opacity-60'}`}>
                                            {t(themeItem.name)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* PRIVACY & SAFETY CARD */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-7">
                <div className="flex items-center gap-2 min-w-0">
                    <Shield size={14} className={`shrink-0 ${themeClasses.text}`} />
                    <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">Privacy & Safety</h2>
                </div>

                <div className="flex flex-col p-6 bg-slate-50/60 dark:bg-slate-800/30 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-sm gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <Lock size={15} className="text-slate-800 dark:text-slate-100 shrink-0 opacity-80"/>
                                <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-none">{t('app_lock')}</span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest break-words leading-tight opacity-70">
                                Require code to access journal
                            </p>
                        </div>
                        {settingPin ? (
                            <div className="flex items-center gap-2 shrink-0">
                                <input type="password" maxLength={4} value={pinInput} onChange={e => setPinInput(e.target.value)} className={`w-14 px-1 py-2.5 rounded-xl border dark:bg-slate-800 dark:border-slate-700 text-center dark:text-white text-xs font-bold shadow-inner ${themeClasses.border}`} placeholder="----" />
                                <button onClick={() => { if(pinInput.length === 4) { setPinCode(pinInput); setSettingPin(false); setPinInput(''); } }} className={`${themeClasses.primary} text-white p-2.5 rounded-xl shadow-lg active:scale-90 transition-transform`}><Check size={16} strokeWidth={4}/></button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => securitySettings.pinCode ? setPinCode(null) : setSettingPin(true)} 
                                className={`text-[9px] font-bold uppercase tracking-widest px-4.5 py-3 rounded-xl transition-all shadow-sm whitespace-nowrap shrink-0 ${securitySettings.pinCode ? 'bg-rose-50 text-rose-500 border border-rose-100' : `${themeClasses.secondary} ${themeClasses.text} border ${themeClasses.border}`}`}
                            >
                                {securitySettings.pinCode ? t('disable') : t('set_pin')}
                            </button>
                        )}
                    </div>
                </div>

                <button onClick={() => { if(confirm(t('delete_account_confirm'))) deleteAccount(); }} className="w-full py-5 text-rose-500 font-bold text-[10px] uppercase tracking-[0.25em] bg-rose-50/40 dark:bg-rose-950/10 rounded-[1.75rem] flex items-center justify-center gap-3 border border-rose-100 dark:border-rose-900/20 hover:bg-rose-50 transition-colors shadow-sm">
                    <Trash2 size={16} className="shrink-0" /> <span className="truncate">{t('delete_account')}</span>
                </button>
            </div>

            {/* MODALS */}
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
            
            {showCropModal && selectedImgSrc && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-[280px] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="min-w-0">
                                <h3 className="font-bold text-slate-800 dark:text-slate-50 text-xl tracking-tight truncate">{t('adjust_photo')}</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">{t('resize_identity')}</p>
                            </div>
                            <button onClick={() => {setShowCropModal(false); setSelectedImgSrc(null);}} className="text-slate-300 hover:text-slate-500 transition-colors p-2 bg-slate-50 dark:bg-slate-800 rounded-full shadow-sm shrink-0 ml-4"><X size={18}/></button>
                        </div>

                        <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 shadow-inner group">
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
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 text-white/60">
                                <Move size={12}/> <span className="text-[9px] font-bold uppercase tracking-widest">{t('drag_move')}</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8 px-1">
                            <div className="flex justify-between items-center text-slate-400 dark:text-slate-50">
                                <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><ZoomIn size={12}/> {t('zoom_label')}</span>
                                <span className="text-[10px] font-bold">{(zoom * 100).toFixed(0)}%</span>
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
                                className="py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 transition-all active:scale-95 border border-slate-100 dark:border-slate-800 shadow-sm truncate"
                            >
                                {t('back')}
                            </button>
                            <button 
                                onClick={handleSaveCroppedImage}
                                disabled={isUploading}
                                className={`py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white bg-gradient-to-br ${themeClasses.gradient} shadow-lg active:scale-95 transition-all truncate flex items-center justify-center gap-2`}
                            >
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
