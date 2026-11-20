import React, { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type GestureEventRecord } from '../../db/db';
import { MessageSquare, Clock, Radio } from 'lucide-react';

interface ActivityFeedProps {
  maxItems?: number;
  className?: string;
}

const GESTURE_ICONS: Record<string, string> = {
  Open_Palm: '✋',
  Closed_Fist: '✊',
  Swipe_Right: '👉',
  Swipe_Left: '👈',
  Thumb_Up: '👍',
  Thumb_Down: '👎',
  Pointing_Up: '☝️',
  Victory: '✌️',
  Wave: '👋',
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ maxItems = 20, className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Live query from IndexedDB
  const events = useLiveQuery(async () => {
    try {
      const records = await db.gestureEvents
        .orderBy('timestamp')
        .reverse()
        .limit(maxItems)
        .toArray();
      // Reverse to display chronological stream (newest at bottom)
      return records.reverse();
    } catch {
      return [];
    }
  }, [maxItems]);

  // Auto-scroll on new action on THAT container only, without page jumps
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events?.length]);

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatActionName = (action: string) => {
    switch (action) {
      case 'NEXT': return 'Next slide';
      case 'PREV': return 'Previous slide';
      case 'PAUSE': return 'Pause';
      case 'PLAY': return 'Play / Resume';
      case 'VOLUME_UP': return 'Volume up';
      case 'VOLUME_DOWN': return 'Volume down';
      case 'CLICK': return 'Click';
      case 'SCREENSHOT': return 'Screenshot';
      case 'SCROLL_UP': return 'Scroll up';
      case 'SCROLL_DOWN': return 'Scroll down';
      default: return action.replace('_', ' ');
    }
  };

  return (
    <div className={`panel-card p-5 flex flex-col h-full bg-surface border border-border/80 rounded-[24px] shadow-soft select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border/80 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-foreground">
              Real-Time Activity
            </h3>
            <p className="text-[11px] text-muted">Live gesture triggers (IndexedDB)</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-surface-secondary text-foreground border border-border">
            Last {events?.length || 0}
          </span>
        </div>
      </div>

      {/* Chat-style scrollable list with fixed height and contained overscroll */}
      <div
        ref={containerRef}
        style={{ overscrollBehavior: 'contain' }}
        className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[360px] min-h-[220px]"
      >
        {!events || events.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6 text-muted">
            <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center text-muted mb-3 border border-border">
              <Radio className="w-6 h-6 opacity-60 text-primary animate-pulse" />
            </div>
            <p className="text-xs font-semibold text-foreground">Ready and waiting for gestures.</p>
            <p className="text-[11px] text-muted mt-1 max-w-xs">
              Start camera and perform a gesture to see live recognized actions logged here in real-time.
            </p>
          </div>
        ) : (
          events.map((ev: GestureEventRecord) => {
            const icon = GESTURE_ICONS[ev.gesture] || '✋';
            return (
              <div
                key={ev.id || `${ev.timestamp}-${ev.gesture}`}
                className="p-3 rounded-2xl bg-surface-secondary/70 hover:bg-surface-secondary border border-border/80 hover:border-primary/40 flex items-center justify-between gap-3 text-xs transition-all duration-150 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg w-7 h-7 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border/60">
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <div className="font-heading font-medium text-foreground truncate">
                      <span className="text-primary font-bold">You: </span>
                      <span className="font-semibold">{ev.gesture.replace('_', ' ')}</span>
                      <span className="text-muted mx-1.5 font-sans">→</span>
                      <span className="text-foreground font-bold">
                        {formatActionName(ev.action)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted font-mono mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted" />
                        {formatTime(ev.timestamp)}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{ev.mode || 'general'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {(ev.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
