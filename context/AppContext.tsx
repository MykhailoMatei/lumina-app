
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { 
  UserState, Goal, Habit, JournalEntry, ThemeColor, AppLanguage, 
  DailyBriefing, GoalCategory, Post, Comment, Resource, AppNotification 
} from '../types';

export const APP_VERSION = '1.1.1-stable';

export const THEMES: Record<ThemeColor, any> = {
  indigo: { name: 'accent_indigo', primary: 'bg-indigo-600', text: 'text-indigo-600', secondary: 'bg-indigo-50 dark:bg-indigo-900/20', gradient: 'from-indigo-600 to-blue-600', ring: 'ring-indigo-500', border: 'border-indigo-100 dark:border-indigo-900/30' },
  emerald: { name: 'accent_emerald', primary: 'bg-emerald-600', text: 'text-emerald-600', secondary: 'bg-emerald-50 dark:bg-emerald-900/20', gradient: 'from-emerald-600 to-teal-600', ring: 'ring-emerald-500', border: 'border-emerald-100 dark:border-emerald-900/30' },
  rose: { name: 'accent_rose', primary: 'bg-rose-600', text: 'text-rose-600', secondary: 'bg-rose-50 dark:bg-rose-900/20', gradient: 'from-rose-600 to-pink-600', ring: 'ring-rose-500', border: 'border-rose-100 dark:border-rose-900/30' },
  amber: { name: 'accent_amber', primary: 'bg-amber-500', text: 'text-amber-600', secondary: 'bg-amber-50 dark:bg-amber-900/20', gradient: 'from-amber-500 to-orange-500', ring: 'ring-amber-500', border: 'border-amber-100 dark:border-amber-900/30' },
  blue: { name: 'accent_blue', primary: 'bg-blue-600', text: 'text-blue-600', secondary: 'bg-blue-50 dark:bg-blue-900/20', gradient: 'from-blue-600 to-indigo-600', ring: 'ring-blue-500', border: 'border-blue-100 dark:border-blue-900/30' }
};

