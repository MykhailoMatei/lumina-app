
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Goal, AppLanguage, Habit, JournalEntry, DailyBriefing } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey: apiKey });
};

const cleanJsonResponse = (text: string): string => {
  return text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
};

const getLangInstr = (lang: AppLanguage) => 
  `CRITICAL: Response MUST be strictly in ${lang}. Output ONLY valid JSON.`;

const GET_DAILY_FALLBACK = (lang: AppLanguage): DailyBriefing => {
  const fallbacks: DailyBriefing[] = [
    {
      motivation: "Consistency is the only variable within your direct control. Focus on the execution, not the outcome.",
      focus: "Operational Efficiency",
      tip: "Reduce friction in your environment to make your desired habits the default choice.",
      journalPrompt: "What was the most effective choice you made today?",
      priorityTask: "Audit your current workload and identify one high-leverage task to focus on."
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
    
    const prompt = `${getLangInstr(lang)} 
    You are the "Lumina Growth Architect." You are a practical, high-performance coach.
    
    COACHING PHILOSOPHY:
    1. AVOID: Ancient metaphors (mountains, rivers, monks, roots). 
    2. VOICE: Intelligent, grounded in behavioral psychology, and actionable.
    3. FOCUS: Systems over willpower. Environment over motivation.
    4. STYLE: Minimalist, kind, but focused on data and trends.

    JSON OUTPUT:
    {
      "summary": "Observation of current momentum and cognitive load.",
      "correlation": "A link between daily systems and long-term targets.",
      "advice": "Actionable adjustment based on behavioral science.",
      "trajectory": "The logical next step in the user's evolution.",
      "archetype": "Strategic Planner",
      "happinessTrigger": "One specific win the user should leverage.",
      "mentalThemes": ["Momentum", "Cognitive Load", "Systems"],
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
        return { summary: "Data patterns are stabilizing.", correlation: "Identifying leverage points.", advice: "Stick to the schedule.", trajectory: "Incremental progress.", happinessTrigger: "Your routine is your foundation.", mentalThemes: ["Consistency"], identityScores: [], archetype: "Systems Builder", isCalibrating: true };
    }
};

export const generateDailyBriefing = async (name: string, goals: Goal[], habits: Habit[], recentJournal: JournalEntry[], lang: AppLanguage): Promise<DailyBriefing> => {
  const ai = getAiClient();
  
  const prompt = `${getLangInstr(lang)} 
    You are a Modern Growth Mentor. Your voice is grounded, practical, and focuses on behavioral science.
    
    STRICT RULES:
    1. NO ARCHAIC METAPHORS: Never use mountains, rivers, flowers, or ancient wisdom.
    2. MODERN TONE: Use terms like 'friction', 'cognitive load', 'systems', 'leverage', and 'momentum'.
    3. NO INFORMAL GREETINGS: Do not use "Hey," "Hi," or "I was thinking." Start with the insight.
    4. ACTION-ORIENTED: The 'motivation' should be a practical truth about personal growth or psychology.
    5. KEYSTONE TASK ('priorityTask'): Frame it as a 'High-Leverage Invitation'.

    JSON: { motivation, focus, tip, journal_prompt, priorityTask }.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.7 }
    });
    const data = JSON.parse(cleanJsonResponse(response.text || "{}"));
    return {
      motivation: data.motivation || "Success is the product of daily systems, not once-in-a-lifetime transformations.",
      focus: data.focus || "System Integrity",
      tip: data.tip || "Identify the point of greatest friction in your routine and resolve it.",
      journalPrompt: data.journal_prompt || "What choice today saved you time or energy?",
      priorityTask: data.priorityTask || "Audit your current queue and eliminate one non-essential task."
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
  const prompt = `${getLangInstr(lang)} Suggest a high-leverage version of: "${habitTitle}". JSON: { suggestion, reason }.`;
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(cleanJsonResponse(res.text || "{}"));
  } catch { return { suggestion: habitTitle, reason: "Consistency over intensity." }; }
};

export const generateMilestonesForGoal = async (goalTitle: string, lang: AppLanguage) => {
  const ai = getAiClient();
  const prompt = `${getLangInstr(lang)} 5 strategic milestones for "${goalTitle}". JSON array of strings.`;
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
  const parts: any[] = [{ text: `${getLangInstr(lang)} Strategic growth insight based on this reflection. Avoid archaic wisdom. Focus on psychology. JSON: { insight } Content: ${content}` }];
  if (imageData) parts.push({ inlineData: { data: imageData.split(',')[1], mimeType: imageData.split(';')[0].split(':')[1] } });
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts }, config: { responseMimeType: "application/json" } });
    return JSON.parse(cleanJsonResponse(res.text || "{}")).insight || "Your patterns reflect your priorities. Alignment is an ongoing practice.";
  } catch { return "Execution is the best form of reflection."; }
};
