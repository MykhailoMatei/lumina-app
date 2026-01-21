
import { UserState, Goal, Habit, JournalEntry } from "../types";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * Lumina Sync Service - Schema Alignment
 * Maps camelCase frontend types to the snake_case Supabase columns.
 */

const mapHabitToDb = (h: Habit) => ({
    id: h.id,
    title: h.title,
    trigger: h.trigger,
    description: h.description,
    duration: h.duration,
    time_of_day: h.timeOfDay,
    days_of_week: h.daysOfWeek || [],
    reminder_time: h.reminderTime,
    linked_goal_id: h.linkedGoalId,
    streak: h.streak || 0,
    completed_dates: h.completedDates || [],
    created_at: h.createdAt,
    last_updated: h.lastUpdated || Date.now()
});

const mapGoalToDb = (g: Goal) => ({
    id: g.id,
    title: g.title,
    why_statement: g.whyStatement,
    category: g.category,
    progress: g.progress || 0,
    deadline: g.deadline,
    completed: g.completed || false,
    milestones: g.milestones || [],
    is_paused: g.isPaused || false,
    outcome_label: g.outcomeLabel,
    identity_impact: g.identityImpact,
    what_stayed: g.whatStayed,
    what_shifted: g.whatShifted,
    archived_at: g.archivedAt,
    start_date: g.startDate,
    last_updated: g.lastUpdated || Date.now()
});

const mapEntryToDb = (e: JournalEntry) => ({
    id: e.id,
    date: e.date,
    content: e.content,
    prompt: e.prompt,
    mood: e.mood,
    activities: e.activities || [],
    ai_insight: e.aiInsight,
    linked_goal_id: e.linkedGoalId,
    linked_habit_id: e.linkedHabitId,
    image_data: e.imageData,
    last_updated: e.lastUpdated || Date.now()
});

const mapFromDb = (item: any) => {
    const mapped: any = {};
    for (const key in item) {
        const camelKey = key.replace(/([-_][a-z])/g, group =>
            group.toUpperCase().replace('-', '').replace('_', '')
        );
        mapped[camelKey] = item[key];
    }
    return mapped;
};

export const performCloudSync = async (localData: UserState): Promise<{ success: boolean; data?: Partial<UserState>; message: string }> => {
    if (!isSupabaseConfigured) {
        return { success: false, message: "Supabase not configured." };
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
        return { success: false, message: "Not logged in." };
    }

    const userId = session.user.id;

    try {
        // 1. Hard Deletions
        const deletePromises: any[] = [];
        if (localData.deletedIds?.goals?.length > 0) {
            deletePromises.push(supabase.from('goals').delete().in('id', localData.deletedIds.goals).eq('user_id', userId));
        }
        if (localData.deletedIds?.habits?.length > 0) {
            deletePromises.push(supabase.from('habits').delete().in('id', localData.deletedIds.habits).eq('user_id', userId));
        }
        if (localData.deletedIds?.journalEntries?.length > 0) {
            deletePromises.push(supabase.from('journal_entries').delete().in('id', localData.deletedIds.journalEntries).eq('user_id', userId));
        }
        if (deletePromises.length > 0) await Promise.all(deletePromises);

        // 2. Fetch Latest State
        const [
            { data: remoteGoals, error: gErr },
            { data: remoteHabits, error: hErr },
            { data: remoteEntries, error: jErr }
        ] = await Promise.all([
            supabase.from('goals').select('*').eq('user_id', userId),
            supabase.from('habits').select('*').eq('user_id', userId),
            supabase.from('journal_entries').select('*').eq('user_id', userId)
        ]);

        if (gErr || hErr || jErr) {
            const err = gErr || hErr || jErr;
            if (err?.message.includes("column") || err?.message.includes("cache")) {
                throw new Error("Schema Mismatch: Your database is missing columns. Run the ALTER TABLE script in Supabase.");
            }
            throw new Error(`Cloud Read Failed: ${err?.message}`);
        }

        const sanitizeAndMap = <T extends object>(list: any[] | null): T[] => {
            return (list || []).map(item => {
                const mapped = mapFromDb(item);
                const arrayFields = ['milestones', 'completedDates', 'daysOfWeek', 'activities'];
                arrayFields.forEach(field => {
                    if (mapped[field]) {
                        if (typeof mapped[field] === 'string') {
                            try { mapped[field] = JSON.parse(mapped[field]); } catch (e) { mapped[field] = []; }
                        }
                    } else {
                        mapped[field] = [];
                    }
                });
                return mapped as T;
            });
        };

        const rGoals = sanitizeAndMap<Goal>(remoteGoals);
        const rHabits = sanitizeAndMap<Habit>(remoteHabits);
        const rEntries = sanitizeAndMap<JournalEntry>(remoteEntries);

        // 3. Determine Push Candidates
        const findNewer = <T extends { id: string; lastUpdated?: number }>(localList: T[], remoteList: T[]) => {
            return localList.filter(local => {
                const remote = remoteList.find(r => r.id === local.id);
                // If remote doesn't exist, it's new. If local timestamp is higher, it's an update.
                const localTS = Number(local.lastUpdated) || 0;
                const remoteTS = remote ? (Number(remote.lastUpdated) || 0) : -1;
                return localTS > remoteTS;
            });
        };

        const pushPromises: any[] = [];
        const goalsPush = findNewer(localData.goals, rGoals);
        const habitsPush = findNewer(localData.habits, rHabits);
        const entriesPush = findNewer(localData.journalEntries, rEntries);

        if (goalsPush.length > 0) {
            pushPromises.push(supabase.from('goals').upsert(
                goalsPush.map(g => ({ ...mapGoalToDb(g), user_id: userId }))
            ));
        }
        if (habitsPush.length > 0) {
            pushPromises.push(supabase.from('habits').upsert(
                habitsPush.map(h => ({ ...mapHabitToDb(h), user_id: userId }))
            ));
        }
        if (entriesPush.length > 0) {
            pushPromises.push(supabase.from('journal_entries').upsert(
                entriesPush.map(e => ({ ...mapEntryToDb(e), user_id: userId }))
            ));
        }

        if (pushPromises.length > 0) {
            const pushResults = await Promise.all(pushPromises);
            const pushError = pushResults.find(r => r.error);
            if (pushError) {
                if (pushError.error.message.includes("column")) {
                    throw new Error("Cloud Write Failed: Missing 'completed_dates' column. Please run the SQL Patch in Supabase.");
                }
                throw pushError.error;
            }
        }

        // 4. Final Merge Logic
        const merge = <T extends { id: string; lastUpdated?: number }>(localList: T[], remoteList: T[]): T[] => {
            const map = new Map<string, T>();
            [...remoteList, ...localList].forEach(item => {
                const existing = map.get(item.id);
                const itemTS = Number(item.lastUpdated) || 0;
                const existingTS = existing ? (Number(existing.lastUpdated) || 0) : -1;
                if (!existing || itemTS >= existingTS) {
                    map.set(item.id, item);
                }
            });
            return Array.from(map.values());
        };

        return {
            success: true,
            message: "Cloud Synchronized.",
            data: {
                goals: merge(localData.goals, rGoals),
                habits: merge(localData.habits, rHabits),
                journalEntries: merge(localData.journalEntries, rEntries),
                syncStatus: { lastSync: Date.now(), status: 'synced' }
            }
        };
    } catch (e: any) {
        console.error("Lumina Sync Detail:", e);
        return { success: false, message: e.message || "Sync Error" };
    }
};
