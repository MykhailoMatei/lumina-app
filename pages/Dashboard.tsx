
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
    Check, Flame, Sun, Moon, Clock, Sparkles, Trophy, 
    ChevronDown, ChevronUp, Zap, Star, Plus, X, Link, ArrowRight, Loader2, Coffee, Sunset, Target, Play, Pencil, Trash2
} from 'lucide-react';
import { generateDailyBriefing, suggestAtomicHabit } from '../services/geminiService';
import { Habit } from '../types';

export const Dashboard: React.FC<{ setView: (v: string) => void }> = ({ setView }) => {
    const { 
        name, avatar, goals, habits, journalEntries, toggleHabitCompletion, addHabit, updateHabit, deleteHabit,
        themeClasses, language, t, dailyBriefing, lastBriefingUpdate, 
        updateUserPreferences 
    } = useApp();
    
    const [isBriefingExpanded, setIsBriefingExpanded] = useState(false);
    const [showHabitModal, setShowHabitModal] = useState(false);
    const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

    // Habit Navigator State
    const currentHour = new Date().getHours();
    const initialTab = useMemo(() => {
        if (currentHour >= 5 && currentHour < 12) return 'Morning';
        if (currentHour >= 12 && currentHour < 17) return 'Afternoon';
        if (currentHour >= 17 && currentHour < 22) return 'Evening';
        return 'Anytime';
    }, [currentHour]);
    
    const [activeHabitTab, setActiveHabitTab] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Anytime'>(initialTab);

    // New Habit Form State
    const [habitTitle, setHabitTitle] = useState('');
    const [habitTrigger, setHabitTrigger] = useState('');
    const [habitDuration, setHabitDuration] = useState('5m');
    const [habitTime, setHabitTime] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Anytime'>(initialTab);
    const [linkedGoalId, setLinkedGoalId] = useState('');
    const [isAtomizing, setIsAtomizing] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    // Execution Logic: Find the single most important next step
    const nextAction = useMemo(() => {
        const pendingHabits = habits.filter(h => !h.completedDates.includes(today));
        if (pendingHabits.length === 0) return null;
        
        // Priority 1: Match current time tab
        const currentPhaseHabits = pendingHabits.filter(h => h.timeOfDay === initialTab);
        if (currentPhaseHabits.length > 0) return currentPhaseHabits[0];
        
        // Priority 2: "Anytime" habits
        const anytimeHabits = pendingHabits.filter(h => h.timeOfDay === 'Anytime');
        if (anytimeHabits.length > 0) return anytimeHabits[0];

        return pendingHabits[0];
    }, [habits, today, initialTab]);

    const circadian = useMemo(() => {
        if (currentHour >= 5 && currentHour < 11) return { state: 'Morning', gradient: 'from-amber-200 to-indigo-500', icon: <Sun className="animate-pulse" /> };
        if (currentHour >= 11 && currentHour < 17) return { state: 'Day', gradient: 'from-blue-400 to-indigo-600', icon: <Clock /> };
        if (currentHour >= 17 && currentHour < 21) return { state: 'Evening', gradient: 'from-orange-400 to-rose-600', icon: <Moon /> };
        return { state: 'Night', gradient: 'from-slate-800 to-indigo-950', icon: <Moon /> };
    }, [currentHour]);

    useEffect(() => {
        const fetchBriefing = async () => {
            const now = Date.now();
            const fiveAM = new Date(); fiveAM.setHours(5,0,0,0);
            if (new Date() < fiveAM) fiveAM.setDate(fiveAM.getDate() - 1);
            
            if (!dailyBriefing || (lastBriefingUpdate || 0) < fiveAM.getTime()) {
                const briefing = await generateDailyBriefing(name, goals, habits, journalEntries, language);
                updateUserPreferences({ dailyBriefing: briefing, lastBriefingUpdate: now });
            }
        };
        fetchBriefing();
    }, [language, goals.length, habits.length]);

    const handleAtomize = async () => {
        if (!habitTitle.trim()) return;
        setIsAtomizing(true);
        const { suggestion } = await suggestAtomicHabit(habitTitle, language);
        setHabitTitle(suggestion);
        setIsAtomizing(false);
    };

    const resetHabitForm = () => {
        setHabitTitle('');
        setHabitTrigger('');
        setHabitDuration('5m');
        setHabitTime(initialTab);
        setLinkedGoalId('');
        setEditingHabitId(null);
        setShowHabitModal(false);
    };

    const handleEditHabit = (h: Habit) => {
        setEditingHabitId(h.id);
        setHabitTitle(h.title);
        setHabitTrigger(h.trigger || '');
        setHabitDuration(h.duration || '5m');
        setHabitTime(h.timeOfDay);
        setLinkedGoalId(h.linkedGoalId || '');
        setShowHabitModal(true);
    };

    const handleSaveHabit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!habitTitle.trim()) return;
        
        if (editingHabitId) {
            updateHabit(editingHabitId, {
                title: habitTitle,
                trigger: habitTrigger,
                duration: habitDuration,
                timeOfDay: habitTime,
                linkedGoalId: linkedGoalId || undefined
            });
        } else {
            addHabit({
                id: Date.now().toString(),
                title: habitTitle,
                trigger: habitTrigger,
                duration: habitDuration,
                timeOfDay: habitTime,
                linkedGoalId: linkedGoalId || undefined,
                streak: 0,
                completedDates: []
            });
        }

        resetHabitForm();
    };

    const handleDeleteHabit = () => {
        if (editingHabitId) {
            deleteHabit(editingHabitId);
            resetHabitForm();
        }
    };

    const filteredHabits = habits.filter(h => h.timeOfDay === activeHabitTab);
    const progress = habits.length > 0 ? Math.round((habits.filter(h => h.completedDates.includes(today)).length / habits.length) * 100) : 0;

    const getTabStats = (time: string) => {
        const set = habits.filter(h => h.timeOfDay === time);
        const done = set.filter(h => h.completedDates.includes(today)).length;
        return { count: set.length, done };
    };

    return (
        <div className="pb-32 space-y-6 animate-in fade-in duration-700">
            {/* MOMENTUM HUB HEADER */}
            <div className={`-mx-6 -mt-6 p-8 pt-16 rounded-b-[3.5rem] bg-gradient-to-br ${circadian.gradient} shadow-2xl relative transition-all duration-1000`}>
                <div className="absolute top-4 right-6 opacity-30">{circadian.icon}</div>
                
                {/* REFINED PROFILE BUTTON SIZE */}
                <button 
                    onClick={() => setView('profile')} 
                    className="absolute top-14 right-6 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl shadow-lg hover:scale-105 active:scale-95 transition-all overflow-hidden z-20 group"
                    aria-label="Profile"
                >
                    <div className="w-full h-full flex items-center justify-center transition-transform group-active:scale-95">
                        {avatar && avatar.startsWith('data') ? <img src={avatar} className="w-full h-full object-cover" /> : avatar || '🌱'}
                    </div>
                </button>

                <div className="space-y-4 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 text-white">Day Perspective</p>
                    <h1 className="text-3xl font-black text-white tracking-tighter pr-16">
                        {currentHour < 12 ? t('good_morning') : currentHour < 18 ? t('good_afternoon') : t('good_evening')}, {name.split(' ')[0]}
                    </h1>

                    {/* THE "NEXT MOVE" CTA: High Visibility Action Step */}
                    {nextAction ? (
                        <button 
                            onClick={() => toggleHabitCompletion(nextAction.id, today)}
                            className="w-full bg-white text-slate-900 rounded-[2rem] p-4 flex items-center justify-between shadow-2xl active:scale-[0.97] transition-all group overflow-hidden"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`${themeClasses.primary} p-2 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                                    <Play size={16} fill="currentColor" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.15em]">Next Move</p>
                                    <h4 className="text-sm font-black truncate max-w-[180px]">
                                        {nextAction.title} <span className="opacity-40 ml-1 text-[10px]">({nextAction.duration || '5m'})</span>
                                    </h4>
                                </div>
                            </div>
                            <ArrowRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <div className="w-full bg-white/10 backdrop-blur-md rounded-[2rem] p-4 flex items-center justify-center text-white/80 border border-white/10">
                            <Check className="mr-2" size={16} strokeWidth={3} />
                            <span className="text-xs font-black uppercase tracking-widest">Rituals Complete</span>
                        </div>
                    )}
                    
                    {dailyBriefing && (
                        <div onClick={() => setIsBriefingExpanded(!isBriefingExpanded)} className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 cursor-pointer hover:bg-white/15 transition-all">
                            <div className="flex justify-between items-center opacity-80 mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2"><Sparkles size={12} /> {t('daily_wisdom')}</span>
                                {isBriefingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                            <p className={`text-white font-bold text-sm italic leading-snug ${isBriefingExpanded ? '' : 'line-clamp-1'}`}>"{dailyBriefing.motivation}"</p>
                            {isBriefingExpanded && (
                                <div className="grid grid-cols-2 gap-3 mt-4 animate-in zoom-in-95">
                                    <div className="bg-black/10 rounded-2xl p-3 border border-white/5">
                                        <h3 className="text-[8px] font-black uppercase opacity-60 text-white mb-1">Focus</h3>
                                        <p className="text-xs font-bold text-white">{dailyBriefing.focus}</p>
                                    </div>
                                    <div className="bg-black/10 rounded-2xl p-3 border border-white/5">
                                        <h3 className="text-[8px] font-black uppercase opacity-60 text-white mb-1">Action</h3>
                                        <p className="text-xs font-bold text-white">{dailyBriefing.tip}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* KEYSTONE TASK */}
            {dailyBriefing?.priorityTask && (
                <div className={`bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 ${themeClasses.border} shadow-lg animate-in slide-in-from-bottom-4 duration-500`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-full ${themeClasses.primary} flex items-center justify-center text-white shadow-lg`}><Zap size={16} /></div>
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('keystone')}</h2>
                    </div>
                    {/* Balanced text size and weight */}
                    <p className="text-[15px] font-bold text-slate-700 dark:text-slate-200 leading-snug mb-4">{dailyBriefing.priorityTask}</p>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${themeClasses.primary} transition-all duration-1000`} style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* RITUAL NAVIGATOR */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ritual Stacks</h3>
                    <button onClick={() => { setEditingHabitId(null); setShowHabitModal(true); }} className={`${themeClasses.text} p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors`}>
                        <Plus size={18} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                    {(['Morning', 'Afternoon', 'Evening', 'Anytime'] as const).map(time => {
                        const stats = getTabStats(time);
                        const isActive = activeHabitTab === time;
                        const isCurrentTime = initialTab === time;
                        
                        return (
                            <button
                                key={time}
                                onClick={() => setActiveHabitTab(time)}
                                className={`flex flex-col min-w-[95px] p-4 rounded-[1.75rem] border-2 transition-all relative ${
                                    isActive 
                                    ? `${themeClasses.secondary} ${themeClasses.border} shadow-indigo-100/50 dark:shadow-none shadow-lg` 
                                    : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800/50 opacity-60'
                                }`}
                            >
                                {isCurrentTime && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)] z-10" />
                                )}
                                <div className="flex justify-between items-center mb-1">
                                    {time === 'Morning' && <Coffee size={12} className={isActive ? themeClasses.text : 'text-slate-400'} />}
                                    {time === 'Afternoon' && <Sun size={12} className={isActive ? themeClasses.text : 'text-slate-400'} />}
                                    {time === 'Evening' && <Sunset size={12} className={isActive ? themeClasses.text : 'text-slate-400'} />}
                                    {time === 'Anytime' && <Zap size={12} className={isActive ? themeClasses.text : 'text-slate-400'} />}
                                    <span className="text-[8px] font-black text-slate-400">{stats.done}/{stats.count}</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-tight text-left ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{time}</span>
                            </button>
                        );
                    })}
                </div>
                
                <div className="space-y-3 min-h-[150px]">
                    {filteredHabits.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                            <Plus size={24} className="opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No {activeHabitTab} Rituals</p>
                            <button onClick={() => { setEditingHabitId(null); setHabitTime(activeHabitTab); setShowHabitModal(true); }} className={`text-[9px] font-black uppercase tracking-widest ${themeClasses.text}`}>Add One Now</button>
                        </div>
                    ) : (
                        filteredHabits.sort((a, b) => {
                            const aDone = a.completedDates.includes(today);
                            const bDone = b.completedDates.includes(today);
                            if (aDone && !bDone) return 1;
                            if (!aDone && bDone) return -1;
                            return 0;
                        }).map(h => {
                            const linkedGoal = goals.find(g => g.id === h.linkedGoalId);
                            const isDone = h.completedDates.includes(today);
                            return (
                                <div key={h.id} className={`bg-white dark:bg-slate-900 p-4 rounded-[2rem] border transition-all flex items-center shadow-sm group ${isDone ? 'opacity-40 border-transparent bg-slate-50/30 dark:bg-slate-800/20 scale-[0.98]' : 'border-slate-100 dark:border-slate-800 hover:shadow-md'}`}>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className={`font-black text-sm leading-tight ${isDone ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>{h.title}</h4>
                                            {h.duration && <span className="text-[9px] font-bold text-slate-400">({h.duration})</span>}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleEditHabit(h); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-slate-500 transition-all ml-1"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <Flame size={10} className={isDone ? 'text-slate-300' : 'text-orange-500'} />
                                                <span className={`text-[9px] font-black ${isDone ? 'text-slate-300' : 'text-orange-500'}`}>{h.streak}d</span>
                                            </div>
                                            {linkedGoal && !isDone && (
                                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${themeClasses.secondary} border ${themeClasses.border}`}>
                                                    <Target size={9} className={themeClasses.text} />
                                                    <span className={`text-[8px] font-black uppercase tracking-tighter ${themeClasses.text}`}>{linkedGoal.title}</span>
                                                </div>
                                            )}
                                        </div>
                                        {h.trigger && !isDone && (
                                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-300 block mt-1">
                                                Trigger: After {h.trigger}
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => toggleHabitCompletion(h.id, today)}
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 ml-4 ${isDone ? `${themeClasses.primary} text-white shadow-lg` : 'bg-slate-50 dark:bg-slate-800 text-slate-300 border border-slate-100 dark:border-slate-700'}`}
                                    >
                                        <Check size={20} strokeWidth={4} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* HUMANIZED METRICS OVERVIEW */}
            <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setView('insights')} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer active:scale-95 transition-all flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className={`w-8 h-8 rounded-xl ${themeClasses.secondary} ${themeClasses.text} flex items-center justify-center`}>
                            <Star size={16} fill="currentColor" />
                        </div>
                        <span className={`text-[11px] font-black ${themeClasses.text}`}>{progress}%</span>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase text-slate-800 dark:text-white mb-1">{t('habit_rate')}</h3>
                        <p className="text-[9px] font-medium text-slate-400 leading-tight">{t('routine_desc')}</p>
                    </div>
                </div>
                <div onClick={() => setView('goals')} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer active:scale-95 transition-all flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className={`w-8 h-8 rounded-xl ${themeClasses.secondary} ${themeClasses.text} flex items-center justify-center`}>
                            <Trophy size={16} />
                        </div>
                        <span className={`text-[11px] font-black ${themeClasses.text}`}>{goals.length}</span>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase text-slate-800 dark:text-white mb-1">{t('goals')}</h3>
                        <p className="text-[9px] font-medium text-slate-400 leading-tight">{t('momentum_desc')}</p>
                    </div>
                </div>
            </div>

            {/* CREATE/EDIT HABIT MODAL */}
            {showHabitModal && (
                <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[85vh]">
                        <button onClick={resetHabitForm} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition-colors">
                            <X size={20}/>
                        </button>
                        
                        <form onSubmit={handleSaveHabit} className="space-y-8 flex-1 overflow-y-auto no-scrollbar pr-1 pb-4">
                            <div className="text-center">
                                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                                    {editingHabitId ? 'Edit Ritual' : 'New Ritual'}
                                </h2>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Define Your Daily Discipline</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest shrink-0">After I</span>
                                        <input 
                                            value={habitTrigger}
                                            onChange={e => setHabitTrigger(e.target.value)}
                                            placeholder="pour my coffee..."
                                            className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500/10 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ArrowRight className="text-slate-200 shrink-0" size={16} />
                                        <div className="w-full relative">
                                            <input 
                                                required 
                                                value={habitTitle} 
                                                onChange={e => setHabitTitle(e.target.value)} 
                                                className={`w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500/10 dark:text-white pr-10`} 
                                                placeholder="I will meditate..." 
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleAtomize}
                                                disabled={!habitTitle || isAtomizing}
                                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg ${themeClasses.secondary} ${themeClasses.text} hover:opacity-80 transition-all disabled:opacity-30`}
                                            >
                                                {isAtomizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="text-slate-200 shrink-0" size={16} />
                                        <input 
                                            value={habitDuration}
                                            onChange={e => setHabitDuration(e.target.value)}
                                            placeholder="Duration (e.g. 5m, 1h)"
                                            className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500/10 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest ml-1">Connect to Strategy</label>
                                    <select 
                                        value={linkedGoalId}
                                        onChange={e => setLinkedGoalId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-4 text-xs font-bold dark:text-white outline-none"
                                    >
                                        <option value="">(Optional) No linked goal</option>
                                        {goals.filter(g => !g.completed).map(g => (
                                            <option key={g.id} value={g.id}>{g.title}</option>
                                        ))}
                                    </select>
                                    
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2">
                                        {(['Morning', 'Afternoon', 'Evening', 'Anytime'] as const).map(time => (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => setHabitTime(time)}
                                                className={`flex-1 py-2 px-3 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${habitTime === time ? `${themeClasses.primary} text-white border-transparent shadow-md` : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4">
                                <button 
                                    type="submit" 
                                    disabled={!habitTitle.trim()}
                                    className={`w-full bg-gradient-to-br ${themeClasses.gradient} text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50`}
                                >
                                    {editingHabitId ? 'Update Ritual' : 'Deploy Ritual'}
                                </button>
                                
                                {editingHabitId && (
                                    <button 
                                        type="button"
                                        onClick={handleDeleteHabit}
                                        className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-500 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Trash2 size={14} /> Delete Ritual
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
