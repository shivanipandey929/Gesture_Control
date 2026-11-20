import React from 'react';
import { useTranslation } from 'react-i18next';
import { sharedPointerMapper } from '../../engine/pointerMapper';

interface PracticeCalibrationModalProps {
  isOpen: boolean;
  step: number;
  onRecordPoint: (corner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft') => void;
  onClose: () => void;
}

export const PracticeCalibrationModal: React.FC<PracticeCalibrationModalProps> = ({
  isOpen,
  step,
  onRecordPoint,
  onClose,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 p-6 flex flex-col justify-between items-center text-center">
      <div className="space-y-1">
        <h3 className="font-heading font-bold text-lg text-foreground">
          {t('practiceArena.calibTitle', 'Fingertip Pointer Calibration')}
        </h3>
        <p className="text-xs text-muted">
          {t('practiceArena.calibDesc', 'Point your index finger comfortably at each highlighted corner to calibrate reach.')}
        </p>
      </div>

      <div className="relative w-full max-w-md h-56 border-2 border-dashed border-primary/40 rounded-2xl flex items-center justify-center bg-white/50 dark:bg-card/50">
        {step === 0 && (
          <button
            onClick={() => onRecordPoint('topLeft')}
            className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold animate-pulse shadow-soft"
          >
            {t('practiceArena.pointTopLeft', '1. Point Top-Left')}
          </button>
        )}
        {step === 1 && (
          <button
            onClick={() => onRecordPoint('topRight')}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold animate-pulse shadow-soft"
          >
            {t('practiceArena.pointTopRight', '2. Point Top-Right')}
          </button>
        )}
        {step === 2 && (
          <button
            onClick={() => onRecordPoint('bottomRight')}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold animate-pulse shadow-soft"
          >
            {t('practiceArena.pointBottomRight', '3. Point Bottom-Right')}
          </button>
        )}
        {step === 3 && (
          <button
            onClick={() => onRecordPoint('bottomLeft')}
            className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold animate-pulse shadow-soft"
          >
            {t('practiceArena.pointBottomLeft', '4. Point Bottom-Left')}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            sharedPointerMapper.resetCalibration();
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-surface-secondary border border-border text-xs text-muted hover:text-foreground"
        >
          {t('practiceArena.resetDefaults', 'Reset Defaults')}
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-soft"
        >
          {t('practiceArena.done', 'Done')}
        </button>
      </div>
    </div>
  );
};
