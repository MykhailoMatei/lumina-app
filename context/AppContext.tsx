import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserState, Goal, Habit, JournalEntry, ThemeColor, AppLanguage, JournalTemplate, ServiceName, AppNotification, Resource, LearningModule, Quiz, Post, CommunityEvent, Comment, NotificationType, GoalCategory, DailyBriefing } from '../types';

// Exported to be accessible in other files (e.g., Profile.tsx)
export const APP_VERSION = '1.2.0';

// Theme definitions for use throughout the app
export const THEMES: Record<ThemeColor, { name: string, primary: string, secondary: string, text: string, ring: string, gradient: string, shadow: string, border: string }> = {
  indigo: {
    name: 'theme_royal',
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-500',
    gradient: 'from-indigo-600 to-blue-600',
    shadow: 'shadow-indigo-200',
    border: 'border-indigo-100 dark:border-indigo-900/30'
  },
  emerald: {
    name: 'theme_nature',
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500',
    gradient: 'from-emerald-600 to-teal-600',
    shadow: 'shadow-emerald-200',
    border: 'border-emerald-100 dark:border-emerald-900/30'
  },
  rose: {
    name: 'theme_passion',
    primary: 'bg-rose-600',
    secondary: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-600 dark:text-rose-400',
    ring: 'ring-rose-500',
    gradient: 'from-rose-600 to-pink-600',
    shadow: 'shadow-rose-200',
    border: 'border-rose-100 dark:border-rose-900/30'
  },
  amber: {
    name: 'theme_energy',
    primary: 'bg-amber-500',
    secondary: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-200',
    border: 'border-amber-100 dark:border-amber-900/30'
  },
  blue: {
    name: 'theme_calm',
    primary: 'bg-blue-600',
    secondary: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500',
    gradient: 'from-blue-600 to-indigo-600',
    shadow: 'shadow-blue-200',
    border: 'border-blue-100 dark:border-blue-900/30'
  }
};

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  English: {
    home: 'Home', goals: 'Goals', journal: 'Journal', grow: 'Grow', community: 'Community', profile: 'Profile', 
    settings: 'Settings', dark_mode: 'Night Theme', language: 'Language', appearance: 'Appearance', 
    identity: 'Identity', insights: 'Insights', focus: 'Focus', daily_wisdom: 'Daily Wisdom',
    good_morning: 'Good Morning', good_afternoon: 'Good Afternoon', good_evening: 'Good Evening',
    no_habits: 'No habits yet.', new_goal: 'New Goal', start_routine: 'Start Routine',
    save_entry: 'Save Entry', update_goal: 'Update Goal', write_entry: 'Write Entry', edit_entry: 'Edit Entry', export_data: 'Export Data', 
    import_data: 'Restore Data', delete_account: 'Delete Account', privacy_policy: 'Privacy Policy', ai_connection: 'AI Connection',
    security: 'Privacy & Security', app_lock: 'App Lock', incognito: 'Incognito Mode',
    integrations: 'Integrations Hub', templates: 'Journal Templates',
    choose_avatar: 'Choose Avatar', accent_palette: 'Accent Palette', notifications_hub: 'Notifications Hub',
    enable_push: 'Enable Push Alerts', habits_notif: 'Habits', goals_notif: 'Goals', journal_notif: 'Journal',
    motivation_notif: 'Motivation', dashboard_layout: 'Dashboard Content', overview_metrics: 'Overview Metrics',
    afternoon_routine: 'Afternoon Routine', evening_routine: 'Evening Routine', focus_mode: 'Focus Mode',
    show_grow: 'Show Grow Hub', show_community: 'Show Community Feed', health_wellness: 'Health & Wellness',
    productivity: 'Productivity', content_social: 'Content & Social', api_test: 'Test',
    api_status_idle: 'Click to verify connection', save_entry_btn: 'Save Entry', update_entry_btn: 'Update Entry',
    template_name_ph: 'Template Name', template_content_ph: 'Entry content...', no_templates: 'No templates yet',
    app_lock_desc: 'Pin Access Only', disable: 'Disable', set_pin: 'Set PIN',
    delete_data_confirm: 'Permanently delete all data?', back: 'Back', create_goal: 'Create Goal',
    growth_traveler: 'Growth Traveler', edit: 'Edit', upload_photo: 'Upload Photo',
    theme_royal: 'Royal', theme_nature: 'Nature', theme_passion: 'Passion', theme_energy: 'Energy', theme_calm: 'Calm',
    my_goals: 'My Goals', progress: 'Progress', action_plan: 'Action Plan', habit_ideas: 'Habit Ideas',
    delete_goal_confirm: 'Delete goal?', choose_path: 'Choose a Path', goal_details: 'Goal Details',
    goal_title_label: 'TITLE', goal_category_label: 'CATEGORY', goal_deadline_label: 'TARGET DATE',
    goal_why_label: 'WHY THIS GOAL?', welcome_back: 'Welcome Back', pin_prompt: 'Enter your secure PIN to access Lumina',
    delete_key: 'Delete',
    micro_tip: 'Micro Tip', goals_achieved: 'Goals Achieved', streak: 'Streak', best_streak: 'Best Habit Streak',
    morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', anytime: 'Anytime',
    edit_habit: 'Edit Habit', new_habit: 'New Habit', design_routine: 'Design your routine',
    link_goal: 'Link Goal', no_goal_linked: 'No Goal Linked', habit_name: 'Habit Name', 
    ai_suggestion: 'AI Suggestion', time_of_day: 'Time of day', reminder: 'Reminder',
    update_habit: 'Update Habit', create_habit: 'Create Habit', remove_habit_confirm: 'Remove habit?',
    daily_reflection: 'Daily Reflection', curating_question: 'Curating your question...',
    search_memories: 'Search memories...', delete_entry_confirm: 'Delete entry?', reflect_grow: 'Reflect and grow.',
    no_templates_msg: 'No templates', link_goal_btn: 'Link Goal', no_goal: 'No Goal',
    write_thoughts: 'Write your thoughts here...', busy_label: 'What kept you busy?', 
    tag_name_ph: 'Tag name', reflecting_msg: 'Reflecting...', 
    progress_tracking: 'Progress Tracking', week: 'Week', month: 'Month', 
    habit_consistency: 'Habit Consistency', completion_rate: 'Completion Rate',
    emotional_journey: 'Emotional Journey', core_drivers: 'Core Drivers',
    habit_rate: 'Habit Rate', entries: 'Entries', goals_done: 'Goals Done',
    grow_explore: 'Grow & Explore', library: 'Library', learn_tab: 'Learn', quizzes_tab: 'Quizzes',
    your_modules: 'Your Modules', continue_btn: 'Continue', start_module: 'Start Module',
    expert_masterclass: 'Expert Masterclass', community_tab: 'Community', feed_tab: 'Feed', 
    events_tab: 'Events', translate_btn: 'Translate', original_btn: 'Original',
    anonymous: 'Anonymous', comment_anon_ph: 'Comment anonymously...', add_comment_ph: 'Add a comment...',
    global_challenge: 'Global Challenge', register_now: 'Register Now', already_joined: 'Already Joined ✓',
    view_all: 'View All', snooze_btn: 'Snooze', done_btn: 'Done',
    habit_name_ph: 'e.g. Morning Yoga...', days_suffix: 'days', ai_breakdown: 'AI Breakdown',
    goal_title_ph: 'What do you want to achieve?', goal_desc_ph: 'Describe your motivation...', goal_step_ph: 'Add a step...',
    post_title_ph: 'Give it a catchy title...', post_content_ph: 'Write your thoughts here...', publish_post: 'Publish to Feed',
    share_title: 'Have something to share?', share_desc: 'Contribute articles or videos to the community library.', submit_resource: 'Submit Resource',
    curating_insights: 'Curating insights...', daily_label: 'Daily:', tag_ph: 'Tag...', recommended_for_you: 'Recommended for You',
    questions_count: 'Questions', start_btn: 'Start', participants_count: 'Participating', localized_ai_translation: 'AI Localized Translation',
    no_active_goals: 'No active goals', set_milestone_btn: 'Set your first milestone',
    incognito_suffix: '(Incognito)', stillness_title: 'The Art of Stillness', stillness_desc: 'In an age of distraction, nothing can be more powerful than doing nothing.',
    masterclass_desc: 'Learn productivity from world-class experts.', quizzes_soon: 'More assessments coming soon!',
    discuss_label: 'Discussion', ask_label: 'Ask Question', share_label: 'Share Story',
    headline_label: 'Headline', category_label: 'Category', type_label: 'Type', content_label: 'Content',
    create_post_title: 'Create Post', share_world_subtitle: 'Share with the world', contrib_received: 'Contribution Received', contrib_thanks: 'Thanks for contributing! We will review it shortly.',
    ago_suffix: 'ago', minutes_short: 'm', hours_short: 'h', days_short: 'd', stillness_alt: 'Art of Stillness cover',
    choose_path_title: 'Choose a Path', choose_path_subtitle: 'START YOUR NEXT CHAPTER', create_custom_goal: 'Create Custom Goal', create_custom_desc: 'Define your own destiny.',
    or_try_template: 'OR TRY A TEMPLATE', refine_vision: 'Refine your vision',
    cat_health: 'Health', cat_career: 'Career', cat_personal: 'Personal', cat_financial: 'Financial', cat_learning: 'Learning', cat_relationships: 'Relationships', cat_creativity: 'Creativity',
    tpl_read_title: 'Read 12 Books', tpl_read_desc: 'Expand knowledge by reading one book a month.',
    tpl_run_title: 'Run a 5K', tpl_run_desc: 'Train progressively to run 5 kilometers without stopping.',
    tpl_save_title: 'Save $1,000', tpl_save_desc: 'Build an emergency fund or save for a treat.',
    tpl_lang_title: 'Learn a New Language', tpl_lang_desc: 'Practice daily to achieve basic conversational fluency.',
    tpl_meditate_title: 'Meditate Daily', tpl_meditate_desc: 'Improve mindfulness and reduce stress.',
    mood_great: 'Great', mood_good: 'Good', mood_neutral: 'Neutral', mood_bad: 'Bad', mood_awful: 'Awful',
    act_work: 'Work', act_exercise: 'Exercise', act_reading: 'Reading', act_family: 'Family', act_friends: 'Friends', act_nature: 'Nature', act_creativity: 'Creativity', act_relax: 'Relax', act_chores: 'Chores', act_learn: 'Learn',
    remove_tag_confirm: 'Remove this tag?', default_prompt: 'How does today reflect your deeper purpose?',
    reflect_on_day: 'Reflect on your day.', import_success: 'Data Restored!', import_error: 'Invalid backup file.',
    backup_status: 'Backup Status', backup_ok: 'Backup Current', backup_needed: 'Backup Recommended',
    persistence_on: 'Enhanced Storage Enabled', persistence_off: 'Enable Persistent Storage',
    update_detected: 'Lumina Updated!', update_note: 'New features added. Your local data has been preserved.',
    ai_friction_title: 'Gemini Wisdom',
    ai_friction_desc: 'Focus is a superpower. You are tracking {count} habits—adding more might reduce your success rate. Consider mastering these first.',
    routine_progress: 'Routine Progress',
    completed_routine: 'Routine Complete!',
    earlier_today: 'Earlier today',
    upcoming_today: 'Upcoming',
    flexible_status: 'Flexible',
    current_status: 'Active',
    routine_morning: 'Morning Ritual',
    routine_afternoon: 'Daytime Flow',
    routine_evening: 'Evening Wind-down',
    routine_anytime: 'Flexible Habits',
    adjust_photo: 'Adjust Photo', resize_identity: 'Resize your identity', drag_move: 'Drag to Move', zoom_label: 'Zoom',
    daily_reward: 'Daily Spark',
    reward_desc: 'You reached the 60% momentum threshold! Tap to claim your daily growth insight.',
    claim_btn: 'Claim Momentum',
    perfect_day: 'Perfect Day!',
    perfect_desc: '100% Habit completion. You are unstoppable.',
    momentum_insight: 'Momentum Insight',
    momentum_title: 'Your Momentum',
    ms_20: 'The first spark. Keep it up!',
    ms_40: 'Rising energy. You are on a roll!',
    ms_60: 'Great flow! Over halfway there.',
    ms_80: 'Peak performance! Almost finished.',
    ms_100: 'Absolute mastery today!',
    ms_idle: 'One small win is all it takes to start. Ready when you are.',
    ms_fresh: 'Fresh Start'
  },
  Spanish: {
    home: 'Inicio', goals: 'Metas', journal: 'Diario', grow: 'Crecimiento', community: 'Comunidad', profile: 'Perfil', 
    settings: 'Ajustes', dark_mode: 'Tema Oscuro', language: 'Idioma', appearance: 'Apariencia', 
    identity: 'Identidad', insights: 'Análisis', focus: 'Enfoque', daily_wisdom: 'Sabiduría Diaria',
    good_morning: 'Buenos días', good_afternoon: 'Buenas tardes', good_evening: 'Buenas noches',
    no_habits: 'Sin hábitos aún.', new_goal: 'Nueva Meta', start_routine: 'Iniciar Rutina',
    save_entry: 'Guardar entrada', update_goal: 'Actualizar Meta', write_entry: 'Escribir entrada', edit_entry: 'Editar entrada', export_data: 'Exportar datos', 
    import_data: 'Restaurar Datos', delete_account: 'Eliminar cuenta', privacy_policy: 'Privacidad', ai_connection: 'Conexión IA',
    security: 'Seguridad', app_lock: 'Bloqueo de App', incognito: 'Modo Incógnito',
    integrations: 'Integraciones', templates: 'Plantillas',
    choose_avatar: 'Elegir Avatar', accent_palette: 'Paleta de Colores', notifications_hub: 'Centro de Notificaciones',
    enable_push: 'Alertas Push', habits_notif: 'Hábitos', goals_notif: 'Metas', journal_notif: 'Diario',
    motivation_notif: 'Motivación', dashboard_layout: 'Contenido del Panel', overview_metrics: 'Métricas',
    afternoon_routine: 'Rutina de Tarde', evening_routine: 'Rutina de Noche', focus_mode: 'Modo Enfoque',
    show_grow: 'Mostrar Crecimiento', show_community: 'Muro Comunitario', health_wellness: 'Salud y Bienestar',
    productivity: 'Productividad', content_social: 'Contenido y Social', api_test: 'Probar',
    api_status_idle: 'Click para verificar conexión', save_entry_btn: 'Guardar entrada', update_entry_btn: 'Actualizar entrada',
    template_name_ph: 'Nombre de Plantilla', template_content_ph: 'Contenido...', no_templates: 'Sin plantillas',
    app_lock_desc: 'Solo acceso con PIN', disable: 'Desactivar', set_pin: 'Definir PIN',
    delete_data_confirm: '¿Eliminar permanentemente todos los datos?', back: 'Atrás', create_goal: 'Crear Meta',
    growth_traveler: 'Viajero del Crecimiento', edit: 'Editar', upload_photo: 'Subir Foto',
    theme_royal: 'Real', theme_nature: 'Naturaleza', theme_passion: 'Pasión', theme_energy: 'Energía', theme_calm: 'Calma',
    my_goals: 'Mis Metas', progress: 'Progreso', action_plan: 'Plan de Acción', habit_ideas: 'Ideas de Hábitos',
    delete_goal_confirm: '¿Eliminar meta?', choose_path: 'Elegir Camino', goal_details: 'Detalles de la Meta',
    goal_title_label: 'TÍTULO', goal_category_label: 'CATEGORÍA', goal_deadline_label: 'FECHA LÍMITE',
    goal_why_label: '¿POR QUÉ ESTA META?', welcome_back: 'Bienvenido de nuevo', pin_prompt: 'Introduce tu PIN para acceder a Lumina',
    delete_key: 'Borrar',
    micro_tip: 'Micro Consejo', goals_achieved: 'Metas Logradas', streak: 'Racha', best_streak: 'Mejor Racha',
    morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche', anytime: 'Cualquier momento',
    edit_habit: 'Editar Hábito', new_habit: 'Nuevo Hábito', design_routine: 'Diseña tu rutina',
    link_goal: 'Vincular Meta', no_goal_linked: 'Sin Meta Vinculada', habit_name: 'Nombre del Hábito', 
    ai_suggestion: 'Sugerencia IA', time_of_day: 'Momento del día', reminder: 'Recordatorio',
    update_habit: 'Actualizar Hábito', create_habit: 'Crear Hábito', remove_habit_confirm: '¿Eliminar hábito?',
    daily_reflection: 'Reflexión Diaria', curating_question: 'Preparando tu pregunta...',
    search_memories: 'Buscar recuerdos...', delete_entry_confirm: '¿Eliminar entrada?', reflect_grow: 'Reflexiona y crece.',
    no_templates_msg: 'Sin plantillas', link_goal_btn: 'Meta', no_goal: 'Sin Meta',
    write_thoughts: 'Escribe tus pensamientos...', busy_label: '¿Qué te mantuvo ocupado?', 
    tag_name_ph: 'Etiqueta', reflecting_msg: 'Reflejando...', 
    progress_tracking: 'Seguimiento de Progreso', week: 'Semana', month: 'Mes', 
    habit_consistency: 'Consistencia de Hábitos', completion_rate: 'Tasa de Éxito',
    emotional_journey: 'Viaje Emocional', core_drivers: 'Impulsores Clave',
    habit_rate: 'Tasa de Hábitos', entries: 'Entradas', goals_done: 'Metas Completas',
    grow_explore: 'Crecer y Explorar', library: 'Biblioteca', learn_tab: 'Aprender', quizzes_tab: 'Quiz',
    your_modules: 'Tus Módulos', continue_btn: 'Continuar', start_module: 'Iniciar Módulo',
    expert_masterclass: 'Expert Masterclass', community_tab: 'Comunidad', feed_tab: 'Muro', 
    events_tab: 'Eventos', translate_btn: 'Traducir', original_btn: 'Original',
    anonymous: 'Anónimo', comment_anon_ph: 'Comentar anónimamente...', add_comment_ph: 'Añadir comentario...',
    global_challenge: 'Desafío Global', register_now: 'Registrarse ahora', already_joined: 'Ya inscrito ✓',
    view_all: 'Ver todo', snooze_btn: 'Posponer', done_btn: 'Hecho',
    habit_name_ph: 'ej. Yoga matutino...', days_suffix: 'días', ai_breakdown: 'Análisis IA',
    goal_title_ph: '¿Qué quieres lograr?', goal_desc_ph: 'Describe tu motivación...', goal_step_ph: 'Añadir paso...',
    post_title_ph: 'Dale un título llamativo...', post_content_ph: 'Escribe tus pensamientos...', publish_post: 'Publicar',
    share_title: '¿Tienes algo que compartir?', share_desc: 'Contribuye artículos o videos a la biblioteca.', submit_resource: 'Enviar',
    curating_insights: 'Preparando análisis...', daily_label: 'Diario:', tag_ph: 'Etiqueta...', recommended_for_you: 'Recomendado para ti',
    questions_count: 'Preguntas', start_btn: 'Comenzar', participants_count: 'Participants', localized_ai_translation: 'Traducción IA localizada',
    no_active_goals: 'No hay metas activas', set_milestone_btn: 'Define tu primer paso',
    incognito_suffix: '(Anónimo)', stillness_title: 'El Arte de la Quietud', stillness_desc: 'En un mundo de distracciones, nada puede be más poderoso que no hacer nada.',
    masterclass_desc: 'Aprende productividad de expertos de clase mundial.', quizzes_soon: '¡Más evaluaciones próximamente!',
    discuss_label: 'Discusión', ask_label: 'Hacer una pregunta', share_label: 'Compartir historia',
    headline_label: 'Título', category_label: 'Categoría', type_label: 'Type', content_label: 'Contenido',
    create_post_title: 'Crear publicación', share_world_subtitle: 'Comparte con el mundo', contrib_received: 'Contribución recibida', contrib_thanks: '¡Gracias por contribuir! La revisaremos pronto.',
    ago_suffix: 'hace', minutes_short: 'm', hours_short: 'h', days_short: 'd', stillness_alt: 'Portada del Arte de la Quietud',
    choose_path_title: 'Elegir Camino', choose_path_subtitle: 'COMIENZA TU PRÓXIMO CAPÍTULO', create_custom_goal: 'Crear Meta Personalizada', create_custom_desc: 'Define tu propio destino.',
    or_try_template: 'O PRUEBA UNA PLANTILLA', refine_vision: 'Refina tu visión',
    cat_health: 'Salud', cat_career: 'Carrera', cat_personal: 'Personal', cat_financial: 'Finanzas', cat_learning: 'Aprendizaje', cat_relationships: 'Relaciones', cat_creativity: 'Creativity',
    tpl_read_title: 'Leer 12 Libros', tpl_read_desc: 'Amplía tus conocimientos leyendo un libro al mes.',
    tpl_run_title: 'Correr 5K', tpl_run_desc: 'Entrena progresivamente para correr 5 kilómetros sin parar.',
    tpl_save_title: 'Ahorrar $1,000', tpl_save_desc: 'Crea un fondo de emergencia o ahorra para un gusto.',
    tpl_lang_title: 'Aprender un Idioma', tpl_lang_desc: 'Practica a diario para lograr fluidez básica.',
    tpl_meditate_title: 'Meditar a Diario', tpl_meditate_desc: 'Mejora el mindfulness y reduce el estrés.',
    mood_great: 'Excelente', mood_good: 'Bien', mood_neutral: 'Neutral', mood_bad: 'Mal', mood_awful: 'Horrible',
    act_work: 'Trabajo', act_exercise: 'Ejercicio', act_reading: 'Lectura', act_family: 'Familia', act_friends: 'Amigos', act_nature: 'Naturaleza', act_creativity: 'Creatividad', act_relax: 'Relax', act_chores: 'Tareas', act_learn: 'Aprender',
    remove_tag_confirm: '¿Eliminar esta etiqueta?', default_prompt: '¿Cómo refleja el día de hoy tu propósito más profundo?',
    reflect_on_day: 'Reflexiona sobre tu día.', import_success: '¡Datos Restaurados!', import_error: 'Archivo de respaldo inválido.',
    backup_status: 'Estado de Respaldo', backup_ok: 'Respaldo al día', backup_needed: 'Se recomienda respaldar',
    persistence_on: 'Almacenamiento Mejorado Activo', persistence_off: 'Activar Almacenamiento Permanente',
    update_detected: '¡Lumina Actualizada!', update_note: 'Nuevas funciones añadidas. Tus datos se han mantenido.',
    ai_friction_title: 'Sabiduría de Gemini',
    ai_friction_desc: 'El enfoque es un superpoder. Ya sigues {count} hábitos; añadir más podría reducir tu éxito. Considera dominar estos primero.',
    routine_progress: 'Progreso de la Rutina',
    completed_routine: '¡Rutina completada!',
    earlier_today: 'Más temprano',
    upcoming_today: 'Próximamente',
    flexible_status: 'Flexible',
    current_status: 'Activo',
    routine_morning: 'Ritual Matutino',
    routine_afternoon: 'Flujo del Día',
    routine_evening: 'Cierre del Día',
    routine_anytime: 'Hábitos Flexibles',
    adjust_photo: 'Ajustar Foto', resize_identity: 'Cambia tu identidad', drag_move: 'Arrastra para mover', zoom_label: 'Zoom',
    daily_reward: 'Chispa Diaria',
    reward_desc: '¡Has alcanzado el 60% de impulso! Pulsa para reclamar tu mensaje de crecimiento.',
    claim_btn: 'Reclamar Impulso',
    perfect_day: '¡Día Perfecto!',
    perfect_desc: '100% hábitos completados. Eres imparable.',
    momentum_insight: 'Mensaje de Impulso',
    momentum_title: 'Tu Impulso',
    ms_20: 'La primera chispa. ¡Sigue así!',
    ms_40: 'Energía en aumento. ¡Vas muy bien!',
    ms_60: '¡Gran flujo! Ya pasaste la mitad.',
    ms_80: '¡Máximo rendimiento! Casi terminas.',
    ms_100: '¡Maestría absoluta hoy!',
    ms_idle: 'Un pequeño paso es todo lo que necesitas para empezar. Listo cuando tú lo estés.',
    ms_fresh: 'Nuevo Comienzo'
  },
  French: {
    home: 'Accueil', goals: 'Objectifs', journal: 'Journal', grow: 'Grandir', community: 'Communauté', profile: 'Profil', 
    settings: 'Paramètres', dark_mode: 'Thème Nuit', language: 'Langue', appearance: 'Apparence', 
    identity: 'Identité', insights: 'Aperçus', focus: 'Focus', daily_wisdom: 'Sagesse Quotidienne',
    good_morning: 'Bon matin', good_afternoon: 'Bon après-midi', good_evening: 'Bonne soirée',
    no_habits: 'Aucune habitude encore.', new_goal: 'Nouvel Objectif', start_routine: 'Commencer Routine',
    save_entry: 'Enregistrer', update_goal: 'Mettre à jour', write_entry: 'Écrire', edit_entry: 'Modifier', export_data: 'Exporter', 
    import_data: 'Restaurer', delete_account: 'Supprimer compte', privacy_policy: 'Confidentialité', ai_connection: 'Connexion IA',
    security: 'Sécurité', app_lock: 'Verrouillage', incognito: 'Mode Incognito',
    integrations: 'Intégrations', templates: 'Modèles',
    choose_avatar: 'Choisir Avatar', accent_palette: 'Couleurs', notifications_hub: 'Notifications',
    enable_push: 'Alertes Push', habits_notif: 'Habitudes', goals_notif: 'Objectifs', journal_notif: 'Journal',
    motivation_notif: 'Motivation', dashboard_layout: 'Tableau de Bord', overview_metrics: 'Métriques',
    afternoon_routine: 'Routine Après-midi', evening_routine: 'Routine Soir', focus_mode: 'Mode Focus',
    show_grow: 'Afficher Grandir', show_community: 'Fil Communautaire', health_wellness: 'Santé',
    productivity: 'Productivité', content_social: 'Social', api_test: 'Test',
    api_status_idle: 'Vérifier connexion', save_entry_btn: 'Enregistrer', update_entry_btn: 'Mettre à jour',
    template_name_ph: 'Nom du modèle', template_content_ph: 'Contenu...', no_templates: 'Aucun modèle',
    app_lock_desc: 'Accès par PIN', disable: 'Désactiver', set_pin: 'Définir PIN',
    delete_data_confirm: 'Supprimer tout définitivement ?', back: 'Retour', create_goal: 'Créer Objectif',
    growth_traveler: 'Voyageur de Croissance', edit: 'Modifier', upload_photo: 'Télécharger Photo',
    theme_royal: 'Royal', theme_nature: 'Nature', theme_passion: 'Passion', theme_energy: 'Énergie', theme_calm: 'Calme',
    my_goals: 'Mes Objectifs', progress: 'Progrès', action_plan: 'Plan d\'Action', habit_ideas: 'Idées',
    delete_goal_confirm: 'Supprimer l\'objectif ?', choose_path: 'Choisir un Chemin', goal_details: 'Détails',
    goal_title_label: 'TITRE', goal_category_label: 'CATÉGORIE', goal_deadline_label: 'DATE CIBLE',
    goal_why_label: 'POURQUOI CET OBJECTIF ?', welcome_back: 'Bon retour', pin_prompt: 'Entrez votre PIN Lumina',
    delete_key: 'Supprimer',
    micro_tip: 'Micro Astuce', goals_achieved: 'Objectifs Atteints', streak: 'Série', best_streak: 'Meilleure Série',
    morning: 'Matin', afternoon: 'Après-midi', evening: 'Soir', anytime: 'N\'importe quand',
    edit_habit: 'Modifier Habitude', new_habit: 'Nouvelle Habitude', design_routine: 'Créez votre routine',
    link_goal: 'Lier Objectif', no_goal_linked: 'Aucun Objectif Lié', habit_name: 'Nom de l\'habitude', 
    ai_suggestion: 'Suggestion IA', time_of_day: 'Moment de la journée', reminder: 'Rappel',
    update_habit: 'Mettre à jour', create_habit: 'Créer Habitude', remove_habit_confirm: 'Supprimer l\'habitude ?',
    daily_reflection: 'Réflexion Quotidienne', curating_question: 'Préparation de la question...',
    search_memories: 'Rechercher...', delete_entry_confirm: 'Supprimer l\'entrée ?', reflect_grow: 'Réfléchir et grandir.',
    no_templates_msg: 'Aucun modèle', link_goal_btn: 'Lier', no_goal: 'Aucun Objectif',
    write_thoughts: 'Écrivez vos pensées...', busy_label: 'Occupations du jour ?', 
    tag_name_ph: 'Nom du tag', reflecting_msg: 'Réflexion...', 
    progress_tracking: 'Suivi des Progrès', week: 'Semaine', month: 'Mois', 
    habit_consistency: 'Consistance', completion_rate: 'Taux de Succès',
    emotional_journey: 'Voyage Émotionnel', core_drivers: 'Moteurs Clés',
    habit_rate: 'Taux Habitudes', entries: 'Entrées', goals_done: 'Objectifs Finis',
    grow_explore: 'Grandir & Explorer', library: 'Bibliothèque', learn_tab: 'Apprendre', quizzes_tab: 'Quiz',
    your_modules: 'Vos Modules', continue_btn: 'Continuer', start_module: 'Démarrer',
    expert_masterclass: 'Masterclass Expert', community_tab: 'Communauté', feed_tab: 'Fil', 
    events_tab: 'Événements', translate_btn: 'Traduire', original_btn: 'Original',
    anonymous: 'Anonyme', comment_anon_ph: 'Commenter anonymement...', add_comment_ph: 'Ajouter un commentaire...',
    global_challenge: 'Défi Mondial', register_now: 'S\'inscrire', already_joined: 'Déjà inscrit ✓',
    view_all: 'Tout voir', snooze_btn: 'Plus tard', done_btn: 'Fait',
    habit_name_ph: 'ex. Yoga matin...', days_suffix: 'jours', ai_breakdown: 'Analyse IA',
    goal_title_ph: 'Que voulez-vous accomplir ?', goal_desc_ph: 'Décrivez votre motivation...', goal_step_ph: 'Ajouter une étape...',
    post_title_ph: 'Donnez un titre...', post_content_ph: 'Écrivez ici...', publish_post: 'Publier',
    share_title: 'Quelque chose à partager ?', share_desc: 'Contribuez à la bibliothèque communautaire.', submit_resource: 'Soumettre',
    curating_insights: 'Préparation...', daily_label: 'Quotidien :', tag_ph: 'Tag...', recommended_for_you: 'Recommandé pour vous',
    questions_count: 'Questions', start_btn: 'Démarrer', participants_count: 'Participants', localized_ai_translation: 'Traduction IA localisée',
    no_active_goals: 'Aucun objectif actif', set_milestone_btn: 'Définir un premier jalon',
    incognito_suffix: '(Anonyme)', stillness_title: 'L\'Art du Calme', stillness_desc: 'Nichts ist mächtiger als nichts zu tun.',
    masterclass_desc: 'Apprenez la productivité avec des experts.', quizzes_soon: 'Plus de quiz bientôt !',
    discuss_label: 'Discussion', ask_label: 'Poser Question', share_label: 'Partager',
    headline_label: 'Titre', category_label: 'Catégorie', type_label: 'Type', content_label: 'Contenu',
    create_post_title: 'Créer Post', share_world_subtitle: 'Partager avec le monde', contrib_received: 'Contribution Reçue', contrib_thanks: 'Merci ! Nous allons examiner cela.',
    ago_suffix: 'auparavant', minutes_short: 'm', hours_short: 'h', days_short: 'j', stillness_alt: 'Couverture L\'Art du Calme',
    choose_path_title: 'Choisir un Chemin', choose_path_subtitle: 'COMMENCEZ VOTRE PROCHAIN CHAPITRE', create_custom_goal: 'Objectif Personnalisé', create_custom_desc: 'Définissez votre destin.',
    or_try_template: 'OU ESSAYEZ UN MODÈLE', refine_vision: 'Affinez votre vision',
    cat_health: 'Santé', cat_career: 'Carrière', cat_personal: 'Personnel', cat_financial: 'Finance', cat_learning: 'Apprentissage', cat_relationships: 'Relations', cat_creativity: 'Créativité',
    tpl_read_title: 'Lire 12 Livres', tpl_read_desc: 'Élargir les connaissances un livre par mois.',
    tpl_run_title: 'Courir un 5K', tpl_run_desc: 'S\'entraîner pour courir 5km sans s\'arrêter.',
    tpl_save_title: 'Économiser 1 000$', tpl_save_desc: 'Créer un fonds d\'urgence.',
    tpl_lang_title: 'Apprendre une Langue', tpl_lang_desc: 'Pratiquer quotidiennement pour la fluidité.',
    tpl_meditate_title: 'Méditer Quotidiennement', tpl_meditate_desc: 'Réduire le stress.',
    mood_great: 'Super', mood_good: 'Bien', mood_neutral: 'Neutre', mood_bad: 'Mal', mood_awful: 'Affreux',
    act_work: 'Travail', act_exercise: 'Exercice', act_reading: 'Lecture', act_family: 'Famille', act_friends: 'Amis', act_nature: 'Nature', act_creativity: 'Créativité', act_relax: 'Repos', act_chores: 'Tâches', act_learn: 'Apprendre',
    remove_tag_confirm: 'Supprimer ce tag ?', default_prompt: 'Comment cette journée reflète-t-elle votre but profond ?',
    reflect_on_day: 'Réfléchissez à votre journée.', import_success: 'Données restaurées !', import_error: 'Fichier invalide.',
    backup_status: 'Sauvegarde', backup_ok: 'Sauvegarde OK', backup_needed: 'Sauvegarde recommandée',
    persistence_on: 'Stockage Amélioré Actif', persistence_off: 'Activer Stockage Permanent',
    update_detected: 'Lumina Mis à Jour !', update_note: 'Nouvelles fonctionnalités ajoutées.',
    ai_friction_title: 'Sagesse de Gemini',
    ai_friction_desc: 'Le focus est un super-pouvoir. Vous suivez {count} habitudes—en ajouter plus réduit vos chances. Maîtrisez celles-ci d\'abord.',
    routine_progress: 'Progrès Routine',
    completed_routine: 'Routine Terminée !',
    earlier_today: 'Plus tôt',
    upcoming_today: 'À venir',
    flexible_status: 'Flexible',
    current_status: 'Actif',
    routine_morning: 'Rituel Matinal',
    routine_afternoon: 'Flux de Journée',
    routine_evening: 'Clôture du Soir',
    routine_anytime: 'Habitudes Flexibles',
    adjust_photo: 'Ajuster Photo', resize_identity: 'Redimensionner', drag_move: 'Glisser pour déplacer', zoom_label: 'Zoom',
    daily_reward: 'Étincelle quotidienne',
    reward_desc: 'Vous avez atteint 60% d\'élan ! Appuyez pour réclamer votre message de croissance.',
    claim_btn: 'Réclamer l\'élan',
    perfect_day: 'Journée parfaite !',
    perfect_desc: '100% d\'habitudes complétées. Vous êtes inarrêtable.',
    momentum_insight: 'Message d\'élan',
    momentum_title: 'Votre Élan',
    ms_20: 'La première étincelle. Continuez !',
    ms_40: 'Énergie montante. Vous êtes sur une lancée !',
    ms_60: 'Super flux ! Déjà plus de la moitié.',
    ms_80: 'Performance de pointe ! Presque fini.',
    ms_100: 'Maîtrise absolue aujourd\'hui !',
    ms_idle: 'Une seule petite victoire suffit pour commencer. Prêt quand tu l\'es.',
    ms_fresh: 'Nouveau Départ'
  },
  German: {
    home: 'Home', goals: 'Ziele', journal: 'Journal', grow: 'Wachsen', community: 'Community', profile: 'Profil', 
    settings: 'Einstellungen', dark_mode: 'Nacht-Modus', language: 'Sprache', appearance: 'Aussehen', 
    identity: 'Identität', insights: 'Einblicke', focus: 'Fokus', daily_wisdom: 'Tägliche Weisheit',
    good_morning: 'Guten Morgen', good_afternoon: 'Guten Tag', good_evening: 'Guten Abend',
    no_habits: 'Noch keine Gewohnheiten.', new_goal: 'Neues Ziel', start_routine: 'Routine starten',
    save_entry: 'Speichern', update_goal: 'Aktualisieren', write_entry: 'Schreiben', edit_entry: 'Bearbeiten', export_data: 'Exportieren', 
    import_data: 'Wiederherstellen', delete_account: 'Konto löschen', privacy_policy: 'Datenschutz', ai_connection: 'KI-Verbindung',
    security: 'Sicherheit', app_lock: 'App-Sperre', incognito: 'Inkognito',
    integrations: 'Integrationen', templates: 'Vorlagen',
    choose_avatar: 'Avatar wählen', accent_palette: 'Farben', notifications_hub: 'Mitteilungen',
    enable_push: 'Push-Benachrichtigungen', habits_notif: 'Gewohnheiten', goals_notif: 'Ziele', journal_notif: 'Journal',
    motivation_notif: 'Motivation', dashboard_layout: 'Dashboard-Inhalt', overview_metrics: 'Metriken',
    afternoon_routine: 'Nachmittags-Routine', evening_routine: 'Abend-Routine', focus_mode: 'Fokus-Modus',
    show_grow: 'Wachsen anzeigen', show_community: 'Community anzeigen', health_wellness: 'Gesundheit',
    productivity: 'Produktivität', content_social: 'Soziales', api_test: 'Test',
    api_status_idle: 'Verbindung prüfen', save_entry_btn: 'Speichern', update_entry_btn: 'Aktualisieren',
    template_name_ph: 'Vorlagenname', template_content_ph: 'Inhalt...', no_templates: 'Keine Vorlagen',
    app_lock_desc: 'Nur PIN-Zugriff', disable: 'Deaktivieren', set_pin: 'PIN setzen',
    delete_data_confirm: 'Alle Daten permanent löschen?', back: 'Zurück', create_goal: 'Ziel erstellen',
    growth_traveler: 'Wachstums-Reisender', edit: 'Bearbeiten', upload_photo: 'Foto hochladen',
    theme_royal: 'Königlich', theme_nature: 'Natur', theme_passion: 'Leidenschaft', theme_energy: 'Energie', theme_calm: 'Ruhe',
    my_goals: 'Meine Ziele', progress: 'Fortschritt', action_plan: 'Aktionsplan', habit_ideas: 'Ideen',
    delete_goal_confirm: 'Ziel löschen?', choose_path: 'Pfad wählen', goal_details: 'Details',
    goal_title_label: 'TITEL', goal_category_label: 'KATEGORIE', goal_deadline_label: 'ZIELDATUM',
    goal_why_label: 'WARUM DIESES ZIEL?', welcome_back: 'Willkommen zurück', pin_prompt: 'PIN eingeben',
    delete_key: 'Löschen',
    micro_tip: 'Tipp', goals_achieved: 'Ziele erreicht', streak: 'Serie', best_streak: 'Beste Serie',
    morning: 'Morgen', afternoon: 'Nachmittag', evening: 'Abend', anytime: 'Jederzeit',
    edit_habit: 'Bearbeiten', new_habit: 'Neue Gewohnheit', design_routine: 'Designen Sie Ihre Routine',
    link_goal: 'Ziel verknüpfen', no_goal_linked: 'Kein Ziel verknüpft', habit_name: 'Name', 
    ai_suggestion: 'KI-Vorschlag', time_of_day: 'Tageszeit', reminder: 'Erinnerung',
    update_habit: 'Aktualisieren', create_habit: 'Erstellen', remove_habit_confirm: 'Löschen?',
    daily_reflection: 'Tägliche Reflexion', curating_question: 'Frage wird erstellt...',
    search_memories: 'Suchen...', delete_entry_confirm: 'Eintrag löschen?', reflect_grow: 'Reflektieren und wachsen.',
    no_templates_msg: 'Keine Vorlagen', link_goal_btn: 'Ziel', no_goal: 'Kein Ziel',
    write_thoughts: 'Schreiben Sie hier...', busy_label: 'Was hat Sie beschäftigt?', 
    tag_name_ph: 'Tag-Name', reflecting_msg: 'Reflektiere...', 
    progress_tracking: 'Fortschritt', week: 'Woche', month: 'Monat', 
    habit_consistency: 'Konsistenz', completion_rate: 'Erfolgsrate',
    emotional_journey: 'Emotionale Reise', core_drivers: 'Haupttreiber',
    habit_rate: 'Rate', entries: 'Einträge', goals_done: 'Ziele fertig',
    grow_explore: 'Wachsen & Erkunden', library: 'Bibliothek', learn_tab: 'Lernen', quizzes_tab: 'Quiz',
    your_modules: 'Ihre Module', continue_btn: 'Weiter', start_module: 'Starten',
    expert_masterclass: 'Experten-Masterclass', community_tab: 'Community', feed_tab: 'Feed', 
    events_tab: 'Events', translate_btn: 'Übersetzen', original_btn: 'Original',
    anonymous: 'Anonym', comment_anon_ph: 'Anonym kommentieren...', add_comment_ph: 'Kommentar hinzufügen...',
    global_challenge: 'Globale Challenge', register_now: 'Jetzt anmelden', already_joined: 'Bereits dabei ✓',
    view_all: 'Alle sehen', snooze_btn: 'Später', done_btn: 'Fertig',
    habit_name_ph: 'z.B. Yoga am Morgen...', days_suffix: 'Tage', ai_breakdown: 'KI-Analyse',
    goal_title_ph: 'Was möchten Sie erreichen?', goal_desc_ph: 'Motivation beschreiben...', goal_step_ph: 'Schritt hinzufügen...',
    post_title_ph: 'Titel geben...', post_content_ph: 'Gedanken schreiben...', publish_post: 'Veröffentlichen',
    share_title: 'Etwas zu teilen?', share_desc: 'Teilen Sie Artikel oder Videos.', submit_resource: 'Senden',
    curating_insights: 'Analysiere...', daily_label: 'Täglich:', tag_ph: 'Tag...', recommended_for_you: 'Für Sie empfohlen',
    questions_count: 'Fragen', start_btn: 'Start', participants_count: 'Teilnehmer', localized_ai_translation: 'KI-Übersetzung',
    no_active_goals: 'Keine aktiven Ziele', set_milestone_btn: 'Erster Meilenstein',
    incognito_suffix: '(Inkognito)', stillness_title: 'Die Kunst der Stille', stillness_desc: 'Nichts ist mächtiger als nichts zu tun.',
    masterclass_desc: 'Produktivität von Experten lernen.', quizzes_soon: 'Mehr Quiz bald!',
    discuss_label: 'Diskussion', ask_label: 'Frage stellen', share_label: 'Teilen',
    headline_label: 'Schlagzeile', category_label: 'Kategorie', type_label: 'Typ', content_label: 'Inhalt',
    create_post_title: 'Post erstellen', share_world_subtitle: 'Mit der Welt teilen', contrib_received: 'Beitrag erhalten', contrib_thanks: 'Danke ! Wir prüfen das.',
    ago_suffix: 'her', minutes_short: 'm', hours_short: 'h', days_short: 't', stillness_alt: 'Cover Stille',
    choose_path_title: 'Pfad wählen', choose_path_subtitle: 'STARTEN SIE IHR NÄCHSTES KAPITEL', create_custom_goal: 'Eigenes Ziel', create_custom_desc: 'Bestimmen Sie Ihr Schicksal.',
    or_try_template: 'ODER VORLAGE NUTZEN', refine_vision: 'Vision verfeinern',
    cat_health: 'Gesundheit', cat_career: 'Karriere', cat_personal: 'Persönlich', cat_financial: 'Finanzen', cat_learning: 'Lernen', cat_relationships: 'Beziehungen', cat_creativity: 'Kreativität',
    tpl_read_title: '12 Bücher lesen', tpl_read_desc: 'Jeden Monat ein Buch lesen.',
    tpl_run_title: '5km laufen', tpl_run_desc: 'Progressiv trainieren.',
    tpl_save_title: '1.000€ sparen', tpl_save_desc: 'Notfallfonds aufbauen.',
    tpl_lang_title: 'Sprache lernen', tpl_lang_desc: 'Täglich üben.',
    tpl_meditate_title: 'Täglich meditieren', tpl_meditate_desc: 'Stress reduzieren.',
    mood_great: 'Super', mood_good: 'Gut', mood_neutral: 'Neutral', mood_bad: 'Schlecht', mood_awful: 'Furchtbar',
    act_work: 'Arbeit', act_exercise: 'Sport', act_reading: 'Lesen', act_family: 'Familie', act_friends: 'Freunde', act_nature: 'Natur', act_creativity: 'Kreativität', act_relax: 'Entspannung', act_chores: 'Haushalt', act_learn: 'Lernen',
    remove_tag_confirm: 'Tag entfernen?', default_prompt: 'Wie spiegelt der heutige Tag Ihren tieferen Sinn wider?',
    reflect_on_day: 'Reflektieren Sie.', import_success: 'Erfolgreich!', import_error: 'Fehler.',
    backup_status: 'Backup', backup_ok: 'Backup aktuell', backup_needed: 'Backup empfohlen',
    persistence_on: 'Speicher aktiv', persistence_off: 'Speicher aktivieren',
    update_detected: 'Update!', update_note: 'Neue Funktionen.',
    ai_friction_title: 'Gemini Weisheit',
    ai_friction_desc: 'Fokus ist alles. Sie tracken {count} Gewohnheiten—mehr könnten den Erfolg mindern.',
    routine_progress: 'Fortschritt',
    completed_routine: 'Fertig!',
    earlier_today: 'Vorhin',
    upcoming_today: 'Demnächst',
    flexible_status: 'Flexibel',
    current_status: 'Aktiv',
    routine_morning: 'Morgenritual',
    routine_afternoon: 'Tagesfluss',
    routine_evening: 'Abendruhe',
    routine_anytime: 'Flexible Gewohnheiten',
    adjust_photo: 'Foto anpassen', resize_identity: 'Identität skalieren', drag_move: 'Zum Bewegen ziehen', zoom_label: 'Zoom',
    daily_reward: 'Tages-Funke',
    reward_desc: '60% Impuls erreicht! Tippen, um Ihre Wachstumsbotschaft zu erhalten.',
    claim_btn: 'Impuls einlösen',
    perfect_day: 'Perfekter Tag!',
    perfect_desc: '100% Gewohnheiten erledigt. Du bist unaufhaltsam.',
    momentum_insight: 'Impuls-Botschaft',
    momentum_title: 'Dein Schwung',
    ms_20: 'Der erste Funke. Weiter so!',
    ms_40: 'Steigende Energie. Du bist gut dabei!',
    ms_60: 'Toller Fluss! Schon über die Hälfte.',
    ms_80: 'Höchstleistung! Fast geschafft.',
    ms_100: 'Absolute Meisterschaft heute!',
    ms_idle: 'Ein kleiner Erfolg reicht für den Anfang. Bereit, wenn du es bist.',
    ms_fresh: 'Neuanfang'
  },
  Ukrainian: {
    home: 'Головна', goals: 'Цілі', journal: 'Щоденник', grow: 'Ріст', community: 'Спільнота', profile: 'Профіль', 
    settings: 'Налаштування', dark_mode: 'Нічна тема', language: 'Мова', appearance: 'Вигляд', 
    identity: 'Особистість', insights: 'Аналітика', focus: 'Фокус', daily_wisdom: 'Мудрість дня',
    good_morning: 'Доброго ранку', good_afternoon: 'Доброго дня', good_evening: 'Доброго вечора',
    no_habits: 'Ще немає звичок.', new_goal: 'Нова ціль', start_routine: 'Почати рутину',
    save_entry: 'Зберегти', update_goal: 'Оновити', write_entry: 'Написати', edit_entry: 'Редагувати', export_data: 'Експорт', 
    import_data: 'Відновити', delete_account: 'Видалити аккаунт', privacy_policy: 'Конфіденційність', ai_connection: 'AI Зв\'язок',
    security: 'Безпека', app_lock: 'Блокування', incognito: 'Інкогніто',
    integrations: 'Інтеграції', templates: 'Шаблони',
    choose_avatar: 'Обрати аватар', accent_palette: 'Кольори', notifications_hub: 'Сповіщення',
    enable_push: 'Push-сповіщення', habits_notif: 'Звички', goals_notif: 'Цілі', journal_notif: 'Щоденник',
    motivation_notif: 'Мотивація', dashboard_layout: 'Контент панелі', overview_metrics: 'Метрики',
    afternoon_routine: 'Денна рутина', evening_routine: 'Вечірня рутина', focus_mode: 'Режим фокусу',
    show_grow: 'Показати Ріст', show_community: 'Показати Спільноту', health_wellness: 'Здоров\'я',
    productivity: 'Продуктивність', content_social: 'Соціал', api_test: 'Тест',
    api_status_idle: 'Перевірити зв\'язок', save_entry_btn: 'Зберегти запис', update_entry_btn: 'Оновити запис',
    template_name_ph: 'Назва шаблону', template_content_ph: 'Зміст...', no_templates: 'Немає шаблонів',
    app_lock_desc: 'Доступ за PIN-кодом', disable: 'Вимкнути', set_pin: 'Встановити PIN',
    delete_data_confirm: 'Видалити всі дані назавжди?', back: 'Назад', create_goal: 'Створити ціль',
    growth_traveler: 'Мандрівник росту', edit: 'Редагувати', upload_photo: 'Завантажити фото',
    theme_royal: 'Королівський', theme_nature: 'Природа', theme_passion: 'Пристрасть', theme_energy: 'Енергія', theme_calm: 'Спокій',
    my_goals: 'Мої цілі', progress: 'Прогрес', action_plan: 'План дій', habit_ideas: 'Ідеї звичок',
    delete_goal_confirm: 'Видалити ціль?', choose_path: 'Обрати шлях', goal_details: 'Деталі цілі',
    goal_title_label: 'НАЗВА', goal_category_label: 'КАТЕГОРІЯ', goal_deadline_label: 'ДАТА',
    goal_why_label: 'ЧОМУ ЦЯ ЦІЛЬ?', welcome_back: 'З поверненням', pin_prompt: 'Введіть PIN для Lumina',
    delete_key: 'Стерти',
    micro_tip: 'Порада', goals_achieved: 'Цілей досягнуто', streak: 'Серія', best_streak: 'Краща серія',
    morning: 'Ранок', afternoon: 'День', evening: 'Вечір', anytime: 'Будь-коли',
    edit_habit: 'Редагувати', new_habit: 'Нова звичка', design_routine: 'Створіть свою рутину',
    link_goal: 'Прив\'язати ціль', no_goal_linked: 'Без цілі', habit_name: 'Назва звички', 
    ai_suggestion: 'AI Порада', time_of_day: 'Час доби', reminder: 'Нагадування',
    update_habit: 'Оновити', create_habit: 'Створити', remove_habit_confirm: 'Видалити?',
    daily_reflection: 'Щоденна рефлексія', curating_question: 'Готуємо питання...',
    search_memories: 'Пошук...', delete_entry_confirm: 'Видалити запис?', reflect_grow: 'Рефлексуйте та ростіть.',
    no_templates_msg: 'Немає шаблонів', link_goal_btn: 'Ціль', no_goal: 'Без цілі',
    write_thoughts: 'Напишіть свої думки...', busy_label: 'Чим ви були зайняті?', 
    tag_name_ph: 'Назва тегу', reflecting_msg: 'Рефлексуємо...', 
    progress_tracking: 'Відстеження прогресу', week: 'Тиждень', month: 'Місяць', 
    habit_consistency: 'Послідовність', completion_rate: 'Рівень успіху',
    emotional_journey: 'Емоційна подорож', core_drivers: 'Ключові драйвери',
    habit_rate: 'Рейтинг', entries: 'Записи', goals_done: 'Цілей виконано',
    grow_explore: 'Ріст та дослідження', library: 'Бібліотека', learn_tab: 'Вчитися', quizzes_tab: 'Квізи',
    your_modules: 'Ваші модулі', continue_btn: 'Продовжити', start_module: 'Почати',
    expert_masterclass: 'Майстер-клас', community_tab: 'Спільнота', feed_tab: 'Стрічка', 
    events_tab: 'Події', translate_btn: 'Перекласти', original_btn: 'Оригінал',
    anonymous: 'Анонімно', comment_anon_ph: 'Анонімний коментар...', add_comment_ph: 'Додати коментар...',
    global_challenge: 'Глобальний виклик', register_now: 'Зареєструватися', already_joined: 'Вже приєдналися ✓',
    view_all: 'Дивитися всі', snooze_btn: 'Пізніше', done_btn: 'Готово',
    habit_name_ph: 'напр. Ранкова йога...', days_suffix: 'днів', ai_breakdown: 'AI Аналіз',
    goal_title_ph: 'Чого ви хочете досягти?', goal_desc_ph: 'Опишіть вашу мотивацію...', goal_step_ph: 'Додати крок...',
    post_title_ph: 'Дайте назву...', post_content_ph: 'Ваші думки...', publish_post: 'Опублікувати',
    share_title: 'Є чим поділитися?', share_desc: 'Додайте статті або відео до бібліотеки.', submit_resource: 'Надіслати',
    curating_insights: 'Аналізуємо...', daily_label: 'Щодня:', tag_ph: 'Тег...', recommended_for_you: 'Рекомендовано',
    questions_count: 'Питань', start_btn: 'Почати', participants_count: 'Учасників', localized_ai_translation: 'AI Переклад',
    no_active_goals: 'Немає активних цілей', set_milestone_btn: 'Перший крок',
    incognito_suffix: '(Інкогніто)', stillness_title: 'Мистецтво спокою', stillness_desc: 'Ніщо не є таким потужним, як неробство.',
    masterclass_desc: 'Вчіться у кращих експертів.', quizzes_soon: 'Квізи незабаром!',
    discuss_label: 'Дискусія', ask_label: 'Питання', share_label: 'Історія',
    headline_label: 'Заголовок', category_label: 'Категорія', type_label: 'Тип', content_label: 'Зміст',
    create_post_title: 'Створити пост', share_world_subtitle: 'Поділіться зі світом', contrib_received: 'Отримано', contrib_thanks: 'Дякуємо! Ми скоро перевіримо.',
    ago_suffix: 'тому', minutes_short: 'хв', hours_short: 'год', days_short: 'д', stillness_alt: 'Обкладинка спокою',
    choose_path_title: 'Оберіть шлях', choose_path_subtitle: 'ПОЧНІТЬ НОВУ ГЛАВУ', create_custom_goal: 'Власна ціль', create_custom_desc: 'Визначте свою долю.',
    or_try_template: 'АБО ШАБЛОН', refine_vision: 'Уточніть бачення',
    cat_health: 'Здоров\'я', cat_career: 'Кар\'єра', cat_personal: 'Особисте', cat_financial: 'Фінанси', cat_learning: 'Навчання', cat_relationships: 'Стосунки', cat_creativity: 'Творчість',
    tpl_read_title: 'Прочитати 12 книг', tpl_read_desc: 'Розширюйте знання щомісяця.',
    tpl_run_title: 'Пробігти 5К', tpl_run_desc: 'Тренуйтеся прогресивно.',
    tpl_save_title: 'Заощадити $1,000', tpl_save_desc: 'Створіть резервний фонд.',
    tpl_lang_title: 'Вивчити мову', tpl_lang_desc: 'Щоденна практика.',
    tpl_meditate_title: 'Медутувати щодня', tpl_meditate_desc: 'Зменшуйте стрес.',
    mood_great: 'Супер', mood_good: 'Добре', mood_neutral: 'Нейтрально', mood_bad: 'Погано', mood_awful: 'Жахливо',
    act_work: 'Робота', act_exercise: 'Спорт', act_reading: 'Читання', act_family: 'Сім\'я', act_friends: 'Друзі', act_nature: 'Природа', act_creativity: 'Творчість', act_relax: 'Відпочинок', act_chores: 'Справи', act_learn: 'Навчання',
    remove_tag_confirm: 'Видалити тег?', default_prompt: 'Як сьогоднішній день відображає вашу глибинну мету?',
    reflect_on_day: 'Рефлексуйте.', import_success: 'Відновлено!', import_error: 'Помилка файлу.',
    backup_status: 'Бекап', backup_ok: 'Актуально', backup_needed: 'Рекомендовано',
    persistence_on: 'Сховище активне', persistence_off: 'Увімкнути сховище',
    update_detected: 'Оновлено!', update_note: 'Нові функції.',
    ai_friction_title: 'Мудрість Gemini',
    ai_friction_desc: 'Фокус - це суперсила. Ви відстежуєте {count} звичок—більше може завадити.',
    routine_progress: 'Прогрес',
    completed_routine: 'Готово!',
    earlier_today: 'Раніше',
    upcoming_today: 'Скоро',
    flexible_status: 'Гнучко',
    current_status: 'Активно',
    routine_morning: 'Ранковий ритуал',
    routine_afternoon: 'Денний потік',
    routine_evening: 'Вечірній спокій',
    routine_anytime: 'Гнучкі звички',
    adjust_photo: 'Налаштувати', resize_identity: 'Змінити масштаб', drag_move: 'Перетягуйте', zoom_label: 'Зум',
    daily_reward: 'Денна іскра',
    reward_desc: 'Ви досягли 60% імпульсу! Натисніть, щоб отримати послання росту.',
    claim_btn: 'Отримати імпульс',
    perfect_day: 'Ідеальний день!',
    perfect_desc: '100% звичок виконано. Вас не зупинити.',
    momentum_insight: 'Послання імпульсу',
    momentum_title: 'Твій Імпульс',
    ms_20: 'Перша іскра. Так тримати!',
    ms_40: 'Енергія зростає. Ти в потоці!',
    ms_60: 'Чудовий рух! Вже більше половини.',
    ms_80: 'Пікова продуктивність! Майже фініш.',
    ms_100: 'Абсолютна майстерність сьогодні!',
    ms_idle: 'Достатньо однієї маленької перемоги для старту. Готові, коли і ви.',
    ms_fresh: 'Новий Початок'
  }
};

