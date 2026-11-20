import React from 'react';
import {
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Lock,
  WifiOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Help: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary font-medium mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t('helpPage.badge', 'Documentation & Architecture')}</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-foreground mb-2">
          {t('helpPage.title', 'Help & User Guide')}
        </h1>
        <p className="text-muted text-sm">
          {t('helpPage.subtitle', 'Everything you need to know about AeroTouch, offline gesture models, and user privacy.')}
        </p>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="p-6 sm:p-8 rounded-3xl panel-card border border-primary/30 flex flex-col gap-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary text-white font-bold shadow-soft">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-foreground">
              {t('helpPage.onDeviceTitle', 'On-Device Privacy by Design')}
            </h2>
            <p className="text-xs text-primary font-mono">
              {t('helpPage.onDeviceSubtitle', 'Guaranteed Offline Capability')}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted leading-relaxed">
          {t(
            'helpPage.onDeviceDesc',
            'AeroTouch utilizes a locally hosted Google MediaPipe Gesture Recognizer compiled into WebAssembly (.wasm) alongside the float16 gesture_recognizer.task model stored directly in this application /public folder.'
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-surface-secondary border border-border">
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-primary mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>{t('helpPage.localProcessing', 'Local Processing')}</span>
            </div>
            <div className="text-[11px] text-muted leading-relaxed">
              {t('helpPage.localProcessingDesc', 'Webcam video frames never leave your browser sandbox or memory buffer.')}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-secondary border border-border">
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-primary mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('helpPage.zeroCloud', 'Zero Cloud Inference')}</span>
            </div>
            <div className="text-[11px] text-muted leading-relaxed">
              {t('helpPage.zeroCloudDesc', 'All 21 hand landmarks and 3D bounding geometry are computed on your device.')}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-secondary border border-border">
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-primary mb-1">
              <WifiOff className="w-3.5 h-3.5" />
              <span>{t('trust.offline', 'Works offline after the first load')}</span>
            </div>
            <div className="text-[11px] text-muted leading-relaxed">
              {t('trust.offlineDesc', 'No cloud server dependency')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
