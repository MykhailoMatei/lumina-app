import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Check, Plus, Flame, Sun, X, Trash2, Sparkles, Target, Clock, Moon, TrendingUp, Bell, Loader2, ShieldCheck, ShieldAlert, FileDown, ChevronDown, ChevronUp, AlertCircle, Layers, Trophy, Zap } from 'lucide-react';
import { generateDailyBriefing, suggestHabitsFromGoals } from '../services/geminiService';
import { Habit, Goal, DailyBriefing, AppLanguage } from '../types';

interface DashboardProps {
  setView: (v: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { 
    name, avatar, goals, habits, journalEntries, addHabit, updateHabit, deleteHabit, toggleHabitCompletion, 
    themeClasses, language, t, dashboardLayout, lastExportTimestamp, exportData,
    dailyBriefing, lastBriefingUpdate, lastBriefingLanguage, updateUserPreferences,
    lastRewardClaimDate, claimDailyReward
  } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [isBriefingExpanded, setIsBriefingExpanded] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  
  // Tracking which routine stacks are manually expanded
  const [expandedRoutines, setExpandedRoutines] = useState<Record<string, boolean>>({});

  // Form State
  const [habitTitle, setHabitTitle] = useState('');
  const [habitTime, setHabitTime] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Anytime'>('Anytime');
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showGoalSelector, setShowGoalSelector] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  // Momentum Calculations
  const dailyStats = useMemo(() => {
    if (habits.length === 0) return { percent: 0, isPerfect: false, isSpark: false, done: 0, total: 0 };
    const total = habits.length;
    const done = habits.filter(h => h.completedDates.includes(today)).length;
    const percent = Math.round((done / total) * 100);
    return {
        percent,
        isPerfect: percent === 100,
        isSpark: percent >= 60,
        done,
        total
    };
  }, [habits, today]);

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

  const hasClaimedToday = lastRewardClaimDate === today;

  // Mapping routine keys to their order for comparison
  const ROUTINE_ORDER = ['Morning', 'Afternoon', 'Evening', 'Anytime'];

