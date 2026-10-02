export function config() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, USEAUTH_URL, S3SYNC_URL } = process.env;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !USEAUTH_URL) return null;
  return { supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_PUBLISHABLE_KEY, authUrl: USEAUTH_URL.replace(/\/$/, ""), storageUrl: S3SYNC_URL?.replace(/\/$/, "") };
}
