
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Goal, AppLanguage, Habit, JournalEntry, DailyBriefing } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey: apiKey });
};

// Helper to clean AI response of markdown artifacts
const cleanJsonResponse = (text: string): string => {
  return text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
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
    const data = JSON.parse(cleanJsonResponse(response.text || "{}"));
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
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Create a detailed map of daily habit activity for the AI
    const habitData = habits.length > 0 ? habits.map(h => {
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
    CURRENT_DATE_TIME: ${now.toLocaleString()}
    RANDOM_SALT: ${Math.random().toString(36).substring(7)}
    
    HABIT_CHRONOLOGY (TODAY=${todayStr}, YESTERDAY=${yesterdayStr}):
    ${habitData}
    
    REFLECTION_CHRONOLOGY (Last 7 Entries):
    ${journalData}
    
    STRATEGIC_GOALS:
    ${goals.map(g => `- ${g.title} (${g.category}, Progress: ${g.progress}%)`).join('\n')}
    `;

    const prompt = `${getLangInstr(lang)} 
    Analyze the behavioral delta specifically between YESTERDAY and TODAY.
    
    RULES:
    1. DO NOT use generic boilerplate like "Maintaining steady momentum" unless activity is literally identical.
    2. LOOK for specific correlations (e.g., "Since you missed your habit X today, your identity score in Y shifted").
    3. Archetype and mental themes MUST change if recent journal entries show new emotional keywords.
    4. Identity scores (A) should be varied and non-uniform (e.g., 42, 67, 89, not all 50).
    
    MANDATORY JSON FORMAT:
    {
      "summary": "Specific analysis of recent 24h behavior.",
      "correlation": "How rituals impacted goals today.",
      "advice": "Actionable nudge based on what was missed or achieved today.",
      "trajectory": "Dynamic outlook.",
      "archetype": "Title reflecting current state.",
      "happinessTrigger": "A win to celebrate.",
      "mentalThemes": ["3 unique keywords"],
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
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                temperature: 0.9 // Encourage variety
            }
        });
        
        const cleanedText = cleanJsonResponse(res.text || "{}");
        const parsed = JSON.parse(cleanedText);
        
        return {
            summary: parsed.summary || "Recalibrating your journey.",
            correlation: parsed.correlation || "Synthesizing your daily signals.",
            advice: parsed.advice || "Observe the small details of your rituals.",
            trajectory: parsed.trajectory || "Initial momentum.",
            archetype: parsed.archetype || "Growth Traveler",
            happinessTrigger: parsed.happinessTrigger || "Every action is a vote for your future self.",
            mentalThemes: parsed.mentalThemes || ["Growth", "Presence", "Vision"],
            identityScores: parsed.identityScores || [
              { subject: 'Health', A: 45, fullMark: 100 },
              { subject: 'Career', A: 52, fullMark: 100 },
              { subject: 'Creativity', A: 38, fullMark: 100 },
              { subject: 'Learning', A: 61, fullMark: 100 },
              { subject: 'Personal', A: 49, fullMark: 100 },
              { subject: 'Financial', A: 55, fullMark: 100 }
            ],
            isCalibrating: parsed.isCalibrating ?? isEarlyStage
        };
    } catch (e) {
        console.error("Lumina Growth Audit Parsing Error:", e);
        // Vary the fallback slightly so it's not totally frozen
        return { 
            summary: "Analyzing steady patterns in your evolution.", 
            correlation: "Maintaining baseline rituals.", 
            advice: "Try to introduce a small delta in your routine tomorrow.",
            trajectory: "Stable foundation.",
            archetype: "Pattern Observer",
            happinessTrigger: "Consistency is your greatest asset.",
            mentalThemes: ["Persistence", "Observation", "Focus"],
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
    return JSON.parse(cleanJsonResponse(res.text || "{}"));
  } catch { return { suggestion: habitTitle, reason: "Start small." }; }
};

export const generateMilestonesForGoal = async (goalTitle: string, lang: AppLanguage) => {
  const ai = getAiClient();
  const prompt = `${getLangInstr(lang)} 5 milestones for "${goalTitle}". JSON array of strings.`;
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(cleanJsonResponse(res.text || "[]"));
  } catch { return []; }
};

export const translateContent = async (title: string, content: string, lang: AppLanguage) => {
  const ai = getAiClient();
  const prompt = `Translate to ${lang}. JSON {title, content}. Title: ${title} Content: ${content}`;
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(cleanJsonResponse(res.text || "{}"));
  } catch { return { title, content }; }
};

export const generateEntryInsight = async (content: string, mood: string, goalTitle: string | null, habitTitle: string | null, imageData: string | null, lang: AppLanguage) => {
  const ai = getAiClient();
  const parts: any[] = [{ text: `${getLangInstr(lang)} Coaching insight. JSON: { insight } Content: ${content}` }];
  if (imageData) parts.push({ inlineData: { data: imageData.split(',')[1], mimeType: imageData.split(';')[0].split(':')[1] } });
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts }, config: { responseMimeType: "application/json" } });
    return JSON.parse(cleanJsonResponse(res.text || "{}")).insight || "Reflecting on your journey is the first step toward mastery.";
  } catch { return "Reflecting on your journey is the first step toward mastery."; }
};
