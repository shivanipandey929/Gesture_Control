import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en.json';
import { getLanguage, LANGUAGES } from './languages';
import { loadFontForLanguage } from './fontLoader';
import { getSetting, setSetting } from '../db/db';

// Explicit dynamic import map for Vite chunk code-splitting
const localeLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import('../locales/en.json'),
  hi: () => import('../locales/hi.json'),
  mr: () => import('../locales/mr.json'),
  as: () => import('../locales/as.json'),
  bn: () => import('../locales/bn.json'),
  brx: () => import('../locales/brx.json'),
  doi: () => import('../locales/doi.json'),
  gu: () => import('../locales/gu.json'),
  kn: () => import('../locales/kn.json'),
  ks: () => import('../locales/ks.json'),
  kok: () => import('../locales/kok.json'),
  mai: () => import('../locales/mai.json'),
  ml: () => import('../locales/ml.json'),
  mni: () => import('../locales/mni.json'),
  ne: () => import('../locales/ne.json'),
  or: () => import('../locales/or.json'),
  pa: () => import('../locales/pa.json'),
  sa: () => import('../locales/sa.json'),
  sat: () => import('../locales/sat.json'),
  sd: () => import('../locales/sd.json'),
  ta: () => import('../locales/ta.json'),
  te: () => import('../locales/te.json'),
  ur: () => import('../locales/ur.json'),
};

/**
 * Detect user's system language from navigator
 */
export function detectSystemLanguage(): string {
  if (typeof navigator === 'undefined' || !navigator.language) return 'en';
  const navCode = navigator.language.toLowerCase();
  const primaryCode = navCode.split('-')[0];

  const exact = LANGUAGES.find((l) => l.code.toLowerCase() === navCode);
  if (exact) return exact.code;

  const prefix = LANGUAGES.find((l) => l.code.toLowerCase() === primaryCode);
  if (prefix) return prefix.code;

  return 'en';
}

// Get initial synchronous language from localStorage or default to en
const initialLang: string =
  typeof localStorage !== 'undefined'
    ? localStorage.getItem('aerotouch_lang') || 'en'
    : 'en';

// Initialize i18next with English preloaded as guaranteed fallback
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

/**
 * Lazy loads a translation bundle and switches the active application language
 */
export async function changeAppLanguage(code: string): Promise<boolean> {
  const meta = getLanguage(code);
  const targetCode = meta.code;

  // 1. Load corresponding script font
  await loadFontForLanguage(targetCode);

  // 2. Load translation JSON if not yet registered in i18n
  if (!i18n.hasResourceBundle(targetCode, 'translation') && localeLoaders[targetCode]) {
    try {
      const module = await localeLoaders[targetCode]();
      i18n.addResourceBundle(targetCode, 'translation', module.default, true, true);
    } catch (err) {
      console.warn(`[i18n] Failed to load translations for ${targetCode}:`, err);
    }
  }

  // 3. Switch i18n language
  await i18n.changeLanguage(targetCode);

  // 4. Save to localStorage and IndexedDB
  try {
    localStorage.setItem('aerotouch_lang', targetCode);
    setSetting('app_language', targetCode);
  } catch {
    // Local persistence fallback
  }

  return true;
}

// Apply initial font & dir on application boot
if (typeof document !== 'undefined') {
  loadFontForLanguage(initialLang);

  // Restore from IndexedDB asynchronously if localStorage was empty
  if (typeof localStorage !== 'undefined' && !localStorage.getItem('aerotouch_lang')) {
    getSetting<string>('app_language', '').then((saved) => {
      if (saved && saved !== initialLang && localeLoaders[saved]) {
        changeAppLanguage(saved);
      }
    });
  }
}

export default i18n;
