import React from 'react';
import { ShieldCheck, EyeOff, Cpu, ServerOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Privacy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('privacyPage.badge', 'Privacy & Security')}</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-foreground mb-3">
          {t('privacyPage.title', 'Privacy Policy & Video Architecture')}
        </h1>
        <p className="text-muted text-sm sm:text-base leading-relaxed">
          {t(
            'privacyPage.subtitle',
            'At AeroTouch, our core principle is mathematical: Your camera stream never leaves your device memory buffer.'
          )}
        </p>
      </div>

      {/* Core Privacy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl panel-card border border-border flex flex-col gap-3 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ServerOff className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-foreground">
            {t('privacyPage.pillar1Title', 'Zero Video Uploads')}
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            {t(
              'privacyPage.pillar1Desc',
              'No video frames, still images, or camera recordings are ever uploaded to any server, cloud provider, or third party. Video frames exist only temporarily in volatile client RAM during HTML5 canvas rendering.'
            )}
          </p>
        </div>

        <div className="p-6 rounded-3xl panel-card border border-border flex flex-col gap-3 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-foreground">
            {t('privacyPage.pillar2Title', 'Local WebAssembly Inference')}
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            {t(
              'privacyPage.pillar2Desc',
              "The neural vision model (gesture_recognizer.task) and Google MediaPipe runtime are compiled into WebAssembly (.wasm) binaries stored directly in your browser's CacheStorage and executed by your local CPU/GPU."
            )}
          </p>
        </div>

        <div className="p-6 rounded-3xl panel-card border border-border flex flex-col gap-3 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <EyeOff className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-foreground">
            {t('privacyPage.pillar3Title', 'Local Storage by Default')}
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            {t(
              'privacyPage.pillar3Desc',
              "By default, all custom gestures, sessions, and settings reside strictly in your browser's private IndexedDB database. Optional Supabase cloud synchronization transmits only coordinate metadata (never video) and requires explicit account creation."
            )}
          </p>
        </div>
      </div>

      {/* Detailed Technical Statement */}
      <div className="p-8 rounded-3xl panel-card border border-border space-y-6 text-sm text-muted leading-relaxed shadow-card">
        <h2 className="font-heading font-bold text-xl text-foreground">
          {t('privacyPage.technicalGuarantee', 'Technical Privacy Guarantee')}
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-1">
              {t('privacyPage.sec1Title', '1. HTML5 getUserMedia Sandbox')}
            </h4>
            <p>
              {t('privacyPage.sec1Desc', 'When you grant webcam access, the browser exposes a direct MediaStream object. This stream is bound solely to an offscreen HTML5 <video> element and processed by WebAssembly memory pointers.')}
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground mb-1">
              {t('privacyPage.sec2Title', '2. Pure Mathematical Coordinate Translation')}
            </h4>
            <p>
              {t('privacyPage.sec2Desc', 'The vision recognizer outputs numerical coordinates (x, y, z normalized floats between 0.0 and 1.0) representing 21 hand landmarks. These lightweight numerical points are the ONLY data consumed by application modes.')}
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground mb-1">
              {t('privacyPage.sec3Title', '3. Guaranteed Offline Air-Gapping')}
            </h4>
            <p>
              {t('privacyPage.sec3Desc', 'Once cached via Progressive Web App Service Worker, you can disconnect your Wi-Fi, Ethernet, or mobile data completely. AeroTouch will continue to detect gestures and operate all 6 workspace modes with identical responsiveness.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
