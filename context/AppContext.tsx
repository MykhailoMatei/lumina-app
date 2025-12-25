
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  UserState, Goal, Habit, JournalEntry, ThemeColor, AppLanguage, 
  DailyBriefing, GoalCategory, Post, Comment, Resource, AppNotification 
} from '../types';

export const APP_VERSION = '1.0.0-core';

export const THEMES: Record<ThemeColor, any> = {
  indigo: { name: 'accent_indigo', primary: 'bg-indigo-600', text: 'text-indigo-600', secondary: 'bg-indigo-50 dark:bg-indigo-900/20', gradient: 'from-indigo-600 to-blue-600', ring: 'ring-indigo-500', border: 'border-indigo-100 dark:border-indigo-900/30' },
  emerald: { name: 'accent_emerald', primary: 'bg-emerald-600', text: 'text-emerald-600', secondary: 'bg-emerald-50 dark:bg-emerald-900/20', gradient: 'from-emerald-600 to-teal-600', ring: 'ring-emerald-500', border: 'border-emerald-100 dark:border-emerald-900/30' },
  rose: { name: 'accent_rose', primary: 'bg-rose-600', text: 'text-rose-600', secondary: 'bg-rose-50 dark:bg-rose-900/20', gradient: 'from-rose-600 to-pink-600', ring: 'ring-rose-500', border: 'border-rose-100 dark:border-rose-900/30' },
  amber: { name: 'accent_amber', primary: 'bg-amber-500', text: 'text-amber-600', secondary: 'bg-amber-50 dark:bg-amber-900/20', gradient: 'from-amber-500 to-orange-500', ring: 'ring-amber-500', border: 'border-amber-100 dark:border-amber-900/30' },
  blue: { name: 'accent_blue', primary: 'bg-blue-600', text: 'text-blue-600', secondary: 'bg-blue-50 dark:bg-blue-900/20', gradient: 'from-blue-600 to-indigo-600', ring: 'ring-blue-500', border: 'border-blue-100 dark:border-blue-900/30' }
};

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  English: {
    home: 'Today', goals: 'Goal Momentum', journal: 'Reflect', insights: 'Growth', profile: 'Profile',
    keystone: 'Top Priority', daily_wisdom: 'Daily Spark', my_goals: 'Core Goals',
    new_goal: 'New Goal', edit: 'Edit', back: 'Back', save: 'Save', delete_key: 'Delete',
    active: 'Active', completed: 'Archive', morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening',
    streak: 'Streak', habit_rate: 'Routine Power', write_entry: 'New Reflection', search: 'Search memories...',
    good_morning: 'Rise & Shine', good_afternoon: 'Keep Moving', good_evening: 'Wind Down',
    privacy_policy: 'Privacy', settings: 'Settings', dark_mode: 'Night Theme', language: 'Language',
    identity: 'Identity', choose_avatar: 'Avatar', accent_palette: 'Accent', ai_breakdown: 'AI Strategy',
    security: 'Security', export_data: 'Export', import_data: 'Import', delete_account: 'Wipe Data',
    growth_traveler: 'Growth Traveler', choose_category: 'Category', adjust_photo: 'Adjust Photo',
    upload_photo: 'Upload Photo', focus_mode: 'Focus Mode', show_grow: 'Inspiration Hub', show_community: 'Community Access',
    ai_connection: 'AI Brain', api_test: 'Test Link', notifications_hub: 'Notifications', enable_push: 'Push Alerts',
    habits_notif: 'Habits', goals_notif: 'Goals', journal_notif: 'Reflections', motivation_notif: 'Wisdom',
    persistence_on: 'Cloud Save', storage_label: 'Database Status', app_lock: 'Security PIN', app_lock_desc: 'Protect your data',
    disable: 'Disable', set_pin: 'Set PIN', delete_account_confirm: 'Are you sure? This action is permanent.',
    accent_indigo: 'Indigo', accent_emerald: 'Emerald', accent_rose: 'Rose', accent_amber: 'Amber', accent_blue: 'Blue',
    routine_desc: 'Strength of your daily execution.', momentum_desc: 'Active strategies driving your vision.'
  },
  Ukrainian: {
    home: 'Сьогодні', goals: 'Імпульс цілей', journal: 'Роздуми', insights: 'Прогрес', profile: 'Профіль',
    keystone: 'Пріоритет', daily_wisdom: 'Мудрість', my_goals: 'Цілі',
    new_goal: 'Нова ціль', edit: 'Редагувати', back: 'Назад', save: 'Зберегти', delete_key: 'Видалити',
    active: 'Активні', completed: 'Архів', morning: 'Ранок', afternoon: 'День', evening: 'Вечір',
    streak: 'Серія', habit_rate: 'Сила рутини', write_entry: 'Новий запис', search: 'Пошук...',
    good_morning: 'Доброго ранку', good_afternoon: 'Добрий день', good_evening: 'Добрий вечір',
    routine_desc: 'Сила виконання щоденних справ.', momentum_desc: 'Активні стратегії вашого розвитку.'
  },
  Spanish: { home: 'Hoy', goals: 'Impulso', journal: 'Reflejo', insights: 'Progreso', profile: 'Perfil', keystone: 'Prioridad', daily_wisdom: 'Sabiduría', my_goals: 'Objetivos', new_goal: 'Nuevo', edit: 'Editar', back: 'Atrás', save: 'Guardar', habit_rate: 'Poder de Rutina' },
  French: { home: 'Aujourd\'hui', goals: 'Momentum', journal: 'Reflet', insights: 'Progrès', profile: 'Profil', keystone: 'Priorité', daily_wisdom: 'Sagesse', my_goals: 'Buts', new_goal: 'Nouveau', edit: 'Modifier', back: 'Retour', save: 'Sauver', habit_rate: 'Force de Routine' },
  German: { home: 'Heute', goals: 'Momentum', journal: 'Reflexion', insights: 'Fortschritt', profile: 'Profile', keystone: 'Priorität', daily_wisdom: 'Weisheit', my_goals: 'Ziele', new_goal: 'Neu', edit: 'Bearbeiten', back: 'Zurück', save: 'Speichern', habit_rate: 'Routine Kraft' }
};

