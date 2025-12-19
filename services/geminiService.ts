
import { GoogleGenAI, Type } from "@google/genai";
import { Goal, AppLanguage, Habit, JournalEntry, DailyBriefing } from "../types";

// Explicitly declare process to prevent ReferenceErrors in environments where it's not shimmed
declare const process: any;

const TEXT_MODEL_COMPLEX = 'gemini-3-pro-preview';
const TEXT_MODEL_FAST = 'gemini-3-flash-preview';

/**
 * Safely retrieves the API Key from the environment.
 */
const getApiKey = (): string => {
  try {
    // Check various common locations for the key
    const key = (typeof process !== 'undefined' && process.env?.API_KEY) || 
                (window as any).API_KEY || 
                "";
    return key.trim();
  } catch (e) {
    return "";
  }
};

/**
 * Helper to get a fresh AI instance.
 */
const getAiClient = () => {
  const key = getApiKey();
  if (!key) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Enhanced localization instruction.
 */
const getLangInstr = (lang: AppLanguage) => 
  `CRITICAL LANGUAGE REQUIREMENT: You are a professional, native-level writer in ${lang}. 
   EVERY SINGLE WORD of your response, including all values in the JSON object, MUST be strictly in ${lang}. 
   DO NOT use English terms. Translate all concepts, labels, and wisdom into ${lang}. 
   ABSOLUTELY NO ENGLISH: If you use a famous quote, you MUST translate it into ${lang}. 
   Even if the input context (goals/habits) is in English, your output MUST be 100% in ${lang}. 
   Forbidden: Motivation, Focus, Tip, and Journal Prompt fields must never contain English text.`;

export const testApiConnection = async (): Promise<{success: boolean, message: string}> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_FAST,
      contents: "Reply with 'OK'.",
    });
    return { success: !!response.text, message: "AI Connection verified! Everything is working." };
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") {
      return { 
        success: false, 
        message: "API Key is missing. Please add your Gemini API Key to your environment variables or .env file and restart the server." 
      };
    }
    return { success: false, message: `Connection Error: ${error.message}` };
  }
};

export const translateContent = async (title: string, content: string, targetLang: AppLanguage): Promise<{title: string, content: string}> => {
  const prompt = `${getLangInstr(targetLang)} 
  Translate and localize this social media post.
  Original Title: "${title}"
  Original Content: "${content}"
  Return JSON with translated "title" and "content".`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ["title", "content"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Translation failed", error);
    return { title, content };
  }
};

export const generateDailyPrompt = async (goals: Goal[], lang: AppLanguage): Promise<string> => {
  const goalSummary = goals.map(g => g.title).join(", ");
  const prompt = `${getLangInstr(lang)} Write ONE deeply personal journaling prompt (a single question) for a user working on: ${goalSummary}. Return JSON with key "prompt". Output strictly in ${lang}.`;
  
  const fallbacks: Record<AppLanguage, string> = {
    English: "How does today reflect your deeper purpose?",
    French: "Comment cette journée reflète-t-elle votre but profond ?",
    German: "Wie spiegelt der heutige Tag Ihren tieferen Sinn wider?",
    Ukrainian: "Як сьогоднішній день відображає вашу глибинну мету?",
    Spanish: "¿Cómo refleja el día de hoy tu propósito más profundo?"
  };

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({ 
      model: TEXT_MODEL_FAST, 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING }
          },
          required: ["prompt"]
        }
      }
    });
    const result = JSON.parse(response.text || "{}");
    return result.prompt || fallbacks[lang] || fallbacks.English;
  } catch { return fallbacks[lang] || fallbacks.English; }
};

export const generateEntryInsight = async (entry: string, lang: AppLanguage): Promise<string> => {
  const prompt = `${getLangInstr(lang)} 
  The user wrote: "${entry}"
  Provide one short sentence of psychological wisdom or growth-oriented insight in ${lang}. Return JSON with key "insight".`;
  
  const fallbacks: Record<AppLanguage, string> = {
    English: "Keep growing.",
    French: "Continuez à grandir.",
    German: "Wachse weiter.",
    Ukrainian: "Продовжуй розвиватися.",
    Spanish: "Sigue creciendo."
  };

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({ 
      model: TEXT_MODEL_FAST, 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING }
          },
          required: ["insight"]
        }
      }
    });
    const result = JSON.parse(response.text || "{}");
    return result.insight || fallbacks[lang] || fallbacks.English;
  } catch { return fallbacks[lang] || fallbacks.English; }
};

