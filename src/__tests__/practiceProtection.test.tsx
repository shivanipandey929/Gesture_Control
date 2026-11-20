import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { GestureProvider, useGesture } from '../context/GestureContext';

// Mock DB
vi.mock('../db/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../db/db')>();
  return {
    ...actual,
    logGestureEvent: vi.fn(),
    checkGestureAchievements: vi.fn().mockResolvedValue(null),
    getSetting: vi.fn().mockResolvedValue(null),
    setSetting: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock AudioContext
class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }
  resume = vi.fn().mockResolvedValue(undefined);
}
(globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;

describe('Practice Mode Protection & Gesture Action Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GestureProvider>{children}</GestureProvider>
  );

  it('strictly disables global SCREENSHOT, CLICK, and VOLUME actions when activeMode is practice', () => {
    const { result } = renderHook(() => useGesture(), { wrapper });

    act(() => {
      result.current.setActiveMode('practice');
    });

    const receivedActions: string[] = [];
    act(() => {
      result.current.subscribe((payload) => {
        receivedActions.push(payload.action);
      });
    });

    // 1. Victory must return 'NONE' and never fire 'SCREENSHOT'
    let actionResult = 'INITIAL';
    act(() => {
      actionResult = result.current.dispatchAction('Victory');
    });
    expect(actionResult).toBe('NONE');
    expect(receivedActions).not.toContain('SCREENSHOT');

    // 2. Pointing_Up must return 'NONE' and never fire 'CLICK'
    act(() => {
      actionResult = result.current.dispatchAction('Pointing_Up');
    });
    expect(actionResult).toBe('NONE');
    expect(receivedActions).not.toContain('CLICK');

    // 3. Thumb_Up and Thumb_Down must return 'NONE' and never fire VOLUME actions
    act(() => {
      actionResult = result.current.dispatchAction('Thumb_Up');
    });
    expect(actionResult).toBe('NONE');
    expect(receivedActions).not.toContain('VOLUME_UP');

    act(() => {
      actionResult = result.current.dispatchAction('Thumb_Down');
    });
    expect(actionResult).toBe('NONE');
    expect(receivedActions).not.toContain('VOLUME_DOWN');

    // 4. In-game PAUSE is still supported
    // Fast-forward cooldown by dispatching after delay or using Open_Palm
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000);
    act(() => {
      actionResult = result.current.dispatchAction('Open_Palm');
    });
    expect(actionResult).toBe('PAUSE');
    expect(receivedActions).toContain('PAUSE');
  });

  it('allows SCREENSHOT in general mode but blocks it once in practice mode', () => {
    const { result } = renderHook(() => useGesture(), { wrapper });

    // Mode is 'general' by default
    expect(result.current.activeMode).toBe('general');

    let actionResult = '';
    act(() => {
      actionResult = result.current.dispatchAction('Victory');
    });
    expect(actionResult).toBe('SCREENSHOT');

    // Switch to practice mode
    act(() => {
      result.current.setActiveMode('practice');
    });

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2000);
    act(() => {
      actionResult = result.current.dispatchAction('Victory');
    });
    expect(actionResult).toBe('NONE');

    // Switch back to general mode
    act(() => {
      result.current.setActiveMode('general');
    });

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 4000);
    act(() => {
      actionResult = result.current.dispatchAction('Victory');
    });
    expect(actionResult).toBe('SCREENSHOT');
  });
});
