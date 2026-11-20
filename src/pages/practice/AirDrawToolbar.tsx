import React from 'react';
import { Eraser, Undo2, Redo2, Trash2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AIR_DRAW_COLORS } from './PracticeTypes';
import type { StabilizerLevel, PenTriggerMode } from './AirDrawEngine';

interface AirDrawToolbarProps {
  brushColor: string;
  setBrushColor: (c: string) => void;
  isEraser: boolean;
  setIsEraser: (e: boolean) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  stabilizer: StabilizerLevel;
  setStabilizer: (s: StabilizerLevel) => void;
  penMode: PenTriggerMode;
  setPenMode: React.Dispatch<React.SetStateAction<PenTriggerMode>>;
  canUndo: boolean;
  canRedo: boolean;
  hasStrokes: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSavePng: () => void;
}

export const AirDrawToolbar: React.FC<AirDrawToolbarProps> = ({
  brushColor,
  setBrushColor,
  isEraser,
  setIsEraser,
  brushSize,
  setBrushSize,
  stabilizer,
  setStabilizer,
  penMode,
  setPenMode,
  canUndo,
  canRedo,
  hasStrokes,
  onUndo,
  onRedo,
  onClear,
  onSavePng,
}) => {
  const { t } = useTranslation();

  return (
    <div className="absolute top-3 right-3 z-30 p-2 rounded-2xl bg-white/95 dark:bg-[#111C35]/95 border border-border shadow-card flex items-center gap-2 backdrop-blur-md">
      <div className="flex items-center gap-1.5 pr-2 border-r border-border">
        {AIR_DRAW_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setBrushColor(c);
              setIsEraser(false);
            }}
            style={{ backgroundColor: c }}
            className={`w-5 h-5 rounded-full border-2 transition-transform ${
              brushColor === c && !isEraser ? 'scale-125 border-primary ring-2 ring-primary/40' : 'border-border/60'
            }`}
            title={c}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
      {/* Eraser */}
      <button
        onClick={() => setIsEraser(!isEraser)}
        className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
          isEraser
            ? 'bg-primary text-white border-primary shadow-xs'
            : 'bg-surface-secondary border-border text-muted hover:text-foreground'
        }`}
        title={t('practiceArena.eraserTitle', 'Eraser (or hold Closed Fist 600ms)')}
        aria-label="Eraser tool"
      >
        <Eraser className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px] font-semibold">{t('practiceArena.eraser', 'Eraser')}</span>
      </button>

      {/* Brush Size Slider */}
      <div className="flex items-center gap-1 px-1">
        <input
          type="range"
          min={2}
          max={24}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-14 h-1.5 accent-primary cursor-pointer"
          title={`Brush size: ${brushSize}px`}
          aria-label="Brush size"
        />
      </div>

      {/* Stabilizer Level */}
      <div className="flex items-center gap-1 bg-surface-secondary p-1 rounded-xl border border-border text-[10px]">
        {(['off', 'low', 'medium', 'high'] as StabilizerLevel[]).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setStabilizer(lvl)}
            className={`px-1.5 py-0.5 rounded capitalize transition-colors ${
              stabilizer === lvl ? 'bg-primary text-white font-bold' : 'text-muted hover:text-foreground'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Pen Trigger Mode */}
      <button
        onClick={() => setPenMode((m) => (m === 'pinch' ? 'pointing' : 'pinch'))}
        className="px-2 py-1 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-[10px] text-foreground font-semibold"
        title={t('practiceArena.switchPen', 'Switch Pen Trigger')}
      >
        {penMode === 'pinch' ? '🤏 Pinch' : '☝️ Point'}
      </button>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-1.5 rounded-lg border border-border bg-surface-secondary text-foreground hover:bg-surface disabled:opacity-30 text-xs"
        title="Undo (Ctrl+Z)"
        aria-label="Undo stroke"
      >
        <Undo2 className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-1.5 rounded-lg border border-border bg-surface-secondary text-foreground hover:bg-surface disabled:opacity-30 text-xs"
        title="Redo (Ctrl+Y)"
        aria-label="Redo stroke"
      >
        <Redo2 className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onClear}
        disabled={!hasStrokes}
        className="p-1.5 rounded-lg border border-border bg-surface-secondary text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 text-xs"
        title="Clear All Strokes"
        aria-label="Clear all strokes"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onSavePng}
        disabled={!hasStrokes}
        className="p-1.5 rounded-lg border border-border bg-primary text-white hover:bg-primary-hover disabled:opacity-30 text-xs"
        title="Download PNG"
        aria-label="Download drawing as PNG"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
