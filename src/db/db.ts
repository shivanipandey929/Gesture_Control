import Dexie, { type Table } from 'dexie';

export interface SettingRecord {
  key: string;
  value: unknown;
  synced: boolean;
  updatedAt: number;
}

export interface SessionRecord {
  id?: number;
  startedAt: number;
  endedAt?: number;
  activeHandSeconds: number;
  synced: boolean;
}

export interface GestureEventRecord {
  id?: number;
  gesture: string;
  action: string;
  confidence: number;
  mode?: string;
  timestamp: number;
  synced: boolean;
}

export interface NormalizedSample {
  landmarks: { x: number; y: number; z: number }[];
}

export interface CustomGestureRecord {
  id?: number;
  name: string;
  action: string;
  samples: NormalizedSample[];
  createdAt: number;
  synced: boolean;
}

export interface AchievementRecord {
  id: string;
  title: string;
  description: string;
  unlockedAt: number;
}

export function isExactSeedSignature(events: GestureEventRecord[]): boolean {
  if (events.length !== 62) return false;
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.gesture] = (counts[e.gesture] || 0) + 1;
  }
  return (
    counts['Closed_Fist'] === 20 &&
    counts['Open_Palm'] === 17 &&
    counts['Pointing_Up'] === 14 &&
    counts['Victory'] === 5 &&
    counts['Thumb_Up'] === 3 &&
    counts['Thumb_Down'] === 3
  );
}

export class AeroTouchDB extends Dexie {
  settings!: Table<SettingRecord, string>;
  sessions!: Table<SessionRecord, number>;
  gestureEvents!: Table<GestureEventRecord, number>;
  customGestures!: Table<CustomGestureRecord, number>;
  achievements!: Table<AchievementRecord, string>;

  constructor() {
    super('AeroTouchDB');
    this.version(2).stores({
      settings: '&key, synced, updatedAt',
      sessions: '++id, startedAt, endedAt, synced',
      gestureEvents: '++id, gesture, action, mode, timestamp, synced',
      customGestures: '++id, &name, action, createdAt, synced',
    });
    this.version(3).stores({
      settings: '&key, synced, updatedAt',
      sessions: '++id, startedAt, endedAt, synced',
      gestureEvents: '++id, gesture, action, mode, timestamp, synced',
      customGestures: '++id, &name, action, createdAt, synced',
      achievements: '&id, unlockedAt',
    });
    this.version(4).upgrade(async (tx) => {
      const gestureTable = tx.table<GestureEventRecord, number>('gestureEvents');
      const count = await gestureTable.count();
      if (count === 62) {
        const events = await gestureTable.toArray();
        if (isExactSeedSignature(events)) {
          await gestureTable.clear();
        }
      }
    });
  }
}

export const db = new AeroTouchDB();

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const record = await db.settings.get(key);
    return record ? (record.value as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  try {
    await db.settings.put({
      key,
      value,
      synced: false,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn('Failed to save setting to Dexie:', err);
  }
}

export async function logGestureEvent(
  gesture: string,
  action: string,
  confidence: number,
  mode: string = 'general'
): Promise<void> {
  try {
    await db.gestureEvents.add({
      gesture,
      action,
      confidence,
      mode,
      timestamp: Date.now(),
      synced: false,
    });
  } catch (err) {
    console.warn('Failed to log gesture event:', err);
  }
}

export async function saveCustomGesture(name: string, action: string, samples: NormalizedSample[]): Promise<number> {
  return await db.customGestures.put({
    name,
    action,
    samples,
    createdAt: Date.now(),
    synced: false,
  });
}

export async function getAllCustomGestures(): Promise<CustomGestureRecord[]> {
  try {
    return await db.customGestures.toArray();
  } catch {
    return [];
  }
}

export async function deleteCustomGesture(id: number): Promise<void> {
  await db.customGestures.delete(id);
}


export async function unlockAchievement(id: string, title: string, description: string): Promise<boolean> {
  try {
    const existing = await db.achievements.get(id);
    if (!existing) {
      await db.achievements.put({
        id,
        title,
        description,
        unlockedAt: Date.now(),
      });
      return true; // Newly unlocked
    }
    return false;
  } catch {
    return false;
  }
}

export async function checkGestureAchievements(gesture: string): Promise<string | null> {
  try {
    // 1. First swipe achievement
    if (gesture === 'Swipe_Right' || gesture === 'Swipe_Left') {
      const isNew = await unlockAchievement('first_swipe', 'Air Flick Master', 'Performed your first directional swipe gesture.');
      if (isNew) return 'Air Flick Master: Performed your first directional swipe!';
    }

    // 2. 50 gestures achievement
    const count = await db.gestureEvents.count();
    if (count >= 50) {
      const isNew = await unlockAchievement('fifty_gestures', 'Gesture Enthusiast', 'Logged 50 touchless spatial gesture actions.');
      if (isNew) return 'Gesture Enthusiast: Reached 50 total gestures!';
    }

    // 3. 3-day streak
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const day1Events = await db.gestureEvents.where('timestamp').between(now - oneDay, now).count();
    const day2Events = await db.gestureEvents.where('timestamp').between(now - 2 * oneDay, now - oneDay).count();
    const day3Events = await db.gestureEvents.where('timestamp').between(now - 3 * oneDay, now - 2 * oneDay).count();
    if (day1Events > 0 && day2Events > 0 && day3Events > 0) {
      const isNew = await unlockAchievement('streak_3_days', 'Consistent Navigator', 'Active gesture user 3 days in a row.');
      if (isNew) return 'Consistent Navigator: 3-day active gesture streak!';
    }
  } catch {
    // progressive enhancement
  }
  return null;
}

export async function exportAllUserData(): Promise<string> {
  const data = {
    exportDate: new Date().toISOString(),
    settings: await db.settings.toArray(),
    sessions: await db.sessions.toArray(),
    gestureEvents: await db.gestureEvents.toArray(),
    customGestures: await db.customGestures.toArray(),
    achievements: await db.achievements.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function clearAllUserData(): Promise<void> {
  await Promise.all([
    db.settings.clear(),
    db.sessions.clear(),
    db.gestureEvents.clear(),
    db.customGestures.clear(),
    db.achievements.clear(),
  ]);
  localStorage.removeItem('aerotouch_auth_mode');
  localStorage.removeItem('aerotouch_camera_consent');
}
