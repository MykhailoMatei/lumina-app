
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateDailyPrompt, generateEntryInsight } from '../services/geminiService';
import { 
    Book, Wand2, Trash2, X, 
    PenLine, ChevronDown, Check, Layout, Mic, Activity, Sparkles,
    Search, Calendar, Download, Settings, BarChart2, ChevronUp, Clock, Link,
    Type, Bold, Italic, List, Send, Image as ImageIcon, Plus, Target, Pencil
} from 'lucide-react';
import { JournalEntry } from '../types';

export const Journal: React.FC = () => {
  const { 
      goals, addJournalEntry, updateJournalEntry, deleteJournalEntry, journalEntries, t,
      themeClasses, savedTemplates, language, reflectionTime = '05:00',
      dailyBriefing
  } = useApp();
  
  const MOODS = useMemo(() => [
    { key: 'great', label: t('mood_great'), emoji: '🤩', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { key: 'good', label: t('mood_good'), emoji: '🙂', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { key: 'neutral', label: t('mood_neutral'), emoji: '😐', color: 'text-slate-400', bg: 'bg-slate-50' },
    { key: 'bad', label: t('mood_bad'), emoji: '☹️', color: 'text-orange-500', bg: 'bg-orange-50' },
    { key: 'awful', label: t('mood_awful'), emoji: '😫', color: 'text-rose-600', bg: 'bg-rose-50' }
  ], [t]);

  const STANDARD_ACTIVITY_KEYS = ['work', 'exercise', 'reading', 'family', 'friends', 'nature', 'creativity', 'relax', 'chores', 'learn'];

  // Persistence keys
  const COLLAPSE_KEY = 'lumina_journal_collapsed';
  const COLLAPSE_TIME_KEY = 'lumina_journal_collapsed_at';

  const [showEditor, setShowEditor] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isReflectionCollapsed, setIsReflectionCollapsed] = useState(() => {
    const saved = localStorage.getItem(COLLAPSE_KEY);
    return saved === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState(t('default_prompt'));
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [moodIndex, setMoodIndex] = useState(1); 
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  
  const [customActivities, setCustomActivities] = useState<{key: string, label: string}[]>(() => {
    const saved = localStorage.getItem('lumina_custom_tags_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showGoalSelector, setShowGoalSelector] = useState(false);

  // Sync custom tags
  useEffect(() => {
    localStorage.setItem('lumina_custom_tags_v3', JSON.stringify(customActivities));
  }, [customActivities]);

  // Sync prompt with daily briefing if available, stripping any accidental JSON artifacts
  useEffect(() => {
    if (dailyBriefing?.journalPrompt) {
      let cleanPrompt = dailyBriefing.journalPrompt;
      // Safety check: if the model returned raw JSON despite instructions
      if (cleanPrompt.includes('{') && cleanPrompt.includes(':')) {
          try {
              const parsed = JSON.parse(cleanPrompt);
              cleanPrompt = parsed.journal_prompt || parsed.prompt || cleanPrompt;
          } catch (e) {
              // Not valid JSON, just use as is or find first question mark
          }
      }
      setPrompt(cleanPrompt);
    }
  }, [dailyBriefing]);

  // Reset collapse logic for 5 AM
  useEffect(() => {
    const checkReset = () => {
        const collapsedAtStr = localStorage.getItem(COLLAPSE_TIME_KEY);
        if (!collapsedAtStr || !isReflectionCollapsed) return;

        const now = new Date();
        const collapsedAt = new Date(collapsedAtStr);
        
        // Calculate the most recent 5 AM
        const mostRecent5AM = new Date();
        mostRecent5AM.setHours(5, 0, 0, 0);
        if (now < mostRecent5AM) {
            mostRecent5AM.setDate(mostRecent5AM.getDate() - 1);
        }

        // If it was collapsed before the last 5 AM cycle, reset it
        if (collapsedAt < mostRecent5AM) {
            setIsReflectionCollapsed(false);
            localStorage.setItem(COLLAPSE_KEY, 'false');
        }
    };

    checkReset();
  }, [language, isReflectionCollapsed]);

  const toggleReflectionCollapse = () => {
    const newState = !isReflectionCollapsed;
    setIsReflectionCollapsed(newState);
    localStorage.setItem(COLLAPSE_KEY, String(newState));
    localStorage.setItem(COLLAPSE_TIME_KEY, new Date().toISOString());
  };

  const refreshPrompt = async () => {
    setLoadingPrompt(true);
    try {
        const newPrompt = await generateDailyPrompt(goals, language);
        setPrompt(newPrompt);
    } catch (e) {
        setPrompt(t('default_prompt'));
    } finally {
        setLoadingPrompt(false);
    }
  };

  const getActLabel = (actKey: string) => {
    if (STANDARD_ACTIVITY_KEYS.includes(actKey)) {
        return t(`act_${actKey}`);
    }
    const custom = customActivities.find(a => a.key === actKey);
    return custom?.label || actKey;
  };

  const toggleActivity = (actKey: string) => {
    setSelectedActivities(prev => prev.includes(actKey) ? prev.filter(a => a !== actKey) : [...prev, actKey]);
  };

  const deleteCustomTag = (e: React.MouseEvent, actKey: string) => {
    e.stopPropagation();
    if (confirm(t('remove_tag_confirm'))) {
        setCustomActivities(prev => prev.filter(a => a.key !== actKey));
        setSelectedActivities(prev => prev.filter(a => a !== actKey));
    }
  };

  const addCustomTag = () => {
    const tagLabel = newTagInput.trim();
    if (tagLabel) {
      const newKey = `custom_${Date.now()}`;
      const newTag = { key: newKey, label: tagLabel };
      setCustomActivities(prev => [...prev, newTag]);
      setSelectedActivities(prev => [...prev, newKey]);
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  const applyTemplate = (tplContent: string) => {
    setContent(prev => prev + (prev ? '\n\n' : '') + tplContent);
    setShowTemplateMenu(false);
  };

  const handleOpenCreate = () => {
      setEditingEntryId(null);
      setContent('');
      setSelectedActivities([]);
      setSelectedGoalId('');
      setMoodIndex(1);
      setShowEditor(true);
  };

  const handleOpenEdit = (journalEntry: JournalEntry) => {
      setEditingEntryId(journalEntry.id);
      setContent(journalEntry.content);
      setPrompt(journalEntry.prompt);
      setSelectedActivities(journalEntry.activities || []);
      setSelectedGoalId(journalEntry.linkedGoalId || '');
      const moodIdx = MOODS.findIndex(m => m.key === journalEntry.mood);
      setMoodIndex(moodIdx !== -1 ? moodIdx : 1);
      setShowEditor(true);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);

    try {
        const insight = await generateEntryInsight(content, language);
        
        if (editingEntryId) {
            updateJournalEntry(editingEntryId, {
                content,
                mood: MOODS[moodIndex].key as any,
                activities: selectedActivities,
                aiInsight: insight,
                linkedGoalId: selectedGoalId || undefined
            });
        } else {
            addJournalEntry({
                id: Date.now().toString(),
                date: new Date().toISOString(),
                content,
                prompt,
                mood: MOODS[moodIndex].key as any,
                activities: selectedActivities,
                attachments: [],
                aiInsight: insight,
                linkedGoalId: selectedGoalId || undefined
            });
        }
    } finally {
        setSubmitting(false);
        setContent('');
        setSelectedActivities([]);
        setSelectedGoalId('');
        setEditingEntryId(null);
        setShowEditor(false); 
    }
  };

  const filteredEntries = journalEntries.filter(e => 
    e.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getThemeHex = () => {
      if (themeClasses.text.includes('indigo')) return '#4f46e5';
      if (themeClasses.text.includes('emerald')) return '#059669';
      if (themeClasses.text.includes('rose')) return '#e11d48';
      if (themeClasses.text.includes('amber')) return '#d97706';
      return '#2563eb'; 
  };

  const dateLocale = language === 'Ukrainian' ? 'uk-UA' : (language === 'Spanish' ? 'es-ES' : (language === 'French' ? 'fr-FR' : (language === 'German' ? 'de-DE' : 'en-US')));

  return (
    <>
      <div className="pb-32 space-y-6 animate-in fade-in duration-700">
        {/* DAILY REFLECTION CARD */}
        <div className={`-mx-6 -mt-6 rounded-b-[2.5rem] shadow-sm ${themeClasses.shadow} relative overflow-hidden transition-all duration-500 bg-gradient-to-br ${themeClasses.gradient} ${isReflectionCollapsed ? 'h-[135px]' : 'pb-10 pt-10'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          
          <div className={`px-6 flex flex-col h-full ${isReflectionCollapsed ? 'justify-center' : 'justify-between'}`}>
              <div className={`flex justify-between items-center ${isReflectionCollapsed ? 'mb-4' : 'mb-6'}`}>
                  <h1 className="text-2xl font-bold text-white tracking-tight">{t('daily_reflection')}</h1>
                  <div className="flex gap-1">
                      <button onClick={refreshPrompt} className="p-2 text-white/60 hover:text-white transition-colors"><Settings size={18} /></button>
                      <button className="p-2 text-white/60 hover:text-white transition-colors"><BarChart2 size={18} /></button>
                      <button onClick={toggleReflectionCollapse} className="p-2 text-white/60 hover:text-white transition-colors">
                          {isReflectionCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                      </button>
                  </div>
              </div>

              {!isReflectionCollapsed ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-white/90 text-lg font-medium leading-snug mb-8 max-w-[90%]">
                          {loadingPrompt ? t('curating_question') : prompt}
                      </p>
                      <div className="flex justify-between items-end">
                          <button onClick={handleOpenCreate} className="bg-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all" style={{color: getThemeHex()}}>
                              <PenLine size={18} /> {t('write_entry')}
                          </button>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-bold uppercase tracking-widest bg-black/10 px-3 py-1.5 rounded-full">
                              <Clock size={12} /> {t('daily_label')} {reflectionTime}
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p className="text-white/70 text-[13px] font-medium italic truncate flex-1 opacity-90 leading-tight pr-4">
                          {loadingPrompt ? t('curating_question') : prompt}
                      </p>
                      <button onClick={handleOpenCreate} className="bg-white/15 hover:bg-white/25 p-2.5 rounded-full text-white transition-all shadow-sm shrink-0 border border-white/10 active:scale-90">
                          <PenLine size={18}/>
                      </button>
                  </div>
              )}
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="flex gap-3 px-1 mt-4">
          <button className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 shadow-sm transition-transform active:scale-95"><Calendar size={20} /></button>
          <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder={t('search_memories')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 text-sm font-medium outline-none shadow-sm transition-all focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800" />
          </div>
          <button className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 shadow-sm transition-transform active:scale-95"><Download size={20} /></button>
        </div>

        {/* JOURNAL HISTORY */}
        <div className="space-y-5 px-1">
          {filteredEntries.map((entry) => {
              const mood = MOODS.find(m => m.key === entry.mood) || MOODS[1];
              const entryLinkedGoal = goals.find(g => g.id === entry.linkedGoalId);
              return (
                  <div key={entry.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 group relative transition-all hover:shadow-md">
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className={`px-3 py-1 rounded-lg ${mood?.bg} dark:bg-slate-800 ${mood?.color} text-[10px] font-bold uppercase tracking-widest`}>{mood.label}</div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-50">
                                  {new Date(entry.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </h4>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleOpenEdit(entry)} className="p-1.5 text-slate-300 hover:text-slate-500 transition-colors"><Pencil size={16} /></button>
                              <button onClick={() => { if(confirm(t('delete_entry_confirm'))) deleteJournalEntry(entry.id); }} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                      </div>
                      {entryLinkedGoal && (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 ${themeClasses.secondary} ${themeClasses.text} text-[9px] font-bold rounded-xl border ${themeClasses.border} w-fit mb-4`}>
                              <Link size={10} /> {entryLinkedGoal.title}
                          </div>
                      )}
                      <div className="space-y-4">
                          <p className="text-[12px] text-slate-400 dark:text-slate-500 italic leading-snug border-l-2 border-slate-100 dark:border-slate-800 pl-3">{entry.prompt}</p>
                          <p className="text-slate-800 dark:text-slate-100 text-[15px] font-medium leading-relaxed">{entry.content}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-4">
                              {entry.activities?.map(actKey => (
                                  <span key={actKey} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-400 text-[9px] font-bold uppercase rounded-full border border-slate-100 dark:border-slate-700">
                                      {getActLabel(actKey)}
                                  </span>
                              ))}
                          </div>

                          {entry.aiInsight && (
                              <div className={`${themeClasses.secondary} p-4 rounded-2xl flex gap-3 items-center border ${themeClasses.border} mt-6`}>
                                  <Sparkles className={`${themeClasses.text} shrink-0`} size={16} />
                                  <p className={`text-xs ${themeClasses.text} font-bold leading-relaxed`}>{entry.aiInsight}</p>
                              </div>
                          )}
                      </div>
                  </div>
              );
          })}
          {filteredEntries.length === 0 && (
              <div className="text-center py-20 opacity-20">
                  <Book className="mx-auto mb-4" size={48} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('no_templates_msg')}</p>
              </div>
          )}
        </div>
      </div>

      {/* NEW/EDIT REFLECTION MODAL */}
      {showEditor && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-[92%] sm:max-w-lg rounded-[3rem] p-10 sm:p-12 shadow-xl flex flex-col max-h-[90vh] overflow-hidden relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
               
               <div className="flex justify-between items-center mb-10">
                   <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${themeClasses.secondary} flex items-center justify-center ${themeClasses.text} shadow-sm border ${themeClasses.border}`}>
                             {editingEntryId ? <Pencil size={22} /> : <PenLine size={22} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 tracking-tight leading-tight">{editingEntryId ? t('edit_entry') : t('write_entry')}</h2>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{t('reflect_grow')}</p>
                        </div>
                   </div>
                   <button onClick={() => { setShowEditor(false); setEditingEntryId(null); }} className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-full text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                       <X size={20} />
                   </button>
               </div>

               <div className="flex-1 overflow-y-auto space-y-8 no-scrollbar pr-1">
                    <div className={`relative pl-6 border-l-2 ${themeClasses.border} py-1`}>
                        <p className="text-[15px] text-slate-400 dark:text-slate-500 italic leading-snug font-medium">
                           {prompt}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pb-2">
                        <div className="flex items-center gap-5 text-slate-300">
                            <Bold size={18} className="cursor-pointer hover:text-slate-500 transition-colors" />
                            <Italic size={18} className="cursor-pointer hover:text-slate-500 transition-colors" />
                            <List size={18} className="cursor-pointer hover:text-slate-500 transition-colors" />
                        </div>
                        
                        <div className="h-4 w-px bg-slate-100 dark:bg-slate-800" />

                        {/* TEMPLATES DROPDOWN */}
                        <div className="relative">
                            <button 
                                onClick={() => { setShowTemplateMenu(!showTemplateMenu); setShowGoalSelector(false); }}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl ${themeClasses.text} ${themeClasses.secondary} text-[12px] font-bold transition-all hover:opacity-80 shadow-sm border ${themeClasses.border}`}
                            >
                                <Book size={16} /> {t('templates')}
                            </button>
                            {showTemplateMenu && (
                                <div className="absolute top-full left-0 mt-3 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 z-[150] p-2 animate-in fade-in zoom-in-95">
                                    <div className="max-h-60 overflow-y-auto no-scrollbar">
                                        {savedTemplates.map(t => (
                                            <button key={t.id} onClick={() => applyTemplate(t.content)} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-200">{t.title}</button>
                                        ))}
                                        {savedTemplates.length === 0 && <p className="p-4 text-[11px] text-slate-400 italic">{t('no_templates_msg')}</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* GOAL LINKING DROPDOWN */}
                        <div className="relative">
                            <button 
                                onClick={() => { setShowGoalSelector(!showGoalSelector); setShowTemplateMenu(false); }}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all shadow-sm ${
                                    selectedGoalId 
                                    ? `${themeClasses.text} ${themeClasses.secondary} border ${themeClasses.border}` 
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 border border-slate-100 dark:border-slate-700'
                                }`}
                            >
                                {selectedGoalId ? <><Target size={14}/> {goals.find(g => g.id === selectedGoalId)?.title}</> : t('link_goal_btn')}
                            </button>
                            {showGoalSelector && (
                                <div className="absolute top-full left-0 mt-3 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 z-[150] p-2 animate-in fade-in zoom-in-95">
                                    <div className="max-h-48 overflow-y-auto no-scrollbar">
                                        <button 
                                            onClick={() => { setSelectedGoalId(''); setShowGoalSelector(false); }} 
                                            className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-[11px] font-bold text-slate-400"
                                        >
                                            {t('no_goal')}
                                        </button>
                                        {goals.map(g => (
                                            <button 
                                                key={g.id} 
                                                onClick={() => { setSelectedGoalId(g.id); setShowGoalSelector(false); }} 
                                                className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-[11px] font-bold ${selectedGoalId === g.id ? `${themeClasses.text} ${themeClasses.secondary}` : 'text-slate-700 dark:text-slate-200'}`}
                                            >
                                                {g.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <textarea
                        autoFocus
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={t('write_thoughts')}
                        className="w-full bg-transparent resize-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-200 dark:placeholder:text-slate-700 text-[18px] font-medium min-h-[180px]"
                    />

                    <div className="flex justify-between items-center py-6">
                        {MOODS.map((m, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setMoodIndex(idx)}
                                className={`flex flex-col items-center gap-2 px-3 py-2 rounded-2xl transition-all ${moodIndex === idx ? themeClasses.secondary : ''}`}
                            >
                                <span className={`text-2xl transition-transform ${moodIndex === idx ? 'scale-110' : 'opacity-40 grayscale'}`}>{m.emoji}</span>
                                <span className={`text-[11px] font-bold ${moodIndex === idx ? themeClasses.text : 'text-slate-300 dark:text-slate-700'}`}>{m.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <label className="text-[11px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest block ml-1">{t('busy_label')}</label>
                        <div className="flex flex-wrap gap-3">
                            {STANDARD_ACTIVITY_KEYS.map(actKey => (
                                <div
                                    key={actKey}
                                    onClick={() => toggleActivity(actKey)}
                                    className={`relative px-4 py-2 rounded-xl text-[12px] font-bold transition-all border flex items-center gap-2 cursor-pointer ${selectedActivities.includes(actKey) ? `${themeClasses.secondary} ${themeClasses.border} ${themeClasses.text}` : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                >
                                    {t(`act_${actKey}`)}
                                </div>
                            ))}

                            {customActivities.map(act => (
                                <div
                                    key={act.key}
                                    onClick={() => toggleActivity(act.key)}
                                    className={`relative group px-4 py-2 rounded-xl text-[12px] font-bold transition-all border flex items-center gap-2 cursor-pointer ${selectedActivities.includes(act.key) ? `${themeClasses.secondary} ${themeClasses.border} ${themeClasses.text}` : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                                >
                                    {act.label}
                                    <button 
                                        onClick={(e) => deleteCustomTag(e, act.key)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 hover:text-red-500 rounded-full"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                            
                            {isAddingTag ? (
                              <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                                <input 
                                  autoFocus
                                  value={newTagInput}
                                  onChange={e => setNewTagInput(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                                  className={`px-4 py-2 rounded-xl text-[12px] font-medium border ${themeClasses.border} outline-none w-28 bg-white dark:bg-slate-800 dark:text-white`}
                                  placeholder={t('tag_name_ph')}
                                />
                                <button onClick={addCustomTag} className={`${themeClasses.text} hover:scale-110 transition-transform`}><Check size={18}/></button>
                                <button onClick={() => {setIsAddingTag(false); setNewTagInput('');}} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setIsAddingTag(true)}
                                className={`px-4 py-2 rounded-xl text-[12px] font-medium text-slate-300 border border-slate-50 dark:border-slate-800 dark:bg-slate-800/40 italic flex items-center gap-2 hover:${themeClasses.text} transition-colors`}
                              >
                                <Plus size={14} /> {t('tag_ph')}
                              </button>
                            )}
                        </div>
                    </div>
               </div>

                <div className="pt-8 flex justify-between items-center bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800 mt-auto">
                    <div className="flex gap-8 text-slate-300">
                        <button className="hover:text-slate-500 transition-colors"><Mic size={24} /></button>
                        <button className="hover:text-slate-500 transition-colors"><ImageIcon size={24} /></button>
                    </div>
                    <button 
                        onClick={handleSubmit}
                        disabled={!content.trim() || submitting}
                        className={`text-white px-10 py-4.5 rounded-[1.75rem] flex items-center gap-3 font-bold text-base shadow-lg disabled:opacity-30 transition-all active:scale-95 bg-gradient-to-br ${themeClasses.gradient}`}
                    >
                        {submitting ? t('reflecting_msg') : <>{editingEntryId ? t('update_entry_btn') : t('save_entry_btn')} <Send size={20} className="ml-1" /></>}
                    </button>
                </div>
           </div>
        </div>
      )}
    </>
  );
};
