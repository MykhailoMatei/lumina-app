
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Goal, GoalCategory, Milestone } from '../types';
import { 
    Target, CheckCircle2, Sparkles, Loader2, Trash2, 
    Plus, Edit3, X, Zap, Pencil, ChevronDown, AlertCircle
} from 'lucide-react';
import { suggestHabitsFromGoals, generateMilestonesForGoal } from '../services/geminiService';

export const Goals: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, addHabit, language, themeClasses, t } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [creationStep, setCreationStep] = useState<'type' | 'details'>('type');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<GoalCategory>(GoalCategory.Personal);
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newMilestones, setNewMilestones] = useState<string[]>([]);
  const [milestoneInput, setMilestoneInput] = useState('');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD for min attribute
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Categorization mapping
  const CATEGORY_MAP = useMemo(() => [
    { key: GoalCategory.Health, label: t('cat_health') },
    { key: GoalCategory.Career, label: t('cat_career') },
    { key: GoalCategory.Personal, label: t('cat_personal') },
    { key: GoalCategory.Financial, label: t('cat_financial') },
    { key: GoalCategory.Learning, label: t('cat_learning') },
    { key: GoalCategory.Relationships, label: t('cat_relationships') },
    { key: GoalCategory.Creativity, label: t('cat_creativity') },
  ], [t]);

  // Goal templates localized
  const GOAL_TEMPLATES = useMemo(() => [
    { title: t('tpl_read_title'), category: GoalCategory.Learning, desc: t('tpl_read_desc'), emoji: "📚" },
    { title: t('tpl_run_title'), category: GoalCategory.Health, desc: t('tpl_run_desc'), emoji: "🏃" },
    { title: t('tpl_save_title'), category: GoalCategory.Financial, desc: t('tpl_save_desc'), emoji: "💰" },
    { title: t('tpl_lang_title'), category: GoalCategory.Learning, desc: t('tpl_lang_desc'), emoji: "🌐" },
    { title: t('tpl_meditate_title'), category: GoalCategory.Health, desc: t('tpl_meditate_desc'), emoji: "🧘" },
  ], [t]);

  const isDeadlineValid = useMemo(() => {
    if (!newDeadline) return true; // Deadline is optional
    return newDeadline >= todayStr;
  }, [newDeadline, todayStr]);

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
      setNewDesc(goal.description || '');
      setNewCategory(goal.category);
      setNewDeadline(goal.deadline || '');
      setNewMilestones(goal.milestones.map((m: Milestone) => m.title));
      setEditingGoalId(goal.id);
      setCreationStep('details');
      setShowModal(true);
  };

  const selectTemplate = (template: typeof GOAL_TEMPLATES[0]) => {
      setNewTitle(template.title);
      setNewCategory(template.category);
      setNewDesc(template.desc);
      setCreationStep('details');
  };

  const handleGeneratePlan = async () => {
      if(!newTitle) return;
      setGeneratingPlan(true);
      try {
          const steps = await generateMilestonesForGoal(newTitle, language);
          setNewMilestones(steps);
      } catch (error) {
          console.error("Failed to generate milestones", error);
      } finally {
          setGeneratingPlan(false);
      }
  };

  const addMilestone = () => {
      if (!milestoneInput.trim()) return;
      setNewMilestones([...newMilestones, milestoneInput.trim()]);
      setMilestoneInput('');
  };

  const removeMilestone = (idx: number) => {
      setNewMilestones(newMilestones.filter((_: string, i: number) => i !== idx));
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !isDeadlineValid) return;
    
    if (editingGoalId) {
        const existingGoal = goals.find((g: Goal) => g.id === editingGoalId);
        const updatedMilestones = newMilestones.map((m: string) => {
            const existing = existingGoal?.milestones.find((ex: Milestone) => ex.title === m);
            return existing ? existing : {
                id: Math.random().toString(36).substr(2, 9),
                title: m,
                completed: false
            };
        });
        const completedCount = updatedMilestones.filter((m: Milestone) => m.completed).length;
        const newProgress = updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : 0;

        updateGoal(editingGoalId, {
            title: newTitle,
            description: newDesc,
            category: newCategory,
            deadline: newDeadline,
            milestones: updatedMilestones,
            progress: newProgress,
            completed: newProgress === 100
        });
    } else {
        addGoal({
            id: Date.now().toString(),
            title: newTitle,
            description: newDesc,
            category: newCategory,
            progress: 0,
            completed: false,
            deadline: newDeadline,
            milestones: newMilestones.map((m: string) => ({
                id: Math.random().toString(36).substr(2, 9),
                title: m,
                completed: false
            })),
            notes: ''
        });
    }
    setShowModal(false);
    setTimeout(() => {
        setCreationStep('type');
        setEditingGoalId(null);
    }, 300);
  };

  const toggleMilestone = (goal: Goal, milestoneId: string) => {
      const updatedMilestones = goal.milestones.map((m: Milestone) => 
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const completedCount = updatedMilestones.filter((m: Milestone) => m.completed).length;
      const newProgress = updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : 0;

      updateGoal(goal.id, { 
          milestones: updatedMilestones,
          progress: newProgress,
          completed: newProgress === 100
      });
  };

  const handleGetHabitSuggestions = async (goalId: string, goalTitle: string) => {
    setLoadingSuggestions(goalId);
    try {
        const suggestions = await suggestHabitsFromGoals(goalTitle, language);
        suggestions.forEach((s: {title: string, description: string, timeOfDay: string}) => {
           addHabit({
               id: (Date.now() + Math.random()).toString(),
               title: s.title,
               description: s.description,
               timeOfDay: s.timeOfDay as any,
               linkedGoalId: goalId,
               streak: 0,
               completedDates: []
           });
        });
    } catch (error) {
        console.error("Failed to get habit suggestions", error);
    } finally {
        setLoadingSuggestions(null);
    }
  };

  const selectedCatLabel = CATEGORY_MAP.find(c => c.key === newCategory)?.label;

  return (
    <>
      <div className="pb-32 space-y-6 animate-in fade-in duration-700">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t('my_goals')}</h1>
          <button
              onClick={handleOpenCreate}
              className={`bg-gradient-to-br ${themeClasses.gradient} text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all`}
          >
              <Plus size={18} strokeWidth={3} /> {t('new_goal')}
          </button>
        </div>

        <div className="space-y-4">
          {goals.map((goal: Goal) => {
              const isExpanded = expandedGoalId === goal.id;
              const catLabel = CATEGORY_MAP.find((c: {key: GoalCategory, label: string}) => c.key === goal.category)?.label || goal.category;
              return (
            <div key={goal.id} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border transition-all duration-500 overflow-hidden relative ${goal.completed ? `${themeClasses.border} bg-slate-50/30 dark:bg-slate-900/40` : 'border-slate-100 dark:border-slate-800'}`}>
              <div className="p-6 cursor-pointer" onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}>
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                          <div className="flex gap-2 items-center mb-1.5">
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border
                                  ${goal.completed ? `${themeClasses.secondary} ${themeClasses.text} ${themeClasses.border}` : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-800'}`}>
                                  {catLabel}
                              </span>
                          </div>
                          <h3 className={`text-lg font-bold leading-tight tracking-tight pr-8 break-words ${goal.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                              {goal.title}
                          </h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                          <button 
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleOpenEdit(goal); }} 
                              className="p-2 text-slate-300 hover:text-slate-500 dark:hover:text-slate-100 transition-colors"
                          >
                              <Pencil size={18} />
                          </button>
                          {goal.completed && <div className={themeClasses.text}><CheckCircle2 size={24} strokeWidth={3} /></div>}
                      </div>
                  </div>

                  <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-50 uppercase tracking-widest">
                          <span>{t('progress')}</span>
                          <span className={themeClasses.text}>{goal.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                              className={`h-full rounded-full transition-all duration-1000 ${themeClasses.primary}`}
                              style={{ width: `${goal.progress}%` }}
                          ></div>
                      </div>
                  </div>
              </div>

              {isExpanded && (
                  <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-4 border-t border-slate-50 dark:border-slate-800/50 mt-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-5 leading-relaxed font-medium break-words">
                          {goal.description || 'No description provided.'}
                      </p>

                      {goal.milestones.length > 0 && (
                          <div className="mt-8 space-y-3">
                              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{t('action_plan')}</h4>
                              {goal.milestones.map((m: Milestone) => (
                                  <button 
                                      key={m.id}
                                      onClick={() => toggleMilestone(goal, m.id)}
                                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                                          m.completed 
                                          ? `${themeClasses.secondary} ${themeClasses.border} ${themeClasses.text}` 
                                          : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-sm'
                                      }`}
                                  >
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${m.completed ? `${themeClasses.primary} border-transparent` : 'border-slate-200 dark:border-slate-700'}`}>
                                          {m.completed && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                                      </div>
                                      <span className={`text-sm font-bold break-all overflow-hidden ${m.completed ? 'line-through opacity-60' : ''}`}>{m.title}</span>
                                  </button>
                              ))}
                          </div>
                      )}

                      <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
                           <button 
                              onClick={() => handleGetHabitSuggestions(goal.id, goal.title)}
                              disabled={loadingSuggestions === goal.id}
                              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold ${themeClasses.secondary} ${themeClasses.text} hover:opacity-80 transition-all border ${themeClasses.border} shadow-sm`}
                          >
                              {loadingSuggestions === goal.id ? <Loader2 size={16} className="animate-spin"/> : <Zap size={16} />}
                              {t('habit_ideas')}
                          </button>
                          <button onClick={() => { if(confirm(t('delete_goal_confirm'))) deleteGoal(goal.id); }} className="p-3.5 text-slate-200 dark:text-slate-700 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                              <Trash2 size={20} />
                          </button>
                      </div>
                  </div>
              )}
            </div>
          )})}
          
          {goals.length === 0 && (
               <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-700">
                  <Target size={80} strokeWidth={1} className="mb-6 opacity-20" />
                  <p className="font-bold text-sm uppercase tracking-widest">{t('no_active_goals')}</p>
                  <button onClick={handleOpenCreate} className={`mt-4 ${themeClasses.text} font-black text-xs uppercase tracking-widest hover:opacity-70 transition-opacity`}>{t('set_milestone_btn')}</button>
               </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[92%] sm:max-w-md rounded-[3rem] p-10 sm:p-12 shadow-xl animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto no-scrollbar relative border border-slate-100 dark:border-slate-800">
                <button 
                    onClick={() => setShowModal(false)} 
                    className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors p-1.5 bg-slate-50 dark:bg-slate-800 rounded-full z-10 shadow-sm"
                >
                    <X size={18}/>
                </button>

                {creationStep === 'type' ? (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="pr-12">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-50 tracking-tight leading-tight">{t('choose_path_title')}</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{t('choose_path_subtitle')}</p>
                        </div>
                        
                        <button 
                            onClick={() => setCreationStep('details')}
                            className="w-full flex items-center gap-4 p-5 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group text-left shadow-sm"
                        >
                            <div className={`w-11 h-11 rounded-xl ${themeClasses.secondary} flex items-center justify-center ${themeClasses.text} shadow-sm group-hover:scale-110 transition-transform shrink-0`}>
                                <Edit3 size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{t('create_custom_goal')}</h4>
                                <p className="text-[10px] font-medium text-slate-400 mt-1">{t('create_custom_desc')}</p>
                            </div>
                        </button>

                        <div className="space-y-4">
                            <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('or_try_template')}</h4>
                            <div className="space-y-3">
                                {GOAL_TEMPLATES.map((tpl: {title: string, category: GoalCategory, desc: string, emoji: string}, i: number) => (
                                    <button 
                                        key={i} 
                                        onClick={() => selectTemplate(tpl)}
                                        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left shadow-sm group"
                                    >
                                        <div className="text-xl w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:scale-110 transition-transform shrink-0 shadow-sm">
                                            {tpl.emoji}
                                        </div>
                                        <div className="min-w-0">
                                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{tpl.title}</h5>
                                            <p className="text-[10px] font-medium text-slate-400 mt-1 line-clamp-1">{tpl.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="pr-12">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-50 tracking-tight leading-tight">{editingGoalId ? t('edit') : t('goal_details')}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{t('refine_vision')}</p>
                        </div>
                        
                        <form onSubmit={handleSaveGoal} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('goal_title_label')}</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={newTitle}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm"
                                    placeholder={t('goal_title_ph')}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('goal_category_label')}</label>
                                    <div className="relative">
                                        <button 
                                            type="button"
                                            onClick={() => setShowCategorySelector(!showCategorySelector)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-3 text-[11px] font-bold text-slate-800 dark:text-white flex justify-between items-center shadow-sm"
                                        >
                                            {selectedCatLabel}
                                            <ChevronDown size={14} className="text-slate-400" />
                                        </button>
                                        {showCategorySelector && (
                                            <div className="absolute bottom-full left-0 mb-2 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 z-[150] p-2 animate-in fade-in zoom-in-95">
                                                <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                    {CATEGORY_MAP.map(c => (
                                                        <button 
                                                            key={c.key} 
                                                            type="button"
                                                            onClick={() => { setNewCategory(c.key); setShowCategorySelector(false); }} 
                                                            className={`w-full text-left p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-[11px] font-bold ${newCategory === c.key ? `${themeClasses.text} ${themeClasses.secondary}` : 'text-slate-700 dark:text-slate-200'}`}
                                                        >
                                                            {c.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('goal_deadline_label')}</label>
                                    <input
                                        type="date"
                                        min={todayStr}
                                        value={newDeadline}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeadline(e.target.value)}
                                        className={`w-full bg-slate-50 dark:bg-slate-800/50 border rounded-xl px-3 py-3 text-[10px] font-bold text-slate-800 dark:text-white outline-none transition-all shadow-sm ${!isDeadlineValid ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/10'}`}
                                    />
                                    {!isDeadlineValid && (
                                        <p className="text-[8px] font-bold text-rose-500 uppercase tracking-wider ml-1 mt-1 flex items-center gap-1 animate-pulse">
                                            <AlertCircle size={10} /> {t('goal_deadline_label')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('goal_why_label')}</label>
                                <textarea
                                    value={newDesc}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDesc(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 h-20 resize-none shadow-sm"
                                    placeholder={t('goal_desc_ph')}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-0.5 ml-1">
                                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('action_plan')}</label>
                                    <button 
                                        type="button" 
                                        onClick={handleGeneratePlan}
                                        disabled={generatingPlan || !newTitle}
                                        className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${themeClasses.text} hover:opacity-70 disabled:opacity-30 mr-1`}
                                    >
                                        {generatingPlan ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} {t('ai_breakdown')}
                                    </button>
                                </div>
                                <div className="space-y-2.5 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                                        {newMilestones.map((m: string, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 group">
                                                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-2 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 break-all shadow-sm">
                                                    {m}
                                                </div>
                                                <button type="button" onClick={() => removeMilestone(idx)} className="text-slate-300 hover:text-red-500 shrink-0 p-1"><Trash2 size={12}/></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <input 
                                            value={milestoneInput}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilestoneInput(e.target.value)}
                                            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                                            placeholder={t('goal_step_ph')}
                                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-2 rounded-lg text-xs font-medium outline-none dark:text-white shadow-sm"
                                        />
                                        <button type="button" onClick={addMilestone} className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0 shadow-sm`}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => editingGoalId ? setShowModal(false) : setCreationStep('type')}
                                    className="flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all active:scale-95 border border-slate-100 dark:border-slate-800 shadow-sm"
                                >
                                    {t('back')}
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={!newTitle.trim() || !isDeadlineValid}
                                    className={`flex-[2] py-4 rounded-2xl font-bold text-[10px] uppercase tracking-wider text-white bg-gradient-to-br ${themeClasses.gradient} shadow-lg active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed`}
                                >
                                    {editingGoalId ? t('update_goal') : t('create_goal')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
      )}
    </>
  );
};
