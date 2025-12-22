import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Check, Plus, Flame, Sun, X, Trash2, Sparkles, Target, Clock, Moon, TrendingUp, Bell, Loader2, ShieldCheck, ShieldAlert, FileDown, ChevronDown, ChevronUp, AlertCircle, Layers, Crown, Trophy } from 'lucide-react';
import { generateDailyBriefing, translateDailyBriefing } from '../services/geminiService';
import { Habit, Goal } from '../types';

interface DashboardProps {
  setView: (v: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { 
    name, avatar, goals, habits, journalEntries, addHabit, updateHabit, deleteHabit, toggleHabitCompletion, 
    themeClasses, language, t, dashboardLayout, lastExportTimestamp, exportData,
    dailyBriefing, lastBriefingUpdate, lastBriefingLanguage, updateUserPreferences
  } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [isBriefingExpanded, setIsBriefingExpanded] = useState(false);
  
  const [userExpandedRoutines, setUserExpandedRoutines] = useState<Record<string, boolean>>({});

  // Form State
  const [habitTitle, setHabitTitle] = useState('');
  const [habitTime, setHabitTime] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Anytime'>('Anytime');
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  const dailyStats = useMemo(() => {
    if (habits.length === 0) return { percent: 0, isPerfect: false, done: 0, total: 0 };
    const total = habits.length;
    const done = habits.filter(h => h.completedDates.includes(today)).length;
    const percent = Math.round((done / total) * 100);
    return { percent, isPerfect: percent === 100, done, total };
  }, [habits, today]);

  const goalSummary = useMemo(() => {
    const completed = goals.filter(g => g.completed).length;
    const total = goals.length;
    return { completed, total };
  }, [goals]);

  const momentumMessage = useMemo(() => {
    const p = dailyStats.percent;
    if (p === 0) return t('ms_idle');
    if (p >= 100) return t('ms_100');
    if (p >= 80) return t('ms_80');
    if (p >= 60) return t('ms_60');
    if (p >= 40) return t('ms_40');
    if (p >= 20) return t('ms_20');
    return t('ms_idle');
  }, [dailyStats.percent, t]);

  const currentRoutineKey = useMemo(() => {
    if (currentHour >= 5 && currentHour < 12) return 'Morning';
    if (currentHour >= 12 && currentHour < 18) return 'Afternoon';
    if (currentHour >= 18 && currentHour < 24) return 'Evening';
    return 'Anytime';
  }, [currentHour]);

  const TIME_CONSTRAINTS = useMemo(() => ({
    Morning: { min: '05:00', max: '11:59', label: '05:00 - 12:00', icon: Sun },
    Afternoon: { min: '12:00', max: '17:59', label: '12:00 - 18:00', icon: Clock },
    Evening: { min: '18:00', max: '23:59', label: '18:00 - 00:00', icon: Moon },
    Anytime: { min: '00:00', max: '23:59', label: t('flexible_status'), icon: Layers }
  }), [t]);

  const isTimeValid = useMemo(() => {
    if (!reminderTime || habitTime === 'Anytime') return true;
    const { min, max } = TIME_CONSTRAINTS[habitTime];
    return reminderTime >= min && reminderTime <= max;
  }, [reminderTime, habitTime, TIME_CONSTRAINTS]);

  const getRoutineStatus = (timeKey: string) => {
    if (timeKey === 'Anytime') return t('flexible_status');
    if (timeKey === currentRoutineKey) return t('current_status');
    const order = ['Morning', 'Afternoon', 'Evening'];
    const currentIdx = order.indexOf(currentRoutineKey);
    const targetIdx = order.indexOf(timeKey);
    return targetIdx > currentIdx ? t('upcoming_today') : t('earlier_today');
  };

  const sortedRoutineKeys = useMemo(() => {
    const timed = ['Morning', 'Afternoon', 'Evening'];
    if (currentRoutineKey === 'Anytime') return ['Anytime', ...timed];
    const activeIdx = timed.indexOf(currentRoutineKey);
    return [currentRoutineKey, ...timed.slice(activeIdx + 1), 'Anytime', ...timed.slice(0, activeIdx).reverse()];
  }, [currentRoutineKey]);

  const isRoutineExpanded = (timeKey: string) => {
    if (userExpandedRoutines[timeKey] !== undefined) return userExpandedRoutines[timeKey];
    return timeKey === currentRoutineKey;
  };

  const dateLocale = useMemo(() => {
    switch(language) {
      case 'Ukrainian': return 'uk-UA';
      case 'Spanish': return 'es-ES';
      case 'French': return 'fr-FR';
      case 'German': return 'de-DE';
      default: return 'en-US';
    }
  }, [language]);

  const formatLocalTime = (time24: string) => {
    if (!time24) return '';
    const [hours, mins] = time24.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins, 0, 0);
    return new Intl.DateTimeFormat(dateLocale, { hour: 'numeric', minute: '2-digit', hour12: language === 'English' }).format(date);
  };

