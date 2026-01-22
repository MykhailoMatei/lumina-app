
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
      motivation: "Growth is a quiet, steady process of becoming.",
      focus: "Gentle Persistence",
      tip: "Focus on the small win right in front of you.",
      journalPrompt: "What is one thing that felt peaceful today?",
      priorityTask: "Tend to your most important intention."
    },
    {
      motivation: "Every day is a fresh canvas for your evolution.",
      focus: "Mindful Momentum",
      tip: "Observe your energy levels without judgment.",
      journalPrompt: "What are you learning about yourself in this phase?",
      priorityTask: "Engage with your primary growth path."
    }
  ];
  return fallbacks[dayOfYear % fallbacks.length];
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
    const currentHour = now.getHours();
    const todayStr = now.toISOString().split('T')[0];
    
    // Map of phase to start hour
    const phaseStartHours = { 'Morning': 5, 'Afternoon': 12, 'Evening': 17, 'Anytime': 0 };

    const habitData = habits.length > 0 ? habits.map(h => {
        const isCompletedToday = h.completedDates.includes(todayStr);
        const scheduledHour = phaseStartHours[h.timeOfDay] || 0;
        
        let status = "";
        if (isCompletedToday) {
            status = "COMPLETED TODAY ✅";
        } else if (currentHour < scheduledHour) {
            status = `UPCOMING (Scheduled for ${h.timeOfDay}) ⏳`;
        } else if (h.timeOfDay === 'Anytime') {
            status = "PENDING (Flexible time) 🕒";
        } else {
            status = "NOT COMPLETED YET (Scheduled phase has passed) ⚠️";
        }

        return `- ${h.title} (${h.timeOfDay}): ${status}. Current Streak: ${h.streak} days.`;
    }).join('\n') : "No rituals established yet.";
    
    const context = `
    USER_TIME: ${now.toLocaleString()}
    CURRENT_PHASE: ${currentHour < 12 ? 'Morning' : currentHour < 17 ? 'Afternoon' : 'Evening'}
    
    RITUAL STATUS FOR TODAY:
    ${habitData}
    
    STRATEGIC PATHS:
    ${goals.map(g => `- ${g.title} (${g.category}, Progress: ${g.progress}%)`).join('\n')}
    
    RECENT REFLECTIONS:
    ${journal.slice(0, 3).map(j => `[Mood: ${j.mood}] ${j.content.substring(0, 100)}...`).join('\n')}
    `;

    const prompt = `${getLangInstr(lang)} 
    You are the "Lumina Growth Strategist." Your persona is: Supportive, Empathetic, Data-Driven but Gentle.
    
    TONE RULES:
    1. NEVER use rude or extreme language like "Failed", "Failing", "Paralyzed", "Critical Friction", or "Disaster".
    2. USE growth-mindset terms: "Observation", "Pivoting", "Upcoming Opportunity", "Learning Point", "Signal".
    3. IMPORTANT: If a habit is "UPCOMING", do NOT penalize the user or call it a miss. It is a future opportunity.
    4. INDEPENDENCE: Do not assume missing a Morning habit "paralyzes" a later habit unless the user explicitly linked them.
    5. Be encouraging. Focus on what is going right, and offer gentle nudges for what hasn't happened yet.

    JSON OUTPUT FORMAT:
    {
      "summary": "Empathetic overview of today's signals.",
      "correlation": "Constructive link between actions and goals.",
      "advice": "A gentle, actionable nudge for the remaining hours of the day.",
      "trajectory": "The path forward based on current momentum.",
      "archetype": "A poetic title for the user's current state.",
      "happinessTrigger": "A small win or positive perspective to hold onto.",
      "mentalThemes": ["3 unique, supportive keywords"],
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
                temperature: 0.7 
            }
        });
        
        const parsed = JSON.parse(cleanJsonResponse(res.text || "{}"));
        
        return {
            summary: parsed.summary || "Reflecting on your journey.",
            correlation: parsed.correlation || "Observing your daily patterns.",
            advice: parsed.advice || "Be kind to yourself as you move through today's intentions.",
            trajectory: parsed.trajectory || "Continuing your evolution.",
            archetype: parsed.archetype || "Growth Voyager",
            happinessTrigger: parsed.happinessTrigger || "Every small action is a beautiful vote for your future.",
            mentalThemes: parsed.mentalThemes || ["Growth", "Awareness", "Balance"],
            identityScores: parsed.identityScores || [
              { subject: 'Health', A: 50, fullMark: 100 },
              { subject: 'Career', A: 50, fullMark: 100 },
              { subject: 'Creativity', A: 50, fullMark: 100 },
              { subject: 'Learning', A: 50, fullMark: 100 },
              { subject: 'Personal', A: 50, fullMark: 100 },
              { subject: 'Financial', A: 50, fullMark: 100 }
            ],
            isCalibrating: parsed.isCalibrating ?? isEarlyStage
        };
    } catch (e) {
        console.error("Lumina Growth Audit Error:", e);
        return { 
            summary: "Analyzing the steady patterns of your day.", 
            correlation: "Maintaining focus on your core path.", 
            advice: "Remember that consistency is built through patience.",
            trajectory: "Sustainable momentum.",
            archetype: "Pattern Observer",
            happinessTrigger: "Your awareness is the first step of growth.",
            mentalThemes: ["Persistence", "Observation", "Patience"],
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