const AppContext = createContext<any>(null);

// Implementation of the AppProvider and useApp hook
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem('lumina_user_v1');
    return saved ? JSON.parse(saved) : {
      name: 'User',
      avatar: '🌱',
      goals: [],
      habits: [],
      journalEntries: [],
      theme: 'light',
      themeColor: 'indigo',
      language: 'English',
      customPrompts: [],
      savedTemplates: [],
      dashboardLayout: {
        showMetrics: true,
        showAfternoon: true,
        showEvening: true,
        showGrow: true,
        showCommunity: true
      },
      integrations: {} as any,
      healthData: { steps: 0, sleepHours: 0, waterIntake: 0 },
      notificationSettings: {
        enabled: true, vacationMode: false, smartReminders: true, sound: true,
        channels: { push: true, inApp: true, email: false },
        types: { habits: true, goals: true, journal: true, motivation: true },
        snoozeDuration: 15
      },
      securitySettings: { pinCode: null, incognitoMode: false, biometricEnabled: false },
      savedResourceIds: [],
      posts: [],
      events: [],
      lastRewardClaimDate: null
    };
  });

  const [isLocked, setIsLocked] = useState(!!user.securitySettings.pinCode);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isPersistent, setIsPersistent] = useState(false);

  useEffect(() => {
    localStorage.setItem('lumina_user_v1', JSON.stringify(user));
  }, [user]);

  const t = (key: string) => TRANSLATIONS[user.language][key] || TRANSLATIONS.English[key] || key;
  const themeClasses = THEMES[user.themeColor];

  const updateUserPreferences = (prefs: Partial<UserState>) => setUser(prev => ({ ...prev, ...prefs }));
  
  const addGoal = (goal: Goal) => setUser(prev => ({ ...prev, goals: [...prev.goals, goal] }));
  const updateGoal = (id: string, updates: Partial<Goal>) => setUser(prev => ({
    ...prev,
    goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g)
  }));
  const deleteGoal = (id: string) => setUser(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));

  const addHabit = (habit: Habit) => setUser(prev => ({ ...prev, habits: [...prev.habits, habit] }));
  const updateHabit = (id: string, updates: Partial<Habit>) => setUser(prev => ({
    ...prev,
    habits: prev.habits.map(h => h.id === id ? { ...h, ...updates } : h)
  }));
  const deleteHabit = (id: string) => setUser(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
  const toggleHabitCompletion = (id: string, date: string) => setUser(prev => ({
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

  const addJournalEntry = (entry: JournalEntry) => setUser(prev => ({ ...prev, journalEntries: [entry, ...prev.journalEntries] }));
  const updateJournalEntry = (id: string, updates: Partial<JournalEntry>) => setUser(prev => ({
    ...prev,
    journalEntries: prev.journalEntries.map(e => e.id === id ? { ...e, ...updates } : e)
  }));
  const deleteJournalEntry = (id: string) => setUser(prev => ({ ...prev, journalEntries: prev.journalEntries.filter(e => e.id !== id) }));

  const setPinCode = (pin: string | null) => setUser(prev => ({
    ...prev,
    securitySettings: { ...prev.securitySettings, pinCode: pin }
  }));

  const unlockApp = (pin: string) => {
    if (pin === user.securitySettings.pinCode) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const triggerNotification = (title: string, message: string, type: NotificationType = 'system') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, title, message, type, timestamp: Date.now() }]);
  };

  const dismissNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const snoozeNotification = (id: string) => dismissNotification(id);

  const exportData = () => {
    const dataStr = JSON.stringify(user);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `lumina_backup_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
    setUser(prev => ({ ...prev, lastExportTimestamp: Date.now() }));
  };

  const importData = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      setUser(parsed);
      alert(t('import_success'));
    } catch {
      alert(t('import_error'));
    }
  };

  const deleteAccount = () => {
    localStorage.removeItem('lumina_user_v1');
    window.location.reload();
  };

  const requestPersistence = async () => {
    if (navigator.storage && (navigator.storage as any).persist) {
      const persistent = await (navigator.storage as any).persist();
      setIsPersistent(persistent);
      return persistent;
    }
    return false;
  };

  const toggleResourceFavorite = (id: string) => setUser(prev => ({
    ...prev,
    savedResourceIds: prev.savedResourceIds.includes(id) ? prev.savedResourceIds.filter(rid => rid !== id) : [...prev.savedResourceIds, id]
  }));

  const addPost = (post: Post) => setUser(prev => ({ ...prev, posts: [post, ...prev.posts] }));
  const likePost = (postId: string) => setUser(prev => ({
    ...prev,
    posts: prev.posts.map(p => p.id === postId ? { ...p, likes: p.likedBy.includes('me') ? p.likes - 1 : p.likes + 1, likedBy: p.likedBy.includes('me') ? p.likedBy.filter(l => l !== 'me') : [...p.likedBy, 'me'] } : p)
  }));
  const addComment = (postId: string, comment: Comment) => setUser(prev => ({
    ...prev,
    posts: prev.posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)
  }));
  const toggleEventJoin = (eventId: string) => setUser(prev => ({
    ...prev,
    events: prev.events.map(e => e.id === eventId ? { ...e, joined: !e.joined, participants: e.joined ? e.participants - 1 : e.participants + 1 } : e)
  }));

  const claimDailyReward = () => {
    setUser(prev => ({ ...prev, lastRewardClaimDate: new Date().toISOString().split('T')[0] }));
  };

  const value = {
    ...user,
    isLocked,
    themeClasses,
    t,
    updateUserPreferences,
    addGoal, updateGoal, deleteGoal,
    addHabit, updateHabit, deleteHabit, toggleHabitCompletion,
    addJournalEntry, updateJournalEntry, deleteJournalEntry,
    notifications, triggerNotification, dismissNotification, snoozeNotification,
    setPinCode, unlockApp,
    exportData, importData, deleteAccount,
    isPersistent, requestPersistence,
    toggleResourceFavorite,
    addPost, likePost, addComment,
    toggleEventJoin,
    claimDailyReward,
    resources: [
      { id: '1', title: 'The Power of Habit', author: 'Charles Duhigg', type: 'book', category: 'Habits', url: '#', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', duration: '300 pages', rating: 4.8 },
      { id: '2', title: 'Mindfulness for Beginners', author: 'Jon Kabat-Zinn', type: 'video', category: 'Mindfulness', url: '#', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', duration: '45 min', rating: 4.9 }
    ],
    modules: [
      { id: 'm1', title: 'Productivity Masterclass', description: 'Master your time and focus.', totalLessons: 10, completedLessons: 2, image: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=400', tags: ['Productivity'] }
    ],
    quizzes: [
      { id: 'q1', title: 'Growth Mindset Assessment', description: 'Discover your mindset type.', questionsCount: 15, image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400' }
    ]
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook for consuming the application context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
