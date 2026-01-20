
import { UserState, Goal, Habit, JournalEntry } from "../types";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * Lumina Sync Service - Scalable Edition
 * Handles hard deletions and deep reconciliation of JSONB fields.
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
        console.log("Starting Lumina Cloud Sync...");

        // 1. Process Hard Deletions First (Clean up remote before fetching)
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
            const deleteResults = await Promise.all(deletePromises);
            const deleteErrors = deleteResults.filter(r => r.error);
            if (deleteErrors.length > 0) console.warn("Deletion sync warnings:", deleteErrors);
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

        // Helper to ensure JSONB fields are treated as arrays
        const sanitizeRemote = <T extends object>(list: T[] | null): T[] => {
            return (list || []).map(item => {
                const newItem = { ...item } as any;
                // Specific fields that must be arrays
                const arrayFields = ['milestones', 'completedDates', 'daysOfWeek', 'activities'];
                arrayFields.forEach(field => {
                    if (newItem[field]) {
                        // If it's a string (sometimes returned by older drivers), parse it.
                        // Otherwise, ensure it's at least an empty array if null.
                        if (typeof newItem[field] === 'string') {
                            try { newItem[field] = JSON.parse(newItem[field]); } catch (e) { newItem[field] = []; }
                        }
                    } else {
                        newItem[field] = [];
                    }
                });
                return newItem as T;
            });
        };

        const rGoals = sanitizeRemote(remoteGoals) as Goal[];
        const rHabits = sanitizeRemote(remoteHabits) as Habit[];
        const rEntries = sanitizeRemote(remoteEntries) as JournalEntry[];

        // 3. Determine what needs to be pushed (Local newer than Remote)
        const goalsToPush = localData.goals.filter(local => {
            const remote = rGoals.find(r => r.id === local.id);
            return !remote || (Number(local.lastUpdated) || 0) > (Number(remote.lastUpdated) || 0);
        });

        const habitsToPush = localData.habits.filter(local => {
            const remote = rHabits.find(r => r.id === local.id);
            return !remote || (Number(local.lastUpdated) || 0) > (Number(remote.lastUpdated) || 0);
        });

        const entriesToPush = localData.journalEntries.filter(local => {
            const remote = rEntries.find(r => r.id === local.id);
            return !remote || (Number(local.lastUpdated) || 0) > (Number(remote.lastUpdated) || 0);
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
            if (errors.length > 0) {
                console.error("Push sync failed:", errors);
                throw errors[0].error;
            }
        }

        // 4. Merge Logic (Reconciliation) - Keep the most recently updated version
        const merge = <T extends { id: string; lastUpdated?: number }>(localList: T[], remoteList: T[]): T[] => {
            const map = new Map<string, T>();
            [...remoteList, ...localList].forEach(item => {
                const existing = map.get(item.id);
                const itemTime = Number(item.lastUpdated) || 0;
                const existingTime = existing ? (Number(existing.lastUpdated) || 0) : -1;
                
                if (!existing || itemTime >= existingTime) {
                    map.set(item.id, item);
                }
            });
            return Array.from(map.values());
        };

        console.log("Sync complete. Vault synchronized.");

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
