/**
 * Cloud accounts (Supabase Auth + PostgreSQL with Row Level Security).
 * The database schema lives in supabase/schema.sql. The browser only ever receives the public anon key;
 * RLS policies ensure each signed-in user can read and write only their own rows.
 * Account sign-in and sync are not wired into the UI yet: today all data stays in this browser.
 */
export function cloudStatus() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return { configured: Boolean(url && key), url: url ?? null };
}
