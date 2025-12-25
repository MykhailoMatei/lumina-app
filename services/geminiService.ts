
import { GoogleGenAI, Type } from "@google/genai";
import { Goal, AppLanguage, Habit, JournalEntry, DailyBriefing } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey: apiKey });
};

const getLangInstr = (lang: AppLanguage) => 
  `CRITICAL: Response MUST be strictly in ${lang}. Output ONLY valid JSON.`;

export const testApiConnection = async () => {
  try {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: "Reply 'OK'." });
    return { success: !!res.text, message: "AI Connection verified!" };
  } catch (e: any) { return { success: false, message: e.message }; }
};

export const suggestAtomicHabit = async (habitTitle: string, lang: AppLanguage): Promise<{ suggestion: string, reason: string }> => {
  const ai = getAiClient();
  const prompt = `${getLangInstr(lang)} The user wants to start this habit: "${habitTitle}". 
  Based on Atomic Habits science, suggest a "tiny" version (less than 2 mins) that is impossible to fail.
  JSON structure:
  - suggestion: The tiny habit version.
  - reason: Why this works (1 short sentence).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestion: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["suggestion", "reason"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch {
    return { suggestion: habitTitle, reason: "Start where you are." };
  }
};

export const generateDailyBriefing = async (name: string, goals: Goal[], habits: Habit[], recentJournal: JournalEntry[], lang: AppLanguage): Promise<DailyBriefing> => {
  const ai = getAiClient();
  const context = `User: ${name}. Goals: ${goals.map(g => g.title).join(', ')}. Habits: ${habits.map(h => h.title).join(', ')}. Recent mood: ${recentJournal[0]?.mood || 'N/A'}`;
  const prompt = `${getLangInstr(lang)} Generate a high-performance daily briefing.
  JSON structure:
  - motivation: One powerful mantra for growth.
  - focus: One specific theme for the day.
  - tip: One micro-action the user can do in 2 minutes.
  - journal_prompt: A deep, Socratic question that bridges their goals and their emotional state.
  - priorityTask: Identify the SINGLE most critical milestone or habit the user should execute today to maintain momentum.
  Context: ${context}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivation: { type: Type.STRING },
            focus: { type: Type.STRING },
            tip: { type: Type.STRING },
            journal_prompt: { type: Type.STRING },
            priorityTask: { type: Type.STRING }
          },
          required: ["motivation", "focus", "tip", "journal_prompt", "priorityTask"]
        }
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    return {
      motivation: data.motivation || "Consistency is your superpower.",
      focus: data.focus || "Growth",
      tip: data.tip || "Start small.",
      journalPrompt: data.journal_prompt || "What are you grateful for today?",
      priorityTask: data.priorityTask || "Review your goals."
    };
  } catch {
    return { motivation: "Consistency is your superpower.", focus: "Momentum", tip: "Start small.", journalPrompt: "What is the smallest step you can take today toward your biggest goal?", priorityTask: "Complete your main ritual." };
  }
};

export const generateMilestonesForGoal = async (goalTitle: string, lang: AppLanguage): Promise<string[]> => {
  const ai = getAiClient();
  const prompt = `${getLangInstr(lang)} Break the goal "${goalTitle}" into 5 highly actionable, sequential milestones. Return a JSON array of strings.`;
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(res.text || "[]");
  } catch { return []; }
};

export const translateContent = async (title: string, content: string, lang: AppLanguage): Promise<{ title: string, content: string }> => {
  const ai = getAiClient();
  const prompt = `Translate the following community post to ${lang}. 
  Return a JSON object with "title" and "content" fields.
  Title: ${title}
  Content: ${content}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
  } catch (err) {
    console.error(err);
    return { title, content };
  }
};

export const generateEntryInsight = async (
  content: string, 
  mood: string, 
  goalTitle: string | null, 
  habitTitle: string | null,
  imageData: string | null, 
  lang: AppLanguage
): Promise<string> => {
  const ai = getAiClient();
  
  const textPart = {
    text: `${getLangInstr(lang)} Provide a deep, coaching-style insight (1-2 sentences) for this journal entry.
    Context:
    - User content: "${content}"
    - Mood: ${mood}
    ${goalTitle ? `- Linked Goal: "${goalTitle}"` : ""}
    ${habitTitle ? `- Linked Habit: "${habitTitle}"` : ""}
    ${imageData ? "- An image was attached. Analyze the text and image context together." : ""}
    JSON: { "insight": "..." }`
  };

  const parts: any[] = [textPart];
  
  if (imageData) {
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.split(';')[0].split(':')[1];
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    });
  }

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
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
    const parsed = JSON.parse(res.text || "{}");
    return parsed.insight || "";
  } catch (err) { 
    console.error(err);
    return "Reflecting on your journey is the first step toward mastery."; 
  }
};