// Added missing German, Ukrainian, and Spanish translations to satisfy AppLanguage type requirement
export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  English: {
    home: 'Home',
    goals: 'Goals',
    journal: 'Journal',
    insights: 'Insights',
    profile: 'Profile',
    good_morning: 'Good Morning',
    good_afternoon: 'Good Afternoon',
    good_evening: 'Good Evening',
    daily_wisdom: 'Daily Wisdom',
    habit_rate: 'Habit Success',
    routine_desc: 'Your daily momentum',
    momentum_desc: 'Active growth paths',
    keystone: 'Keystone Task',
    identity: 'Identity',
    upload_photo: 'Upload Photo',
    edit: 'Edit',
    settings: 'Settings',
    language: 'Language',
    dark_mode: 'Dark Mode',
    accent_palette: 'Accent Palette',
    ai_connection: 'AI Connection',
    api_test: 'Test AI',
    notifications_hub: 'Notifications',
    enable_push: 'Enable Notifications',
    security: 'Security',
    app_lock: 'App Lock',
    set_pin: 'Set PIN',
    disable: 'Disable',
    export_data: 'Export',
    import_data: 'Import',
    delete_account: 'Delete Data',
    accent_indigo: 'Indigo',
    accent_emerald: 'Emerald',
    accent_rose: 'Rose',
    accent_amber: 'Amber',
    accent_blue: 'Blue',
    persistence_on: 'Cloud persistence',
    storage_label: 'LocalStorage active',
    choose_avatar: 'Choose Avatar',
    growth_traveler: 'Growth Traveler',
    import_success: 'Data integrated successfully.',
    import_failed: 'Import failed. Check file format.',
  },
  French: { 
    home: 'Accueil', 
    goals: 'Objectifs', 
    journal: 'Journal', 
    insights: 'Analyses',
    profile: 'Profil',
    good_morning: 'Bon matin',
    good_afternoon: 'Bon après-midi',
    good_evening: 'Bonsoir',
    daily_wisdom: 'Sagesse quotidienne',
    habit_rate: 'Succès des habitudes',
    routine_desc: 'Votre élan quotidien',
    momentum_desc: 'Voies de croissance',
    keystone: 'Tâche clé',
    identity: 'Identité',
    upload_photo: 'Charger photo',
    edit: 'Modifier',
    settings: 'Paramètres',
    language: 'Langue',
    dark_mode: 'Mode Sombre',
    accent_palette: 'Palette d\'accent',
    ai_connection: 'Connexion IA',
    api_test: 'Tester l\'IA',
    notifications_hub: 'Notifications',
    enable_push: 'Activer les notifications',
    security: 'Sécurité',
    app_lock: 'Verrouillage',
    set_pin: 'Définir PIN',
    disable: 'Désactiver',
    export_data: 'Exporter',
    import_data: 'Importer',
    delete_account: 'Supprimer données',
    accent_indigo: 'Indigo',
    accent_emerald: 'Émeraude',
    accent_rose: 'Rose',
    accent_amber: 'Ambre',
    accent_blue: 'Bleu',
    persistence_on: 'Persistance cloud',
    storage_label: 'Stockage local actif',
    choose_avatar: 'Choisir un avatar',
    growth_traveler: 'Voyageur de croissance',
    import_success: 'Données intégrées avec succès.',
    import_failed: 'Échec de l\'importation.',
  },
  German: {
    home: 'Startseite',
    goals: 'Ziele',
    journal: 'Journal',
    insights: 'Einblicke',
    profile: 'Profil',
    good_morning: 'Guten Morgen',
    good_afternoon: 'Guten Tag',
    good_evening: 'Guten Abend',
    daily_wisdom: 'Tägliche Weisheit',
    habit_rate: 'Gewohnheitserfolg',
    routine_desc: 'Dein täglicher Schwung',
    momentum_desc: 'Aktive Wachstumswege',
    keystone: 'Schlüsselaufgabe',
    identity: 'Identität',
    upload_photo: 'Foto hochladen',
    edit: 'Bearbeiten',
    settings: 'Einstellungen',
    language: 'Sprache',
    dark_mode: 'Dunkelmodus',
    accent_palette: 'Akzentpalette',
    ai_connection: 'KI-Verbindung',
    api_test: 'KI testen',
    notifications_hub: 'Benachrichtigungen',
    enable_push: 'Benachrichtigungen aktivieren',
    security: 'Sicherheit',
    app_lock: 'App-Sperre',
    set_pin: 'PIN festlegen',
    disable: 'Deaktivieren',
    export_data: 'Exportieren',
    import_data: 'Importieren',
    delete_account: 'Daten löschen',
    accent_indigo: 'Indigo',
    accent_emerald: 'Smaragd',
    accent_rose: 'Rose',
    accent_amber: 'Bernstein',
    accent_blue: 'Blau',
    persistence_on: 'Cloud-Persistenz',
    storage_label: 'LocalStorage aktiv',
    choose_avatar: 'Avatar wählen',
    growth_traveler: 'Wachstumsreisender',
    import_success: 'Daten erfolgreich integriert.',
    import_failed: 'Import fehlgeschlagen.',
  },
  Ukrainian: {
    home: 'Головна',
    goals: 'Цілі',
    journal: 'Журнал',
    insights: 'Аналітика',
    profile: 'Профіль',
    good_morning: 'Доброго ранку',
    good_afternoon: 'Доброго дня',
    good_evening: 'Доброго вечора',
    daily_wisdom: 'Щоденна мудрість',
    habit_rate: 'Успіх звичок',
    routine_desc: 'Ваш щоденний імпульс',
    momentum_desc: 'Активні шляхи зростання',
    keystone: 'Ключове завдання',
    identity: 'Ідентичність',
    upload_photo: 'Завантажити фото',
    edit: 'Редагувати',
    settings: 'Налаштування',
    language: 'Мова',
    dark_mode: 'Темний режим',
    accent_palette: 'Палітра кольорів',
    ai_connection: 'Підключення ШІ',
    api_test: 'Тестувати ШІ',
    notifications_hub: 'Сповіщення',
    enable_push: 'Увімкнути сповіщення',
    security: 'Безпека',
    app_lock: 'Блокування програми',
    set_pin: 'Встановити PIN',
    disable: 'Вимкнути',
    export_data: 'Експорт',
    import_data: 'Імпорт',
    delete_account: 'Видалити дані',
    accent_indigo: 'Індиго',
    accent_emerald: 'Смарагдовий',
    accent_rose: 'Рожевий',
    accent_amber: 'Бурштиновий',
    accent_blue: 'Синій',
    persistence_on: 'Хмарне збереження',
    storage_label: 'LocalStorage активний',
    choose_avatar: 'Обрати аватар',
    growth_traveler: 'Мандрівник зростання',
    import_success: 'Дані успішно інтегровані.',
    import_failed: 'Помилка імпорту.',
  },
  Spanish: {
    home: 'Inicio',
    goals: 'Metas',
    journal: 'Diario',
    insights: 'Perspectivas',
    profile: 'Perfil',
    good_morning: 'Buenos días',
    good_afternoon: 'Buenas tardes',
    good_evening: 'Buenas noches',
    daily_wisdom: 'Sabiduría diaria',
    habit_rate: 'Éxito de hábitos',
    routine_desc: 'Tu impulso diario',
    momentum_desc: 'Caminos de crecimiento',
    keystone: 'Tarea clave',
    identity: 'Identidad',
    upload_photo: 'Subir foto',
    edit: 'Editar',
    settings: 'Ajustes',
    language: 'Idioma',
    dark_mode: 'Modo oscuro',
    accent_palette: 'Paleta de acentos',
    ai_connection: 'Conexión IA',
    api_test: 'Probar IA',
    notifications_hub: 'Notificaciones',
    enable_push: 'Activar notificaciones',
    security: 'Seguridad',
    app_lock: 'Bloqueo de app',
    set_pin: 'Establecer PIN',
    disable: 'Desactivar',
    export_data: 'Exportar',
    import_data: 'Importar',
    delete_account: 'Borrar datos',
    accent_indigo: 'Índigo',
    accent_emerald: 'Esmeralda',
    accent_rose: 'Rosa',
    accent_amber: 'Ámbar',
    accent_blue: 'Azul',
    persistence_on: 'Persistencia en la nube',
    storage_label: 'LocalStorage activo',
    choose_avatar: 'Elegir avatar',
    growth_traveler: 'Viajero del crecimiento',
    import_success: 'Datos integrados correctamente.',
    import_failed: 'Error al importar.',
  }
};

