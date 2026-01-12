
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
    ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    Scatter, CartesianGrid, Line
} from 'recharts';
import { 
    Calendar, TrendingUp, Award, Activity, Sparkles, 
    Zap, Brain, Target, ArrowUpRight, Loader2, Clock, Sunset, Sun, Coffee
} from 'lucide-react';
import { generateGrowthAudit } from '../services/geminiService';

const THEME_HEX_MAP: Record<string, string> = {
  indigo: '#6366f1',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  blue: '#3b82f6'
};

interface CorrelationPoint {
  dateLabel: string;
  fullDate: string;
  score: number;
  perfectScore: number | null;
  completion: number;
}

export const Insights: React.FC = () => {
  const { habits, goals, journalEntries, themeColor, themeClasses, language, t } = useApp();
  const [timeframe, setTimeframe] = useState<'Week' | 'Month'>('Week');
  const [audit, setAudit] = useState<{ summary: string, correlation: string, advice: string, trajectory: string } | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const accentHex = THEME_HEX_MAP[themeColor || 'indigo'] || '#6366f1';

  useEffect(() => {
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
  }, [journalEntries.length, habits.length, timeframe]);

  const getDateRange = () => {
      const end = new Date();
      const start = new Date();
      if (timeframe === 'Week') start.setDate(end.getDate() - 7);
      else start.setMonth(end.getMonth() - 1);
      return { start, end };
  };

  const { start, end } = getDateRange();

  // --- Idea #1: Life-Correlation Mood Engine ---
  const correlationData = useMemo(() => {
      const moodMap: Record<string, number> = { 'Great': 5, 'Good': 4, 'Neutral': 3, 'Bad': 2, 'Awful': 1 };
      const result: CorrelationPoint[] = [];
      const daysCount = timeframe === 'Week' ? 7 : 30;
      
      for(let i = daysCount - 1; i >= 0; i--) {
          const d = new Date(); 
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          
          const entry = journalEntries.find(e => e.date && e.date.split('T')[0] === dateStr);
          const habitsDone = habits.filter(h => h.completedDates.includes(dateStr)).length;
          const habitsTotal = habits.length;
          const isPerfect = habitsTotal > 0 && habitsDone === habitsTotal;
          
          const score = entry ? (moodMap[entry.mood] || 3) : 3;

          result.push({
              dateLabel: d.toLocaleDateString(undefined, { weekday: 'short' }),
              fullDate: dateStr,
              score: score,
              perfectScore: isPerfect ? score : null,
              completion: habitsTotal > 0 ? (habitsDone / habitsTotal) * 100 : 0
          });
      }
      return result;
  }, [journalEntries, habits, timeframe]);

  // --- Idea #4: Biological Circadian Heatmap ---
  const circadianData = useMemo(() => {
      const slots = [
          { name: 'Morning', icon: <Coffee size={14} /> },
          { name: 'Afternoon', icon: <Sun size={14} /> },
          { name: 'Evening', icon: <Sunset size={14} /> },
          { name: 'Anytime', icon: <Zap size={14} /> },
      ];

      return slots.map(slot => {
          const set = habits.filter(h => h.timeOfDay === slot.name);
          const completions = set.reduce((acc, h) => {
              const inPeriod = h.completedDates.filter(d => {
                  const dObj = new Date(d);
                  return dObj >= start && dObj <= end;
              }).length;
              return acc + inPeriod;
          }, 0);
          const totalPossible = set.length * (timeframe === 'Week' ? 7 : 30);
          const rate = totalPossible > 0 ? Math.round((completions / totalPossible) * 100) : 0;
          
          return {
              ...slot,
              rate
          };
      });
  }, [habits, timeframe, start, end]);

  return (
      <div className="pb-40 space-y-6 animate-in fade-in duration-1000">
          {/* HEADER */}
          <div className="flex justify-between items-end px-1">
              <div>
                  <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Growth Audit</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Biological & Predictive AI</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 flex shadow-sm">
                  {(['Week', 'Month'] as const).map(t => (
                      <button 
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === t ? `${themeClasses.primary} text-white shadow-lg` : 'text-slate-400'}`}
                      >
                          {t}
                      </button>
                  ))}
              </div>
          </div>

          {/* AI STRATEGIST CARD */}
          <div className="relative p-8 rounded-[3rem] bg-slate-950 overflow-hidden shadow-2xl border border-white/5 group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
                
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <Brain size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-black text-sm uppercase tracking-wider">Strategic Audit</h2>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-400/80">Gemini Neural Analysis</p>
                            </div>
                        </div>
                        {loadingAudit && <Loader2 className="animate-spin text-white/20" size={18} />}
                    </div>

                    {loadingAudit ? (
                        <div className="space-y-3 py-2">
                            <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
                            <div className="h-4 w-3/4 bg-white/5 rounded-full animate-pulse" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-slate-300 font-bold text-sm leading-relaxed border-l-2 border-indigo-500 pl-4 py-1">
                                {audit?.summary}
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap size={14} className="text-amber-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Causal Link</span>
                                    </div>
                                    <p className="text-[11px] text-white/90 font-medium leading-relaxed">{audit?.correlation}</p>
                                </div>
                                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ArrowUpRight size={14} className="text-emerald-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Coach Advice</span>
                                    </div>
                                    <p className="text-[11px] text-white/90 font-medium leading-relaxed">{audit?.advice}</p>
                                </div>
                                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp size={14} className="text-indigo-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">30-Day Outlook</span>
                                    </div>
                                    <p className="text-[11px] text-white/90 font-medium leading-relaxed">{audit?.trajectory}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
          </div>

          {/* HEATMAP & CORRELATION GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* BIOLOGICAL TIMELINE (CIRCADIAN HEATMAP) */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group text-balance">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Circadian Success</h2>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Biological Rhythm Peak</p>
                        </div>
                        <div className={`p-3 rounded-2xl ${themeClasses.secondary} ${themeClasses.text}`}>
                            <Activity size={20} />
                        </div>
                    </div>

                    <div className="h-64 flex flex-col justify-center">
                        <div className="grid grid-cols-2 gap-6 px-4">
                            {circadianData.map(slot => (
                                <div key={slot.name} className="flex items-center gap-4 group/slot">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${slot.rate > 80 ? themeClasses.primary + ' text-white scale-110' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                        {slot.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">{slot.name}</p>
                                        <div className="flex items-end gap-1">
                                            <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{slot.rate}%</span>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Power</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
              </div>

              {/* LIFE-CORRELATION ENGINE (MOOD + HABITS) */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Sync-Map</h2>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Mood vs. Discipline Overlay</p>
                        </div>
                        <div className={`p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500`}>
                            <TrendingUp size={20} />
                        </div>
                    </div>

                    <div className="flex-1 min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={correlationData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={accentHex} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={accentHex} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis 
                                    dataKey="dateLabel" 
                                    tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 900}} 
                                    axisLine={false}
                                    tickLine={false}
                                    interval={timeframe === 'Month' ? 6 : 0}
                                />
                                <YAxis hide domain={[0.5, 5.5]} />
                                <Tooltip 
                                    contentStyle={{borderRadius: '24px', border: 'none', backgroundColor: '#020617', color: '#fff'}}
                                    itemStyle={{color: '#fff', fontSize: '10px'}}
                                    labelStyle={{fontWeight: 'bold', marginBottom: '4px'}}
                                    formatter={(value: any, name: string) => [value, name === 'score' ? 'Mood Score' : 'Perfect Sync']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke={accentHex} 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorScore)" 
                                    isAnimationActive={true}
                                />
                                <Scatter 
                                    dataKey="perfectScore" 
                                    fill="#f59e0b" 
                                    stroke="#fff" 
                                    strokeWidth={2}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-6 ml-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-1 rounded-full bg-indigo-500" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Mood Baseline</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-800 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">100% Habit Sync</span>
                        </div>
                    </div>
              </div>
          </div>

          {/* PREDICTIVE PATHFINDER */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-50 dark:border-slate-800 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500 opacity-20" />
                
                <div className="flex items-center gap-4 mb-8">
                    <div className={`w-14 h-14 rounded-3xl ${themeClasses.primary} text-white flex items-center justify-center shadow-xl`}>
                        <Target size={28} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Future Trajectory Projection</p>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Pathfinder Insight</h2>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 relative group cursor-help mb-4">
                    <Sparkles className="absolute top-6 right-6 text-indigo-400 opacity-20 group-hover:opacity-100 transition-opacity" size={20} />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-200 leading-relaxed pr-8 italic">
                        {audit?.trajectory || "Building trajectory model based on your rituals..."}
                    </p>
                </div>
          </div>
      </div>
  );
};
