
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
  const fallbacks: DailyBriefing[] = [
    {
      motivation: "Transformation is not a storm, but the steady falling of rain upon dry earth.",
      focus: "Quiet Observation",
      tip: "Move with intention, not with haste.",
      journalPrompt: "Where did you find stillness today?",
      priorityTask: "Perhaps invite a moment of quiet reflection into your current work."
    }
  ];
  return fallbacks[0];
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
    
    const habitData = habits.length > 0 ? habits.map(h => {
        const isCompletedToday = h.completedDates.includes(todayStr);
        return `- ${h.title}: ${isCompletedToday ? "Recorded" : "Awaiting"}.`;
    }).join('\n') : "The path is currently clear.";

    const prompt = `${getLangInstr(lang)} 
    You are the "Lumina Sage." Your persona is: Wise, Patient, Minimalist, and Profound.
    
    COACHING PHILOSOPHY:
    1. AVOID: Casual greetings, exclamation marks, or "Hey/Hi."
    2. INDEPENDENCE: Rituals are individual stars. Missing one does not dim the others.
    3. LANGUAGE: Use grounded metaphors (roots, seasons, rivers).
    4. FOCUS: Highlight the quiet strength in what the user *did* do.

    JSON OUTPUT:
    {
      "summary": "A calm observation of the day's movement.",
      "correlation": "A subtle link between actions, framed as a pattern rather than a dependency.",
      "advice": "A gentle invitation to find balance.",
      "trajectory": "A vision of the path ahead.",
      "archetype": "Quiet Architect",
      "happinessTrigger": "One specific moment of alignment the user should acknowledge.",
      "mentalThemes": ["Patience", "Clarity", "Presence"],
      "identityScores": [
          {"subject": "Health", "A": 50, "fullMark": 100},
          {"subject": "Career", "A": 50, "fullMark": 100},
          {"subject": "Creativity", "A": 50, "fullMark": 100},
          {"subject": "Learning", "A": 50, "fullMark": 100},
          {"subject": "Personal", "A": 50, "fullMark": 100},
          {"subject": "Financial", "A": 50, "fullMark": 100}
      ],
      "isCalibrating": false
    }`;

    try {
        const res: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.4 }
        });
        const parsed = JSON.parse(cleanJsonResponse(res.text || "{}"));
        return { ...parsed, isCalibrating: parsed.isCalibrating ?? isEarlyStage };
    } catch (e) {
        return { summary: "The rhythm of growth is steady.", correlation: "Patterns are emerging.", advice: "Trust your pace.", trajectory: "Forward, always.", happinessTrigger: "Your awareness is your compass.", mentalThemes: ["Presence"], identityScores: [], archetype: "Pathfinder", isCalibrating: true };
    }
};

export const generateDailyBriefing = async (name: string, goals: Goal[], habits: Habit[], recentJournal: JournalEntry[], lang: AppLanguage): Promise<DailyBriefing> => {
  const ai = getAiClient();
  const now = new Date();
  
  const prompt = `${getLangInstr(lang)} 
    You are a Wise Mentor. Your voice is calm, thoughtful, and minimalist.
    
    STRICT RULES:
    1. NO INFORMAL GREETINGS: Do not use "Hey," "Hi," "I was thinking about you," or "Wanted to say."
    2. START DIRECTLY: Begin the 'motivation' with an observation or a timeless truth.
    3. NO EXCLAMATION MARKS: Keep the energy low, steady, and profound.
    4. KEYSTONE TASK ('priorityTask'): Frame it as a "Gentle Invitation." Use phrases like "Perhaps find space for...", "There is an opportunity to...", "You might enjoy tending to...".
    5. FOCUS: The 'motivation' should feel like a line from a meditation, not a chat message.

    JSON: { motivation, focus, tip, journal_prompt, priorityTask }.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.7 }
    });
    const data = JSON.parse(cleanJsonResponse(response.text || "{}"));
    return {
      motivation: data.motivation || "The ocean does not hurry, yet all things are accomplished.",
      focus: data.focus || "Internal Alignment",
      tip: data.tip || "Allow your breath to find its natural depth.",
      journalPrompt: data.journal_prompt || "Where did you find clarity today?",
      priorityTask: data.priorityTask || "Perhaps find a few moments to sit with your current intentions."
    };
  } catch (err) {
    return GET_DAILY_FALLBACK(lang);
  }
};

export const testApiConnection = async () => {
  try {
    const ai = getAiClient();
    const response: GenerateContentResponse = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: "Reply 'OK'." });
    return { success: !!response.text, message: "AI Connection verified!" };
  } catch (e: any) { return { success: false, message: e.message }; }
};

export const suggestAtomicHabit = async (habitTitle: string, lang: AppLanguage) => {
  const ai = getAiClient();
  const prompt = `${getLangInstr(lang)} Tiny habit for: "${habitTitle}". JSON: { suggestion, reason }.`;
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(cleanJsonResponse(res.text || "{}"));
  } catch { return { suggestion: habitTitle, reason: "Small steps." }; }
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
  const parts: any[] = [{ text: `${getLangInstr(lang)} Sage insight. PERSONA: Observant and deep. JSON: { insight } Content: ${content}` }];
  if (imageData) parts.push({ inlineData: { data: imageData.split(',')[1], mimeType: imageData.split(';')[0].split(':')[1] } });
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts }, config: { responseMimeType: "application/json" } });
    return JSON.parse(cleanJsonResponse(res.text || "{}")).insight || "The narrative of your life is written in your reflections.";
  } catch { return "Reflection is the mirror of the soul."; }
};
