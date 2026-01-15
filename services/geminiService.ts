
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Goal, AppLanguage, Habit, JournalEntry, DailyBriefing } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey: apiKey });
};

const getLangInstr = (lang: AppLanguage) => 
  `CRITICAL: Response MUST be strictly in ${lang}. Output ONLY valid JSON.`;

const GET_DAILY_FALLBACK = (lang: AppLanguage): DailyBriefing => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const fallbacks: DailyBriefing[] = [
    {
      motivation: "The path to mastery is built one ritual at a time.",
      focus: "Identity Shift",
      tip: "Drink a glass of water before your first habit.",
      journalPrompt: "Who are you becoming through your current discipline?",
      priorityTask: "Review your active growth map."
    },
    {
      motivation: "Small wins are the compound interest of self-improvement.",
      focus: "Atomic Momentum",
      tip: "Set out your clothes for tomorrow tonight.",
      journalPrompt: "What is one thing you can forgive yourself for today?",
      priorityTask: "Complete your most difficult ritual first."
    }
  ];
  return fallbacks[dayOfYear % fallbacks.length];
};

export const testApiConnection = async () => {
  try {
    const ai = getAiClient();
    const response: GenerateContentResponse = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: "Reply 'OK'." 
    });
    return { success: !!response.text, message: "AI Connection verified!" };
  } catch (e: any) { return { success: false, message: e.message }; }
};

