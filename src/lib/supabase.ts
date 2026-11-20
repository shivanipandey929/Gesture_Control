import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const cleanEnvVar = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

export const supabaseUrl: string = cleanEnvVar(import.meta.env.VITE_SUPABASE_URL);
export const supabaseAnonKey: string = cleanEnvVar(import.meta.env.VITE_SUPABASE_ANON_KEY);

/**
 * Validates whether Supabase configuration is present.
 * Accepts both legacy anon key (JWT starting with eyJ) and new Supabase keys (e.g. sb_publishable_...).
 * Only treated as unconfigured if a value is empty or still contains placeholder text
 * such as "your-project" or "your-anon".
 */
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon')
);

// Dev-only helper logging safe variable diagnostic (never the secret/key, only defined & length)
if (import.meta.env.DEV) {
  console.log('[Supabase Config Status]', {
    urlConfigured: Boolean(supabaseUrl),
    urlLength: supabaseUrl.length,
    keyConfigured: Boolean(supabaseAnonKey),
    keyLength: supabaseAnonKey.length,
    keyFormat: supabaseAnonKey.startsWith('sb_publishable_')
      ? 'new_publishable_key'
      : supabaseAnonKey.startsWith('eyJ')
        ? 'legacy_jwt_anon_key'
        : 'standard_key',
    isSupabaseConfigured,
  });
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })
  : null;

