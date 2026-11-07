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
  timestamp: number;
  synced: boolean;
}

export interface NormalizedSample {
  landmarks: { x: number; y: number; z: number }[]; // 21 normalized landmarks relative to wrist and scaled
}

export interface CustomGestureRecord {
  id?: number;
  name: string;
  action: string;
  samples: NormalizedSample[]; // 8 samples
  createdAt: number;
  synced: boolean;
}

export class AeroTouchDB extends Dexie {
  settings!: Table<SettingRecord, string>;
  sessions!: Table<SessionRecord, number>;
  gestureEvents!: Table<GestureEventRecord, number>;
  customGestures!: Table<CustomGestureRecord, number>;

  constructor() {
    super('AeroTouchDB');
    this.version(1).stores({
      settings: '&key, synced, updatedAt',
      sessions: '++id, startedAt, endedAt, synced',
      gestureEvents: '++id, gesture, action, timestamp, synced',
      customGestures: '++id, &name, action, createdAt, synced',
    });
  }
}

export const db = new AeroTouchDB();

/**
 * DB Helper functions
 */
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

export async function logGestureEvent(gesture: string, action: string, confidence: number): Promise<void> {
  try {
    await db.gestureEvents.add({
      gesture,
      action,
      confidence,
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

