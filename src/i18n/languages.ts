export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  script:
  | 'latin'
  | 'devanagari'
  | 'bengali'
  | 'gujarati'
  | 'gurmukhi'
  | 'tamil'
  | 'telugu'
  | 'kannada'
  | 'malayalam'
  | 'oriya'
  | 'arabic'
  | 'ol-chiki'
  | 'meetei-mayek';
  isPopular?: boolean;
  status: 'full' | 'beta';
}

export const LANGUAGES: LanguageMeta[] = [
  // Popular Group with Full human-verified coverage
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', script: 'latin', isPopular: true, status: 'full' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', script: 'devanagari', isPopular: true, status: 'full' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', dir: 'ltr', script: 'devanagari', isPopular: true, status: 'full' },

  // Rest alphabetical by English name (Beta / Machine-translated coverage)
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', dir: 'ltr', script: 'bengali', status: 'beta' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr', script: 'bengali', status: 'beta' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', dir: 'ltr', script: 'devanagari', status: 'beta' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', dir: 'ltr', script: 'devanagari', status: 'beta' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', dir: 'ltr', script: 'gujarati', status: 'beta' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr', script: 'kannada', status: 'beta' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', dir: 'rtl', script: 'arabic', status: 'beta' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', dir: 'ltr', script: 'devanagari', status: 'beta' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', dir: 'ltr', script: 'devanagari', status: 'beta' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr', script: 'malayalam', status: 'beta' },
  { code: 'mni', name: 'Manipuri (Meitei)', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ', dir: 'ltr', script: 'meetei-mayek', status: 'beta' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', dir: 'ltr', script: 'devanagari', status: 'beta' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', dir: 'ltr', script: 'oriya', status: 'beta' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', dir: 'ltr', script: 'gurmukhi', status: 'beta' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', dir: 'ltr', script: 'devanagari', status: 'beta' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', dir: 'ltr', script: 'ol-chiki', status: 'beta' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', dir: 'rtl', script: 'arabic', status: 'beta' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr', script: 'tamil', status: 'beta' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr', script: 'telugu', status: 'beta' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', script: 'arabic', status: 'beta' },
];

export const POPULAR_LANGUAGES = LANGUAGES.filter((l) => l.isPopular);
export const OTHER_LANGUAGES = LANGUAGES.filter((l) => !l.isPopular);

export function getLanguage(code: string): LanguageMeta {
  const normalized = code.toLowerCase().split('-')[0];
  return (
    LANGUAGES.find((l) => l.code === code) ||
    LANGUAGES.find((l) => l.code === normalized) ||
    LANGUAGES[0]
  );
}

export function isRtl(code: string): boolean {
  return getLanguage(code).dir === 'rtl';
}

export function getScript(code: string): string {
  return getLanguage(code).script;
}

