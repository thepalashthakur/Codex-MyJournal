import "server-only";
import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
import { getAccessToken, requireUser } from "./auth";

export async function userDb() {
  const user = await requireUser();
  const token = await getAccessToken();
  const settings = config();
  if (!settings || !token) throw new Error("Journal service is not configured.");
  const db = createClient(settings.supabaseUrl, settings.supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { db, user, token };
}
