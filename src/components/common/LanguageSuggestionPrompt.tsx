import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, X, Check } from 'lucide-react';
import { detectSystemLanguage, changeAppLanguage } from '../../i18n';
import { getLanguage, type LanguageMeta } from '../../i18n/languages';
import { getSetting, setSetting } from '../../db/db';

export const LanguageSuggestionPrompt: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [suggestedLang, setSuggestedLang] = useState<LanguageMeta | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if prompt was previously dismissed
    const dismissed = localStorage.getItem('aerotouch_lang_prompt_dismissed') === 'true';
    if (dismissed) return;

    // Check IndexedDB
    getSetting<boolean>('lang_prompt_dismissed', false).then((dbDismissed) => {
      if (dbDismissed) return;

      const detectedCode = detectSystemLanguage();
      const currentCode = i18n.language.split('-')[0];

      if (detectedCode && detectedCode !== 'en' && detectedCode !== currentCode) {
        const meta = getLanguage(detectedCode);
        setSuggestedLang(meta);
        setVisible(true);
      }
    });
  }, [i18n.language]);

  const handleSwitch = async () => {
    if (!suggestedLang) return;
    await changeAppLanguage(suggestedLang.code);
    dismiss();
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('aerotouch_lang_prompt_dismissed', 'true');
    setSetting('lang_prompt_dismissed', true);
  };

  if (!visible || !suggestedLang) return null;

  return (
    <aside
      aria-label="Language Suggestion Notification"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto px-4 py-2.5 rounded-2xl bg-[#0F172A]/95 border border-cyan-500/40 text-slate-100 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-slide-in"
    >
      <div className="flex items-center gap-2.5 text-xs">
        <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
          <Globe className="w-4 h-4" />
        </div>
        <div>
          <span className="text-slate-300">
            {t('languagePicker.suggestTitle', 'Switch language to')}
          </span>{' '}
          <strong className="text-cyan-300 font-heading">
            {suggestedLang.nativeName} ({suggestedLang.name})
          </strong>
          ?
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleSwitch}
          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-400 text-slate-950 font-heading font-bold text-xs hover:bg-cyan-300 transition-colors shadow-glow-cyan/20"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{t('languagePicker.suggestSwitch', 'Switch')}</span>
        </button>
        <button
          onClick={dismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={t('languagePicker.suggestDismiss', 'Dismiss')}
          aria-label="Dismiss language suggestion"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
