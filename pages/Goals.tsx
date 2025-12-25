
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Goal, GoalCategory, Milestone } from '../types';
import { Target, Trophy, Plus, ChevronDown, Check, Sparkles, Loader2, X, Trash2, ListPlus, Calendar, Info, Pencil } from 'lucide-react';
import { generateMilestonesForGoal } from '../services/geminiService';

export const Goals: React.FC = () => {
    const { goals, addGoal, updateGoal, deleteGoal, themeClasses, t, language } = useApp();
    const [activeTab, setActiveTab] = useState<'active' | 'needs' | 'hall'>('active');
    const [showModal, setShowModal] = useState(false);
    const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<GoalCategory>(GoalCategory.Personal);
    const [deadline, setDeadline] = useState('');
    const [milestones, setMilestones] = useState<string[]>([]);
    const [manualMilestone, setManualMilestone] = useState('');

    const filtered = goals.filter(g => {
        if (activeTab === 'active') return !g.completed;
        if (activeTab === 'hall') return g.completed;
        return false;
    });

    const handleSaveGoal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        
        const milestoneTitles = milestones.length > 0 ? milestones : [title];

        if (editingGoalId) {
            const existingGoal = goals.find(g => g.id === editingGoalId);
            if (!existingGoal) return;

            // Map new milestone titles to objects, preserving completion if title matches
            const updatedMilestones: Milestone[] = milestoneTitles.map(mTitle => {
                const existing = existingGoal.milestones.find(m => m.title === mTitle);
                return {
                    id: existing?.id || Math.random().toString(36).substr(2, 9),
                    title: mTitle,
                    completed: existing?.completed || false
                };
            });

            const progress = Math.round((updatedMilestones.filter(m => m.completed).length / updatedMilestones.length) * 100);

            updateGoal(editingGoalId, {
                title,
                category,
                deadline: deadline || undefined,
                milestones: updatedMilestones,
                progress,
                completed: progress === 100
            });
        } else {
            addGoal({
                id: Date.now().toString(),
                title, 
                category, 
                progress: 0, 
                completed: false,
                milestones: milestoneTitles.map(m => ({ 
                    id: Math.random().toString(36).substr(2, 9), 
                    title: m, 
                    completed: false 
                })),
                deadline: deadline || undefined
            });
        }
        resetForm();
    };

    const handleEditClick = (goal: Goal) => {
        setEditingGoalId(goal.id);
        setTitle(goal.title);
        setCategory(goal.category);
        setDeadline(goal.deadline || '');
        setMilestones(goal.milestones.map(m => m.title));
        setShowModal(true);
    };

    const resetForm = () => {
        setShowModal(false);
        setEditingGoalId(null);
        setTitle('');
        setDeadline('');
        setCategory(GoalCategory.Personal);
        setMilestones([]);
        setManualMilestone('');
    };

    const handleGenerate = async () => {
        if (!title.trim()) return;
        setGenerating(true);
        const results = await generateMilestonesForGoal(title, language);
        setMilestones(prev => [...prev, ...results]);
        setGenerating(false);
    };

    const addManualMilestone = () => {
        if (manualMilestone.trim()) {
            setMilestones(prev => [...prev, manualMilestone.trim()]);
            setManualMilestone('');
        }
    };

    const toggleMilestone = (goalId: string, mid: string) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        const newMilestones = goal.milestones.map(m => m.id === mid ? { ...m, completed: !m.completed } : m);
        const progress = Math.round((newMilestones.filter(m => m.completed).length / newMilestones.length) * 100);
        updateGoal(goalId, { milestones: newMilestones, progress, completed: progress === 100 });
    };

    return (
        <div className="pb-32 space-y-6 animate-in fade-in">
            {/* COMPACT HEADER */}
            <div className="flex justify-between items-center px-1 pt-2">
                <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">My Goals</h1>
                <button 
                    onClick={() => setShowModal(true)} 
                    className={`${themeClasses.primary} text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest`}
                >
                    <Plus size={18} strokeWidth={4} /> GOAL
                </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex shadow-sm">
                {(['active', 'needs', 'hall'] as const).map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-white border border-slate-50 dark:border-slate-700' : 'text-slate-300'}`}
                    >
                        {tab === 'active' && <Target size={14} className={activeTab === tab ? themeClasses.text : ''} />}
                        {tab === 'needs' && <Sparkles size={14} />}
                        {tab === 'hall' && <Trophy size={14} />}
                        {tab}
                    </button>
                ))}
            </div>

            {/* LIST OF GOALS */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="py-20 text-center opacity-20">
                        <Target size={48} className="mx-auto text-slate-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest mt-4">Empty Horizon</p>
                    </div>
                ) : (
                    filtered.map(goal => (
                        <div key={goal.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
                            <div 
                                onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)} 
                                className="p-4 flex items-center justify-between cursor-pointer"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${goal.completed ? 'bg-emerald-500 text-white' : `${themeClasses.secondary} ${themeClasses.text} border ${themeClasses.border}`}`}>
                                        <Target size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-[14px] text-slate-800 dark:text-white leading-tight truncate">{goal.title}</h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[7px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-md tracking-widest border border-slate-100/50 dark:border-slate-800">
                                                {goal.category}
                                            </span>
                                            {goal.deadline && (
                                                <div className="flex items-center gap-1 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                                    <Calendar size={9} /> {goal.deadline}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 ml-2">
                                    <div className="text-right">
                                        <p className={`text-[11px] font-black ${themeClasses.text}`}>{goal.progress}%</p>
                                        <p className="text-[8px] font-bold text-slate-300 tracking-tighter">
                                            {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length}
                                        </p>
                                    </div>
                                    <ChevronDown size={14} className={`text-slate-200 transition-transform ${expandedGoalId === goal.id ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {/* EXPANDED SECTION */}
                            {expandedGoalId === goal.id && (
                                <div className="px-5 pb-5 pt-1 animate-in slide-in-from-top-2 bg-slate-50/20 dark:bg-slate-800/10">
                                    <div className="space-y-2 mb-4">
                                        {goal.milestones.map(m => (
                                            <div key={m.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-50 dark:border-slate-800/50 shadow-sm">
                                                <span className={`text-[11px] font-bold leading-snug flex-1 pr-4 ${m.completed ? 'line-through text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>{m.title}</span>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleMilestone(goal.id, m.id); }} 
                                                    className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all ${m.completed ? 'bg-emerald-500 border-transparent text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-transparent'}`}
                                                >
                                                    <Check size={14} strokeWidth={4} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-4 pt-2">
                                        <button 
                                            onClick={() => handleEditClick(goal)} 
                                            className="text-[8px] font-black uppercase text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-all"
                                        >
                                            <Pencil size={11}/> {t('edit')}
                                        </button>
                                        <button 
                                            onClick={() => deleteGoal(goal.id)} 
                                            className="text-[8px] font-black uppercase text-rose-300 hover:text-rose-500 flex items-center gap-1.5 transition-all"
                                        >
                                            <Trash2 size={11}/> {t('delete_key')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* CREATE/EDIT GOAL MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[85vh]">
                        <button onClick={resetForm} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition-colors"><X size={20}/></button>
                        
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{editingGoalId ? 'Edit Goal' : 'New Goal'}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Design your outcome</p>
                        </div>

                        <form onSubmit={handleSaveGoal} className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-1 pb-4">
                            {/* TITLE INPUT */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest ml-1 leading-none">Title</label>
                                <input 
                                    required 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-5 h-14 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500/10 dark:text-white" 
                                    placeholder="e.g. Master Roast" 
                                />
                            </div>

                            {/* CATEGORY & DATE - PERFECT SYMMETRY */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 flex flex-col">
                                    <div className="h-4 flex items-center ml-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest leading-none">Category</label>
                                    </div>
                                    <div className="relative">
                                        <select 
                                            value={category}
                                            onChange={e => setCategory(e.target.value as GoalCategory)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 h-14 text-[11px] font-bold dark:text-white outline-none appearance-none cursor-pointer pr-10"
                                        >
                                            {Object.values(GoalCategory).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <div className="h-4 flex items-center gap-2 ml-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest leading-none">End Date</label>
                                        <div className="relative group/tooltip inline-flex items-center">
                                            <Info size={10} className="text-slate-300 opacity-60 cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap shadow-xl border border-white/10">
                                                Optional requirement
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="date"
                                            value={deadline}
                                            onChange={e => setDeadline(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 h-14 text-[11px] font-bold dark:text-white outline-none cursor-pointer flex items-center appearance-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* STRATEGY SECTION */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Strategy</span>
                                    <button 
                                        type="button" 
                                        onClick={handleGenerate} 
                                        disabled={generating || !title} 
                                        className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${themeClasses.text} hover:opacity-70 transition-all disabled:opacity-20`}
                                    >
                                        {generating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} AI STRATEGY
                                    </button>
                                </div>

                                <div className="flex gap-2 items-stretch">
                                    <input 
                                        value={manualMilestone}
                                        onChange={e => setManualMilestone(e.target.value)}
                                        className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 h-14 text-[11px] font-bold outline-none dark:text-white"
                                        placeholder="Add milestone step..."
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addManualMilestone())}
                                    />
                                    <button 
                                        type="button"
                                        onClick={addManualMilestone}
                                        className={`w-14 h-14 rounded-2xl ${themeClasses.secondary} ${themeClasses.text} border ${themeClasses.border} flex items-center justify-center shadow-sm active:scale-95 transition-all shrink-0`}
                                    >
                                        <ListPlus size={20} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {milestones.map((m, i) => (
                                        <div key={i} className="group p-3 bg-white dark:bg-slate-800/30 rounded-2xl text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 flex justify-between items-center shadow-sm">
                                            <span className="flex-1 truncate pr-4">{m}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setMilestones(prev => prev.filter((_, idx) => idx !== i))}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-rose-300 hover:text-rose-500 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={!title} 
                                className={`w-full py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-white shadow-2xl transition-all active:scale-95 bg-gradient-to-br ${themeClasses.gradient} disabled:opacity-50 mt-4`}
                            >
                                {editingGoalId ? 'UPDATE' : 'SAVE'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