const DEFAULT_USER_STATE: UserState = {
  name: 'Lumina Traveler', avatar: '🌱', goals: [], habits: [], journalEntries: [],
  theme: 'light', themeColor: 'indigo', language: 'English',
  securitySettings: { pinCode: null },
  dashboardLayout: { showGrow: true, showCommunity: true },
  notificationSettings: { enabled: true, types: { habits: true, goals: true, journal: true, motivation: true } },
  posts: [], events: [], resources: [], modules: [], quizzes: [],
  savedResourceIds: [], notifications: []
};

const AppContext = createContext<any>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem('lumina_v3_core');
    if (!saved) return DEFAULT_USER_STATE;
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_USER_STATE, ...parsed,
      goals: (parsed.goals || []).map((g: any) => ({ ...g, milestones: g.milestones || [] })),
      habits: (parsed.habits || []).map((h: any) => ({ ...h, completedDates: h.completedDates || [] })),
      journalEntries: parsed.journalEntries || [],
      dashboardLayout: parsed.dashboardLayout || DEFAULT_USER_STATE.dashboardLayout,
      notificationSettings: parsed.notificationSettings || DEFAULT_USER_STATE.notificationSettings,
      posts: parsed.posts || [],
      events: parsed.events || [],
      resources: parsed.resources || [],
      modules: parsed.modules || [],
      quizzes: parsed.quizzes || [],
      savedResourceIds: parsed.savedResourceIds || [],
      notifications: parsed.notifications || []
    };
  });

  const [isLocked, setIsLocked] = useState(!!user.securitySettings.pinCode);
  const [isPersistent, setIsPersistent] = useState(false);

  useEffect(() => {
    localStorage.setItem('lumina_v3_core', JSON.stringify(user));
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user]);

  useEffect(() => {
      if (navigator.storage && navigator.storage.persisted) {
          navigator.storage.persisted().then(setIsPersistent);
      }
  }, []);

  const t = (key: string) => TRANSLATIONS[user.language]?.[key] || TRANSLATIONS.English[key] || key;
  const themeClasses = THEMES[user.themeColor];

  const updateUserPreferences = (prefs: Partial<UserState>) => setUser(prev => ({ ...prev, ...prefs }));
  
  const addGoal = (goal: Goal) => setUser(prev => ({ ...prev, goals: [...prev.goals, goal] }));
  const updateGoal = (id: string, updates: Partial<Goal>) => setUser(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g) }));
  const deleteGoal = (id: string) => setUser(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  
  const addHabit = (habit: Habit) => setUser(prev => ({ ...prev, habits: [...prev.habits, habit] }));
  const updateHabit = (id: string, updates: Partial<Habit>) => setUser(prev => ({ ...prev, habits: prev.habits.map(h => h.id === id ? { ...h, ...updates } : h) }));
  const deleteHabit = (id: string) => setUser(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
  
  const toggleHabitCompletion = (id: string, date: string) => setUser(prev => ({
    ...prev,
    habits: prev.habits.map(h => {
      if (h.id === id) {
          const isDone = h.completedDates.includes(date);
          return {
              ...h,
              completedDates: isDone ? h.completedDates.filter(d => d !== date) : [...h.completedDates, date],
              streak: isDone ? Math.max(0, h.streak - 1) : h.streak + 1
          };
      }
      return h;
    })
  }));

  const addJournalEntry = (entry: JournalEntry) => setUser(prev => ({ ...prev, journalEntries: [entry, ...prev.journalEntries] }));
  const deleteJournalEntry = (id: string) => setUser(prev => ({ ...prev, journalEntries: prev.journalEntries.filter(e => e.id !== id) }));

  const addPost = (post: Post) => setUser(prev => ({ ...prev, posts: [post, ...prev.posts] }));
  const likePost = (id: string) => setUser(prev => ({
    ...prev,
    posts: prev.posts.map(p => p.id === id ? { 
        ...p, 
        likes: p.likedBy.includes('me') ? p.likes - 1 : p.likes + 1,
        likedBy: p.likedBy.includes('me') ? p.likedBy.filter(u => u !== 'me') : [...p.likedBy, 'me']
    } : p)
  }));
  const addComment = (postId: string, comment: Comment) => setUser(prev => ({
    ...prev,
    posts: prev.posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)
  }));
  const toggleEventJoin = (id: string) => setUser(prev => ({
    ...prev,
    events: prev.events.map(e => e.id === id ? { ...e, joined: !e.joined, participants: e.joined ? e.participants - 1 : e.participants + 1 } : e)
  }));

  const toggleResourceFavorite = (id: string) => setUser(prev => ({
    ...prev,
    savedResourceIds: prev.savedResourceIds.includes(id) ? prev.savedResourceIds.filter(rid => rid !== id) : [...prev.savedResourceIds, id]
  }));

  const triggerNotification = (title: string, message: string, type: AppNotification['type']) => {
      const n: AppNotification = { id: Date.now().toString(), title, message, type };
      setUser(prev => ({ ...prev, notifications: [...prev.notifications, n] }));
  };
  const dismissNotification = (id: string) => setUser(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }));
  const snoozeNotification = (id: string) => { dismissNotification(id); };

  const requestPersistence = async () => {
    if (navigator.storage && navigator.storage.persist) {
        const persisted = await navigator.storage.persist();
        setIsPersistent(persisted);
        return persisted;
    }
    return false;
  };

  const unlockApp = (pin: string) => {
      if (user.securitySettings.pinCode === pin) {
          setIsLocked(false);
          return true;
      }
      return false;
  };

  const setPinCode = (pin: string | null) => {
      updateUserPreferences({ securitySettings: { pinCode: pin } });
  };

  const exportData = () => {
    const data = JSON.stringify(user, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (content: string) => {
      try {
          const parsed = JSON.parse(content);
          setUser({ ...DEFAULT_USER_STATE, ...parsed });
          alert('Data imported successfully!');
      } catch (e) {
          alert('Import failed.');
      }
  };

  const deleteAccount = () => {
      localStorage.removeItem('lumina_v3_core');
      window.location.reload();
  };

  return (
    <AppContext.Provider value={{ 
        ...user, isLocked, isPersistent, unlockApp, setPinCode, exportData, importData, deleteAccount,
        t, themeClasses, updateUserPreferences, requestPersistence,
        addGoal, updateGoal, deleteGoal, 
        addHabit, updateHabit, deleteHabit, toggleHabitCompletion, 
        addJournalEntry, deleteJournalEntry,
        addPost, likePost, addComment, toggleEventJoin,
        toggleResourceFavorite, triggerNotification, dismissNotification, snoozeNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
