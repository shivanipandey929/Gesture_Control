import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useState } from 'react';
import { render, act } from '@testing-library/react';
import { HandOverlayCanvas } from '../components/common/HandOverlayCanvas';
import { masterGestureEngine } from '../engine/masterEngine';
import * as handDrawer from '../utils/handDrawer';
import { createRealistic21Landmarks } from './helpers/landmarkFixtures';

// Mock ResizeObserver for jsdom
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver = MockResizeObserver;

// Mock Canvas 2D Context for jsdom
const mock2dContext = {
  save: vi.fn(),
  restore: vi.fn(),
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  roundRect: vi.fn(),
  measureText: vi.fn(() => ({ width: 50 })),
  fillText: vi.fn(),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  setLineDash: vi.fn(),
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn().mockImplementation((type: string) => {
    if (type === '2d') return mock2dContext;
    return null;
  }),
  configurable: true,
  writable: true,
});

describe('HandOverlayCanvas and Skeleton Registration Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    masterGestureEngine.setSimulatedHand(false);
  });

  afterEach(() => {
    masterGestureEngine.setSimulatedHand(false);
  });

  // Test 1: Component rendering HandOverlayCanvas only after state flip registers exactly one canvas and unregisters on unmount
  it('registers exactly one canvas only after state flip and unregisters on unmount', () => {
    function ToggleComponent() {
      const [showCanvas, setShowCanvas] = useState(false);
      return (
        <div>
          <button data-testid="toggle-btn" onClick={() => setShowCanvas((prev) => !prev)}>
            Toggle
          </button>
          {showCanvas && <HandOverlayCanvas />}
        </div>
      );
    }

    const { getByTestId, unmount } = render(<ToggleComponent />);

    // Initially off: zero registered canvases from this component
    const initialRegistered = masterGestureEngine.getRegisteredCanvases();
    expect(initialRegistered.length).toBe(0);

    // Flip state on (e.g. camera stream active)
    act(() => {
      getByTestId('toggle-btn').click();
    });

    const registeredAfterFlip = masterGestureEngine.getRegisteredCanvases();
    expect(registeredAfterFlip.length).toBe(1);
    expect(registeredAfterFlip[0].drawSkeleton).toBe(true);
    expect(registeredAfterFlip[0].showGestureChip).toBe(true);

    // Unmount component: should cleanly unregister
    unmount();
    const registeredAfterUnmount = masterGestureEngine.getRegisteredCanvases();
    expect(registeredAfterUnmount.length).toBe(0);
  });

  // Test 2: Toggling streaming off/on 3 times leaves exactly one registered canvas (no leaks/duplicates)
  it('leaves exactly one registered canvas without duplicates when toggled 3 times', () => {
    function StreamingHost({ streaming }: { streaming: boolean }) {
      return <div>{streaming && <HandOverlayCanvas />}</div>;
    }

    const { rerender, unmount } = render(<StreamingHost streaming={false} />);
    expect(masterGestureEngine.getRegisteredCanvases().length).toBe(0);

    // Toggle 1: ON -> OFF
    rerender(<StreamingHost streaming={true} />);
    expect(masterGestureEngine.getRegisteredCanvases().length).toBe(1);
    rerender(<StreamingHost streaming={false} />);
    expect(masterGestureEngine.getRegisteredCanvases().length).toBe(0);

    // Toggle 2: ON -> OFF
    rerender(<StreamingHost streaming={true} />);
    expect(masterGestureEngine.getRegisteredCanvases().length).toBe(1);
    rerender(<StreamingHost streaming={false} />);
    expect(masterGestureEngine.getRegisteredCanvases().length).toBe(0);

    // Toggle 3: ON
    rerender(<StreamingHost streaming={true} />);
    const activeCanvases = masterGestureEngine.getRegisteredCanvases();
    expect(activeCanvases.length).toBe(1);

    // Direct idempotent register call with same canvas does not create duplicates
    const canvasEl = activeCanvases[0].canvas;
    masterGestureEngine.registerCanvas(canvasEl, true, true);
    expect(masterGestureEngine.getRegisteredCanvases().length).toBe(1);

    unmount();
    expect(masterGestureEngine.getRegisteredCanvases().length).toBe(0);
  });

  // Test 3: Minimizing and expanding a widget keeps skeleton drawn
  it('keeps skeleton drawn when minimizing and expanding a widget', () => {
    const drawSpy = vi.spyOn(handDrawer, 'drawHandSkeleton');

    function Widget({ expanded }: { expanded: boolean }) {
      return (
        <div data-testid="widget-root">
          {expanded ? <HandOverlayCanvas drawSkeleton={true} /> : <div>Minimized widget icon</div>}
        </div>
      );
    }

    // 1. Expanded initial state
    const { rerender, unmount } = render(<Widget expanded={true} />);
    expect(masterGestureEngine.getRegisteredCanvases().length).toBe(1);

    // Provide mock 21 landmarks to masterGestureEngine
    const mockLandmarks = createRealistic21Landmarks(0.5, 0.5, 'open_palm');
    masterGestureEngine.targetLandmarks = mockLandmarks.map((lm) => ({ ...lm }));
    masterGestureEngine.renderedLandmarks = mockLandmarks.map((lm) => ({ ...lm }));

    // 2. Minimize widget (unmounts canvas overlay)
    rerender(<Widget expanded={false} />);
    expect(masterGestureEngine.getRegisteredCanvases().length).toBe(0);

    // 3. Re-expand widget (mounts canvas overlay again)
    rerender(<Widget expanded={true} />);
    expect(masterGestureEngine.getRegisteredCanvases().length).toBe(1);

    // Run a render loop tick or trigger simulated frame
    act(() => {
      masterGestureEngine.setSimulatedHand(true, 'Victory');
    });

    expect(drawSpy).toHaveBeenCalled();
    unmount();
    drawSpy.mockRestore();
  });

  // Test 4: With Simulated hand mode, skeleton is drawn on canvas
  it('draws skeleton on registered canvas when simulated hand mode is active', () => {
    const drawSpy = vi.spyOn(handDrawer, 'drawHandSkeleton');

    const { unmount } = render(<HandOverlayCanvas drawSkeleton={true} />);
    expect(masterGestureEngine.getRegisteredCanvases().length).toBe(1);

    // Activate simulated hand mode
    act(() => {
      masterGestureEngine.setSimulatedHand(true, 'Open_Palm');
    });

    expect(masterGestureEngine.isSimulatedHand).toBe(true);
    expect(masterGestureEngine.targetLandmarks.length).toBe(21);
    expect(drawSpy).toHaveBeenCalled();

    unmount();
    drawSpy.mockRestore();
  });
});
