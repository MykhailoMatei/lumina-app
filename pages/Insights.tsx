
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
    ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    Scatter, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
    TrendingUp, Activity, Sparkles, Zap, Brain, Target, 
    ArrowUpRight, Loader2, Sunset, Sun, Coffee, 
    Flame, LayoutGrid, Heart, Fingerprint, Waves, Info,
    Lock, Sprout, PenLine, ChevronRight, BookOpen, PlusCircle,
    Check
} from 'lucide-react';
import { generateGrowthAudit } from '../services/geminiService';

const THEME_HEX_MAP: Record<string, string> = {
  indigo: '#6366f1',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  blue: '#3b82f6'
};

export const Insights: React.FC<{ setView: (v: string) => void }> = ({ setView }) => {
  const { habits, goals, journalEntries, themeColor, themeClasses, language, t } = useApp();
  const [timeframe, setTimeframe] = useState<'Week' | 'Month'>('Month');
  const [audit, setAudit] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showThemeHelp, setShowThemeHelp] = useState(false);

  const accentHex = THEME_HEX_MAP[themeColor || 'indigo'] || '#6366f1';

  const hasHabits = habits.length > 0;
  const hasJournal = journalEntries.length > 0;
  const hasGoals = goals.length > 0;
  const hasSync = hasHabits && hasJournal;
  const hasAnyData = hasHabits || hasJournal || hasGoals;

  // Track habit completions by creating a string representation of the data
  // This ensures that completing a habit triggers a re-fetch if the user visits this page
  const habitCompletionKey = JSON.stringify(habits.map(h => ({ id: h.id, streak: h.streak, count: h.completedDates.length })));
  const journalKey = JSON.stringify(journalEntries.map(j => ({ id: j.id, mood: j.mood })));

  useEffect(() => {
    if (!hasAnyData) return;

    const fetchAudit = async () => {
        setLoadingAudit(true);
        try {
            const res = await generateGrowthAudit(habits, goals, journalEntries, language);
            setAudit(res);
        } catch (e) {
            console.error("Audit failed", e);
        } finally {
            setLoadingAudit(false);
        }
    };
    fetchAudit();
  }, [habitCompletionKey, journalKey, goals.length, timeframe, hasAnyData, language]);

  const momentumGrid = useMemo(() => {
    const daysCount = 35;
    const result: { dateStr: string; ratio: number; }[] = [];
    for(let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const habitsDone = habits.filter(h => h.completedDates.includes(dateStr)).length;
        const total = habits.length;
        const ratio = total > 0 ? habitsDone / total : 0;
        result.push({ dateStr, ratio });
    }
    return result;
  }, [habits]);

  const radarData = useMemo(() => {
      if (audit?.identityScores) return audit.identityScores;
      return [
        { subject: 'Health', A: 50, fullMark: 100 },
        { subject: 'Career', A: 50, fullMark: 100 },
        { subject: 'Creativity', A: 50, fullMark: 100 },
        { subject: 'Learning', A: 50, fullMark: 100 },
        { subject: 'Personal', A: 50, fullMark: 100 },
        { subject: 'Financial', A: 50, fullMark: 100 }
      ];
  }, [audit]);

  const correlationData = useMemo(() => {
      const moodMap: Record<string, number> = { 'Great': 5, 'Good': 4, 'Neutral': 3, 'Bad': 2, 'Awful': 1 };
      const result: { dateLabel: string; score: number; perfectScore: number | null; }[] = [];
      const daysCount = timeframe === 'Week' ? 7 : 14;
      
      for(let i = daysCount - 1; i >= 0; i--) {
          const d = new Date(); 
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const entry = journalEntries.find(e => e.date && e.date.split('T')[0] === dateStr);
          const habitsDone = habits.filter(h => h.completedDates.includes(dateStr)).length;
          const habitsTotal = habits.length;
          const score = entry ? (moodMap[entry.mood] || 3) : 3;

          result.push({
              dateLabel: d.toLocaleDateString(undefined, { weekday: 'short' }),
              score: score,
              perfectScore: habitsTotal > 0 && habitsDone === habitsTotal ? score : null
          });
      }
      return result;
  }, [journalEntries, habits, timeframe]);

  if (!hasAnyData) {
    return (
        <div className="pb-40 space-y-10 animate-in fade-in duration-1000 flex flex-col items-center justify-center min-h-[80vh] text-center px-8">
            <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${themeClasses.gradient} blur-[60px] opacity-10 animate-pulse-slow`} />
                <div className={`w-28 h-28 rounded-[2.5rem] ${themeClasses.secondary} flex items-center justify-center border ${themeClasses.border} relative z-10 shadow-2xl`}>
                    <Sprout size={42} className={themeClasses.text} />
                </div>
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">Neuro Calibration</h1>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Unlock your identity audit</p>
                
                <div className="max-w-[320px] mx-auto p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">
                        "Insights are born from consistency. Provide a signal to the neural network to begin your evolution audit."
                    </p>

                    <div className="space-y-3">
                        <button 
                            onClick={() => setView('goals')}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${hasGoals ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                        >
                            <div className="flex items-center gap-3">
                                {hasGoals ? <div className="bg-emerald-500 rounded-full p-1 text-white"><Check size={12} strokeWidth={4} /></div> : <Target size={16} className="text-slate-300" />}
                                <span className={`text-[10px] font-black uppercase tracking-widest ${hasGoals ? 'text-emerald-600' : 'text-slate-400'}`}>1. Plant a Goal</span>
                            </div>
                            {!hasGoals && <PlusCircle size={14} className="text-slate-300" />}
                        </button>

                        <button 
                            onClick={() => setView('dashboard')}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${hasHabits ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                        >
                            <div className="flex items-center gap-3">
                                {hasHabits ? <div className="bg-emerald-500 rounded-full p-1 text-white"><Check size={12} strokeWidth={4} /></div> : <Zap size={16} className="text-slate-300" />}
                                <span className={`text-[10px] font-black uppercase tracking-widest ${hasHabits ? 'text-emerald-600' : 'text-slate-400'}`}>2. Start a Ritual</span>
                            </div>
                            {!hasHabits && <PlusCircle size={14} className="text-slate-300" />}
                        </button>

                        <button 
                            onClick={() => setView('journal')}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${hasJournal ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                        >
                            <div className="flex items-center gap-3">
                                {hasJournal ? <div className="bg-emerald-500 rounded-full p-1 text-white"><Check size={12} strokeWidth={4} /></div> : <BookOpen size={16} className="text-slate-300" />}
                                <span className={`text-[10px] font-black uppercase tracking-widest ${hasJournal ? 'text-emerald-600' : 'text-slate-400'}`}>3. Write Reflection</span>
                            </div>
                            {!hasJournal && <PlusCircle size={14} className="text-slate-300" />}
                        </button>
                    </div>

                    <div className="pt-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 animate-pulse">
                            Awaiting Signal to Unlock
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
      <div className="pb-40 space-y-6 animate-in fade-in duration-1000">
          <header className="px-1 pt-2 flex justify-between items-end">
              <div>
                  <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">Neuro Insights</h1>
                  <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        {audit?.archetype || 'Analyzing Identity...'}
                      </p>
                      {audit?.isCalibrating && (
                        <div className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-amber-500/20">
                            Calibrating
                        </div>
                      )}
                  </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 flex shadow-sm">
                  {(['Week', 'Month'] as const).map(t => (
                      <button 
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === t ? `${themeClasses.primary} text-white shadow-lg` : 'text-slate-400'}`}
                      >
                          {t}
                      </button>
                  ))}
              </div>
          </header>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Identity Resonance</h2>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Strategic vs Daily Sync
                        </p>
                    </div>
                    <div className={`p-3 rounded-2xl ${themeClasses.secondary} ${themeClasses.text}`}>
                        <Fingerprint size={20} />
                    </div>
                </div>

                <div className="h-64 -mx-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" strokeOpacity={0.5} />
                            <PolarAngleAxis dataKey="subject" tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                            <Radar
                                name="Resonance"
                                dataKey="A"
                                stroke={accentHex}
                                fill={accentHex}
                                fillOpacity={0.4}
                                animationBegin={300}
                                animationDuration={1000}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2 relative">
                    <div className="w-full flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Mental Themes</span>
                        <button 
                            onClick={() => setShowThemeHelp(!showThemeHelp)}
                            className="p-1 text-slate-300 hover:text-slate-500"
                        >
                            <Info size={12} />
                        </button>
                    </div>

                    {showThemeHelp && (
                        <div className="absolute bottom-full left-0 right-0 mb-4 p-4 bg-slate-900 text-white rounded-2xl text-[9px] font-bold leading-relaxed z-20 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                             Mental Themes represent recurring psychological patterns detected by AI across your goals, rituals, and reflections. They evolve as your data grows.
                        </div>
                    )}

                    {audit?.mentalThemes?.map((theme: string) => (
                        <div key={theme} className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-1.5 transition-transform hover:scale-105">
                            <Waves size={10} className={themeClasses.text} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{theme}</span>
                        </div>
                    ))}
                    {!hasJournal && (
                        <div className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 flex items-center gap-1.5 opacity-40">
                            <PenLine size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Journal to unlock themes</span>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 italic leading-relaxed">
                        IDENTITY RESONANCE correlates your <span className={themeClasses.text}>Active Goals</span> (where you intend to grow) with your <span className={themeClasses.text}>Habit Execution</span> (where you actually spend energy). The more balanced the shape, the more integrated your life dimensions.
                    </p>
                </div>
          </div>

          <div className="relative p-8 rounded-[3.5rem] bg-white dark:bg-slate-900 overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 group">
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-2xl ${themeClasses.secondary} flex items-center justify-center`}>
                            <Brain size={20} className={themeClasses.text} />
                        </div>
                        <div>
                            <h2 className="text-slate-800 dark:text-white font-black text-sm uppercase tracking-wider">Growth Strategist</h2>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Tailored AI Guidance</p>
                        </div>
                    </div>

                    {loadingAudit ? (
                        <div className="space-y-3 py-2">
                            <div className="h-4 w-full bg-slate-50 dark:bg-slate-800 rounded-full animate-pulse" />
                            <div className="h-4 w-3/4 bg-slate-50 dark:bg-slate-800 rounded-full animate-pulse" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-5 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800/50 flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                                    <Heart size={18} className="text-rose-400" />
                                </div>
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Core Insight</span>
                                    <p className="text-[11px] text-slate-700 dark:text-slate-200 font-bold leading-snug mt-1">{audit?.summary}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap size={14} className="text-amber-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Advice</span>
                                    </div>
                                    <p className="text-[10px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">"{audit?.advice}"</p>
                                </div>
                                <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp size={14} className={themeClasses.text} />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Trajectory</span>
                                    </div>
                                    <p className="text-[10px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{audit?.trajectory}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
          </div>

          {hasHabits && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-in zoom-in-95">
                  <div className="flex justify-between items-start mb-8">
                      <div>
                          <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Momentum Density</h2>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Habit Execution Heatmap</p>
                      </div>
                      <div className={`p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500`}>
                          <LayoutGrid size={20} />
                      </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                      {momentumGrid.map((day, idx) => (
                          <div 
                              key={idx}
                              className={`aspect-square rounded-lg border border-slate-100 dark:border-slate-800/50 transition-all duration-700 ${
                                  day.ratio > 0.8 ? `${themeClasses.primary} shadow-md` :
                                  day.ratio > 0.5 ? `${themeClasses.primary} opacity-60` :
                                  day.ratio > 0.2 ? `${themeClasses.primary} opacity-20` :
                                  'bg-slate-50 dark:bg-slate-800/20'
                              }`}
                          />
                      ))}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                      <div className="flex items-start gap-3">
                          <Info size={14} className="text-slate-300 shrink-0 mt-0.5" />
                          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 italic leading-relaxed">
                              MOMENTUM DENSITY visualizes ritual execution over 35 days. Color intensity represents percentage completion, mapping the architecture of your discipline.
                          </p>
                      </div>
                  </div>
            </div>
          )}

          {hasSync && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-bottom-6">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Discipline Sync</h2>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Integrated Emotional correlation</p>
                      </div>
                      <div className={`p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500`}>
                          <Flame size={20} />
                      </div>
                  </div>

                  <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={correlationData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                              <defs>
                                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={accentHex} stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor={accentHex} stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <XAxis dataKey="dateLabel" hide />
                              <YAxis hide domain={[0.5, 5.5]} />
                              <Area type="monotone" dataKey="score" stroke={accentHex} strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                              <Scatter dataKey="perfectScore" fill="#f59e0b" stroke="#fff" strokeWidth={2} />
                          </ComposedChart>
                      </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                      <div className="flex items-start gap-3">
                          <Info size={14} className="text-slate-300 shrink-0 mt-0.5" />
                          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 italic leading-relaxed">
                              DISCIPLINE SYNC maps the intersection of mood and output. Gold markers signify "Total Alignment" days.
                          </p>
                      </div>
                  </div>
            </div>
          )}
      </div>
  );
};
