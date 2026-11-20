import React from 'react';
import { useCamera } from '../../context/CameraContext';
import { masterGestureEngine } from '../../engine';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface CameraStatusChipProps {
  hasHand?: boolean;
  isLowLight?: boolean;
  modelError?: string | null;
  onRetry?: () => void;
  className?: string;
  showFps?: boolean;
}

export const CameraStatusChip: React.FC<CameraStatusChipProps> = ({
  hasHand = false,
  isLowLight = false,
  modelError = null,
  onRetry,
  className = '',
  showFps = true,
}) => {
  const { isStreaming, isLoading, loadingPhase } = useCamera();

  const statusLabel = !isStreaming
    ? 'Off'
    : (isLoading || loadingPhase === 'requesting-camera' || loadingPhase === 'loading-model')
    ? 'Starting'
    : isLowLight
    ? 'Low light'
    : hasHand
    ? 'Tracking'
    : 'No hand';

  const dotColor =
    statusLabel === 'Off'
      ? 'bg-muted'
      : statusLabel === 'Starting'
      ? 'bg-warning animate-pulse'
      : statusLabel === 'Tracking'
      ? 'bg-success animate-pulse'
      : statusLabel === 'Low light'
      ? 'bg-amber-500 animate-pulse'
      : 'bg-primary/50 animate-pulse';

  if (!isStreaming) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary border border-border text-xs font-mono text-muted ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-muted/60" />
        <span className="font-semibold">{statusLabel}</span>
      </div>
    );
  }

  if (modelError) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-600 dark:text-rose-400 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-error" />
        <span>Model load failed</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-1 px-1.5 py-0.5 rounded bg-error text-white hover:opacity-90 font-semibold text-[10px] flex items-center gap-1"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  const cameraFps = masterGestureEngine.state.cameraFps || 30;
  const aiFps = masterGestureEngine.state.fps || 0;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary border border-border text-xs font-mono text-foreground shadow-soft">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="font-semibold">{statusLabel}</span>
      </div>

      {showFps && isStreaming && (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 shadow-soft">
          Cam {cameraFps} · AI {aiFps}
        </span>
      )}
    </div>
  );
};
