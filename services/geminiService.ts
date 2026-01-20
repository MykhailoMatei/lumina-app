
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
    
    const now = new Date();
    
    // Create a detailed map of daily habit activity for the AI
    const habitData = habits.length > 0 ? habits.map(h => {
        // Explicitly typed as string[] to fix the 'never' assignment error
        const last7Days: string[] = []; 
        for(let i=0; i<7; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            last7Days.push(h.completedDates.includes(dStr) ? '✅' : '❌');
        }
        return `${h.title}: [Today..7daysAgo: ${last7Days.join('')}] Streak: ${h.streak}`;
    }).join('\n') : "No rituals established.";
    
    const journalData = journal.length > 0 ? journal.slice(0, 7).map(j => {
        const entryDate = new Date(j.date);
        const daysAgo = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24));
        return `[${daysAgo} days ago | Mood: ${j.mood}] ${j.content.substring(0, 150)}...`;
    }).join('\n') : "No reflections written.";
    
    const context = `
    DETERMINISTIC CURRENT TIME: ${now.toLocaleString()}
    NEURAL_SEED: ${Math.random().toString(36).substring(7)}
    USER_IDENTITY: Growth Traveler
    
    HABIT_CHRONOLOGY (Last 7 Days):
    ${habitData}
    
    REFLECTION_CHRONOLOGY (Last 7 Entries):
    ${journalData}
    
    STRATEGIC_GOALS:
    ${goals.map(g => `- ${g.title} (${g.category}, Progress: ${g.progress}%)`).join('\n')}
    `;

    const prompt = `${getLangInstr(lang)} 
    You are the "Lumina Growth Architect". Analyze the behavior delta.
    
    STRICT INSTRUCTION:
    1. Acknowledge SPECIFIC changes in habits/journal from the last 24-48 hours.
    2. If the user is consistently checking habits, reflect a POSITIVE shift in the identityScores.
    3. Ensure the archetype and mentalThemes evolve based on current entries.
    
    MANDATORY JSON FORMAT:
    {
      "summary": "Overview of recent behavioral shifts.",
      "correlation": "Analysis of ritual sync with goals.",
      "advice": "Actionable adjustment.",
      "trajectory": "Outlook based on current momentum.",
      "archetype": "Dynamic identity title.",
      "happinessTrigger": "A psychological win to celebrate.",
      "mentalThemes": ["3 core keywords"],
      "identityScores": [
          {"subject": "Health", "A": 0-100, "fullMark": 100},
          {"subject": "Career", "A": 0-100, "fullMark": 100},
          {"subject": "Creativity", "A": 0-100, "fullMark": 100},
          {"subject": "Learning", "A": 0-100, "fullMark": 100},
          {"subject": "Personal", "A": 0-100, "fullMark": 100},
          {"subject": "Financial", "A": 0-100, "fullMark": 100}
      ],
      "isCalibrating": boolean
    }

    CONTEXT: ${context}`;

    try {
        const res: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                temperature: 0.95 // High temperature to ensure variety
            }
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
    return JSON.parse(res.text || "{}").insight || " reflecting on your journey is the first step toward mastery.";
  } catch { return "Reflecting on your journey is the first step toward mastery."; }
};
