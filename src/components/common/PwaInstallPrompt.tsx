import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('aerotouch_pwa_dismissed') === 'true';
  });
  const [hasUsed60s, setHasUsed60s] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // iOS detection
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isSafari = !/crios|fxios|chrome/i.test(window.navigator.userAgent);
    setIsIosSafari(isIos && isSafari && !standalone);

    // 60-second usage timer requirement
    const timer = setTimeout(() => {
      setHasUsed60s(true);
    }, 60000);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Show only on /settings or /help, after 60s, if not standalone and not dismissed
  const isAllowedPage = location.pathname === '/settings' || location.pathname === '/help';
  if (!isAllowedPage || !hasUsed60s || dismissed || isStandalone) {
    return null;
  }

  // If on desktop/android with prompt or iOS hint
  if (!deferredPrompt && !isIosSafari) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('aerotouch_pwa_dismissed', 'true');
  };

  return (
    <section
      aria-label="Install AeroTouch App"
      className="fixed bottom-6 left-6 z-40 max-w-sm p-4 rounded-2xl bg-[#111827]/95 border border-cyan-500/40 text-white shadow-xl backdrop-blur-md flex items-start justify-between gap-3 animate-fade-in"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shrink-0">
          {isIosSafari ? <Share className="w-5 h-5" /> : <Download className="w-5 h-5" />}
        </div>
        <div className="space-y-1 text-xs">
          <div className="font-heading font-bold text-white text-sm">Install AeroTouch App</div>
          <p className="text-slate-300 leading-relaxed">
            {isIosSafari
              ? 'To install on iOS: tap Share, then tap "Add to Home Screen".'
              : 'Add to your home screen or desktop for full offline launch.'}
          </p>
          {!isIosSafari && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-heading font-bold text-xs hover:bg-cyan-300 transition-colors"
            >
              Install App
            </button>
          )}
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="p-1 rounded text-slate-400 hover:text-white"
        aria-label="Dismiss installation prompt"
      >
        <X className="w-4 h-4" />
      </button>
    </section>
  );
};
