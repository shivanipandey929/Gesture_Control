import React from 'react';
import { Camera, ShieldCheck, RefreshCw, AlertCircle, VideoOff } from 'lucide-react';
import { useCamera } from '../../context/CameraContext';

export const CameraConsentCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isStreaming, isLoading, error, grantConsentAndStart } = useCamera();

  if (isStreaming) return null;

  return (
    <div
      className={`relative rounded-[24px] sm:rounded-[28px] panel-card border border-border/80 bg-surface/95 dark:bg-card/90 backdrop-blur-xl text-foreground flex flex-col items-center text-center select-none overflow-hidden transition-all ${compact
          ? 'p-4 gap-3 max-w-sm'
          : 'p-4 sm:p-8 md:p-10 gap-2.5 sm:gap-4 md:gap-5 max-w-lg mx-auto shadow-[0_20px_50px_rgba(29,99,232,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
        }`}
    >
      {/* Decorative ambient background rings for optical sensor look */}
      <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-sky-400/5 blur-2xl pointer-events-none" />

      {/* Camera Sensor Badge */}
      <div className="relative flex items-center justify-center">
        <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-primary/15 via-blue-500/10 to-sky-400/20 border border-primary/25 flex items-center justify-center text-primary shadow-soft group">
          {error ? (
            <VideoOff className="w-5 h-5 sm:w-8 sm:h-8 text-error" />
          ) : (
            <Camera className="w-5 h-5 sm:w-8 sm:h-8 text-primary transition-transform group-hover:scale-105 duration-200" />
          )}
        </div>
        {/* Subtle pulsating status dot */}
        <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-surface border-2 border-surface flex items-center justify-center">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary/70 animate-ping" />
        </span>
      </div>

      {/* Main Content */}
      <div className="space-y-1 sm:space-y-2 w-full relative z-10">
        <h3 className="font-heading font-extrabold text-foreground text-base sm:text-lg md:text-xl tracking-tight">
          {error === 'denied'
            ? 'Camera Access Denied'
            : error === 'busy'
              ? 'Camera is in Use'
              : error === 'not-found'
                ? 'No Webcam Detected'
                : 'Enable Touchless Control'}
        </h3>

        {error === 'denied' ? (
          <div className="text-left bg-surface-secondary/80 p-3 sm:p-4 rounded-xl border border-border text-xs space-y-1.5 mt-1">
            <div className="flex items-center gap-1.5 font-semibold text-warning text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>How to unblock camera access:</span>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-muted text-[11px] leading-relaxed">
              <li>Click the <strong>Lock or Tune icon</strong> (🔒) on the left of your browser address bar.</li>
              <li>Find <strong>Camera</strong> and toggle it to <strong>Allow</strong>.</li>
              <li>Click the <strong>Retry Camera</strong> button below.</li>
            </ol>
          </div>
        ) : (
          <p className="text-[11px] sm:text-xs md:text-sm text-muted leading-relaxed max-w-md mx-auto line-clamp-2 sm:line-clamp-none">
            {error === 'busy'
              ? 'Another application (Zoom, Teams, Meet) is currently using your camera. Please close it and retry.'
              : error === 'not-found'
                ? 'No webcam was detected on this device. Please connect an external USB webcam.'
                : 'AeroTouch needs standard webcam access to track hand gestures. Video stays 100% on your device and is never recorded or uploaded.'}
          </p>
        )}
      </div>

      {/* Privacy Trust Indicator */}
      <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono text-primary bg-primary/10 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-primary/20 shadow-xs relative z-10">
        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
        <span className="font-medium">Private • Processed Locally</span>
      </div>

      {/* Primary Action Button */}
      <div className="w-full sm:w-auto relative z-10 pt-0.5 sm:pt-1">
        <button
          onClick={() => grantConsentAndStart()}
          disabled={isLoading}
          className="w-full sm:w-auto px-5 py-2 sm:px-7 sm:py-3 rounded-xl bg-[#1D63E8] hover:bg-[#1554C9] text-white font-heading font-semibold text-xs sm:text-sm transition-all duration-150 shadow-[0_10px_25px_-5px_rgba(29,99,232,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Connecting Camera...</span>
            </>
          ) : error ? (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Retry Camera</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CameraConsentCard;
