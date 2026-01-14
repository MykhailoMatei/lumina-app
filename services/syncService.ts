
import { UserState, Goal, Habit, JournalEntry } from "../types";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * Lumina Sync Service - Scalable Edition
 * Uses granular timestamp comparison to ensure data integrity across multiple devices.
 */

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
        const [
            { data: remoteGoals },
            { data: remoteHabits },
            { data: remoteEntries }
        ] = await Promise.all([
            supabase.from('goals').select('*').eq('user_id', userId),
            supabase.from('habits').select('*').eq('user_id', userId),
            supabase.from('journal_entries').select('*').eq('user_id', userId)
        ]);

        const rGoals = (remoteGoals || []) as Goal[];
        const rHabits = (remoteHabits || []) as Habit[];
        const rEntries = (remoteEntries || []) as JournalEntry[];

        const goalsToPush = localData.goals.filter(local => {
            const remote = rGoals.find(r => r.id === local.id);
            return !remote || (local.lastUpdated || 0) > (remote.lastUpdated || 0);
        });

        const habitsToPush = localData.habits.filter(local => {
            const remote = rHabits.find(r => r.id === local.id);
            return !remote || (local.lastUpdated || 0) > (remote.lastUpdated || 0);
        });

        const entriesToPush = localData.journalEntries.filter(local => {
            const remote = rEntries.find(r => r.id === local.id);
            return !remote || (local.lastUpdated || 0) > (remote.lastUpdated || 0);
        });

        // Fix: Use any[] because Supabase builders are PromiseLike but not strict Promise instances (missing Symbol.toStringTag etc.)
        const pushPromises: any[] = [];
        
        if (goalsToPush.length > 0) {
            pushPromises.push(supabase.from('goals').upsert(
                goalsToPush.map(g => ({ ...g, user_id: userId }))
            ));
        }
        if (habitsToPush.length > 0) {
            pushPromises.push(supabase.from('habits').upsert(
                habitsToPush.map(h => ({ ...h, user_id: userId }))
            ));
        }
        if (entriesToPush.length > 0) {
            pushPromises.push(supabase.from('journal_entries').upsert(
                entriesToPush.map(e => ({ ...e, user_id: userId }))
            ));
        }

        if (pushPromises.length > 0) {
            const results = await Promise.all(pushPromises);
            const errors = results.filter(r => r.error);
            if (errors.length > 0) throw errors[0].error;
        }

        const merge = <T extends { id: string; lastUpdated?: number }>(localList: T[], remoteList: T[]): T[] => {
            const map = new Map<string, T>();
            [...remoteList, ...localList].forEach(item => {
                const existing = map.get(item.id);
                if (!existing || (item.lastUpdated || 0) >= (existing.lastUpdated || 0)) {
                    map.set(item.id, item);
                }
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
        console.error("Lumina Sync Error:", e);
        return { success: false, message: e.message || "Sync failed." };
    }
};
