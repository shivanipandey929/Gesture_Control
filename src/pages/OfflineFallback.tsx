import React from 'react';
import { Link } from 'react-router-dom';
import { WifiOff, Video, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const OfflineFallback: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
      <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-warning mb-6 shadow-soft animate-pulse">
        <WifiOff className="w-10 h-10" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary font-medium mb-4">
        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        <span>{t('offlineFallback.badge', 'Offline Mode Active')}</span>
      </div>

      <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-foreground mb-3">
        {t('offlineFallback.title', "You're Currently Offline")}
      </h1>
      <p className="text-muted text-sm leading-relaxed mb-8">
        {t(
          'offlineFallback.desc',
          "No internet connection detected, but AeroTouch's MediaPipe AI vision models, WebAssembly runtimes, and local gesture workspaces are cached and run entirely on your device after the first load."
        )}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Link
          to="/studio"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-semibold text-sm shadow-card transition-colors"
        >
          <Video className="w-4 h-4 text-white" />
          <span>{t('offlineFallback.openStudio', 'Open Live Studio')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/modes"
          className="w-full sm:w-auto px-6 py-3 rounded-xl panel-card border border-border text-foreground text-sm font-semibold hover:bg-surface-secondary shadow-soft transition-colors"
        >
          {t('offlineFallback.exploreWorkspaces', 'Explore Workspaces')}
        </Link>
      </div>
    </div>
  );
};

export default OfflineFallback;
