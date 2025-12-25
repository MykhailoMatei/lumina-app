
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
    Book, PenLine, X, Send, Sparkles, Search, Trash2, 
    ImageIcon, Loader2, Target, History, Calendar, Camera, Zap
} from 'lucide-react';
import { generateEntryInsight } from '../services/geminiService';

export const Journal: React.FC = () => {
    const { 
        journalEntries, addJournalEntry, deleteJournalEntry, goals, habits,
        t, themeClasses, language, dailyBriefing 
    } = useApp();
    
    const [showEditor, setShowEditor] = useState(false);
    const [content, setContent] = useState('');
    const [mood, setMood] = useState<'Great' | 'Good' | 'Neutral' | 'Bad' | 'Awful'>('Great');
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [linkedGoalId, setLinkedGoalId] = useState<string>('');
    const [linkedHabitId, setLinkedHabitId] = useState<string>('');
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [linkFilter, setLinkFilter] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MOODS = [
        { key: 'Great', emoji: '🤩', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { key: 'Good', emoji: '🙂', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { key: 'Neutral', emoji: '😐', color: 'text-slate-400', bg: 'bg-slate-400/10' },
        { key: 'Bad', emoji: '☹️', color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { key: 'Awful', emoji: '😫', color: 'text-rose-500', bg: 'bg-rose-500/10' }
    ];

    const currentMoodConfig = useMemo(() => MOODS.find(m => m.key === mood), [mood]);

    // Sorting Logic for Links
    const sortedGoals = useMemo(() => {
        return goals.filter(g => !g.completed && g.title.toLowerCase().includes(linkFilter.toLowerCase()));
    }, [goals, linkFilter]);

    const sortedHabits = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return habits
            .filter(h => h.title.toLowerCase().includes(linkFilter.toLowerCase()))
            .sort((a, b) => {
                const aDone = a.completedDates.includes(today);
                const bDone = b.completedDates.includes(today);
                if (aDone && !bDone) return -1; // Show just-completed first
                if (!aDone && bDone) return 1;
                return 0;
            });
    }, [habits, linkFilter]);

    const flashback = useMemo(() => {
        if (journalEntries.length < 2) return null;
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const oldEntries = journalEntries.filter(e => new Date(e.date) < threeDaysAgo);
        if (oldEntries.length === 0) return null;
        return oldEntries[Math.floor(Math.random() * oldEntries.length)];
    }, [journalEntries]);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setSubmitting(true);
        
        const linkedGoal = goals.find(g => g.id === linkedGoalId);
        const linkedHabit = habits.find(h => h.id === linkedHabitId);
        
        const insight = await generateEntryInsight(
            content, 
            mood, 
            linkedGoal?.title || null, 
            linkedHabit?.title || null,
            attachedImage, 
            language
        );

        addJournalEntry({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            content, 
            mood, 
            activities: [],
            prompt: dailyBriefing?.journalPrompt || "What's on your mind?",
            aiInsight: insight,
            linkedGoalId: linkedGoalId || undefined,
            linkedHabitId: linkedHabitId || undefined,
            imageData: attachedImage || undefined
        });

        setSubmitting(false);
        resetEditor();
    };

    const resetEditor = () => {
        setContent('');
        setMood('Great');
        setLinkedGoalId('');
        setLinkedHabitId('');
        setAttachedImage(null);
        setLinkFilter('');
        setShowEditor(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setAttachedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const filtered = journalEntries.filter((e: any) => 
        e.content.toLowerCase().includes(search.toLowerCase()) || 
        (goals.find(g => g.id === e.linkedGoalId)?.title || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="pb-32 space-y-6 animate-in fade-in duration-500">
            {/* REFINED HERO PROMPT SECTION */}
            <div className={`p-6 rounded-[2.5rem] bg-gradient-to-br ${themeClasses.gradient} text-white shadow-xl relative overflow-hidden group transition-all duration-500`}>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                
                <div className="relative z-10 space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                                <Sparkles size={12} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80">Daily Focus</span>
                        </div>
                    </div>
                    
                    <h1 className="text-lg font-semibold tracking-tight leading-relaxed pr-4 opacity-95">
                        {dailyBriefing?.journalPrompt || 'How did today shape who you are becoming?'}
                    </h1>
                    
                    <button 
                        onClick={() => setShowEditor(true)} 
                        className="w-full bg-white/95 text-slate-900 px-5 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-white active:scale-[0.98] shadow-lg transition-all flex items-center justify-center gap-2 group"
                    >
                        <PenLine size={14} className="group-hover:rotate-12 transition-transform" />
                        Start Writing
                    </button>
                </div>
            </div>

            {/* FLASHBACK BANNER */}
            {flashback && !showEditor && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0">
                        <History size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-amber-500 mb-0.5">Flashback Perspective</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-amber-200 line-clamp-1 italic">"{flashback.content}"</p>
                    </div>
                    <button 
                        onClick={() => setSearch(flashback.content.substring(0, 10))}
                        className="text-[9px] font-black uppercase tracking-tighter text-amber-600 hover:underline"
                    >
                        View
                    </button>
                </div>
            )}

            {/* SEARCH & FILTERS */}
            <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                    placeholder="Search memories or linked goals..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] pl-14 pr-4 text-sm font-bold outline-none shadow-sm focus:ring-4 focus:ring-indigo-500/5 transition-all dark:text-white" 
                />
            </div>

            {/* ENTRY FEED */}
            <div className="space-y-4">
                {filtered.map((entry) => {
                    const linkedGoal = goals.find(g => g.id === entry.linkedGoalId);
                    const linkedHabit = habits.find(h => h.id === entry.linkedHabitId);
                    return (
                        <div key={entry.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl ${MOODS.find(m => m.key === entry.mood)?.bg} flex items-center justify-center text-xl`}>
                                        {MOODS.find(m => m.key === entry.mood)?.emoji}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                        <div className="flex gap-2 mt-0.5">
                                            {linkedGoal && (
                                                <div className="flex items-center gap-1">
                                                    <Target size={10} className={themeClasses.text} />
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${themeClasses.text}`}>{linkedGoal.title}</span>
                                                </div>
                                            )}
                                            {linkedHabit && (
                                                <div className="flex items-center gap-1 opacity-60">
                                                    <Zap size={10} className="text-amber-500" />
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter text-amber-500`}>{linkedHabit.title}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => deleteJournalEntry(entry.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all">
                                    <Trash2 size={16}/>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {entry.imageData && (
                                    <div className="w-full h-40 rounded-3xl overflow-hidden shadow-inner border border-slate-50 dark:border-slate-800">
                                        <img src={entry.imageData} className="w-full h-full object-cover" alt="Memory" />
                                    </div>
                                )}
                                <p className="text-slate-700 dark:text-slate-200 text-sm font-medium leading-relaxed">{entry.content}</p>
                            </div>

                            {entry.aiInsight && (
                                <div className={`mt-6 ${themeClasses.secondary} ${themeClasses.text} p-4 rounded-3xl text-xs font-bold flex items-center gap-4 border ${themeClasses.border} animate-in zoom-in-95 duration-700`}>
                                    <div className={`w-8 h-8 rounded-full ${themeClasses.primary} text-white flex items-center justify-center shrink-0 shadow-lg`}>
                                        <Sparkles size={14} className="animate-pulse" />
                                    </div>
                                    <span className="italic leading-snug">"{entry.aiInsight}"</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* IMMERSIVE EDITOR */}
            {showEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={resetEditor} />
                    
                    <div className={`bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] p-8 md:p-10 shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] overflow-hidden border border-white/20`}>
                        {/* Dynamic Background Glow */}
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-[80px] -z-10 transition-colors duration-1000 ${currentMoodConfig?.color.replace('text', 'bg')} opacity-20`} />
                        
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400`}>
                                    <Calendar size={18} />
                                </div>
                                <h2 className="text-lg font-black tracking-tight dark:text-white">Reflection Space</h2>
                            </div>
                            <button onClick={resetEditor} className="p-3 text-slate-300 hover:text-slate-600 transition-all"><X size={20}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-1">
                            {/* GUIDED PROMPT */}
                            <div className={`p-5 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/40 border-l-8 ${themeClasses.border} shadow-sm`}>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Guided Prompt</p>
                                <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                    {dailyBriefing?.journalPrompt || "How did today contribute to your long-term vision?"}
                                </p>
                            </div>

                            {/* SMART LINKING SYSTEM */}
                            <div className="space-y-4 bg-slate-50/30 dark:bg-slate-800/20 p-5 rounded-[2.5rem] border border-slate-50 dark:border-slate-800">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Connect Context</label>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                                        <Search size={10} className="text-slate-300" />
                                        <input 
                                            value={linkFilter}
                                            onChange={e => setLinkFilter(e.target.value)}
                                            placeholder="Find..."
                                            className="bg-transparent text-[10px] font-bold outline-none w-16 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* HABIT PILLS */}
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        <button 
                                            onClick={() => setLinkedHabitId('')}
                                            className={`px-3 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${linkedHabitId === '' ? 'bg-amber-500 text-white border-transparent' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100'}`}
                                        >
                                            No Habit
                                        </button>
                                        {sortedHabits.map(h => (
                                            <button 
                                                key={h.id}
                                                onClick={() => {
                                                    setLinkedHabitId(h.id);
                                                    if (h.linkedGoalId) setLinkedGoalId(h.linkedGoalId);
                                                }}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${linkedHabitId === h.id ? 'bg-amber-500 text-white border-transparent shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100'}`}
                                            >
                                                <Zap size={10} />
                                                {h.title}
                                            </button>
                                        ))}
                                    </div>

                                    {/* GOAL PILLS */}
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        <button 
                                            onClick={() => setLinkedGoalId('')}
                                            className={`px-3 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${linkedGoalId === '' ? `${themeClasses.primary} text-white border-transparent` : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100'}`}
                                        >
                                            No Goal
                                        </button>
                                        {sortedGoals.map(g => (
                                            <button 
                                                key={g.id}
                                                onClick={() => setLinkedGoalId(g.id)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${linkedGoalId === g.id ? `${themeClasses.primary} text-white border-transparent shadow-lg` : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100'}`}
                                            >
                                                <Target size={10} />
                                                {g.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* MAIN EDITOR */}
                            <div className="space-y-4">
                                <textarea 
                                    autoFocus
                                    value={content} 
                                    onChange={e => setContent(e.target.value)} 
                                    className="w-full min-h-[160px] bg-transparent resize-none outline-none text-lg font-bold text-slate-800 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-800 leading-relaxed" 
                                    placeholder="Speak your truth..."
                                />
                                
                                {attachedImage && (
                                    <div className="relative w-full h-40 rounded-[2rem] overflow-hidden border-2 border-slate-100 dark:border-slate-800">
                                        <img src={attachedImage} className="w-full h-full object-cover" alt="Memory" />
                                        <button onClick={() => setAttachedImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full"><X size={14}/></button>
                                    </div>
                                )}
                            </div>

                            {/* MOOD SELECTION */}
                            <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Current State</p>
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-[2.5rem]">
                                    {MOODS.map(m => (
                                        <button 
                                            key={m.key} 
                                            onClick={() => setMood(m.key as any)} 
                                            className={`flex flex-col items-center p-3 rounded-full transition-all ${mood === m.key ? `bg-white dark:bg-slate-700 scale-110 shadow-md ${m.color}` : 'opacity-30 grayscale'}`}
                                        >
                                            <span className="text-2xl">{m.emoji}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* TOOLBAR */}
                        <div className="pt-6 flex justify-between items-center border-t border-slate-50 dark:border-slate-800 shrink-0">
                             <div className="flex gap-2">
                                <button onClick={() => fileInputRef.current?.click()} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 active:scale-95"><ImageIcon size={18}/></button>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                <button className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 active:scale-95"><Camera size={18}/></button>
                             </div>
                             
                             <button 
                                onClick={handleSubmit} 
                                disabled={!content.trim() || submitting} 
                                className={`px-8 py-3.5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 bg-gradient-to-br ${themeClasses.gradient} disabled:opacity-50`}
                             >
                                {submitting ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>}
                                {submitting ? 'Synthesizing' : 'Seal Entry'}
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
