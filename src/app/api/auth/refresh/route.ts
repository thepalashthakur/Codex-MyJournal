import { NextResponse } from "next/server";
import { getRefreshToken, setSession, clearSession } from "@/lib/auth";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const settings = config(); const token = await getRefreshToken();
  if (settings && token) {
    try {
      const response = await fetch(`${settings.authUrl}/api/v1/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: token }), cache: "no-store" });
      if (response.ok) {
        const result = await response.json();
        if (result.session?.access_token && result.session?.refresh_token) {
          await setSession(result.session);
          return NextResponse.redirect(new URL("/today", request.url));
        }
      }
    } catch { /* Sign-in is the recovery path. */ }
  }
  await clearSession();
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
