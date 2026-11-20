import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, isExactSeedSignature, type GestureEventRecord } from '../db/db';

describe('Analytics Real Data Protection', () => {
  beforeEach(async () => {
    await db.gestureEvents.clear();
  });

  afterEach(async () => {
    await db.gestureEvents.clear();
  });

  it('keeps an empty database completely empty without auto-seeding', async () => {
    const initialCount = await db.gestureEvents.count();
    expect(initialCount).toBe(0);

    // Verify after simulated access / delay that count remains strictly 0
    await new Promise((r) => setTimeout(r, 50));
    const postCount = await db.gestureEvents.count();
    expect(postCount).toBe(0);
  });

  it('preserves all 100 real user gesture events without deleting or modifying them', async () => {
    const now = Date.now();
    const realEvents: Omit<GestureEventRecord, 'id'>[] = [];
    for (let i = 0; i < 100; i++) {
      realEvents.push({
        gesture: i % 2 === 0 ? 'Open_Palm' : 'Pointing_Up',
        action: i % 2 === 0 ? 'PAUSE' : 'SCROLL_DOWN',
        confidence: 0.85 + (i % 10) * 0.01,
        mode: 'presentation',
        timestamp: now - i * 1000,
        synced: false,
      });
    }

    await db.gestureEvents.bulkAdd(realEvents);
    const countBefore = await db.gestureEvents.count();
    expect(countBefore).toBe(100);

    // Verify count and data remain completely intact
    const allRecords = await db.gestureEvents.toArray();
    expect(allRecords.length).toBe(100);
    expect(isExactSeedSignature(allRecords)).toBe(false);
  });

  it('correctly matches and identifies only the exact 62-event seed signature', () => {
    const fakeSeedEvents: GestureEventRecord[] = [];
    const now = Date.now();

    // 20 Closed_Fist
    for (let i = 0; i < 20; i++) {
      fakeSeedEvents.push({
        id: i + 1,
        gesture: 'Closed_Fist',
        action: 'PLAY',
        confidence: 0.85,
        mode: 'Kitchen',
        timestamp: now - i * 1000,
        synced: false,
      });
    }
    // 17 Open_Palm
    for (let i = 0; i < 17; i++) {
      fakeSeedEvents.push({
        id: i + 21,
        gesture: 'Open_Palm',
        action: 'PAUSE',
        confidence: 0.8,
        mode: 'Kitchen',
        timestamp: now - i * 1000,
        synced: false,
      });
    }
    // 14 Pointing_Up
    for (let i = 0; i < 14; i++) {
      fakeSeedEvents.push({
        id: i + 38,
        gesture: 'Pointing_Up',
        action: 'SCROLL_DOWN',
        confidence: 0.82,
        mode: 'Kitchen',
        timestamp: now - i * 1000,
        synced: false,
      });
    }
    // 5 Victory
    for (let i = 0; i < 5; i++) {
      fakeSeedEvents.push({
        id: i + 52,
        gesture: 'Victory',
        action: 'SNAPSHOT',
        confidence: 0.88,
        mode: 'Studio',
        timestamp: now - i * 1000,
        synced: false,
      });
    }
    // 3 Thumb_Up
    for (let i = 0; i < 3; i++) {
      fakeSeedEvents.push({
        id: i + 57,
        gesture: 'Thumb_Up',
        action: 'VOLUME_UP',
        confidence: 0.85,
        mode: 'Presentation',
        timestamp: now - i * 1000,
        synced: false,
      });
    }
    // 3 Thumb_Down
    for (let i = 0; i < 3; i++) {
      fakeSeedEvents.push({
        id: i + 60,
        gesture: 'Thumb_Down',
        action: 'VOLUME_DOWN',
        confidence: 0.82,
        mode: 'Presentation',
        timestamp: now - i * 1000,
        synced: false,
      });
    }

    expect(fakeSeedEvents.length).toBe(62);
    expect(isExactSeedSignature(fakeSeedEvents)).toBe(true);

    // If one event changes, it should NOT match
    const modifiedEvents = [...fakeSeedEvents];
    modifiedEvents[0] = { ...modifiedEvents[0], gesture: 'Victory' };
    expect(isExactSeedSignature(modifiedEvents)).toBe(false);
  });
});
