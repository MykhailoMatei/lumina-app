
import { UserState, Goal, Habit, JournalEntry } from "../types";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * Lumina Sync Service - Reconciliation & Mapping Edition
 * Resolves naming mismatches between camelCase (TS) and snake_case (Postgres).
 */

// Mapping helper to convert camelCase keys to snake_case for DB
const mapToDb = (item: any) => {
    const mapped: any = {};
    for (const key in item) {
        // Simple camelCase to snake_case conversion
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        mapped[snakeKey] = item[key];
    }
    return mapped;
};

// Mapping helper to convert snake_case keys to camelCase for Frontend
const mapFromDb = (item: any) => {
    const mapped: any = {};
    for (const key in item) {
        // Simple snake_case to camelCase conversion
        const camelKey = key.replace(/([-_][a-z])/g, group =>
            group.toUpperCase().replace('-', '').replace('_', '')
        );
        mapped[camelKey] = item[key];
    }
    return mapped;
};

export const performCloudSync = async (localData: UserState): Promise<{ success: boolean; data?: Partial<UserState>; message: string }> => {
    if (!isSupabaseConfigured) {
        return { success: false, message: "Supabase is not configured." };
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
        return { success: false, message: "Not authenticated." };
    }

    const userId = session.user.id;

    try {
        console.log("Starting Lumina Cloud Sync with Schema Mapping...");

        // 1. Process Hard Deletions First
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
        
        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
        }

        // 2. Fetch Latest Remote State
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
            throw new Error(`Fetch failed: ${gErr?.message || hErr?.message || jErr?.message}`);
        }

        // Map remote data back to frontend camelCase and sanitize JSONB
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

        // 3. Determine what needs to be pushed (Local newer than Remote)
        const findNewer = <T extends { id: string; lastUpdated?: number }>(localList: T[], remoteList: T[]) => {
            return localList.filter(local => {
                const remote = remoteList.find(r => r.id === local.id);
                return !remote || (Number(local.lastUpdated) || 0) > (Number(remote.lastUpdated) || 0);
            });
        };

        const goalsToPush = findNewer(localData.goals, rGoals);
        const habitsToPush = findNewer(localData.habits, rHabits);
        const entriesToPush = findNewer(localData.journalEntries, rEntries);

        const pushPromises: any[] = [];
        
        // Push with mapped keys
        if (goalsToPush.length > 0) {
            pushPromises.push(supabase.from('goals').upsert(
                goalsToPush.map(g => ({ ...mapToDb(g), user_id: userId }))
            ));
        }
        if (habitsToPush.length > 0) {
            pushPromises.push(supabase.from('habits').upsert(
                habitsToPush.map(h => ({ ...mapToDb(h), user_id: userId }))
            ));
        }
        if (entriesToPush.length > 0) {
            pushPromises.push(supabase.from('journal_entries').upsert(
                entriesToPush.map(e => ({ ...mapToDb(e), user_id: userId }))
            ));
        }

        if (pushPromises.length > 0) {
            const results = await Promise.all(pushPromises);
            const errors = results.filter(r => r.error);
            if (errors.length > 0) throw errors[0].error;
        }

        // 4. Merge Logic (Reconciliation)
        const merge = <T extends { id: string; lastUpdated?: number }>(localList: T[], remoteList: T[]): T[] => {
            const map = new Map<string, T>();
            [...remoteList, ...localList].forEach(item => {
                const existing = map.get(item.id);
                const itemTime = Number(item.lastUpdated) || 0;
                const existingTime = existing ? (Number(existing.lastUpdated) || 0) : -1;
                if (!existing || itemTime >= existingTime) map.set(item.id, item);
            });
            return Array.from(map.values());
        };

        return {
            success: true,
            message: "Sync complete.",
            data: {
                goals: merge(localData.goals, rGoals),
                habits: merge(localData.habits, rHabits),
                journalEntries: merge(localData.journalEntries, rEntries),
                syncStatus: {
                    lastSync: Date.now(),
                    status: 'synced'
                }
            }
        };
    } catch (e: any) {
        console.error("Lumina Cloud Sync Error:", e);
        return { success: false, message: e.message || "Sync failed." };
    }
};
