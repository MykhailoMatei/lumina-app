
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
    Check, Sun, Moon, Clock, Sparkles, Trophy, 
    ChevronDown, ChevronUp, Zap, Star, Plus, X, ArrowRight, Loader2, Coffee, Sunset, Target, Play, Pencil, Trash2, RefreshCw, Flame, Cloud, CloudOff, History, Calendar
} from 'lucide-react';
import { generateDailyBriefing, suggestAtomicHabit } from '../services/geminiService';
import { Habit } from '../types';

interface DashboardProps {
    setView: (view: string) => void;
}

interface MomentumDay {
    full: string;
    dayNum: number;
    dayName: string;
    isToday: boolean;
    dayOfWeek: number;
}

const getTodayString = () => new Date().toISOString().split('T')[0];
const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
    const { 
        name, avatar, goals, habits, journalEntries, toggleHabitCompletion, addHabit, updateHabit, deleteHabit,
        themeClasses, language, t, dailyBriefing, lastBriefingUpdate, 
        updateUserPreferences, circadian, syncStatus, user
    } = useApp();
    
    // Reactive Today State: Handles date turnover while app is in memory
    const [currentTodayStr, setCurrentTodayStr] = useState(getTodayString());
    const [selectedDate, setSelectedDate] = useState(currentTodayStr);
    
    const [isMomentumOpen, setIsMomentumOpen] = useState(false);
    const [isBriefingExpanded, setIsBriefingExpanded] = useState(false);
    const [showHabitModal, setShowHabitModal] = useState(false);
    const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Heartbeat to detect midnight turnover
    useEffect(() => {
        const interval = setInterval(() => {
            const freshToday = getTodayString();
            if (freshToday !== currentTodayStr) {
                console.log("Date turnover detected. Refreshing momentum ribbon...");
                setCurrentTodayStr(freshToday);
                // Optionally move user to the new 'Today' if they were looking at the old 'Today'
                if (selectedDate === currentTodayStr) {
                    setSelectedDate(freshToday);
                }
            }
        }, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [currentTodayStr, selectedDate]);

    // Generate last 7 days for the Momentum Ribbon
    const momentumDays = useMemo(() => {
        const days: MomentumDay[] = [];
        const baseDate = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(baseDate);
            d.setDate(baseDate.getDate() - i);
            const iso = d.toISOString().split('T')[0];
            days.push({
                full: iso,
                dayNum: d.getDate(),
                dayName: d.toLocaleDateString(undefined, { weekday: 'short' }).charAt(0),
                isToday: iso === currentTodayStr,
                dayOfWeek: d.getDay()
            });
        }
        return days;
    }, [currentTodayStr]);

    const currentHour = new Date().getHours();
    const initialTab = useMemo(() => {
        if (currentHour >= 5 && currentHour < 12) return 'Morning';
        if (currentHour >= 12 && currentHour < 17) return 'Afternoon';
        if (currentHour >= 17 && currentHour < 22) return 'Evening';
        return 'Anytime';
    }, [currentHour]);
    
    const [activeHabitTab, setActiveHabitTab] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Anytime'>(initialTab);

    // Habit Form State
    const [habitTitle, setHabitTitle] = useState('');
    const [habitTrigger, setHabitTrigger] = useState('');
    const [habitDuration, setHabitDuration] = useState('5m');
    const [habitTime, setHabitTime] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Anytime'>(initialTab);
    const [linkedGoalId, setLinkedGoalId] = useState('');
    const [isAtomizing, setIsAtomizing] = useState(false);
    const [habitDays, setHabitDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

    /**
     * HISTORICAL & RECURRENCE FILTERING LOGIC
     * 1. Check if habit was created on/before selectedDate
     * 2. Check if selectedDate's day of week is in h.daysOfWeek
     */
    const getHabitsForSelectedDate = useCallback(() => {
        const d = new Date(selectedDate);
        const dayOfWeek = d.getDay();
        
        return habits.filter(h => {
            const createdDateStr = h.createdAt.split('T')[0];
            const isHistoricalValid = createdDateStr <= selectedDate;
            const isScheduledForDay = h.daysOfWeek.includes(dayOfWeek);
            return isHistoricalValid && isScheduledForDay;
        });
    }, [habits, selectedDate]);

    const habitsForDay = useMemo(() => getHabitsForSelectedDate(), [getHabitsForSelectedDate]);

    const nextAction = useMemo(() => {
        const pendingHabits = habitsForDay.filter(h => !h.completedDates.includes(selectedDate));
        if (pendingHabits.length === 0) return null;
        const currentPhaseHabits = pendingHabits.filter(h => h.timeOfDay === initialTab);
        if (currentPhaseHabits.length > 0) return currentPhaseHabits[0];
        const anytimeHabits = pendingHabits.filter(h => h.timeOfDay === 'Anytime');
        if (anytimeHabits.length > 0) return anytimeHabits[0];
        return pendingHabits[0];
    }, [habitsForDay, selectedDate, initialTab]);

    const phaseIcon = useMemo(() => {
        switch(circadian.state) {
            case 'Morning': return <Sun className="animate-pulse" size={24} />;
            case 'Day': return <Clock size={24} />;
            case 'Evening': return <Sunset size={24} />;
            default: return <Moon size={24} />;
        }
    }, [circadian.state]);

    const fetchBriefing = async () => {
        setIsRefreshing(true);
        try {
            const briefing = await generateDailyBriefing(name, goals, habits, journalEntries, language);
            updateUserPreferences({ dailyBriefing: briefing, lastBriefingUpdate: Date.now() });
        } catch (error) {
            console.error("Dashboard briefing update failed", error);
        } finally {
            setTimeout(() => setIsRefreshing(false), 1000);
        }
    };

    useEffect(() => {
        const checkBriefingStaleness = () => {
            const lastUpdate = lastBriefingUpdate ? new Date(lastBriefingUpdate) : null;
            const lastUpdateDateStr = lastUpdate ? lastUpdate.toISOString().split('T')[0] : null;
            if (lastUpdateDateStr !== currentTodayStr) {
                fetchBriefing();
            }
        };
        checkBriefingStaleness();
    }, [currentTodayStr, language]);

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
        setHabitDays([0, 1, 2, 3, 4, 5, 6]);
        setShowHabitModal(false);
    };

    const handleEditHabit = (h: Habit) => {
        setEditingHabitId(h.id);
        setHabitTitle(h.title);
        setHabitTrigger(h.trigger || '');
        setHabitDuration(h.duration || '5m');
        setHabitTime(h.timeOfDay);
        setLinkedGoalId(h.linkedGoalId || '');
        setHabitDays(h.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
        setShowHabitModal(true);
    };

    const handleSaveHabit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!habitTitle.trim()) return;
        if (habitDays.length === 0) {
            alert("Please select at least one day for this ritual.");
            return;
        }
        
        if (editingHabitId) {
            updateHabit(editingHabitId, {
                title: habitTitle,
                trigger: habitTrigger,
                duration: habitDuration,
                timeOfDay: habitTime,
                daysOfWeek: habitDays,
                linkedGoalId: linkedGoalId || undefined
            });
        } else {
            addHabit({
                id: Date.now().toString(),
                title: habitTitle,
                trigger: habitTrigger,
                duration: habitDuration,
                timeOfDay: habitTime,
                daysOfWeek: habitDays,
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

    const filteredHabits = habitsForDay.filter(h => h.timeOfDay === activeHabitTab);
    const progress = habitsForDay.length > 0 ? Math.round((habitsForDay.filter(h => h.completedDates.includes(selectedDate)).length / habitsForDay.length) * 100) : 0;

    const getTabStats = (time: string) => {
        const set = habitsForDay.filter(h => h.timeOfDay === time);
        const done = set.filter(h => h.completedDates.includes(selectedDate)).length;
        return { count: set.length, done };
    };

    const toggleDay = (dayNum: number) => {
        setHabitDays(prev => 
            prev.includes(dayNum) 
                ? prev.filter(d => d !== dayNum) 
                : [...prev, dayNum].sort()
        );
    };

    return (
        <>
            <div className="pb-32 space-y-6 animate-in fade-in duration-700">
                {/* MOMENTUM HUB HEADER */}
                <div className={`-mx-6 -mt-20 p-8 pt-28 rounded-b-[3.5rem] bg-gradient-to-br ${circadian.headerGradient} relative transition-all duration-1000 shadow-xl overflow-hidden`}>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute top-4 right-6 opacity-20 text-white">{phaseIcon}</div>
                    
                    {user && (
                        <div className="absolute top-24 left-8 flex items-center gap-2 px-2 py-1 rounded-full bg-black/10 backdrop-blur-sm border border-white/5 transition-opacity duration-500">
                            {syncStatus?.status === 'pending' ? (
                                <Loader2 size={10} className="animate-spin text-white/40" />
                            ) : syncStatus?.status === 'error' ? (
                                <CloudOff size={10} className="text-rose-400" />
                            ) : (
                                <Cloud size={10} className="text-emerald-400" />
                            )}
                            <span className="text-[7px] font-black uppercase tracking-widest text-white/30">
                                {syncStatus?.status === 'pending' ? 'Syncing' : 'Secured'}
                            </span>
                        </div>
                    )}

                    <button 
                        onClick={() => setView('profile')} 
                        className="absolute top-24 right-6 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-lg hover:scale-105 active:scale-95 transition-all overflow-hidden z-20 group"
                        aria-label="Profile"
                    >
                        <div className="w-full h-full flex items-center justify-center transition-transform group-active:scale-95">
                            {avatar && avatar.startsWith('data') ? <img src={avatar} className="w-full h-full object-cover" /> : avatar || '🌱'}
                        </div>
                    </button>

                    <div className="space-y-4 relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 text-white">{circadian.label}</p>
                        <h1 className="text-3xl font-black text-white tracking-tighter pr-16">
                            {currentHour < 12 ? t('good_morning') : currentHour < 18 ? t('good_afternoon') : t('good_evening')}, {name.split(' ')[0]}
                        </h1>

                        {nextAction ? (
                            <button 
                                onClick={() => toggleHabitCompletion(nextAction.id, selectedDate)}
                                className={`w-full ${circadian.buttonStyle} rounded-[2rem] p-4 flex items-center justify-between active:scale-[0.97] transition-all group overflow-hidden border border-white/10`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${circadian.iconContrast ? themeClasses.secondary + ' ' + themeClasses.text : 'bg-white/10 text-white'}`}>
                                        <Play size={16} fill="currentColor" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[8px] font-black uppercase tracking-[0.15em] opacity-40">
                                            {selectedDate === currentTodayStr ? 'START ROUTINE' : 'BACKDATE COMPLETION'}
                                        </p>
                                        <h4 className="text-sm font-black truncate max-w-[180px]">
                                            {nextAction.title} <span className="opacity-40 ml-1 text-[10px]">({nextAction.duration || '5m'})</span>
                                        </h4>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <div className="w-full bg-white/5 backdrop-blur-md rounded-[2rem] p-4 flex items-center justify-center text-white/50 border border-white/5">
                                <Check className="mr-2" size={16} strokeWidth={3} />
                                <span className="text-xs font-black uppercase tracking-widest">Rituals Complete</span>
                            </div>
                        )}
                        
                        {dailyBriefing && (
                            <div onClick={() => setIsBriefingExpanded(!isBriefingExpanded)} className="bg-black/20 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-5 cursor-pointer hover:bg-black/30 transition-all group/briefing shadow-inner">
                                <div className="flex justify-between items-center opacity-60 mb-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                                        <Sparkles size={12} className={isRefreshing ? 'animate-spin' : ''} /> {t('daily_wisdom')}
                                    </span>
                                    <div className="flex items-center gap-3 text-white">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); fetchBriefing(); }}
                                            className={`p-1 hover:bg-white/20 rounded-full transition-all ${isRefreshing ? 'opacity-40' : ''}`}
                                            disabled={isRefreshing}
                                        >
                                            <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-emerald-400' : ''} />
                                        </button>
                                        {isBriefingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </div>
                                </div>
                                <div className="relative">
                                    <p className={`text-white/90 font-bold text-sm italic leading-snug transition-opacity duration-300 ${isRefreshing ? 'opacity-30' : 'opacity-100'} ${isBriefingExpanded ? '' : 'line-clamp-1'}`}>
                                        "{dailyBriefing.motivation}"
                                    </p>
                                </div>
                                {isBriefingExpanded && (
                                    <div className="grid grid-cols-2 gap-3 mt-4 animate-in zoom-in-95">
                                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                            <h3 className="text-[8px] font-black uppercase opacity-40 text-white mb-1">Focus</h3>
                                            <p className="text-xs font-bold text-white/90">{dailyBriefing.focus}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                            <h3 className="text-[8px] font-black uppercase opacity-40 text-white mb-1">Action</h3>
                                            <p className="text-xs font-bold text-white/90">{dailyBriefing.tip}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* KEYSTONE TASK */}
                {dailyBriefing?.priorityTask && (
                    <div className={`bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 ${themeClasses.border} animate-in slide-in-from-bottom-4 duration-500 group/keystone relative overflow-hidden shadow-sm`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full ${themeClasses.primary} flex items-center justify-center text-white shadow-lg`}><Zap size={16} /></div>
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('keystone')}</h2>
                            </div>
                            <span className="text-[8px] font-bold text-slate-300 uppercase">
                                {new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <p className={`text-[15px] font-bold text-slate-700 dark:text-slate-200 leading-snug mb-4 transition-opacity ${isRefreshing ? 'opacity-30' : 'opacity-100'}`}>
                            {dailyBriefing.priorityTask}
                        </p>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${themeClasses.primary} transition-all duration-1000`} style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                {/* RITUAL NAVIGATOR SECTION */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ritual Stacks</h3>
                            <button 
                                onClick={() => setIsMomentumOpen(!isMomentumOpen)} 
                                className={`p-1.5 rounded-lg transition-all ${isMomentumOpen ? themeClasses.secondary + ' ' + themeClasses.text : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <History size={14} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedDate !== currentTodayStr && isMomentumOpen && (
                                <button 
                                    onClick={() => setSelectedDate(currentTodayStr)} 
                                    className={`text-[8px] font-black uppercase tracking-[0.2em] ${themeClasses.text} animate-in fade-in slide-in-from-right-2`}
                                >
                                    Return Today
                                </button>
                            )}
                            <button onClick={() => { setEditingHabitId(null); setShowHabitModal(true); }} className={`${themeClasses.text} p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors`}>
                                <Plus size={18} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* MOMENTUM RIBBON */}
                    {isMomentumOpen && (
                        <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] p-4 pb-5 border border-slate-100 dark:border-slate-800/50 animate-in slide-in-from-top-2 overflow-hidden">
                            <div className="flex justify-start gap-4 overflow-x-auto no-scrollbar py-1 px-1 snap-x pr-10">
                                {momentumDays.map((day) => {
                                    const isSelected = selectedDate === day.full;
                                    // Accurate check for that specific date in the past
                                    const activeHabitsForDay = habits.filter(h => 
                                        h.createdAt.split('T')[0] <= day.full && 
                                        h.daysOfWeek.includes(day.dayOfWeek)
                                    );
                                    const habitsCount = activeHabitsForDay.length;
                                    const doneForDay = activeHabitsForDay.filter(h => h.completedDates.includes(day.full)).length;
                                    const isComplete = habitsCount > 0 && doneForDay === habitsCount;

                                    return (
                                        <button
                                            key={day.full}
                                            onClick={() => setSelectedDate(day.full)}
                                            className={`flex flex-col items-center gap-2 min-w-[48px] transition-all relative snap-center ${isSelected ? 'scale-110' : 'opacity-40'}`}
                                        >
                                            <span className={`text-[8px] font-black uppercase ${isSelected ? themeClasses.text : 'text-slate-400'}`}>
                                                {day.isToday ? 'Now' : day.dayName}
                                            </span>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all border-2 ${
                                                isSelected 
                                                ? `${themeClasses.primary} text-white shadow-md border-transparent` 
                                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'
                                            }`}>
                                                {day.dayNum}
                                            </div>
                                            {isComplete && (
                                                <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${themeClasses.primary} shadow-sm`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                        {(['Morning', 'Afternoon', 'Evening', 'Anytime'] as const).map(time => {
                            const stats = getTabStats(time);
                            const isActive = activeHabitTab === time;
                            const isCurrentTime = initialTab === time && selectedDate === currentTodayStr;
                            
                            return (
                                <button
                                    key={time}
                                    onClick={() => setActiveHabitTab(time)}
                                    className={`flex flex-col min-w-[95px] p-4 rounded-[1.75rem] border-2 transition-all relative ${
                                        isActive 
                                        ? `${themeClasses.secondary} ${themeClasses.border}` 
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
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 border-2 border-dashed border-slate-200/20 dark:border-white/5 rounded-[2.5rem] bg-slate-50/10 dark:bg-white/[0.01]">
                                <Calendar size={24} className="opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-30 text-center">
                                  {habitsForDay.length === 0 ? 'No Rituals Scheduled' : `No ${activeHabitTab} Rituals Today`}
                                </p>
                                <button onClick={() => { setEditingHabitId(null); setHabitTime(activeHabitTab); setShowHabitModal(true); }} className={`text-[9px] font-black uppercase tracking-widest ${themeClasses.text} opacity-80 hover:opacity-100 transition-opacity`}>Schedule One</button>
                            </div>
                        ) : (
                            filteredHabits.sort((a, b) => {
                                const aDone = a.completedDates.includes(selectedDate);
                                const bDone = b.completedDates.includes(selectedDate);
                                if (aDone && !bDone) return 1;
                                if (!aDone && bDone) return -1;
                                return 0;
                            }).map(h => {
                                const linkedGoal = goals.find(g => g.id === h.linkedGoalId);
                                const isDone = h.completedDates.includes(selectedDate);
                                return (
                                    <div key={h.id} className={`bg-white dark:bg-slate-900 p-4 rounded-[2rem] border transition-all flex items-center group ${isDone ? 'opacity-40 border-transparent bg-slate-50/30 dark:bg-slate-800/20 scale-[0.98]' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}>
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
                                        </div>
                                        <button 
                                            onClick={() => toggleHabitCompletion(h.id, selectedDate)}
                                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 ml-4 ${isDone ? `${themeClasses.primary} text-white` : 'bg-slate-50 dark:bg-slate-800 text-slate-300 border border-slate-100 dark:border-slate-700 shadow-sm'}`}
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
                    <div onClick={() => setView('insights')} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 cursor-pointer active:scale-95 transition-all flex flex-col gap-3 shadow-sm hover:shadow-md">
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
                    <div onClick={() => setView('goals')} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 cursor-pointer active:scale-95 transition-all flex flex-col gap-3 shadow-sm hover:shadow-md">
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
            </div>

            {/* CREATE/EDIT HABIT MODAL */}
            {showHabitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
                    <div 
                        className="fixed -inset-[100px] bg-slate-950/40 backdrop-blur-2xl" 
                        onClick={resetHabitForm} 
                    />
                    
                    <div className="bg-white dark:bg-slate-900 w-[calc(100%-3rem)] max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[85vh]">
                        <button onClick={resetHabitForm} className="absolute top-6 right-6 p-1.5 text-slate-300 hover:text-slate-500 transition-colors z-10">
                            <X size={20}/>
                        </button>
                        
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                                {editingHabitId ? 'Edit Ritual' : 'New Ritual'}
                            </h2>
                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mt-1">Define Your Frequency</p>
                        </div>

                        <form onSubmit={handleSaveHabit} className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-1 pb-4">
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

                                    {/* DAY FREQUENCY SELECTOR */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Frequency</label>
                                            <button 
                                                type="button"
                                                onClick={() => setHabitDays(habitDays.length === 7 ? [] : [0,1,2,3,4,5,6])}
                                                className={`text-[8px] font-black uppercase tracking-widest ${themeClasses.text}`}
                                            >
                                                {habitDays.length === 7 ? 'Clear All' : 'Select Daily'}
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center gap-1.5">
                                            {DAYS_OF_WEEK.map((day, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => toggleDay(i)}
                                                    className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all flex items-center justify-center border ${habitDays.includes(i) ? `${themeClasses.primary} text-white border-transparent shadow-md` : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300'}`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest ml-1">Connect to Strategy</label>
                                    <select 
                                        value={linkedGoalId}
                                        onChange={e => setLinkedGoalId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-4 text-xs font-bold dark:text-white outline-none"
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
                                    disabled={!habitTitle.trim() || habitDays.length === 0}
                                    className={`w-full bg-gradient-to-br ${themeClasses.gradient} text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-[0.98] disabled:opacity-50 mt-4`}
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
        </>
    );
};
