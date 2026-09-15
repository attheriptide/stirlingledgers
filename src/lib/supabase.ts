import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Doesn't throw — lets the UI still render with a visible warning instead of a blank screen.
  console.warn(
    'Supabase env vars are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    'to a .env file locally, and to your Netlify site\'s environment variables for production.'
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '');
export const supabaseConfigured = Boolean(url && anonKey);
