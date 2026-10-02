import { NextRequest } from "next/server";
import { clearSession, getAccessToken, getRefreshToken, setSession } from "@/lib/auth";
import { config } from "@/lib/config";
import { privateJson, sameOrigin } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";
const credentials = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) }).strict();
const sessionSchema = z.object({ access_token: z.string(), refresh_token: z.string(), expires_in: z.number() });

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  const settings = config();
  if (!settings) return privateJson({ error: "Authentication is not configured." }, 503);
  const { action } = await context.params;
  if (!["sign-in", "sign-up", "sign-out"].includes(action)) return privateJson({ error: "Not found." }, 404);
  let body: unknown;
  try { body = await request.json(); } catch { return privateJson({ error: "Invalid request." }, 400); }
  if (action === "sign-out") {
    const access = await getAccessToken(); const refresh = await getRefreshToken();
    if (access && refresh) {
      await fetch(`${settings.authUrl}/api/v1/auth/sign-out`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_token: access, refresh_token: refresh }), cache: "no-store" }).catch(() => null);
    }
    await clearSession(); return privateJson({ ok: true });
  }
  const parsed = credentials.safeParse(body);
  if (!parsed.success) return privateJson({ error: "Enter a valid email and password." }, 400);
  const upstream = await fetch(`${settings.authUrl}/api/v1/auth/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), cache: "no-store" }).catch(() => null);
  if (!upstream) return privateJson({ error: "Authentication service is unavailable." }, 503);
  const result = await upstream.json();
  if (!upstream.ok) return privateJson({ error: result.error?.message || "Authentication failed." }, upstream.status);
  if (result.session) {
    const session = sessionSchema.safeParse(result.session);
    if (!session.success) return privateJson({ error: "Invalid authentication response." }, 502);
    await setSession(session.data);
  }
  return privateJson({ user: result.user, confirmation_required: result.confirmation_required, message: result.message });
}
