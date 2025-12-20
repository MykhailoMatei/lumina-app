
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Goal, GoalCategory, Milestone } from '../types';
import { 
    Target, CheckCircle2, Sparkles, Loader2, Trash2, 
    Plus, Edit3, X, Zap, Pencil, ChevronDown, AlertCircle, Trophy, RotateCcw, Calendar, Layers, Check, Info, Circle, ChevronUp,
    ChevronRight, PartyPopper, ArrowRight
} from 'lucide-react';
import { generateMilestonesForGoal } from '../services/geminiService';

export const Goals: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, addHabit, language, themeClasses, t } = useApp();
  
  const [activeTab, setActiveTab] = useState<'active' | 'overdue' | 'completed'>('active');
  const [showModal, setShowModal] = useState(false);
  const [showRecalibrateModal, setShowRecalibrateModal] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [creationStep, setCreationStep] = useState<'type' | 'details'>('type');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  
  // Track goals currently in the "Celebration" phase before moving to Hall of Fame
  const [completingGoalId, setCompletingGoalId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<GoalCategory>(GoalCategory.Personal);
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newMilestones, setNewMilestones] = useState<string[]>([]);
  const [milestoneInput, setMilestoneInput] = useState('');
  const [generatingMilestones, setGeneratingMilestones] = useState(false);

  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const CATEGORY_MAP = useMemo(() => [
    { key: GoalCategory.Health, label: t('cat_health') },
    { key: GoalCategory.Career, label: t('cat_career') },
    { key: GoalCategory.Personal, label: t('cat_personal') },
    { key: GoalCategory.Financial, label: t('cat_financial') },
    { key: GoalCategory.Learning, label: t('cat_learning') },
    { key: GoalCategory.Relationships, label: t('cat_relationships') },
    { key: GoalCategory.Creativity, label: t('cat_creativity') },
  ], [t]);

  const GOAL_TEMPLATES = useMemo(() => [
    { title: t('tpl_read_title'), category: GoalCategory.Learning, desc: t('tpl_read_desc'), emoji: "📚" },
    { title: t('tpl_run_title'), category: GoalCategory.Health, desc: t('tpl_run_desc'), emoji: "🏃" },
    { title: t('tpl_save_title'), category: GoalCategory.Financial, desc: t('tpl_save_desc'), emoji: "💰" },
    { title: t('tpl_lang_title'), category: GoalCategory.Learning, desc: t('tpl_lang_desc'), emoji: "🌐" },
    { title: t('tpl_meditate_title'), category: GoalCategory.Health, desc: t('tpl_meditate_desc'), emoji: "🧘" },
  ], [t]);

  const categorizedGoals = useMemo(() => {
    return {
      active: goals.filter(g => !g.completed && (!g.deadline || g.deadline >= todayStr)),
      overdue: goals.filter(g => !g.completed && g.deadline && g.deadline < todayStr),
      completed: goals.filter(g => g.completed)
    };
  }, [goals, todayStr]);

  const displayedGoals = categorizedGoals[activeTab];

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    // Prevent interaction if goal is currently celebrating
    if (!goal || completingGoalId === goalId) return;

    const updatedMilestones = goal.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const totalCount = updatedMilestones.length;
    
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : goal.progress;
    const isNowFinished = newProgress === 100;

    if (isNowFinished && !goal.completed) {
        // CELEBRATION PHASE START
        setCompletingGoalId(goalId);
        setExpandedGoalId(goalId); // Ensure it's expanded to see the message
        
        // Update milestones and progress immediately to show 100%
        updateGoal(goalId, { 
          milestones: updatedMilestones, 
          progress: 100,
          completed: false // Keep it on the active list for the delay
        });

        // After 7 seconds, move it to the hall of fame
        setTimeout(() => {
            updateGoal(goalId, { completed: true });
            setCompletingGoalId(null);
        }, 7000);
    } else {
        updateGoal(goalId, { 
          milestones: updatedMilestones, 
          progress: newProgress,
          completed: false // If user unchecks a milestone, ensure it stays active
        });
    }
  };

  const handleOpenCreate = () => {
      setNewTitle('');
      setNewDesc('');
      setNewCategory(GoalCategory.Personal);
      setNewDeadline('');
      setNewMilestones([]);
      setEditingGoalId(null);
      setCreationStep('type');
      setShowModal(true);
  };

  const handleOpenEdit = (goal: Goal) => {
      setNewTitle(goal.title);
      setNewCategory(goal.category);
      setNewDesc(goal.description || '');
      setNewDeadline(goal.deadline || '');
      setNewMilestones(goal.milestones.map(m => m.title));
      setEditingGoalId(goal.id);
      setCreationStep('details');
      setShowModal(true);
  };

  const handleAiGenerateMilestones = async () => {
    if (!newTitle.trim()) return;
    setGeneratingMilestones(true);
    try {
        const context = `${newTitle}. Context: ${newDesc}`;
        const milestones = await generateMilestonesForGoal(context, language);
        setNewMilestones(milestones);
    } finally {
        setGeneratingMilestones(false);
    }
  };

  const addMilestone = () => {
      if (milestoneInput.trim()) {
          setNewMilestones(prev => [...prev, milestoneInput.trim()]);
          setMilestoneInput('');
      }
  };

  const removeMilestone = (idx: number) => {
      setNewMilestones(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDeadline || newMilestones.length === 0) return;
    
    const milestoneObjects = newMilestones.map((m) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: m,
        completed: false
    }));

    if (editingGoalId) {
        updateGoal(editingGoalId, {
            title: newTitle,
            description: newDesc,
            category: newCategory,
            deadline: newDeadline || undefined,
            milestones: milestoneObjects
        });
    } else {
        addGoal({
            id: Date.now().toString(),
            title: newTitle,
            description: newDesc,
            category: newCategory,
            progress: 0,
            completed: false,
            deadline: newDeadline || undefined,
            milestones: milestoneObjects
        });
    }
    setShowModal(false);
  };

  const handleRecalibrate = async (goalId: string, action: 'extend' | 'breakdown' | 'someday') => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      if (action === 'extend') {
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + 7);
          updateGoal(goalId, { deadline: newDate.toISOString().split('T')[0] });
      } else if (action === 'someday') {
          updateGoal(goalId, { deadline: undefined });
      } else if (action === 'breakdown') {
          setLoadingSuggestions(goalId);
          try {
              const newSteps = await generateMilestonesForGoal(goal.title, language);
              updateGoal(goalId, { 
                  milestones: newSteps.map(s => ({ id: Math.random().toString(36).substr(2, 9), title: s, completed: false })),
                  progress: 0
              });
          } finally {
              setLoadingSuggestions(null);
          }
      }
      setShowRecalibrateModal(null);
  };

  const selectTemplate = (template: any) => {
      setNewTitle(template.title);
      setNewCategory(template.category);
      setNewDesc(template.desc);
      setCreationStep('details');
  };

  const isFormValid = newTitle.trim().length > 0 && newDeadline !== '' && newMilestones.length > 0;

  return (
    <div className="pb-32 space-y-6 animate-in fade-in duration-700">
      {/* Header & Tabs */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t('my_goals')}</h1>
          <button onClick={handleOpenCreate} className={`bg-gradient-to-br ${themeClasses.gradient} text-white px-5 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2`}>
            <Plus size={16} strokeWidth={3}/> {t('new_goal').split(' ')[1]}
          </button>
        </div>

        <div className="bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex">
            {[
                { id: 'active', label: t('active_focus'), icon: Target },
                { id: 'overdue', label: t('overdue_label'), icon: AlertCircle, count: categorizedGoals.overdue.length },
                { id: 'completed', label: t('hall_of_fame'), icon: Trophy }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all relative ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 shadow-sm z-10' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
                >
                    <tab.icon size={14} className={activeTab === tab.id ? themeClasses.text : ''} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-slate-800 dark:text-slate-100' : ''}`}>{tab.label.split(' ')[0]}</span>
                    {tab.count ? <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[8px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">{tab.count}</span> : null}
                </button>
            ))}
        </div>
      </div>

      {/* Goals List - Compact Design */}
      <div className="space-y-4">
        {displayedGoals.map((goal) => {
          const isOverdue = !goal.completed && goal.deadline && goal.deadline < todayStr;
          const isExpanded = expandedGoalId === goal.id;
          const isCelebrating = completingGoalId === goal.id;
          const isCompleted = goal.completed;
          const catLabel = CATEGORY_MAP.find(c => c.key === goal.category)?.label || goal.category;
          const completedMilestones = goal.milestones.filter(m => m.completed).length;
          
          return (
            <div key={goal.id} className={`overflow-hidden rounded-[2rem] transition-all duration-700 ${
                isExpanded ? 'bg-transparent' : 
                isCelebrating ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/10 shadow-lg shadow-emerald-100' :
                'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm'
            }`}>
              
              {/* Goal Card Header */}
              <div 
                onClick={() => !isCelebrating && setExpandedGoalId(isExpanded ? null : goal.id)} 
                className={`flex items-center justify-between p-4 cursor-pointer transition-all ${
                    isCelebrating ? 'bg-emerald-50 dark:bg-emerald-900/30 rounded-[2rem] border border-emerald-200 dark:border-emerald-500/10 shadow-sm mb-2 scale-[1.01] animate-pulse-slow' :
                    isExpanded ? 'bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-2' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
                        isCelebrating || isCompleted ? 'bg-emerald-500 border-transparent text-white scale-110 shadow-md rotate-3' : 
                        isOverdue ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-200 text-amber-500' :
                        `${themeClasses.secondary} border-transparent ${themeClasses.text}`
                    }`}>
                        {isCelebrating || isCompleted ? <Trophy size={20} /> : <Target size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-bold truncate transition-colors duration-500 ${isCelebrating || isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                {goal.title}
                            </h3>
                            {isOverdue && !isCelebrating && !isCompleted && <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-600 animate-pulse">{t('overdue_label')}</span>}
                            {isCelebrating && <PartyPopper size={12} className="text-emerald-500 animate-bounce" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">{catLabel}</span>
                            {goal.deadline && (
                                <>
                                    <span className="w-0.5 h-0.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Calendar size={8} /> {goal.deadline}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Compact Progress Indicator */}
                    <div className="px-3 text-right">
                        <div className={`text-[10px] font-black transition-colors duration-500 ${isCelebrating || isCompleted ? 'text-emerald-500' : isOverdue ? 'text-amber-500' : themeClasses.text}`}>
                            {goal.progress}%
                        </div>
                        <div className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">
                            {completedMilestones}/{goal.milestones.length}
                        </div>
                    </div>
                </div>
                {!isCelebrating && (isExpanded ? <ChevronUp size={16} className="text-slate-300 ml-1" /> : <ChevronDown size={16} className="text-slate-300 ml-1" />)}
              </div>

              {/* Goal Card Body (Expanded) */}
              {(isExpanded || isCelebrating) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300 px-1 pb-3">
                    
                    {/* Congratulations Message */}
                    {isCelebrating && (
                        <div className="mx-2 mb-3 bg-emerald-500 rounded-2xl p-4 text-white shadow-lg animate-in zoom-in-95 duration-500">
                            <div className="flex items-center gap-3">
                                <Sparkles size={20} className="shrink-0" />
                                <div className="flex-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest mb-0.5">Incredible Win!</p>
                                    <p className="text-[13px] font-bold leading-tight opacity-90">Congratulations! This goal is moving to your Hall of Fame now...</p>
                                </div>
                                <div className="ml-auto w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                                    <ArrowRight size={16} strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Goal Description */}
                    {goal.description && (
                        <div className={`p-4 rounded-2xl border mb-1 transition-colors duration-500 ${isCelebrating ? 'bg-white/40 border-emerald-100 dark:bg-slate-800/20 dark:border-emerald-500/10' : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'}`}>
                             <div className="flex items-center gap-2 mb-2">
                                <Info size={10} className={isCelebrating ? 'text-emerald-400' : 'text-slate-400'} />
                                <span className={`text-[8px] font-black uppercase tracking-widest ${isCelebrating ? 'text-emerald-400' : 'text-slate-400'}`}>Purpose & Vision</span>
                             </div>
                             <p className={`text-xs font-medium leading-relaxed transition-colors duration-500 ${isCelebrating ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>{goal.description}</p>
                        </div>
                    )}

                    {/* Recalibrate Alert for Overdue */}
                    {isOverdue && !isCelebrating && !isCompleted && (
                        <button onClick={() => setShowRecalibrateModal(goal.id)} className="w-full flex items-center justify-between p-3.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl group active:scale-[0.98] transition-all mb-1">
                             <div className="flex items-center gap-3">
                                <RotateCcw size={16} className="text-amber-500" />
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">{t('recalibrate')}</span>
                             </div>
                             <ChevronRight size={14} className="text-amber-300" />
                        </button>
                    )}

                    {/* Milestones (Action Plan) - COMPACT DESIGN with Wrapping Support */}
                    <div className={`rounded-[1.75rem] border overflow-hidden shadow-sm transition-all duration-500 ${isCelebrating ? 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-500/10 opacity-70' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60'}`}>
                        <div className="px-4 pt-3.5 pb-2">
                             <span className={`text-[9px] font-black uppercase tracking-widest ml-1 ${isCelebrating ? 'text-emerald-300' : 'text-slate-300 dark:text-slate-600'}`}>{t('action_plan')}</span>
                        </div>
                        <div className={`divide-y transition-colors duration-500 ${isCelebrating ? 'divide-emerald-50 dark:divide-emerald-950/20' : 'divide-slate-50 dark:divide-slate-800'}`}>
                            {goal.milestones.map(m => (
                                <div key={m.id} className={`flex justify-between items-start p-3 gap-3 transition-all ${m.completed ? (isCelebrating ? 'bg-emerald-50/30 dark:bg-emerald-500/5' : 'bg-slate-50/50 dark:bg-slate-800/20') : ''}`}>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <h3 className={`font-semibold text-[13px] leading-snug break-words transition-colors duration-500 ${m.completed ? (isCelebrating ? 'text-emerald-300 line-through opacity-50' : 'text-slate-400 line-through opacity-60') : (isCelebrating ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200')}`}>
                                            {m.title}
                                        </h3>
                                    </div>
                                    <button 
                                        onClick={() => !isCelebrating && toggleMilestone(goal.id, m.id)} 
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all border ${
                                            m.completed ? `bg-emerald-500 border-transparent text-white shadow-sm` : 
                                            'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-transparent hover:border-slate-300 active:scale-90'
                                        }`}
                                    >
                                        <Check size={14} strokeWidth={4} className={m.completed ? 'opacity-100' : 'opacity-0'} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Goal Action Bar */}
                    {!isCelebrating && (
                        <div className="flex gap-2 pt-2 px-1">
                            <button onClick={() => handleOpenEdit(goal)} className="flex-1 py-3.5 bg-white dark:bg-slate-800 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2">
                                <Edit3 size={14} /> {t('edit')}
                            </button>
                            <button onClick={() => setShowDeleteConfirm(goal.id)} className="w-14 py-3.5 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-2xl border border-rose-100 dark:border-rose-900/20 shadow-sm active:scale-90 transition-transform flex items-center justify-center">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    )}
                </div>
              )}
            </div>
          );
        })}

        {displayedGoals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                {activeTab === 'completed' ? <Trophy size={64} strokeWidth={1}/> : activeTab === 'overdue' ? <Check size={64} strokeWidth={1}/> : <Target size={64} strokeWidth={1}/>}
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest">
                    {activeTab === 'completed' ? t('no_archive') : activeTab === 'overdue' ? t('no_overdue') : t('no_active_goals')}
                </p>
            </div>
        )}
      </div>

      {/* Recalibrate Modal */}
      {showRecalibrateModal && (
          <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-amber-100 dark:border-amber-900/40 relative animate-in zoom-in-95">
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4">
                          <RotateCcw size={32} />
                      </div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 tracking-tight">{t('recalibrate')}</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-2 leading-relaxed">{t('recalibrate_desc')}</p>
                  </div>
                  
                  <div className="space-y-3">
                      <button onClick={() => handleRecalibrate(showRecalibrateModal, 'extend')} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-amber-200 transition-all shadow-sm">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('extend_deadline')}</span>
                          <Calendar size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                      </button>
                      <button onClick={() => handleRecalibrate(showRecalibrateModal, 'breakdown')} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-amber-200 transition-all shadow-sm">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('break_down')}</span>
                          <Zap size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                      </button>
                      <button onClick={() => handleRecalibrate(showRecalibrateModal, 'someday')} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-amber-200 transition-all shadow-sm">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('move_someday')}</span>
                          <Layers size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                      </button>
                  </div>
                  
                  <button onClick={() => setShowRecalibrateModal(null)} className="w-full mt-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 active:scale-95 transition-all">{t('back')}</button>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 w-full max-w-[280px] rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-in zoom-in-95 text-center">
                  <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6">
                      <Trash2 size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-50 tracking-tight mb-2">{t('delete_goal_confirm')}</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed mb-8">
                      Do you really want to delete your goal? Your progress and all milestones will be permanently removed.
                  </p>
                  <div className="space-y-3">
                      <button onClick={() => { deleteGoal(showDeleteConfirm); setShowDeleteConfirm(null); }} className="w-full py-4 rounded-2xl bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-none active:scale-95 transition-all">{t('delete_key')}</button>
                      <button onClick={() => setShowDeleteConfirm(null)} className="w-full py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">{t('back')}</button>
                  </div>
              </div>
          </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 shadow-xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar border border-slate-100 dark:border-slate-800">
                <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 bg-slate-50 dark:bg-slate-800 rounded-full shadow-sm transition-colors"><X size={18}/></button>
                
                {creationStep === 'type' && !editingGoalId ? (
                    <div className="space-y-6">
                        <div className="pr-12">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-50 tracking-tight leading-tight">{t('choose_path_title')}</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{t('choose_path_subtitle')}</p>
                        </div>
                        <div className="space-y-3">
                            {GOAL_TEMPLATES.map((tpl, i) => (
                                <button key={i} onClick={() => selectTemplate(tpl)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:border-indigo-200 transition-all text-left shadow-sm">
                                    <span className="text-2xl">{tpl.emoji}</span>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{tpl.title}</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{tpl.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setCreationStep('details')} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-gradient-to-br ${themeClasses.gradient} shadow-lg shadow-indigo-200 dark:shadow-none`}>
                            {t('create_custom_goal')}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSaveGoal} className="space-y-6">
                        <div className="pr-12">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-50 tracking-tight leading-tight">{editingGoalId ? t('edit') : t('goal_details')}</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{t('refine_vision')}</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('goal_title_label')} <span className="text-rose-500">*</span></label>
                                <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3.5 rounded-xl border border-slate-100 dark:border-slate-700 outline-none text-sm font-bold shadow-sm focus:ring-2 focus:ring-slate-100" placeholder={t('goal_title_ph')} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('goal_category_label')}</label>
                                    <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 px-3 py-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-[10px] font-black uppercase tracking-wider shadow-sm">
                                        {CATEGORY_MAP.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('goal_deadline_label')} <span className="text-rose-500">*</span></label>
                                    <input required type="date" min={todayStr} value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className={`w-full bg-slate-50 dark:bg-slate-800 px-3 py-3 rounded-xl border outline-none text-[10px] font-black shadow-sm ${!newDeadline ? 'border-amber-100 dark:border-amber-900/30' : 'border-slate-100 dark:border-slate-700'}`} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('goal_why_label')}</label>
                                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3.5 rounded-xl border border-slate-100 dark:border-slate-700 outline-none text-xs font-medium h-20 resize-none shadow-sm" placeholder={t('goal_desc_ph')} />
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('action_plan')} <span className="text-rose-500">*</span></label>
                                    <button 
                                        type="button" 
                                        onClick={handleAiGenerateMilestones}
                                        disabled={generatingMilestones || !newTitle.trim()}
                                        className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${themeClasses.text} hover:opacity-70 transition-all disabled:opacity-30`}
                                    >
                                        {generatingMilestones ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>}
                                        {t('ai_breakdown')}
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input 
                                            value={milestoneInput}
                                            onChange={e => setMilestoneInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                                            className={`flex-1 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl border outline-none text-xs font-medium ${newMilestones.length === 0 ? 'border-amber-100 dark:border-amber-900/30' : 'border-slate-100 dark:border-slate-700'}`}
                                            placeholder={t('goal_step_ph')}
                                        />
                                        <button type="button" onClick={addMilestone} className={`w-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:${themeClasses.text}`}><Plus size={18}/></button>
                                    </div>
                                    <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
                                        {newMilestones.map((m, i) => (
                                            <div key={i} className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 px-3 py-2 rounded-lg border border-slate-50 dark:border-slate-700">
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate pr-2">{m}</span>
                                                <button type="button" onClick={() => removeMilestone(i)} className="text-slate-300 hover:text-rose-500 shrink-0"><X size={14}/></button>
                                            </div>
                                        ))}
                                        {newMilestones.length === 0 && (
                                            <p className="text-[10px] text-amber-500 font-bold italic text-center py-2">{t('set_milestone_btn')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button type="button" onClick={() => editingGoalId ? setShowModal(false) : setCreationStep('type')} className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95">{t('back')}</button>
                            <button type="submit" disabled={!isFormValid} className={`flex-2 py-4 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-gradient-to-br ${themeClasses.gradient} shadow-lg active:scale-95 transition-all disabled:opacity-30 disabled:grayscale`}>
                                {editingGoalId ? t('update_goal').split(' ')[0] : t('create_goal').split(' ')[0]}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