export const generateDailyBriefing = async (name: string, goals: Goal[], habits: Habit[], recentJournal: JournalEntry[], lang: AppLanguage): Promise<DailyBriefing> => {
  const ai = getAiClient();
  const dateStr = new Date().toDateString();
  const context = `Today: ${dateStr}. Goals: ${goals.map(g => g.title).join(', ')}. Habits: ${habits.map(h => h.title).join(', ')}. Recent mood: ${recentJournal[0]?.mood || 'N/A'}`;
  
  const prompt = `${getLangInstr(lang)} Generate a daily briefing. JSON: { motivation, focus, tip, journal_prompt, priorityTask }. Context: ${context}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || "{}");
    return {
      motivation: data.motivation || "Your potential is a series of choices.",
      focus: data.focus || "Daily Evolution",
      tip: data.tip || "Breathe intentionally.",
      journalPrompt: data.journal_prompt || "What are you grateful for?",
      priorityTask: data.priorityTask || "Advance your primary path."
    };
  } catch (err) {
    return GET_DAILY_FALLBACK(lang);
  }
};

export const generateGrowthAudit = async (
    habits: Habit[], 
    goals: Goal[], 
    journal: JournalEntry[], 
    lang: AppLanguage
): Promise<{ 
  summary: string, 
  correlation: string, 
  advice: string, 
  trajectory: string,
  happinessTrigger: string,
  mentalThemes: string[],
  identityScores: { subject: string, A: number, fullMark: number }[],
  archetype: string,
  isCalibrating: boolean
}> => {
    const ai = getAiClient();
    const isEarlyStage = goals.length <= 1 && habits.length === 0 && journal.length === 0;
    
    const habitData = habits.length > 0 ? habits.map(h => `${h.title} (Streak: ${h.streak})`).join(', ') : "None tracked yet";
    const journalData = journal.length > 0 ? journal.slice(0, 10).map(j => `[Mood: ${j.mood}] ${j.content.substring(0, 100)}`).join('; ') : "None written yet";
    
    const context = `
    PHASE: ${isEarlyStage ? 'SEEDING_PHASE (User just started)' : 'ACTIVE_GROWTH'}
    Habits: ${habitData}
    Journal Context: ${journalData}
    Goals: ${goals.map(g => `${g.title} (${g.category})`).join(', ')}
    `;

    const prompt = `${getLangInstr(lang)} Analyze growth data. 
    
    CRITICAL TONE GUIDE:
    - If user is in SEEDING_PHASE, be encouraging and use simple metaphors (e.g., 'Seeds of Intent', 'First Horizon').
    - AVOID technical jargon like 'Unidirectional Planning', 'Objective Simplification', or 'Input-Output Disparity' for new users.
    - Use human, warm coaching language.
    
    archetype: A persona (e.g. 'The Visionary Beginner', 'The Disciplined Architect').
    MANDATORY JSON:
    - summary: Warm overview of their current state.
    - correlation: How their goals match their actions.
    - advice: One actionable next step.
    - trajectory: Future outlook.
    - archetype: string
    - happinessTrigger: A psychological "win".
    - mentalThemes: Array of 3 human-friendly themes (e.g. 'Foundational Courage', 'Fresh Perspective').
    - identityScores: Array of 6 objects { subject: string, A: number, fullMark: 100 }.
    - isCalibrating: true if low data, false otherwise.

    Context: ${context}`;

    try {
        const res: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const parsed = JSON.parse(res.text || "{}");
        return {
            summary: parsed.summary || "You've planted your first seed.",
            correlation: parsed.correlation || "Beginning to map your intentions.",
            advice: parsed.advice || "Start a daily ritual to build momentum.",
            trajectory: parsed.trajectory || "Positive foundation.",
            archetype: parsed.archetype || "Growth Traveler",
            happinessTrigger: parsed.happinessTrigger || "Taking the first step is the hardest part.",
            mentalThemes: parsed.mentalThemes || ["Fresh Start", "Initial Vision", "Courage"],
            identityScores: parsed.identityScores || [
              { subject: 'Health', A: 30, fullMark: 100 },
              { subject: 'Career', A: 30, fullMark: 100 },
              { subject: 'Creativity', A: 30, fullMark: 100 },
              { subject: 'Learning', A: 30, fullMark: 100 },
              { subject: 'Personal', A: 30, fullMark: 100 },
              { subject: 'Financial', A: 30, fullMark: 100 }
            ],
            isCalibrating: parsed.isCalibrating ?? isEarlyStage
        };
    } catch {
        return { 
            summary: "Maintaining steady momentum.", 
            correlation: "Building a foundation.", 
            advice: "Stay the course.",
            trajectory: "Sustainable growth.",
            archetype: "Growth Traveler",
            happinessTrigger: "Your presence is your anchor.",
            mentalThemes: ["Persistence", "Stability", "Vision"],
            identityScores: [
              { subject: 'Health', A: 50, fullMark: 100 },
              { subject: 'Career', A: 50, fullMark: 100 },
              { subject: 'Creativity', A: 50, fullMark: 100 },
              { subject: 'Learning', A: 50, fullMark: 100 },
              { subject: 'Personal', A: 50, fullMark: 100 },
              { subject: 'Financial', A: 50, fullMark: 100 }
            ],
            isCalibrating: isEarlyStage
        };
    }
};

export const suggestAtomicHabit = async (habitTitle: string, lang: AppLanguage) => {
  const ai = getAiClient();
  const prompt = `${getLangInstr(lang)} Tiny habit for: "${habitTitle}". JSON: { suggestion, reason }.`;
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(res.text || "{}");
  } catch { return { suggestion: habitTitle, reason: "Start small." }; }
};

export const generateMilestonesForGoal = async (goalTitle: string, lang: AppLanguage) => {
  const ai = getAiClient();
  const prompt = `${getLangInstr(lang)} 5 milestones for "${goalTitle}". JSON array of strings.`;
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(res.text || "[]");
  } catch { return []; }
};

export const translateContent = async (title: string, content: string, lang: AppLanguage) => {
  const ai = getAiClient();
  const prompt = `Translate to ${lang}. JSON {title, content}. Title: ${title} Content: ${content}`;
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(res.text || "{}");
  } catch { return { title, content }; }
};

export const generateEntryInsight = async (content: string, mood: string, goalTitle: string | null, habitTitle: string | null, imageData: string | null, lang: AppLanguage) => {
  const ai = getAiClient();
  const parts: any[] = [{ text: `${getLangInstr(lang)} Coaching insight. JSON: { insight } Content: ${content}` }];
  if (imageData) parts.push({ inlineData: { data: imageData.split(',')[1], mimeType: imageData.split(';')[0].split(':')[1] } });
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts }, config: { responseMimeType: "application/json" } });
    return JSON.parse(res.text || "{}").insight || " মাস্টারি বা দক্ষতা অর্জনের দিকে প্রতিফলন প্রথম পদক্ষেপ।";
  } catch { return "Reflecting on your journey is the first step toward mastery."; }
};
