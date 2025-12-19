import React, { useState, useMemo } from 'react';
import { useApp, THEMES } from '../context/AppContext';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
    AreaChart, Area
} from 'recharts';
import { Calendar, TrendingUp, Award, Activity } from 'lucide-react';

// Hex mapper for Recharts since it doesn't support Tailwind classes directly for data visualization
const THEME_HEX_MAP: Record<string, string> = {
  indigo: '#4f46e5', // indigo-600
  emerald: '#059669', // emerald-600
  rose: '#e11d48', // rose-600
  amber: '#d97706', // amber-600
  blue: '#2563eb'  // blue-600
};

interface MoodDataPoint {
    date: string;
    score: number | null;
    rawDate: string;
}

export const Insights: React.FC = () => {
  const { habits, goals, journalEntries, themeColor, themeClasses, t, language } = useApp();
  const [timeframe, setTimeframe] = useState<'Week' | 'Month'>('Week');

  const accentHex = THEME_HEX_MAP[themeColor || 'indigo'];

  // Helper to get date range
  const getDateRange = () => {
      const end = new Date();
      const start = new Date();
      if (timeframe === 'Week') {
          start.setDate(end.getDate() - 7);
      } else {
          start.setMonth(end.getMonth() - 1);
      }
      return { start, end };
  };

  const { start, end } = getDateRange();

  // --- Habit Analysis ---
  const habitStats = useMemo(() => {
      const daysCount = timeframe === 'Week' ? 7 : 30;
      
      return habits.map(h => {
          const completionsInPeriod = h.completedDates.filter(date => 
            new Date(date) >= start && new Date(date) <= end
          ).length;
          
          return {
              name: h.title.length > 12 ? h.title.substring(0, 10) + '..' : h.title,
              fullName: h.title,
              rate: Math.round((completionsInPeriod / daysCount) * 100),
              count: completionsInPeriod
          };
      }).sort((a,b) => b.rate - a.rate);
  }, [habits, timeframe, start, end]);

  // --- Mood Analysis ---
  const moodData = useMemo(() => {
      const moodMap = { 'Great': 5, 'Good': 4, 'Neutral': 3, 'Bad': 2, 'Awful': 1 };
      
      const grouped = journalEntries.reduce((acc, entry) => {
          const d = entry.date.split('T')[0];
          if (new Date(d) >= start && new Date(d) <= end) {
              if(!acc[d]) acc[d] = { sum: 0, count: 0 };
              acc[d].sum += moodMap[entry.mood as keyof typeof moodMap] || 3;
              acc[d].count += 1;
          }
          return acc;
      }, {} as Record<string, { sum: number, count: number }>);

      const result: MoodDataPoint[] = [];
      const daysCount = timeframe === 'Week' ? 7 : 30;
      for(let i=daysCount-1; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const data = grouped[dateStr];
          
          result.push({
              date: new Date(dateStr).toLocaleDateString(language === 'Ukrainian' ? 'uk-UA' : 'en-US', {weekday: 'short', day: 'numeric'}),
              score: data ? data.sum / data.count : null,
              rawDate: dateStr
          });
      }
      return result;
  }, [journalEntries, timeframe, start, end, language]);

  // --- Activity Analysis ---
  const activityData = useMemo(() => {
      const counts: Record<string, number> = {};
      journalEntries.forEach(entry => {
          if (new Date(entry.date) >= start && new Date(entry.date) <= end) {
              entry.activities.forEach(act => {
                  counts[act] = (counts[act] || 0) + 1;
              });
          }
      });
      
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 5);
  }, [journalEntries, start, end]);

  // --- Summary Metrics ---
  const overallAdherence = habitStats.length > 0 
      ? Math.round(habitStats.reduce((acc, h) => acc + h.rate, 0) / habitStats.length)
      : 0;
  
  const entriesCount = journalEntries.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
  }).length;
  
  const completedGoalsCount = goals.filter(g => g.completed).length; 

  return (
      <div className="pb-32 space-y-6 animate-in fade-in duration-700">
          <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t('progress_tracking')}</h1>
              <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800 flex text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  <button 
                    onClick={() => setTimeframe('Week')}
                    className={`px-4 py-2 rounded-lg transition-all ${timeframe === 'Week' ? `${themeClasses.primary} text-white shadow-md` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                      {t('week')}
                  </button>
                  <button 
                    onClick={() => setTimeframe('Month')}
                    className={`px-4 py-2 rounded-lg transition-all ${timeframe === 'Month' ? `${themeClasses.primary} text-white shadow-md` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                      {t('month')}
                  </button>
              </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                  <div className={`w-10 h-10 rounded-2xl ${themeClasses.secondary} ${themeClasses.text} flex items-center justify-center mb-2`}>
                      <TrendingUp size={20} />
                  </div>
                  <span className="text-xl font-bold text-slate-800 dark:text-slate-50">{overallAdherence}%</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('habit_rate')}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 delay-75">
                  <div className={`w-10 h-10 rounded-2xl ${themeClasses.secondary} ${themeClasses.text} flex items-center justify-center mb-2`}>
                      <Calendar size={20} />
                  </div>
                  <span className="text-xl font-bold text-slate-800 dark:text-slate-50">{entriesCount}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('entries')}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 delay-150">
                  <div className={`w-10 h-10 rounded-2xl ${themeClasses.secondary} ${themeClasses.text} flex items-center justify-center mb-2`}>
                      <Award size={20} />
                  </div>
                  <span className="text-xl font-bold text-slate-800 dark:text-slate-50">{completedGoalsCount}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('goals_done')}</span>
              </div>
          </div>

          {/* Charts */}
          
          {/* 1. Habit Performance */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('habit_consistency')}</h2>
                 <span className={`text-[9px] font-bold uppercase tracking-widest ${themeClasses.text}`}>{t('completion_rate')}</span>
             </div>
             <div className="h-64">
                {habitStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={habitStats} layout="vertical" margin={{ left: -10, right: 20 }}>
                            <XAxis type="number" hide domain={[0, 100]} />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={80} 
                                tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} 
                                interval={0}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff'}} 
                                itemStyle={{color: '#fff', fontSize: '10px', fontWeight: 'bold'}}
                                labelStyle={{display: 'none'}}
                                formatter={(value: number) => [`${value}%`, t('habit_consistency')]}
                            />
                            <Bar dataKey="rate" radius={[0, 8, 8, 0]} barSize={24}>
                                {habitStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.rate >= 80 ? accentHex : entry.rate >= 50 ? `${accentHex}99` : '#cbd5e1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">{t('no_habits')}</div>
                )}
             </div>
          </div>

          {/* 2. Emotional Trend */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('emotional_journey')}</h2>
                 <Activity size={16} className={themeClasses.text} />
             </div>
             <div className="h-48">
                {moodData.some(d => d.score !== null) ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={moodData}>
                            <defs>
                                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={accentHex} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={accentHex} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="date" 
                                tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 600}} 
                                interval={timeframe === 'Week' ? 0 : 6} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis hide domain={[1, 5]} />
                            <Tooltip 
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff'}} 
                                itemStyle={{color: '#fff', fontSize: '10px', fontWeight: 'bold'}}
                                labelStyle={{color: '#94a3b8', fontSize: '8px', marginBottom: '4px'}}
                                formatter={(val: number) => [val.toFixed(1), t('emotional_journey')]}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="score" 
                                stroke={accentHex} 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorMood)" 
                                connectNulls
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">{t('no_templates_msg')}</div>
                )}
             </div>
          </div>

          {/* 3. Top Activities */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">{t('core_drivers')}</h2>
                <div className="flex flex-wrap gap-2">
                    {activityData.length > 0 ? activityData.map((act, i) => (
                        <div key={i} className={`flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 transition-transform active:scale-95`}>
                            <div className={`w-2 h-2 rounded-full ${i === 0 ? themeClasses.primary : 'bg-slate-300 dark:bg-slate-600'}`} />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{act.name}</span>
                            <span className={`text-[10px] ${themeClasses.text} font-black ml-1`}>{act.value}x</span>
                        </div>
                    )) : (
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic py-4">{t('no_habits')}</p>
                    )}
                </div>
          </div>
      </div>
  );
};