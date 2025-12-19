export enum GoalCategory {
  Health = 'Health',
  Career = 'Career',
  Personal = 'Personal',
  Financial = 'Financial',
  Learning = 'Learning',
  Relationships = 'Relationships',
  Creativity = 'Creativity'
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  progress: number; // 0 to 100
  deadline?: string;
  completed: boolean;
  milestones: Milestone[];
  notes?: string;
  coverImage?: string; 
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Anytime';
  reminderTime?: string; 
  linkedGoalId?: string; 
  streak: number;
  completedDates: string[]; 
}

export interface JournalEntry {
  id: string;
  date: string; 
  content: string;
  prompt: string;
  mood: 'Great' | 'Good' | 'Neutral' | 'Bad' | 'Awful';
  activities: string[];
  attachments: string[]; 
  audio?: string; 
  aiInsight?: string;
  linkedGoalId?: string; 
}

export type ThemeColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue';
export type AppLanguage = 'English' | 'French' | 'German' | 'Ukrainian' | 'Spanish';

export interface JournalTemplate {
  id: string;
  title: string;
  content: string; 
}

export type ServiceName = 'Fitbit' | 'AppleHealth' | 'GoogleCalendar' | 'Todoist' | 'Spotify' | 'YouTube' | 'Twitter';

export type NotificationType = 'reminder' | 'achievement' | 'motivation' | 'system';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    timestamp: number;
    actionLabel?: string;
    onAction?: () => void;
}

export interface NotificationSettings {
    enabled: boolean;
    vacationMode: boolean;
    smartReminders: boolean;
    sound: boolean;
    channels: {
        push: boolean;
        inApp: boolean;
        email: boolean;
    };
    types: {
        habits: boolean;
        goals: boolean;
        journal: boolean;
        motivation: boolean;
    };
    snoozeDuration: number;
}

export interface SecuritySettings {
    pinCode: string | null; 
    incognitoMode: boolean;
    biometricEnabled: boolean; 
}

export interface Resource {
  id: string;
  title: string;
  author: string;
  type: 'article' | 'video' | 'podcast' | 'book';
  category: string;
  url: string; 
  image: string;
  duration: string;
  rating: number;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  totalLessons: number;
  completedLessons: number;
  image: string;
  tags: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questionsCount: number;
  image: string;
}

export interface Comment {
    id: string;
    author: string;
    avatar: string;
    content: string;
    timestamp: string;
    isExpert?: boolean;
}

export interface Post {
    id: string;
    author: string;
    avatar: string;
    category: string;
    title: string;
    content: string;
    likes: number;
    likedBy: string[]; 
    comments: Comment[];
    timestamp: string;
    type: 'question' | 'share' | 'discussion';
}

export interface CommunityEvent {
    id: string;
    title: string;
    date: string; 
    description: string;
    participants: number;
    joined: boolean;
    image: string;
    type: 'challenge' | 'workshop' | 'meetup';
}

export interface DailyBriefing {
  motivation: string;
  focus: string;
  tip: string;
  journalPrompt: string;
}

export interface UserState {
  name: string;
  avatar: string; 
  goals: Goal[];
  habits: Habit[];
  journalEntries: JournalEntry[];
  theme: 'light' | 'dark';
  themeColor: ThemeColor;
  language: AppLanguage; 
  reflectionTime?: string; 
  customPrompts: string[];
  savedTemplates: JournalTemplate[];
  lastExportTimestamp?: number;
  appVersion?: string;
  dashboardLayout: {
    showMetrics: boolean;
    showAfternoon: boolean;
    showEvening: boolean;
    showGrow: boolean;
    showCommunity: boolean;
  };
  integrations: Record<ServiceName, boolean>;
  healthData: {
      steps: number;
      sleepHours: number;
      waterIntake: number; 
  };
  notificationSettings: NotificationSettings;
  securitySettings: SecuritySettings;
  savedResourceIds: string[];
  posts: Post[];
  events: CommunityEvent[];
  // AI Personalized briefing fields
  dailyBriefing?: DailyBriefing;
  lastBriefingUpdate?: number;
  lastBriefingLanguage?: AppLanguage;
  lastRewardClaimDate: string | null;
}