  useEffect(() => {
    const fetchBriefingIfNeeded = async () => {
        const now = new Date();
        const mostRecent5AM = new Date();
        mostRecent5AM.setHours(5, 0, 0, 0);
        if (now < mostRecent5AM) mostRecent5AM.setDate(mostRecent5AM.getDate() - 1);
        
        const isNewDay = !dailyBriefing || !lastBriefingUpdate || (lastBriefingUpdate < mostRecent5AM.getTime());
        const isLangSwitch = language !== lastBriefingLanguage;

        if (isNewDay) {
            setLoading(true);
            try {
                const briefing = await generateDailyBriefing(name, goals, habits, journalEntries, language);
                updateUserPreferences({ dailyBriefing: briefing, lastBriefingUpdate: Date.now(), lastBriefingLanguage: language });
            } finally {
                setLoading(false);
            }
        } else if (isLangSwitch && dailyBriefing) {
            setLoading(true);
            try {
                const translated = await translateDailyBriefing(dailyBriefing, language);
                updateUserPreferences({ dailyBriefing: translated, lastBriefingLanguage: language });
            } finally {
                setLoading(false);
            }
        }
    };
    fetchBriefingIfNeeded();
  }, [name, language, dailyBriefing, lastBriefingUpdate]);

  const handleOpenCreate = () => {
    setEditingHabitId(null);
    setHabitTitle('');
    setHabitTime(currentRoutineKey as any);
    setLinkedGoalId('');
    setReminderTime('');
    setShowModal(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setHabitTitle(habit.title);
    setHabitTime(habit.timeOfDay);
    setLinkedGoalId(habit.linkedGoalId || '');
    setReminderTime(habit.reminderTime || '');
    setShowModal(true);
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!habitTitle.trim() || !isTimeValid) return;
    if (editingHabitId) {
        updateHabit(editingHabitId, { title: habitTitle, timeOfDay: habitTime, linkedGoalId: linkedGoalId || undefined, reminderTime: reminderTime || undefined });
    } else {
        addHabit({ id: Date.now().toString(), title: habitTitle, timeOfDay: habitTime, streak: 0, completedDates: [], linkedGoalId: linkedGoalId || undefined, reminderTime: reminderTime || undefined });
    }
    setShowModal(false);
  };

