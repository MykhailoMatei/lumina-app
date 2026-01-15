
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
    Book, PenLine, X, Send, Sparkles, Search, Trash2, 
    ImageIcon, Loader2, Target, Calendar, Camera, Pencil,
    Sun, Moon, Clock, Sunset, BookOpen, Zap, CloudRain, Shield,
    Activity, Circle, Wind
} from 'lucide-react';
import { generateEntryInsight } from '../services/geminiService';
import { uploadImage } from '../services/storageService';
import { JournalEntry } from '../types';

// Custom Minimalist Mood Glyphs to fit the "Lumina" aesthetic
const MoodGlyph: React.FC<{ type: string; active: boolean; color: string }> = ({ type, active, color }) => {
    // Re-balanced sizes: A bit bigger to feel substantial, but still contained
    const size = active ? 26 : 20;
    const strokeWidth = active ? 2.5 : 1.8;
    const commonClasses = `transition-all duration-500 ${active ? color : 'text-slate-300 dark:text-slate-700'}`;

    switch (type) {
        case 'Great':
            return (
                <div className="relative">
                    <Sparkles size={size} strokeWidth={strokeWidth} className={commonClasses} />
                </div>
            );
        case 'Good':
            return (
                <div className="relative">
                    <Sun size={size} strokeWidth={strokeWidth} className={commonClasses} />
                </div>
            );
        case 'Neutral':
            return <Circle size={size} strokeWidth={strokeWidth} className={commonClasses} />;
        case 'Bad':
            return <Wind size={size} strokeWidth={strokeWidth} className={commonClasses} />;
        case 'Awful':
            return <CloudRain size={size} strokeWidth={strokeWidth} className={commonClasses} />;
        default:
            return <Circle size={size} strokeWidth={strokeWidth} className={commonClasses} />;
    }
};

