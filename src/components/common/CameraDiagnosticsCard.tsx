import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Camera,
  Cpu,
  Activity,
  Shield,
  Layers,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useCamera } from '../../context/CameraContext';

export const CameraDiagnosticsCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isStreaming,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    diagnostics,
    error,
    errorMessage,
    startCamera,
    isLoading
  } = useCamera();

  return (
    <div className={`rounded-2xl panel-card border border-border shadow-soft overflow-hidden transition-all ${className}`}>
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-surface hover:bg-surface-secondary/60 text-foreground transition-colors text-xs font-heading font-semibold"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span>Camera & Engine Diagnostics</span>
          {isStreaming && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
              {diagnostics.fps > 0 ? `${diagnostics.fps} FPS` : 'Active'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-muted">
          <span className="text-[11px] font-normal">{isOpen ? 'Hide' : 'Show details'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-border bg-surface-secondary/30 text-xs">
          {/* Camera Error / Instructions if error active */}
          {error && errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => startCamera()}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Retry Camera</span>
              </button>
            </div>
          )}

          {/* Camera Device Selector if multiple devices exist */}
          {devices.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-primary" />
                <span>Camera Device</span>
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              >
                {devices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* 1. Device Name */}
            <div className="p-2.5 rounded-xl bg-surface border border-border space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-mono uppercase">
                <Camera className="w-3 h-3" />
                <span>Device</span>
              </div>
              <div className="font-semibold text-foreground text-[11px] truncate" title={diagnostics.deviceName}>
                {diagnostics.deviceName || 'None'}
              </div>
            </div>

            {/* 2. Permission */}
            <div className="p-2.5 rounded-xl bg-surface border border-border space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-mono uppercase">
                <Shield className="w-3 h-3" />
                <span>Permission</span>
              </div>
              <div className="font-semibold text-foreground text-[11px] capitalize">
                {diagnostics.permissionState}
              </div>
            </div>

            {/* 3. Resolution */}
            <div className="p-2.5 rounded-xl bg-surface border border-border space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-mono uppercase">
                <Layers className="w-3 h-3" />
                <span>Resolution</span>
              </div>
              <div className="font-semibold text-foreground text-[11px]">
                {diagnostics.resolution.width > 0
                  ? `${diagnostics.resolution.width} × ${diagnostics.resolution.height}`
                  : '—'}
              </div>
            </div>

            {/* 4. Model State */}
            <div className="p-2.5 rounded-xl bg-surface border border-border space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-mono uppercase">
                <Cpu className="w-3 h-3" />
                <span>Model</span>
              </div>
              <div className="font-semibold text-[11px]">
                {diagnostics.modelLoaded ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Float16 Ready</span>
                ) : (
                  <span className="text-muted">Loading...</span>
                )}
              </div>
            </div>

            {/* 5. Live FPS */}
            <div className="p-2.5 rounded-xl bg-surface border border-border space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-mono uppercase">
                <Activity className="w-3 h-3" />
                <span>Measured FPS</span>
              </div>
              <div className="font-semibold font-mono text-foreground text-[11px]">
                {isStreaming ? `${diagnostics.fps} fps` : '0 fps'}
              </div>
            </div>

            {/* 6. Inference Time */}
            <div className="p-2.5 rounded-xl bg-surface border border-border space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-mono uppercase">
                <Cpu className="w-3 h-3" />
                <span>Inference</span>
              </div>
              <div className="font-semibold font-mono text-foreground text-[11px]">
                {isStreaming && diagnostics.inferenceMs > 0 ? `${diagnostics.inferenceMs} ms` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
