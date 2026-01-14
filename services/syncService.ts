
import { UserState, Goal, Habit, JournalEntry } from "../types";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * Lumina Sync Service - Scalable Edition
 * Now supports hard deletions using the 'deletedIds' queue.
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

        // 3. Determine what needs to be pushed (Local newer than Remote)
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

        // 4. Merge Logic (Reconciliation)
        const merge = <T extends { id: string; lastUpdated?: number }>(localList: T[], remoteList: T[]): T[] => {
            const map = new Map<string, T>();
            [...remoteList, ...localList].forEach(item => {
                const existing = map.get(item.id);
                // If remote item exists but it was deleted in local, the merge should handle it.
                // However, since we already performed DELETEs above, remoteList will not contain the deleted items.
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