  // Determine current active routine block
  const currentRoutineKey = useMemo(() => {
    if (currentHour >= 5 && currentHour < 12) return 'Morning';
    if (currentHour >= 12 && currentHour < 18) return 'Afternoon';
    if (currentHour >= 18 && currentHour < 24) return 'Evening';
    return 'Anytime';
  }, [currentHour]);

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
    const is12Hour = language === 'English';
    return new Intl.DateTimeFormat(dateLocale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: is12Hour
    }).format(date);
  };

  const TIME_CONSTRAINTS = useMemo(() => ({
    Morning: { min: '05:00', max: '12:00' },
    Afternoon: { min: '12:00', max: '18:00' },
    Evening: { min: '18:00', max: '23:59' },
    Anytime: { min: '00:00', max: '23:59' }
  }), []);

  const timeRangeLabel = useMemo(() => {
    if (habitTime === 'Anytime') return '';
    const { min, max } = TIME_CONSTRAINTS[habitTime];
    return `${formatLocalTime(min)} - ${formatLocalTime(max)}`;
  }, [habitTime, language, TIME_CONSTRAINTS]);

  const isTimeValid = useMemo(() => {
    if (!reminderTime || habitTime === 'Anytime') return true;
    const { min, max } = TIME_CONSTRAINTS[habitTime];
    return reminderTime >= min && reminderTime <= max;
  }, [reminderTime, habitTime, TIME_CONSTRAINTS]);

  useEffect(() => {
    const fetchBriefingIfNeeded = async () => {
        const now = new Date();
        const mostRecent5AM = new Date();
        mostRecent5AM.setHours(5, 0, 0, 0);
        if (now < mostRecent5AM) mostRecent5AM.setDate(mostRecent5AM.getDate() - 1);
        const isNewDay = !dailyBriefing || !lastBriefingUpdate || (lastBriefingUpdate < mostRecent5AM.getTime());
        const isNewLanguage = language !== lastBriefingLanguage;
        if (isNewDay || isNewLanguage) {
            setLoading(true);
            try {
                const briefing = await generateDailyBriefing(name, goals, habits, journalEntries, language);
                updateUserPreferences({ 
                    dailyBriefing: briefing, 
                    lastBriefingUpdate: Date.now(),
                    lastBriefingLanguage: language
                });
            } catch (err) {
                console.error("Failed to update daily briefing", err);
            } finally {
                setLoading(false);
            }
        }
    };
    fetchBriefingIfNeeded();
  }, [name, language, goals.length, habits.length, journalEntries.length, lastBriefingLanguage]);

  const handleOpenCreate = () => {
    setEditingHabitId(null);
    setHabitTitle('');
    setHabitTime('Anytime'); // Default to Anytime per feedback
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
        updateHabit(editingHabitId, { 
          title: habitTitle, 
          timeOfDay: habitTime, 
          linkedGoalId: linkedGoalId || undefined, 
          reminderTime: reminderTime || undefined 
        });
    } else {
        addHabit({ 
          id: Date.now().toString(), 
          title: habitTitle, 
          timeOfDay: habitTime, 
          streak: 0, 
          completedDates: [], 
          linkedGoalId: linkedGoalId || undefined, 
          reminderTime: reminderTime || undefined 
        });
    }
    setShowModal(false);
  };

  const handleSuggest = async () => {
    const goal = goals.find((g: Goal) => g.id === linkedGoalId);
    if (!goal) return;
    setIsSuggesting(true);
    try {
      const suggestions = await suggestHabitsFromGoals(goal.title, language);
      if (suggestions.length > 0) {
          setHabitTitle(suggestions[0].title);
          const suggestedTime = suggestions[0].timeOfDay;
          if (['Morning', 'Afternoon', 'Evening', 'Anytime'].includes(suggestedTime)) {
              setHabitTime(suggestedTime as any);
          }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleClaimReward = (e: React.MouseEvent) => {
    e.stopPropagation();
    claimDailyReward();
    setShowRewardModal(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 18) return t('good_afternoon');
    return t('good_evening');
  };

  const filteredHabits = (time: string) => {
    return habits
        .filter((h: Habit) => h.timeOfDay === time)
        .sort((a, b) => {
            if (a.reminderTime && b.reminderTime) return a.reminderTime.localeCompare(b.reminderTime);
            if (a.reminderTime) return -1; 
            if (b.reminderTime) return 1;
            return a.id.localeCompare(b.id);
        });
  };

  const completedGoalsCount = goals.filter((g: Goal) => g.completed).length;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map((h: Habit) => h.streak), 0) : 0;

  const weekDates = (() => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) { 
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
  })();

  const calculateReliability = (habit: Habit) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const completions = habit.completedDates.filter(d => new Date(d) >= thirtyDaysAgo).length;
    return Math.round((completions / 30) * 100);
  };

  const getFlameColorClasses = (streak: number) => {
    if (streak >= 100) return 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]';
    if (streak >= 30) return 'text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]';
    if (streak >= 7) return 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]';
    return 'text-orange-500';
  };

  const getFlameScaleStyle = (streak: number) => {
      const scale = 1 + Math.min(streak * 0.04, 0.6);
      return { transform: `scale(${scale})`, transformOrigin: 'center' };
  };

  const isImageAvatar = avatar && (avatar.startsWith('data:image') || avatar.startsWith('http'));
  const backupNeeded = lastExportTimestamp ? (Date.now() - lastExportTimestamp) / (1000 * 60 * 60 * 24) > 3 : true;

  // AI Friction Check: Too many habits? (Wisdom restored)
  const showAiFriction = habits.length >= 7 && !editingHabitId;

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-700 relative">
        {/* Header Section */}
        <div className="flex justify-between items-start pt-2">
          <div className="space-y-1">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              {new Date().toLocaleDateString(dateLocale, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {getGreeting()}, <span className={themeClasses.text}>{name}</span>
            </h1>
            <button onClick={exportData} className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all mt-1 ${backupNeeded ? 'bg-amber-50 border-amber-200 text-amber-600 animate-pulse' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              {backupNeeded ? <ShieldAlert size={10}/> : <ShieldCheck size={10}/>}
              {backupNeeded ? t('backup_needed') : t('backup_ok')}
              <FileDown size={10} className="ml-0.5 opacity-50" />
            </button>
          </div>
          <button onClick={() => setView('profile')} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 text-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              {isImageAvatar ? <img src={avatar} className="w-full h-full object-cover" alt="User" /> : avatar}
          </button>
        </div>

        {/* Unified Daily Briefing & Reward Card */}
        {dashboardLayout.showMetrics && (
          <div onClick={() => setIsBriefingExpanded(!isBriefingExpanded)} className={`rounded-[2.5rem] p-7 text-white shadow-xl relative overflow-hidden bg-gradient-to-br ${themeClasses.gradient} cursor-pointer duration-500 ${isBriefingExpanded ? 'scale-[1.02]' : 'hover:shadow-indigo-200 dark:hover:shadow-none'} ${dailyStats.isSpark && !hasClaimedToday ? 'animate-reward-pulse' : ''}`}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
              {loading ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{t('curating_insights')}</span>
                  </div>
              ) : dailyBriefing && (
                  <div className="space-y-6 relative z-10">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5 opacity-80">
                             {dailyStats.isSpark && !hasClaimedToday ? <Zap size={16} className="text-yellow-300 animate-pulse" /> : <Sparkles size={16} />}
                             <span className="text-[10px] font-black uppercase tracking-widest">{t('daily_wisdom')}</span>
                          </div>
                          {dailyStats.isSpark && !hasClaimedToday ? (
                             <span className="bg-yellow-400 text-slate-900 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-bounce">{t('daily_reward')}</span>
                          ) : (
                             isBriefingExpanded ? <ChevronUp size={16} className="opacity-60" /> : <ChevronDown size={16} className="opacity-60" />
                          )}
                       </div>
                       
                       <div className="space-y-2">
                           <p className={`font-bold text-xl leading-tight tracking-tight transition-all duration-500 ${isBriefingExpanded ? '' : 'line-clamp-2'}`}>"{dailyBriefing.motivation}"</p>
                           {dailyStats.isSpark && !hasClaimedToday && (
                             <button 
                                onClick={handleClaimReward}
                                className="mt-4 bg-white text-slate-900 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                             >
                                <Zap size={14} fill="currentColor" /> {t('claim_btn')}
                             </button>
                           )}
                       </div>

                       <div className={`grid gap-3 transition-all duration-500 ${isBriefingExpanded ? 'grid-cols-1 mt-4' : 'grid-cols-2'}`}>
                           <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-md border border-white/10 shadow-inner">
                               <h3 className="text-[9px] font-black uppercase opacity-60 mb-1.5 flex items-center gap-1.5"><Target size={10} /> {t('focus')}</h3>
                               <p className={`text-[13px] font-bold leading-snug ${isBriefingExpanded ? '' : 'line-clamp-1'}`}>{dailyBriefing.focus}</p>
                           </div>
                           <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-md border border-white/10 shadow-inner">
                               <h3 className="text-[9px] font-black uppercase opacity-60 mb-1.5 flex items-center gap-1.5"><Clock size={10} /> {t('micro_tip')}</h3>
                               <p className={`text-[13px] font-bold leading-snug ${isBriefingExpanded ? '' : 'line-clamp-2'}`}>{dailyBriefing.tip}</p>
                           </div>
                       </div>
                  </div>
              )}
          </div>
        )}

        {/* Momentum Tracker - Milestone Feedback */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
             <div className="flex justify-between items-center px-1">
                 <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={12} className={themeClasses.text}/> {t('momentum_title')}
                 </h2>
                 <div className="flex items-center gap-2">
                    {dailyStats.isPerfect && <Trophy size={14} className="text-yellow-500 animate-sparkle" />}
                    <span className={`text-[10px] font-black ${themeClasses.text} ${dailyStats.percent === 0 ? 'bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700 opacity-60' : ''}`}>
                        {dailyStats.percent === 0 ? t('ms_fresh') : `${dailyStats.percent}%`}
                    </span>
                 </div>
             </div>
             <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                 {dailyStats.percent === 0 && (
                     <div className={`absolute inset-0 ${themeClasses.primary} opacity-10`} />
                 )}
                 <div 
                    className={`h-full transition-all duration-1000 ${themeClasses.primary}`}
                    style={{ width: `${dailyStats.percent}%` }}
                 />
                 {[20, 40, 60, 80].map(m => (
                    <div key={m} className="absolute top-0 bottom-0 w-px bg-white/30 dark:bg-black/20" style={{ left: `${m}%` }} />
                 ))}
             </div>
             <div className="flex items-center justify-center gap-2 min-h-[1.25rem]">
                 <p className={`text-[10px] font-bold tracking-tight text-center transition-all duration-500 ${dailyStats.percent > 0 ? themeClasses.text : 'text-slate-400 opacity-80'}`}>
                    {momentumMessage}
                 </p>
             </div>
        </div>

        {/* Global Stats Row */}
        <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setView('goals')} className={`rounded-3xl p-4 h-32 ${themeClasses.primary} text-white shadow-sm flex flex-col justify-between relative overflow-hidden group text-left transition-transform`}>
                 <Target size={40} className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110" />
                 <div className="w-full">
                     <div className="flex items-center justify-between mb-2"><div className="p-1.5 bg-white/20 rounded-xl"><Target size={14} /></div><span className="text-[8px] font-bold uppercase tracking-widest opacity-80">{t('goals')}</span></div>
                     <h4 className="text-xl font-bold">{completedGoalsCount}/{goals.length}</h4>
                     <p className="text-[9px] font-bold opacity-70 uppercase mt-0.5">{t('goals_achieved')}</p>
                 </div>
            </button>
            <button onClick={() => setView('insights')} className="rounded-3xl p-4 h-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group text-left transition-transform">
                 <Flame size={40} className="absolute -right-2 -bottom-2 text-orange-500/5 group-hover:scale-110" />
                 <div className="w-full">
                     <div className="flex items-center justify-between mb-2"><div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><TrendingUp size={14} /></div><span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{t('streak')}</span></div>
                     <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{bestStreak} <span className="text-xs font-medium text-slate-400">{t('days_suffix')}</span></h4>
                     <p className="text-[9px] font-bold text-emerald-500 uppercase mt-0.5">{t('best_streak')}</p>
                 </div>
            </button>
        </div>

        {/* ROUTINES (BUNDLES) SECTION */}
        <div className="space-y-4 pb-32">
            {ROUTINE_ORDER.map((timeKey: string) => {
                const habitsInRoutine = filteredHabits(timeKey);
                if (habitsInRoutine.length === 0 && timeKey !== currentRoutineKey) return null;

                const completedCount = habitsInRoutine.filter(h => h.completedDates.includes(today)).length;
                const totalCount = habitsInRoutine.length;
                const isRoutineDone = totalCount > 0 && completedCount === totalCount;
                
                const orderIndex = ROUTINE_ORDER.indexOf(timeKey);
                const currentRoutineIndex = ROUTINE_ORDER.indexOf(currentRoutineKey);
                
                const isPrevious = orderIndex < currentRoutineIndex && timeKey !== 'Anytime';
                const isCurrent = timeKey === currentRoutineKey;

                const isExpanded = expandedRoutines[timeKey] ?? (isCurrent || timeKey === 'Anytime');
                const toggleRoutine = () => setExpandedRoutines(prev => ({ ...prev, [timeKey]: !isExpanded }));

                const getRoutineTitle = () => {
                   if (timeKey === 'Morning') return t('routine_morning');
                   if (timeKey === 'Afternoon') return t('routine_afternoon');
                   if (timeKey === 'Evening') return t('routine_evening');
                   return t('routine_anytime');
                };

                const getBadgeText = () => {
                    if (timeKey === 'Anytime') return t('flexible_status');
                    if (isCurrent) return t('current_status');
                    if (isPrevious) return t('earlier_today');
                    return t('upcoming_today');
                };

                const IconComponent = timeKey === 'Morning' ? Sun : timeKey === 'Evening' ? Moon : timeKey === 'Afternoon' ? Clock : Layers;

                return (
                    <div key={timeKey} className={`group overflow-hidden rounded-[2.5rem] transition-all duration-500 ${isExpanded ? 'bg-transparent' : 'bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800'}`}>
                        {/* Routine Header */}
                        <div 
                          onClick={toggleRoutine}
                          className={`flex items-center justify-between p-5 cursor-pointer select-none transition-all ${isExpanded ? 'mb-2 opacity-100' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isRoutineDone ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-400'}`}>
                                   {isRoutineDone ? <Check size={24} strokeWidth={3} /> : <IconComponent size={24} />}
                                </div>
                                <div className="min-w-0">
                                    <h2 className={`text-sm font-bold truncate ${isRoutineDone ? 'text-emerald-500 line-through opacity-70' : 'text-slate-800 dark:text-slate-100'}`}>
                                        {getRoutineTitle()}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                           <div className={`h-full transition-all duration-700 ${isRoutineDone ? 'bg-emerald-500' : themeClasses.primary}`} style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{completedCount}/{totalCount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {!isExpanded && !isRoutineDone && (
                                   <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${timeKey === 'Anytime' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400' : isCurrent ? `${themeClasses.secondary} ${themeClasses.text}` : isPrevious ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                       {getBadgeText()}
                                   </span>
                                )}
                                {isExpanded ? <ChevronUp size={18} className="text-slate-300" /> : <ChevronDown size={18} className="text-slate-300" />}
                            </div>
                        </div>

                        {/* Routine Habits List */}
                        {isExpanded && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
                                {habitsInRoutine.length === 0 ? (
                                    <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">{t('no_habits')}</p>
                                    </div>
                                ) : (
                                    habitsInRoutine.map((h: Habit) => {
                                        const isDone = h.completedDates.includes(today);
                                        const reliability = calculateReliability(h);
                                        const linkedGoal = goals.find(g => g.id === h.linkedGoalId);
                                        return (
                                        <div key={h.id} className={`group bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border duration-300 flex justify-between items-center ${isDone ? `${themeClasses.border} opacity-70 scale-[0.98]` : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}>
                                            <div onClick={() => handleOpenEdit(h)} className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className={`font-bold text-sm truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>{h.title}</h3>
                                                    <div className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-[8px] font-black uppercase text-slate-400 border border-slate-100 dark:border-slate-800">{reliability}% {t('habit_rate')}</div>
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
                                                    {linkedGoal && (
                                                        <div className={`flex items-center gap-1 text-[9px] font-bold ${themeClasses.text} bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded-lg border ${themeClasses.border}`}>
                                                            <Target size={10} /> {linkedGoal.title}
                                                        </div>
                                                    )}
                                                    {h.reminderTime && (
                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <Clock size={10} /> {formatLocalTime(h.reminderTime)}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 mt-4">
                                                    <div className="flex items-center gap-1.5 transition-transform" style={getFlameScaleStyle(h.streak)}>
                                                        <Flame 
                                                            size={14} 
                                                            fill="currentColor" 
                                                            className={getFlameColorClasses(h.streak)} 
                                                        />
                                                        <span className={`text-[11px] font-black ${getFlameColorClasses(h.streak)}`}>{h.streak}</span>
                                                    </div>
                                                    
                                                    <div className="flex gap-1.5 items-center px-1">
                                                        {weekDates.map((date: string, idx: number) => {
                                                            const isFuture = date > today;
                                                            const isToday = date === today;
                                                            const done = h.completedDates.includes(date);
                                                            const pastOpacity = idx < 6 ? 'opacity-30' : 'opacity-100';

                                                            if (isFuture) return <div key={date} className="w-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" />;
                                                            if (isToday) return (
                                                                <div key={date} className={`w-2.5 h-2.5 rounded-full ring-2 ${done ? themeClasses.primary : 'ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-800'} ${done ? 'bg-transparent' : ''} flex items-center justify-center`}>
                                                                    {done && <div className={`w-1.5 h-1.5 rounded-full ${themeClasses.primary}`} />}
                                                                </div>
                                                            );
                                                            return (
                                                                <div key={date} className={`w-1.5 h-1.5 rounded-full flex items-center justify-center ${pastOpacity} ${done ? themeClasses.primary : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                                    {!done && <X size={6} className="text-slate-400" />}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <button onClick={(e) => { e.stopPropagation(); toggleHabitCompletion(h.id, today); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border ${isDone ? `${themeClasses.primary} border-transparent text-white animate-pop-haptic shadow-lg` : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-200 hover:text-slate-400 active:scale-90'}`}>
                                                    <Check size={18} strokeWidth={4} className={`${isDone ? 'scale-100 animate-check-draw' : 'scale-75 opacity-40'} transition-all`} />
                                                </button>
                                            </div>
                                        </div>
                                    )})
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
        <button onClick={handleOpenCreate} className={`fixed bottom-24 right-6 w-16 h-16 rounded-full ${themeClasses.primary} text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40`}><Plus size={32} strokeWidth={3} /></button>
      </div>

      {/* Habit Creation Modal */}
      {showModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 w-full max-w-[92%] sm:max-w-md rounded-[3rem] p-10 sm:p-12 shadow-xl relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto no-scrollbar">
                  <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 p-2 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors"><X size={18}/></button>

                  <div className="space-y-6">
                      <div className="pr-12">
                          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-50 tracking-tight leading-tight">{editingHabitId ? t('edit_habit') : t('new_habit')}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{t('design_routine')}</p>
                      </div>

                      {/* Gemini Wisdom Helper Block */}
                      {showAiFriction && (
                         <div className={`p-4 rounded-2xl border ${themeClasses.border} ${themeClasses.secondary} flex gap-4 items-start animate-in slide-in-from-top-4`}>
                             <div className={`w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-sm ${themeClasses.text}`}>
                                <Sparkles size={16} />
                             </div>
                             <div className="space-y-1">
                                <h4 className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text}`}>{t('ai_friction_title')}</h4>
                                <p className="text-[11px] font-medium leading-relaxed opacity-80">{t('ai_friction_desc').replace('{count}', habits.length.toString())}</p>
                             </div>
                         </div>
                      )}

                      <form onSubmit={handleSaveHabit} className="space-y-5">
                          <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('link_goal')}</label>
                              <div className="relative">
                                  <button 
                                      type="button" 
                                      onClick={() => setShowGoalSelector(!showGoalSelector)} 
                                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white flex justify-between items-center shadow-sm"
                                  >
                                      {linkedGoalId ? (goals.find(g => g.id === linkedGoalId)?.title) : t('no_goal_linked')}
                                      <ChevronDown size={14} className="text-slate-400" />
                                  </button>
                                  {showGoalSelector && (
                                      <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 z-[150] p-2 animate-in fade-in zoom-in-95">
                                          <div className="max-h-48 overflow-y-auto no-scrollbar">
                                              <button type="button" onClick={() => { setLinkedGoalId(''); setShowGoalSelector(false); }} className="w-full text-left p-3.5 hover:bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-400">{t('no_goal_linked')}</button>
                                              {goals.map(g => (
                                                  <button 
                                                      key={g.id} 
                                                      type="button" 
                                                      onClick={() => { setLinkedGoalId(g.id); setShowGoalSelector(false); }} 
                                                      className={`w-full text-left p-3.5 hover:bg-slate-50 rounded-2xl text-[11px] font-bold ${linkedGoalId === g.id ? themeClasses.text : 'text-slate-700 dark:text-slate-200'}`}
                                                  >
                                                      {g.title}
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="space-y-2">
                              <div className="flex justify-between items-center ml-1">
                                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('habit_name')}</label>
                                  {linkedGoalId && (
                                      <button 
                                          type="button" 
                                          onClick={handleSuggest} 
                                          disabled={isSuggesting} 
                                          className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${themeClasses.text} disabled:opacity-30`}
                                      >
                                          {isSuggesting ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} 
                                          {t('ai_suggestion')}
                                      </button>
                                  )}
                              </div>
                              <input 
                                  type="text" 
                                  required 
                                  value={habitTitle} 
                                  onChange={(e) => setHabitTitle(e.target.value)} 
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm" 
                                  placeholder={t('habit_name_ph')} 
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('time_of_day')}</label>
                                  <select 
                                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-sm" 
                                      value={habitTime} 
                                      onChange={(e) => setHabitTime(e.target.value as any)}
                                  >
                                      <option value="Morning">{t('morning')}</option>
                                      <option value="Afternoon">{t('afternoon')}</option>
                                      <option value="Evening">{t('evening')}</option>
                                      <option value="Anytime">{t('anytime')}</option>
                                  </select>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('reminder')}</label>
                                  <input 
                                      type="time" 
                                      min={TIME_CONSTRAINTS[habitTime].min} 
                                      max={TIME_CONSTRAINTS[habitTime].max} 
                                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border rounded-xl px-3 py-3 text-[10px] font-bold text-slate-800 dark:text-white outline-none transition-all shadow-sm ${!isTimeValid ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/10'}`} 
                                      value={reminderTime} 
                                      onChange={(e) => setReminderTime(e.target.value)} 
                                  />
                              </div>
                          </div>

                          {/* Range Feedback restored */}
                          {habitTime !== 'Anytime' && (
                              <div className={`flex items-center gap-2 px-1 text-[8px] font-bold uppercase tracking-wider ${!isTimeValid ? 'text-rose-500 animate-pulse' : 'text-slate-400 opacity-60'}`}>
                                  {!isTimeValid ? <AlertCircle size={10} /> : <Clock size={10} />}
                                  {timeRangeLabel}
                              </div>
                          )}

                          <div className="flex gap-4 pt-4">
                              <button 
                                  type="button" 
                                  onClick={() => setShowModal(false)}
                                  className="flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all active:scale-95 border border-slate-100 dark:border-slate-800 shadow-sm"
                              >
                                  {t('back')}
                              </button>
                              <button 
                                  type="submit" 
                                  disabled={!habitTitle.trim() || !isTimeValid} 
                                  className={`flex-[2] py-4 rounded-2xl font-bold text-[10px] uppercase tracking-wider text-white bg-gradient-to-br ${themeClasses.gradient} shadow-lg active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed`}
                              >
                                  {editingHabitId ? t('update_habit') : t('create_habit')}
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};
