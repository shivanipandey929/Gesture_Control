import { getLanguage, type LanguageMeta } from './languages';

const loadedScripts = new Set<string>();

const SCRIPT_FONT_MAP: Record<string, string> = {
  devanagari: "'Noto Sans Devanagari', 'Inter', sans-serif",
  bengali: "'Noto Sans Bengali', 'Inter', sans-serif",
  gujarati: "'Noto Sans Gujarati', 'Inter', sans-serif",
  gurmukhi: "'Noto Sans Gurmukhi', 'Inter', sans-serif",
  tamil: "'Noto Sans Tamil', 'Inter', sans-serif",
  telugu: "'Noto Sans Telugu', 'Inter', sans-serif",
  kannada: "'Noto Sans Kannada', 'Inter', sans-serif",
  malayalam: "'Noto Sans Malayalam', 'Inter', sans-serif",
  oriya: "'Noto Sans Oriya', 'Inter', sans-serif",
  arabic: "'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
  'ol-chiki': "'Noto Sans Ol Chiki', 'Inter', sans-serif",
  'meetei-mayek': "'Noto Sans Meetei Mayek', 'Inter', sans-serif",
  latin: "'Inter', system-ui, -apple-system, sans-serif",
};

/**
 * Dynamically loads the bundled @fontsource font for a given script
 * only when that language is actually chosen.
 */
export async function loadFontForLanguage(code: string): Promise<void> {
  const meta: LanguageMeta = getLanguage(code);
  const script = meta.script;

  // Set html document attributes
  if (typeof document !== 'undefined') {
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;

    // Apply Indic or Arabic generous line-height classes
    if (script === 'arabic') {
      document.documentElement.classList.add('script-arabic');
      document.documentElement.classList.remove('script-indic');
    } else if (script !== 'latin') {
      document.documentElement.classList.add('script-indic');
      document.documentElement.classList.remove('script-arabic');
    } else {
      document.documentElement.classList.remove('script-indic', 'script-arabic');
    }

    // Set CSS variable for dynamic font family
    const fontFamily = SCRIPT_FONT_MAP[script] || SCRIPT_FONT_MAP.latin;
    document.documentElement.style.setProperty('--current-font-family', fontFamily);
  }

  if (loadedScripts.has(script) || script === 'latin') {
    return;
  }

  loadedScripts.add(script);

  try {
    switch (script) {
      case 'devanagari':
        await Promise.all([
          import('@fontsource/noto-sans-devanagari/400.css'),
          import('@fontsource/noto-sans-devanagari/600.css'),
          import('@fontsource/noto-sans-devanagari/700.css'),
        ]);
        break;
      case 'bengali':
        await Promise.all([
          import('@fontsource/noto-sans-bengali/400.css'),
          import('@fontsource/noto-sans-bengali/600.css'),
        ]);
        break;
      case 'gujarati':
        await Promise.all([
          import('@fontsource/noto-sans-gujarati/400.css'),
          import('@fontsource/noto-sans-gujarati/600.css'),
        ]);
        break;
      case 'gurmukhi':
        await Promise.all([
          import('@fontsource/noto-sans-gurmukhi/400.css'),
          import('@fontsource/noto-sans-gurmukhi/600.css'),
        ]);
        break;
      case 'tamil':
        await Promise.all([
          import('@fontsource/noto-sans-tamil/400.css'),
          import('@fontsource/noto-sans-tamil/600.css'),
        ]);
        break;
      case 'telugu':
        await Promise.all([
          import('@fontsource/noto-sans-telugu/400.css'),
          import('@fontsource/noto-sans-telugu/600.css'),
        ]);
        break;
      case 'kannada':
        await Promise.all([
          import('@fontsource/noto-sans-kannada/400.css'),
          import('@fontsource/noto-sans-kannada/600.css'),
        ]);
        break;
      case 'malayalam':
        await Promise.all([
          import('@fontsource/noto-sans-malayalam/400.css'),
          import('@fontsource/noto-sans-malayalam/600.css'),
        ]);
        break;
      case 'oriya':
        await Promise.all([
          import('@fontsource/noto-sans-oriya/400.css'),
          import('@fontsource/noto-sans-oriya/600.css'),
        ]);
        break;
      case 'arabic':
        await Promise.all([
          import('@fontsource/noto-sans-arabic/400.css'),
          import('@fontsource/noto-sans-arabic/600.css'),
        ]);
        break;
      case 'ol-chiki':
        await Promise.all([
          import('@fontsource/noto-sans-ol-chiki/400.css'),
          import('@fontsource/noto-sans-ol-chiki/600.css'),
        ]);
        break;
      case 'meetei-mayek':
        await Promise.all([
          import('@fontsource/noto-sans-meetei-mayek/400.css'),
          import('@fontsource/noto-sans-meetei-mayek/600.css'),
        ]);
        break;
    }
  } catch (err) {
    console.warn(`[fontLoader] Failed to load font for script ${script}:`, err);
  }
}