  const handleDeleteHabit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingHabitId && confirm(t('remove_habit_confirm'))) {
        deleteHabit(editingHabitId);
        setShowModal(false);
        setEditingHabitId(null);
    }
  };

  const filteredHabits = (time: string) => {
    return habits.filter((h: Habit) => h.timeOfDay === time).sort((a, b) => (a.reminderTime || '').localeCompare(b.reminderTime || ''));
  };

  const calculateReliability = (habit: Habit) => {
    const completions = habit.completedDates.length;
    return completions === 0 ? 0 : Math.round((completions / Math.max(habit.completedDates.length, 7)) * 100);
  };

  const weekDates = (() => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) { 
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
  })();

  const isImageAvatar = avatar && (avatar.startsWith('data:image') || avatar.startsWith('http'));
  const isPerfect = dailyStats.percent === 100;

  const routineOptions = [
    { key: 'Morning', label: t('morning'), icon: Sun },
    { key: 'Afternoon', label: t('afternoon'), icon: Clock },
    { key: 'Evening', label: t('evening'), icon: Moon },
    { key: 'Anytime', label: t('anytime'), icon: Layers },
  ];

  const SelectorItem = ({ label, icon: Icon, isSelected, onClick }: any) => (
    <button 
      type="button" 
      onClick={onClick} 
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[11px] font-bold transition-all text-left ${
        isSelected ? `${themeClasses.text} ${themeClasses.secondary}` : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {Icon && (
          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-white/50 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
            <Icon size={14} className={isSelected ? themeClasses.text : 'text-slate-400'} />
          </div>
        )}
        <span className="leading-tight">{label}</span>
      </div>
      {isSelected && <Check size={14} className={`shrink-0 ml-3 ${themeClasses.text}`} strokeWidth={3} />}
    </button>
  );

  return (
    <div className="animate-in fade-in duration-700 relative">
      <div className="space-y-6">
        <div className="flex justify-between items-start pt-2">
          <div className="space-y-1">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              {new Date().toLocaleDateString(dateLocale, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {currentHour < 12 ? t('good_morning') : currentHour < 18 ? t('good_afternoon') : t('good_evening')}, <span className={themeClasses.text}>{name}</span>
            </h1>
            <button onClick={exportData} className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all mt-1 bg-emerald-50 border-emerald-200 text-emerald-600`}>
              <ShieldCheck size={10}/> {t('backup_ok')}
              <FileDown size={10} className="ml-0.5 opacity-50" />
            </button>
          </div>
          <button onClick={() => setView('profile')} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 text-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden active:scale-95 transition-transform">
              {isImageAvatar ? <img src={avatar} className="w-full h-full object-cover" alt="User" /> : avatar}
          </button>
        </div>

        {dashboardLayout.showMetrics && dailyBriefing && (
          <div onClick={() => setIsBriefingExpanded(!isBriefingExpanded)} className={`rounded-3xl p-5 text-white shadow-lg relative overflow-hidden bg-gradient-to-br ${themeClasses.gradient} cursor-pointer duration-300 ${isBriefingExpanded ? 'scale-[1.01]' : ''}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
              <div className="space-y-4 relative z-10">
                   <div className="flex justify-between items-center opacity-80">
                      <div className="flex items-center gap-2">
                         <Sparkles size={14} />
                         <span className="text-[9px] font-black uppercase tracking-widest">{t('daily_wisdom')}</span>
                      </div>
                      {isBriefingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                   </div>
                   {loading && !isBriefingExpanded ? <div className="h-5 w-2/3 bg-white/20 rounded animate-pulse" /> : (
                     <p className={`font-bold text-[15px] leading-snug tracking-tight transition-all duration-300 ${isBriefingExpanded ? '' : 'line-clamp-2'}`}>"{dailyBriefing.motivation}"</p>
                   )}
                   {isBriefingExpanded && (
                       <div className="grid grid-cols-1 gap-3 mt-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                           <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/5">
                               <h3 className="text-[8px] font-black uppercase opacity-60 mb-2 flex items-center gap-1.5"><Target size={10} /> {t('focus')}</h3>
                               <p className="text-[12px] font-bold leading-snug">{dailyBriefing.focus}</p>
                           </div>
                           <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/5">
                               <h3 className="text-[8px] font-black uppercase opacity-60 mb-2 flex items-center gap-1.5"><Clock size={10} /> {t('micro_tip')}</h3>
                               <p className="text-[12px] font-bold leading-snug">{dailyBriefing.tip}</p>
                           </div>
                       </div>
                   )}
              </div>
          </div>
        )}

        {/* METRICS ROW: MOMENTUM & GOAL TRACKING */}
        <div className="grid grid-cols-1 gap-4">
            <div className={`rounded-[2rem] py-5 px-6 shadow-sm border transition-all duration-700 space-y-4 ${
                isPerfect 
                ? 'bg-amber-50/50 dark:bg-amber-900/5 border-amber-200 dark:border-amber-500/10 shadow-amber-500/5' 
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
            }`}>
                 <div className="flex justify-between items-center px-1">
                     <h2 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isPerfect ? 'text-amber-600 dark:text-amber-400/80' : 'text-slate-400'}`}>
                        {isPerfect ? <Crown size={12} className="text-amber-500 dark:text-amber-400/60" /> : <TrendingUp size={12} className={themeClasses.text}/>} 
                        {t('momentum_title')}
                     </h2>
                     <span className={`text-[10px] font-black ${isPerfect ? 'text-amber-500 dark:text-amber-400/90' : themeClasses.text}`}>
                        {dailyStats.percent}% {isPerfect && '✨'}
                     </span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                     <div 
                        className={`h-full transition-all duration-1000 ${
                            isPerfect 
                            ? 'bg-amber-500 dark:bg-amber-500/80' 
                            : themeClasses.primary
                        }`}
                        style={{ width: `${dailyStats.percent}%` }}
                     />
                 </div>
                 <div className="flex justify-between items-center">
                    <p className={`text-[10px] font-bold ${isPerfect ? 'text-amber-600 dark:text-amber-400/70' : 'text-slate-400'}`}>
                        {momentumMessage}
                    </p>
                    <div onClick={() => setView('goals')} className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity">
                         <Trophy size={11} className={goalSummary.completed === goalSummary.total && goalSummary.total > 0 ? 'text-amber-500' : 'text-slate-300'} />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{goalSummary.completed}/{goalSummary.total} {t('goals').toLowerCase()}</span>
                    </div>
                 </div>
            </div>
        </div>

        <div className="space-y-4 pb-32">
            {sortedRoutineKeys.map((timeKey: string) => {
                const habitsInRoutine = filteredHabits(timeKey);
                if (habitsInRoutine.length === 0 && timeKey !== currentRoutineKey) return null;

                const completedCount = habitsInRoutine.filter(h => h.completedDates.includes(today)).length;
                const totalCount = habitsInRoutine.length;
                const isRoutineDone = totalCount > 0 && completedCount === totalCount;
                
                const expanded = isRoutineExpanded(timeKey);
                const toggle = () => setUserExpandedRoutines(prev => ({ ...prev, [timeKey]: !expanded }));
                const routineLabel = timeKey === 'Morning' ? t('routine_morning') : timeKey === 'Afternoon' ? t('routine_afternoon') : timeKey === 'Evening' ? t('routine_evening') : t('routine_anytime');

                return (
                    <div key={timeKey} className={`overflow-hidden rounded-[2rem] transition-all duration-500 ${expanded ? 'bg-transparent' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm'}`}>
                        <div onClick={toggle} className="flex items-center justify-between p-4 cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/20 transition-colors">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                    isRoutineDone ? 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/10 text-emerald-500 dark:text-emerald-500/80' : 
                                    'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 text-slate-400'}`}>
                                   {isRoutineDone ? <Check size={20} strokeWidth={3} /> : (timeKey === 'Morning' ? <Sun size={20}/> : timeKey === 'Evening' ? <Moon size={20}/> : timeKey === 'Afternoon' ? <Clock size={20}/> : <Layers size={20}/>)}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className={`text-xs font-bold truncate ${isRoutineDone ? 'text-emerald-500 dark:text-emerald-500/80 opacity-90' : 'text-slate-800 dark:text-slate-100'}`}>
                                            {isRoutineDone && !expanded ? routineLabel + ' Done' : routineLabel}
                                        </h2>
                                        {!isRoutineDone && <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border ${timeKey === currentRoutineKey ? `${themeClasses.secondary} ${themeClasses.text} border-indigo-200 dark:border-indigo-900/30` : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-100 dark:border-slate-800'}`}>{getRoutineStatus(timeKey)}</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">{TIME_CONSTRAINTS[timeKey as keyof typeof TIME_CONSTRAINTS].label}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{completedCount}/{totalCount}</span>
                                    </div>
                                </div>
                            </div>
                            {expanded ? <ChevronUp size={16} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-300" />}
                        </div>

                        {expanded && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 px-1 pb-3">
                                {habitsInRoutine.length === 0 ? (
                                     <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{t('no_habits')}</p>
                                        <button onClick={handleOpenCreate} className={`mt-2 text-[8px] font-black uppercase tracking-widest ${themeClasses.text} hover:opacity-70 transition-opacity`}>{t('start_routine')}</button>
                                     </div>
                                ) : habitsInRoutine.map((h: Habit) => {
                                    const isDone = h.completedDates.includes(today);
                                    const linkedGoal = goals.find(g => g.id === h.linkedGoalId);
                                    return (
                                        <div key={h.id} className={`bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-sm border flex justify-between items-center transition-all ${isDone ? `${themeClasses.border} opacity-70 scale-[0.99] dark:border-emerald-500/10` : 'border-slate-100 dark:border-slate-800/60'}`}>
                                            <div onClick={() => handleOpenEdit(h)} className="flex-1 min-w-0 pr-3 cursor-pointer">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className={`font-bold text-sm truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>{h.title}</h3>
                                                    <span className="text-[7px] font-black text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">{calculateReliability(h)}% {t('habit_rate')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    {linkedGoal && <div className={`flex items-center gap-1 text-[8px] font-bold ${themeClasses.text} bg-slate-50 dark:bg-slate-800/60 border ${themeClasses.border} px-1.5 py-0.5 rounded border`}><Target size={8} /> {linkedGoal.title}</div>}
                                                    {h.reminderTime && <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800"><Clock size={8} /> {formatLocalTime(h.reminderTime)}</div>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                     <div className="flex items-center gap-1"><Flame size={12} fill="currentColor" className={isDone ? 'text-orange-500' : 'text-slate-200'} /><span className={`text-[10px] font-black ${isDone ? 'text-orange-500' : 'text-slate-400'}`}>{h.streak}</span></div>
                                                     <div className="flex gap-1">
                                                        {weekDates.map(date => <div key={date} className={`w-1 h-1 rounded-full ${h.completedDates.includes(date) ? themeClasses.primary : (date === today ? 'bg-slate-300' : 'bg-slate-100 dark:bg-slate-800')}`} />)}
                                                     </div>
                                                </div>
                                            </div>
                                            <button onClick={() => toggleHabitCompletion(h.id, today)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${isDone ? `${themeClasses.primary} border-transparent dark:opacity-80 text-white shadow` : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 text-slate-200 hover:text-slate-400 active:scale-90'}`}><Check size={20} strokeWidth={4} /></button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg pointer-events-none z-30 px-6">
          <div className="relative h-full w-full">
              <button 
                  onClick={handleOpenCreate} 
                  className={`absolute right-0 w-14 h-14 rounded-full ${themeClasses.primary} text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto ring-4 ring-white/10 dark:ring-slate-900/40 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500 delay-300`}
                  aria-label={t('new_habit')}
              >
                  <Plus size={28} strokeWidth={3.5} />
              </button>
          </div>
      </div>

      {showModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 shadow-xl relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
                  <div className="absolute top-6 right-6 flex items-center gap-2">
                      {editingHabitId && (
                          <button 
                            type="button"
                            onClick={handleDeleteHabit} 
                            className="text-slate-300 hover:text-red-500 p-2 bg-slate-50 dark:bg-slate-800 rounded-full shadow-sm transition-colors"
                          >
                              <Trash2 size={16}/>
                          </button>
                      )}
                      <button onClick={() => { setShowModal(false); setShowGoalSelector(false); setShowTimeSelector(false); }} className="text-slate-300 hover:text-slate-500 p-2 bg-slate-50 dark:bg-slate-800 rounded-full shadow-sm transition-colors"><X size={18}/></button>
                  </div>
                  
                  <form onSubmit={handleSaveHabit} className="space-y-6">
                      <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-50 tracking-tight leading-tight truncate">{editingHabitId ? t('edit_habit') : t('new_habit')}</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{t('design_routine')}</p>
                          </div>
                      </div>

                      <div className="space-y-5">
                          <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-50 uppercase tracking-widest ml-1">{t('link_goal')}</label>
                              <div className="relative">
                                  <button 
                                    type="button" 
                                    onClick={() => { setShowGoalSelector(!showGoalSelector); setShowTimeSelector(false); }} 
                                    className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-3 text-sm font-bold flex justify-between items-center shadow-sm transition-all ${showGoalSelector ? `ring-2 ${themeClasses.ring} border-transparent` : 'border-slate-100 dark:border-slate-800'}`}
                                  >
                                      <span className="truncate">{linkedGoalId ? (goals.find(g => g.id === linkedGoalId)?.title) : t('no_goal_linked')}</span>
                                      <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${showGoalSelector ? 'rotate-180' : ''}`} />
                                  </button>
                                  {showGoalSelector && (
                                      <div className="absolute top-full left-0 mt-2 min-w-full w-max max-w-[240px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 z-[150] p-1.5 animate-in fade-in zoom-in-95 origin-top">
                                          <div className="max-h-56 overflow-y-auto no-scrollbar space-y-1">
                                              <SelectorItem 
                                                label={t('no_goal_linked')} 
                                                isSelected={!linkedGoalId} 
                                                onClick={() => { setLinkedGoalId(''); setShowGoalSelector(false); }} 
                                              />
                                              {/* Logic: Only show goals that are NOT completed for habit linking */}
                                              {goals.filter(g => !g.completed).map(g => (
                                                  <SelectorItem 
                                                    key={g.id} 
                                                    label={g.title} 
                                                    icon={Target}
                                                    isSelected={linkedGoalId === g.id} 
                                                    onClick={() => { setLinkedGoalId(g.id); setShowGoalSelector(false); }} 
                                                  />
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-50 uppercase tracking-widest ml-1">{t('habit_name')}</label>
                              <input type="text" required value={habitTitle} onChange={(e) => setHabitTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm" placeholder={t('habit_name_ph')} />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-50 uppercase tracking-widest ml-1">{t('time_of_day')}</label>
                                  <div className="relative">
                                      <button 
                                        type="button" 
                                        onClick={() => { setShowTimeSelector(!showTimeSelector); setShowGoalSelector(false); }} 
                                        className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-3 text-sm font-bold flex justify-between items-center shadow-sm transition-all ${showTimeSelector ? `ring-2 ${themeClasses.ring} border-transparent` : 'border-slate-100 dark:border-slate-800'}`}
                                      >
                                          <div className="flex items-center gap-2 min-w-0">
                                            {React.createElement(TIME_CONSTRAINTS[habitTime].icon, { size: 14, className: themeClasses.text })}
                                            <span className="truncate">{t(habitTime.toLowerCase())}</span>
                                          </div>
                                          <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${showTimeSelector ? 'rotate-180' : ''}`} />
                                      </button>
                                      {showTimeSelector && (
                                          <div className="absolute top-full left-0 mt-2 min-w-full w-max max-w-[240px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 z-[150] p-1.5 animate-in fade-in zoom-in-95 origin-top">
                                              <div className="space-y-1">
                                                  {routineOptions.map((opt) => (
                                                      <SelectorItem 
                                                        key={opt.key}
                                                        label={opt.label}
                                                        icon={opt.icon}
                                                        isSelected={habitTime === opt.key}
                                                        onClick={() => { setHabitTime(opt.key as any); setShowTimeSelector(false); }}
                                                      />
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-50 uppercase tracking-widest ml-1">{t('reminder')}</label>
                                  <input 
                                    type="time" 
                                    value={reminderTime} 
                                    onChange={e => setReminderTime(e.target.value)} 
                                    className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none shadow-sm transition-all ${!isTimeValid ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/10'}`} 
                                  />
                                  <p className={`text-[8px] font-black uppercase mt-1 px-1 flex items-center gap-1 ${!isTimeValid ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                                    <AlertCircle size={10}/> {TIME_CONSTRAINTS[habitTime].label}
                                  </p>
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 shadow-sm transition-all active:scale-95">{t('back')}</button>
                          <button type="submit" disabled={!habitTitle.trim() || !isTimeValid} className={`flex-[2] py-4 rounded-2xl font-bold text-[10px] uppercase tracking-wider text-white bg-gradient-to-br ${themeClasses.gradient} shadow-lg active:scale-95 transition-all disabled:opacity-30 disabled:grayscale`}>{editingHabitId ? t('update_habit') : t('create_habit')}</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};