export const generateDailyBriefing = async (
  name: string, 
  goals: Goal[], 
  habits: Habit[], 
  recentJournal: JournalEntry[], 
  lang: AppLanguage
): Promise<DailyBriefing> => {
    const ctxTexts: Record<AppLanguage, { pg: string, nh: string, nr: string }> = {
      English: { pg: "personal growth", nh: "no active habits", nr: "no recent reflections" },
      Spanish: { pg: "crecimiento personal", nh: "sin hábitos activos", nr: "sin reflexiones recientes" },
      French: { pg: "croissance personnelle", nh: "pas d'habitudes actives", nr: "pas de réflexions récentes" },
      German: { pg: "persönliches Wachstum", nh: "keine aktiven Gewohnheiten", nr: "keine aktuellen Reflexionen" },
      Ukrainian: { pg: "особистий розвиток", nh: "немає активних звичок", nr: "немає недавніх роздумів" }
    };

    const activeCtx = ctxTexts[lang] || ctxTexts.English;
    const goalText = goals.length > 0 ? goals.map(g => g.title).join(', ') : activeCtx.pg;
    const habitText = habits.length > 0 ? habits.map(h => `${h.title} (streak: ${h.streak})`).join(', ') : activeCtx.nh;
    const recentReflections = recentJournal.slice(0, 3).map(j => j.aiInsight || j.content.substring(0, 50)).join('; ') || activeCtx.nr;
    
    const prompt = `${getLangInstr(lang)} 
    Create a personalized, deeply insightful daily briefing for the user named ${name}.
    
    User Context for Personalization:
    - Current Life Goals: ${goalText}. 
    - Active Habits: ${habitText}.
    - Recent Thoughts: ${recentReflections}.
    
    TASKS:
    1. Motivation: Create a powerful philosophical mantra in ${lang}. 
    2. Focus: Identify one central theme for today in ${lang}.
    3. Micro Tip: Suggest one actionable small step in ${lang}.
    4. Journal Prompt: Create ONE specific, open-ended question for their journal in ${lang}.
    
    CRITICAL: YOU MUST NOT LEAVE ANY TEXT IN ENGLISH. EVERYTHING IN THE OUTPUT JSON MUST BE WRITTEN IN ${lang}.`;

    const fallbacks: Record<AppLanguage, DailyBriefing> = {
      English: { motivation: "Your potential is infinite, nurtured by the small steps you take today.", focus: "Consistency", tip: "Take one small step towards your most daunting goal.", journalPrompt: "How does today reflect your deeper purpose?" },
      French: { motivation: "Votre potentiel est infini, nourri par les petits pas que vous faites aujourd'hui.", focus: "Cohérence", tip: "Faites un petit pas vers votre objectif le plus intimidant.", journalPrompt: "Comment cette journée reflète-t-elle votre but profond ?" },
      German: { motivation: "Dein Potenzial ist unendlich, genährt durch die kleinen Schritte, die du heute unternimmst.", focus: "Beständigkeit", tip: "Mache einen kleinen Schritt in Richtung deines entmutigendsten Ziels.", journalPrompt: "Wie spiegelt der heutige Tag Ihren tieferen Sinn wider?" },
      Ukrainian: { motivation: "Твій потенціал безмежний, він живиться маленькими кроками, які ти робиш сьогодні.", focus: "Стабільність", tip: "Зроби один маленький крок до своєї найскладнішої цілі.", journalPrompt: "Як сьогоднішній день відображає вашу глибинну мету?" },
      Spanish: { motivation: "Tu potencial es infinito, alimentado por los pequeños pasos que das hoy.", focus: "Consistencia", tip: "Da un pequeño paso hacia tu meta más intimidante.", journalPrompt: "¿Cómo refleja el día de hoy tu propósito más profundo?" }
    };

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: TEXT_MODEL_COMPLEX,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        motivation: { 
                          type: Type.STRING, 
                          description: `A powerful mantra written strictly in ${lang}` 
                        },
                        focus: { 
                          type: Type.STRING,
                          description: `A specific growth theme written strictly in ${lang}` 
                        },
                        tip: { 
                          type: Type.STRING,
                          description: `A localized micro-action in ${lang}`
                        },
                        journal_prompt: {
                          type: Type.STRING,
                          description: `A deeply personal journaling question in ${lang}`
                        }
                    },
                    required: ["motivation", "focus", "tip", "journal_prompt"]
                }
            }
        });
        const result = JSON.parse(response.text || "{}");
        if (!result.motivation) return fallbacks[lang] || fallbacks.English;
        return {
          motivation: result.motivation,
          focus: result.focus,
          tip: result.tip,
          journalPrompt: result.journal_prompt
        };
    } catch { 
      return fallbacks[lang] || fallbacks.English;
    }
};

export const generateMilestonesForGoal = async (goalTitle: string, lang: AppLanguage): Promise<string[]> => {
  const prompt = `${getLangInstr(lang)} Break the goal "${goalTitle}" into 5 milestones. Return a JSON array of strings in ${lang}.`;
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { 
            type: Type.STRING,
            description: `A localized milestone title in ${lang}`
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch { return []; }
};

export const suggestHabitsFromGoals = async (goalTitle: string, lang: AppLanguage): Promise<{title: string, description: string, timeOfDay: string}[]> => {
    const prompt = `${getLangInstr(lang)} Suggest 3 daily habits to achieve: "${goalTitle}". Output JSON array of objects with title, description, timeOfDay in ${lang}.`;
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: TEXT_MODEL_COMPLEX,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { 
               type: Type.OBJECT,
               properties: {
                   title: { 
                     type: Type.STRING,
                     description: `Localized habit title in ${lang}`
                   },
                   description: { 
                     type: Type.STRING,
                     description: `Localized habit description in ${lang}`
                   },
                   timeOfDay: { 
                     type: Type.STRING,
                     description: `Localized time of day in ${lang}`
                   }
               },
               required: ["title", "description", "timeOfDay"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch { return []; }
};