interface AppContextType extends UserState {
  t: (key: string) => string;
  themeClasses: any;
  circadian: { state: string, label: string, headerGradient: string, appBg: string, glowColor: string, buttonStyle: string, iconContrast: boolean };
  isLocked: boolean;
  isPersistent: boolean;
  preselectedGoalId: string | null;
  setPreselectedGoalId: (id: string | null) => void;
  updateUserPreferences: (prefs: Partial<UserState>) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, entry: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  unlockApp: (pin: string) => boolean;
  setPinCode: (pin: string | null) => void;
  triggerNotification: (title: string, message: string, type: any) => void;
  dismissNotification: (id: string) => void;
  snoozeNotification: (id: string) => void;
  exportData: () => void;
  importData: (json: string) => void;
  deleteAccount: () => void;
  requestPersistence: () => Promise<boolean>;
  addPost: (post: Post) => void;
  likePost: (id: string) => void;
  addComment: (postId: string, comment: Comment) => void;
  toggleEventJoin: (id: string) => void;
  toggleResourceFavorite: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'lumina_v1_state';

const DEFAULT_STATE: UserState = {
  name: 'Seeker',
  avatar: '🌱',
  goals: [],
  habits: [],
  journalEntries: [],
  theme: 'light',
  themeColor: 'indigo',
  language: 'English',
  securitySettings: { pinCode: null },
  dashboardLayout: { showGrow: true, showCommunity: true },
  notificationSettings: {
    enabled: true,
    types: { habits: true, goals: true, journal: true, motivation: true }
  },
  notifications: [],
  posts: [],
  events: [],
  resources: [],
  modules: [],
  quizzes: [],
  savedResourceIds: []
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UserState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_STATE;
  });

  const [isLocked, setIsLocked] = useState(!!state.securitySettings.pinCode);
  const [isPersistent, setIsPersistent] = useState(false);
  const [preselectedGoalId, setPreselectedGoalId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state]);

  const t = useCallback((key: string) => {
    return TRANSLATIONS[state.language]?.[key] || TRANSLATIONS['English'][key] || key;
  }, [state.language]);

  const themeClasses = useMemo(() => THEMES[state.themeColor] || THEMES.indigo, [state.themeColor]);

  const circadian = useMemo(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return { 
        state: 'Morning', 
        label: 'Awakening Phase', 
        headerGradient: 'from-amber-400/90 to-orange-500/90', 
        glowColor: 'rgba(245,158,11,0.2)', 
        appBg: 'bg-[#fcfcfd] dark:bg-slate-950',
        buttonStyle: 'bg-white shadow-xl text-slate-900',
        iconContrast: true
    };
    
    if (hour >= 12 && hour < 17) return { 
        state: 'Day', 
        label: 'Performance Phase', 
        headerGradient: 'from-blue-400/90 to-indigo-600/90', 
        glowColor: 'rgba(59,130,246,0.2)', 
        appBg: 'bg-white dark:bg-slate-900',
        buttonStyle: 'bg-white shadow-xl text-slate-900',
        iconContrast: true
    };
    
    if (hour >= 17 && hour < 21) return { 
        state: 'Evening', 
        label: 'Reflection Phase', 
        headerGradient: 'from-[#1e1b4b] via-[#0f172a] to-[#0a0f1e]', 
        glowColor: 'rgba(79,70,229,0.2)', 
        appBg: 'bg-[#0a0f1e] dark:bg-[#0a0f1e]',
        buttonStyle: 'bg-white/10 backdrop-blur-2xl border border-white/10 text-white shadow-none',
        iconContrast: false
    };
    
    return { 
        state: 'Night', 
        label: 'Restoration Phase', 
        headerGradient: 'from-[#030712] via-[#020617] to-[#000000]', 
        glowColor: 'rgba(30,41,59,0.2)', 
        appBg: 'bg-[#030712] dark:bg-[#030712]',
        buttonStyle: 'bg-white/5 backdrop-blur-3xl border border-white/5 text-white/70 shadow-none',
        iconContrast: false
    };
  }, []);

  const triggerHaptic = (type: 'success' | 'error' | 'medium') => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      if (type === 'success') window.navigator.vibrate([10, 30, 10]);
      else if (type === 'error') window.navigator.vibrate([50, 100, 50]);
      else window.navigator.vibrate(15);
    }
  };

  const updateUserPreferences = (prefs: Partial<UserState>) => {
    setState(prev => ({ ...prev, ...prefs }));
  };

  const triggerNotification = useCallback((title: string, message: string, type: any) => {
    const id = Date.now().toString();
    setState(prev => ({ ...prev, notifications: [{ id, title, message, type }, ...prev.notifications] }));
  }, []);

  const dismissNotification = (id: string) => {
    setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }));
  };

  const snoozeNotification = (id: string) => {
    dismissNotification(id);
    setTimeout(() => {
      const n = state.notifications.find(notif => notif.id === id);
      if (n) triggerNotification(n.title, `Snoozed: ${n.message}`, n.type);
    }, 300000);
  };

  const addGoal = (goal: Goal) => {
    triggerHaptic('success');
    setState(prev => ({ ...prev, goals: [goal, ...prev.goals] }));
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g)
    }));
  };

  const deleteGoal = (id: string) => {
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  };

  const addHabit = (habit: Habit) => {
    triggerHaptic('success');
    setState(prev => ({ ...prev, habits: [habit, ...prev.habits] }));
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === id ? { ...h, ...updates } : h)
    }));
  };

  const deleteHabit = (id: string) => {
    setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
  };

  const toggleHabitCompletion = (id: string, date: string) => {
    triggerHaptic('medium');
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => {
        if (h.id === id) {
          const completed = h.completedDates.includes(date);
          const newDates = completed ? h.completedDates.filter(d => d !== date) : [...h.completedDates, date];
          return { ...h, completedDates: newDates, streak: completed ? Math.max(0, h.streak - 1) : h.streak + 1 };
        }
        return h;
      })
    }));
  };

  const addJournalEntry = (entry: JournalEntry) => {
    triggerHaptic('success');
    setState(prev => ({ ...prev, journalEntries: [entry, ...prev.journalEntries] }));
  };

  const updateJournalEntry = (id: string, updates: Partial<JournalEntry>) => {
    setState(prev => ({
      ...prev,
      journalEntries: prev.journalEntries.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const deleteJournalEntry = (id: string) => {
    setState(prev => ({ ...prev, journalEntries: prev.journalEntries.filter(e => e.id !== id) }));
  };

  const unlockApp = (pin: string) => {
    if (pin === state.securitySettings.pinCode) {
      setIsLocked(false);
      triggerHaptic('success');
      return true;
    }
    triggerHaptic('error');
    return false;
  };

  const setPinCode = (pin: string | null) => {
    setState(prev => ({ ...prev, securitySettings: { ...prev.securitySettings, pinCode: pin } }));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (json: string) => {
    try {
      // Clean input: remove common markdown headers or leading/trailing text if user pasted from chat
      let cleaned = json.trim();
      if (cleaned.includes('--- START OF FILE')) {
          cleaned = cleaned.split('\n').slice(1).join('\n');
      }
      if (cleaned.includes('```')) {
          cleaned = cleaned.replace(/```json|```/g, '').trim();
      }

      const parsed = JSON.parse(cleaned);
      if (!parsed || typeof parsed !== 'object') throw new Error("Invalid structure");

      // Robust Merge Logic
      const mergedState: UserState = {
        ...DEFAULT_STATE,
        ...parsed,
        securitySettings: { ...DEFAULT_STATE.securitySettings, ...(parsed.securitySettings || {}) },
        notificationSettings: { ...DEFAULT_STATE.notificationSettings, ...(parsed.notificationSettings || {}) }
      };

      // Reset stale or future-dated briefings to prevent logic lock
      if (mergedState.lastBriefingUpdate && mergedState.lastBriefingUpdate > Date.now()) {
          mergedState.lastBriefingUpdate = undefined;
          mergedState.dailyBriefing = undefined;
      }

      setState(mergedState);
      
      // Force sync dependent UI states
      setIsLocked(!!mergedState.securitySettings.pinCode);
      
      triggerHaptic('success');
      triggerNotification(t('import_data'), t('import_success'), 'achievement');
    } catch (err) {
      console.error('Import failed', err);
      triggerHaptic('error');
      triggerNotification(t('import_data'), t('import_failed'), 'reminder');
    }
  };

  const deleteAccount = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(DEFAULT_STATE);
    window.location.reload();
  };

  const requestPersistence = async () => {
    if (navigator.storage && navigator.storage.persist) {
      const persistent = await navigator.storage.persist();
      setIsPersistent(persistent);
      return persistent;
    }
    return false;
  };

  const addPost = (post: Post) => {
    triggerHaptic('success');
    setState(prev => ({ ...prev, posts: [post, ...prev.posts] }));
  };

  const likePost = (id: string) => {
    triggerHaptic('medium');
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p => {
        if (p.id === id) {
          const isLiked = p.likedBy.includes('me');
          const newLikedBy = isLiked ? p.likedBy.filter(u => u !== 'me') : [...p.likedBy, 'me'];
          return { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1, likedBy: newLikedBy };
        }
        return p;
      })
    }));
  };

  const addComment = (postId: string, comment: Comment) => {
    triggerHaptic('success');
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)
    }));
  };

  const toggleEventJoin = (id: string) => {
    triggerHaptic('medium');
    setState(prev => ({
      ...prev,
      events: prev.events.map(e => e.id === id ? { ...e, joined: !e.joined } : e)
    }));
  };

  const toggleResourceFavorite = (id: string) => {
    triggerHaptic('medium');
    setState(prev => {
      const isSaved = prev.savedResourceIds.includes(id);
      const newSaved = isSaved ? prev.savedResourceIds.filter(rid => rid !== id) : [...prev.savedResourceIds, id];
      return { ...prev, savedResourceIds: newSaved };
    });
  };

  return (
    <AppContext.Provider value={{
      ...state,
      t, themeClasses, circadian, isLocked, isPersistent,
      preselectedGoalId, setPreselectedGoalId,
      updateUserPreferences, addGoal, updateGoal, deleteGoal,
      addHabit, updateHabit, deleteHabit, toggleHabitCompletion,
      addJournalEntry, updateJournalEntry, deleteJournalEntry,
      unlockApp, setPinCode, triggerNotification, dismissNotification, snoozeNotification,
      exportData, importData, deleteAccount, requestPersistence,
      addPost, likePost, addComment, toggleEventJoin, toggleResourceFavorite
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
