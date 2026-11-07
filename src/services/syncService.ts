import { db } from '../db/db';
import { supabase } from './supabase';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  unsyncedCount: number;
  error: string | null;
}

class SyncService {
  private isSyncing = false;
  private lastSyncedAt: number | null = null;
  private error: string | null = null;

  async getUnsyncedCount(): Promise<number> {
    try {
      const [events, gestures, sessions] = await Promise.all([
        db.gestureEvents.where('synced').equals(0).count(),
        db.customGestures.where('synced').equals(0).count(),
        db.sessions.where('synced').equals(0).count(),
      ]);
      return events + gestures + sessions;
    } catch {
      return 0;
    }
  }

  async syncAll(userId: string): Promise<{ synced: number; error: string | null }> {
    if (this.isSyncing || !supabase || !navigator.onLine) {
      return { synced: 0, error: 'Offline or sync already in progress' };
    }

    this.isSyncing = true;
    this.error = null;
    let totalSynced = 0;

    try {
      // 1. Sync Gesture Events in batches of 50
      const unsyncedEvents = await db.gestureEvents
        .filter((e) => !e.synced)
        .limit(50)
        .toArray();

      if (unsyncedEvents.length > 0) {
        const payload = unsyncedEvents.map((e) => ({
          user_id: userId,
          gesture: e.gesture,
          action: e.action,
          confidence: e.confidence,
          timestamp: new Date(e.timestamp).toISOString(),
        }));

        const { error } = await supabase.from('gesture_events').insert(payload);
        if (!error) {
          // Mark as synced in IndexedDB
          const ids = unsyncedEvents.map((e) => e.id!).filter(Boolean);
          await db.gestureEvents.where('id').anyOf(ids).modify({ synced: true });
          totalSynced += unsyncedEvents.length;
        } else {
          console.warn('Sync events error:', error);
        }
      }

      // 2. Sync Custom Gestures
      const unsyncedGestures = await db.customGestures
        .filter((g) => !g.synced)
        .toArray();

      if (unsyncedGestures.length > 0) {
        const payload = unsyncedGestures.map((g) => ({
          user_id: userId,
          name: g.name,
          action: g.action,
          samples: g.samples,
        }));

        const { error } = await supabase.from('custom_gestures').upsert(payload, { onConflict: 'user_id,name' });
        if (!error) {
          const ids = unsyncedGestures.map((g) => g.id!).filter(Boolean);
          await db.customGestures.where('id').anyOf(ids).modify({ synced: true });
          totalSynced += unsyncedGestures.length;
        }
      }

      // 3. Sync Sessions
      const unsyncedSessions = await db.sessions
        .filter((s) => !s.synced)
        .toArray();

      if (unsyncedSessions.length > 0) {
        const payload = unsyncedSessions.map((s) => ({
          user_id: userId,
          started_at: new Date(s.startedAt).toISOString(),
          ended_at: s.endedAt ? new Date(s.endedAt).toISOString() : null,
          active_hand_seconds: s.activeHandSeconds,
        }));

        const { error } = await supabase.from('sessions').insert(payload);
        if (!error) {
          const ids = unsyncedSessions.map((s) => s.id!).filter(Boolean);
          await db.sessions.where('id').anyOf(ids).modify({ synced: true });
          totalSynced += unsyncedSessions.length;
        }
      }

      this.lastSyncedAt = Date.now();
      return { synced: totalSynced, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.error = msg;
      return { synced: totalSynced, error: msg };
    } finally {
      this.isSyncing = false;
    }
  }

  getStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      unsyncedCount: 0,
      error: this.error,
    };
  }
}

export const syncService = new SyncService();