export const Journal: React.FC = () => {
    const { 
        journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry, goals, habits, user,
        t, themeClasses, language, dailyBriefing, preselectedGoalId, setPreselectedGoalId, circadian
    } = useApp();
    
    const [showEditor, setShowEditor] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [content, setContent] = useState('');
    
    // Defaulting to Neutral ('Still') as requested
    const [mood, setMood] = useState<'Great' | 'Good' | 'Neutral' | 'Bad' | 'Awful'>('Neutral');
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [linkedGoalId, setLinkedGoalId] = useState<string>('');
    const [linkedHabitId, setLinkedHabitId] = useState<string>('');
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [linkFilter, setLinkFilter] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (preselectedGoalId) {
            setLinkedGoalId(preselectedGoalId);
            setPreselectedGoalId(null);
            setShowEditor(true);
        }
    }, [preselectedGoalId]);

    const phaseIcon = useMemo(() => {
        switch(circadian.state) {
            case 'Morning': return <Sun size={12} className="animate-pulse" />;
            case 'Day': return <Clock size={12} />;
            case 'Evening': return <Sunset size={12} />;
            default: return <Moon size={12} />;
        }
    }, [circadian.state]);

    const MOODS = [
        { key: 'Great', label: 'Radiant', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { key: 'Good', label: 'Steady', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { key: 'Neutral', label: 'Still', color: 'text-slate-400', bg: 'bg-slate-400/10' },
        { key: 'Bad', label: 'Turbulent', color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { key: 'Awful', label: 'Heavy', color: 'text-rose-500', bg: 'bg-rose-500/10' }
    ];

    const sortedGoals = useMemo(() => {
        return goals.filter(g => g.title.toLowerCase().includes(linkFilter.toLowerCase()));
    }, [goals, linkFilter]);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setSubmitting(true);
        
        let imageUrl = attachedImage;
        
        if (attachedImage && attachedImage.startsWith('data:image') && user) {
            const uploadedUrl = await uploadImage('journal', `${user.id}/${Date.now()}`, attachedImage);
            if (uploadedUrl) imageUrl = uploadedUrl;
        }

        const linkedGoal = goals.find(g => g.id === linkedGoalId);
        const linkedHabit = habits.find(h => h.id === linkedHabitId);
        
        const entryToEdit = journalEntries.find(e => e.id === editingEntryId);
        let insight = entryToEdit?.aiInsight;
        
        if (!entryToEdit || entryToEdit.content !== content) {
            insight = await generateEntryInsight(
                content, 
                mood, 
                linkedGoal?.title || null, 
                linkedHabit?.title || null,
                attachedImage, 
                language
            );
        }

        if (editingEntryId) {
            updateJournalEntry(editingEntryId, {
                content,
                mood,
                linkedGoalId: linkedGoalId || undefined,
                linkedHabitId: linkedHabitId || undefined,
                imageData: imageUrl || undefined,
                aiInsight: insight
            });
        } else {
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
                imageData: imageUrl || undefined
            });
        }

        setSubmitting(false);
        resetEditor();
    };

    const handleEdit = (entry: JournalEntry) => {
        setEditingEntryId(entry.id);
        setContent(entry.content);
        setMood(entry.mood);
        setLinkedGoalId(entry.linkedGoalId || '');
        setLinkedHabitId(entry.linkedHabitId || '');
        setAttachedImage(entry.imageData || null);
        setShowEditor(true);
    };

    const resetEditor = () => {
        setContent('');
        setMood('Neutral');
        setLinkedGoalId('');
        setLinkedHabitId('');
        setAttachedImage(null);
        setLinkFilter('');
        setEditingEntryId(null);
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
        e.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="pb-32 space-y-4 animate-in fade-in duration-500">
            <div className={`-mx-6 -mt-6 p-6 pt-12 rounded-b-[2rem] bg-gradient-to-br ${circadian.headerGradient} shadow-lg relative transition-all duration-1000 overflow-hidden`}>
                <div className="absolute top-4 right-6 opacity-20 text-white">{phaseIcon}</div>
                <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center backdrop-blur-md text-white">
                            <Sparkles size={10} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">{circadian.state} Reflection</span>
                    </div>
                    <h1 className="text-lg font-black tracking-tight leading-snug pr-8 text-white">
                        {dailyBriefing?.journalPrompt || 'How did today shape who you are becoming?'}
                    </h1>
                    <button 
                        onClick={() => setShowEditor(true)} 
                        className={`w-full ${circadian.buttonStyle} px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-[0.97] transition-all flex items-center justify-center gap-2 group border border-white/10`}
                    >
                        <PenLine size={14} className={`transition-transform group-hover:rotate-12 ${circadian.iconContrast ? themeClasses.text : 'text-white'}`} />
                        <span className={circadian.iconContrast ? themeClasses.text : 'text-white'}>Capture Moment</span>
                    </button>
                </div>
            </div>

            {journalEntries.length > 0 && (
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors" size={16} />
                    <input 
                        placeholder="Search memories..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl pl-11 pr-4 text-xs font-bold outline-none shadow-sm transition-all dark:text-white" 
                    />
                </div>
            )}

            <div className="space-y-3 min-h-[40vh] flex flex-col">
                {journalEntries.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                        <BookOpen size={32} className="text-slate-200/20" />
                        <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight opacity-40">The first page is yours</h2>
                        <button 
                            onClick={() => setShowEditor(true)}
                            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-br ${themeClasses.gradient} text-white text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all`}
                        >
                            <PenLine size={12} /> Start Reflection
                        </button>
                    </div>
                ) : (
                    filtered.map((entry) => {
                        const linkedGoal = goals.find(g => g.id === entry.linkedGoalId);
                        const moodCfg = MOODS.find(m => m.key === entry.mood);
                        return (
                            <div key={entry.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-bottom-2">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl ${moodCfg?.bg} flex items-center justify-center shadow-inner`}>
                                            <MoodGlyph type={entry.mood} active={true} color={moodCfg?.color || 'text-slate-400'} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                                {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                            <div className="flex gap-2 mt-0.5">
                                                {linkedGoal && (
                                                    <div className="flex items-center gap-1">
                                                        <Target size={9} className={themeClasses.text} />
                                                        <span className={`text-[8px] font-black uppercase tracking-tighter ${themeClasses.text}`}>{linkedGoal.title}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(entry)} className="p-1.5 text-slate-300 hover:text-indigo-500 transition-all">
                                            <Pencil size={16}/>
                                        </button>
                                        <button onClick={() => deleteJournalEntry(entry.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-all">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {entry.imageData && (
                                        <div className="w-full h-40 rounded-xl overflow-hidden shadow-inner border border-slate-100 dark:border-slate-800">
                                            <img src={entry.imageData} className="w-full h-full object-cover" alt="Memory" />
                                        </div>
                                    )}
                                    <p className="text-slate-700 dark:text-slate-200 text-sm font-bold leading-relaxed">{entry.content}</p>
                                </div>
                                {entry.aiInsight && (
                                    <div className={`mt-4 ${themeClasses.secondary} ${themeClasses.text} p-3 rounded-xl text-[10px] font-bold flex items-center gap-3 border ${themeClasses.border}`}>
                                        <Sparkles size={14} className="animate-pulse" />
                                        <span className="italic leading-snug">"{entry.aiInsight}"</span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {showEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={resetEditor} />
                    <div className={`bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] overflow-hidden border border-white/10`}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400`}>
                                    <Calendar size={18} />
                                </div>
                                <h2 className="text-lg font-black tracking-tight dark:text-white">
                                    {editingEntryId ? 'Refine Entry' : 'Seal Moment'}
                                </h2>
                            </div>
                            <button onClick={resetEditor} className="p-2 text-slate-300 hover:text-slate-600 transition-all"><X size={20}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                            <div className={`p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border-l-4 ${themeClasses.border} shadow-sm`}>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Reflective Spark</p>
                                <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                    {dailyBriefing?.journalPrompt || "How did today contribute to your long-term vision?"}
                                </p>
                            </div>

                            <div className="space-y-3 bg-slate-50/30 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-[0.3em]">Neural Context</label>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <Search size={10} className="text-slate-300" />
                                        <input 
                                            value={linkFilter}
                                            onChange={e => setLinkFilter(e.target.value)}
                                            placeholder="Find..."
                                            className="bg-transparent text-[10px] font-black outline-none w-14 dark:text-white uppercase"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        <button 
                                            onClick={() => setLinkedGoalId('')}
                                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${linkedGoalId === '' ? `${themeClasses.primary} text-white border-transparent shadow-md` : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100'}`}
                                        >
                                            No Context
                                        </button>
                                        {sortedGoals.map(g => (
                                            <button 
                                                key={g.id}
                                                onClick={() => setLinkedGoalId(g.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${linkedGoalId === g.id ? `${themeClasses.primary} text-white border-transparent shadow-md` : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100'}`}
                                            >
                                                <Target size={10} strokeWidth={3} />
                                                {g.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <textarea 
                                    autoFocus
                                    value={content} 
                                    onChange={e => setContent(e.target.value)} 
                                    className="w-full min-h-[140px] bg-transparent resize-none outline-none text-base font-bold text-slate-800 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-800 leading-relaxed" 
                                    placeholder="Speak your truth..."
                                />
                                {attachedImage && (
                                    <div className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-slate-50 dark:border-slate-800 shadow-lg animate-in zoom-in-95">
                                        <img src={attachedImage} className="w-full h-full object-cover" alt="Memory" />
                                        <button onClick={() => setAttachedImage(null)} className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white p-1.5 rounded-full"><X size={12}/></button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.3em] ml-1">Vibration</p>
                                <div className="flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/40 p-1 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm h-14 overflow-hidden">
                                    {MOODS.map(m => (
                                        <button 
                                            key={m.key} 
                                            onClick={() => setMood(m.key as any)} 
                                            className={`flex-1 h-full flex flex-col items-center justify-center transition-all duration-500 relative rounded-2xl ${mood === m.key ? `bg-white dark:bg-slate-800` : 'opacity-25 grayscale hover:opacity-100'}`}
                                        >
                                            <MoodGlyph type={m.key} active={mood === m.key} color={m.color} />
                                            {mood === m.key && (
                                                <span className={`text-[6px] font-black uppercase tracking-[0.2em] ${m.color} mt-0.5 animate-in fade-in slide-in-from-top-1`}>
                                                    {m.label}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-between items-center border-t border-slate-50 dark:border-slate-800 shrink-0">
                             <div className="flex gap-2">
                                <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 active:scale-95 shadow-sm transition-all"><ImageIcon size={18}/></button>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                <button className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 active:scale-95 shadow-sm transition-all"><Camera size={18}/></button>
                             </div>
                             <button 
                                onClick={handleSubmit} 
                                disabled={!content.trim() || submitting} 
                                className={`px-8 py-3 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 bg-gradient-to-br ${themeClasses.gradient} disabled:opacity-50 active:scale-[0.98] transition-all`}
                             >
                                {submitting ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>}
                                {submitting ? (editingEntryId ? 'Uploading' : 'Saving') : (editingEntryId ? 'Update' : 'Seal Entry')}
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
