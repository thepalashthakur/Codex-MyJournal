import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "./config";

export type CurrentUser = { id: string; email: string };
const accessName = "stillroom_access";
const refreshName = "stillroom_refresh";

export async function getAccessToken() { return (await cookies()).get(accessName)?.value; }
export async function getRefreshToken() { return (await cookies()).get(refreshName)?.value; }
export async function setSession(session: { access_token: string; refresh_token: string; expires_in: number }) {
  const jar = await cookies();
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  jar.set(accessName, session.access_token, { ...options, maxAge: session.expires_in });
  jar.set(refreshName, session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 30 });
}
export async function clearSession() {
  const jar = await cookies();
  jar.delete(accessName); jar.delete(refreshName);
}
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getAccessToken();
  const settings = config();
  if (!token || !settings) return null;
  try {
    const response = await fetch(`${settings.authUrl}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user?.id ? { id: data.user.id, email: data.user.email || "" } : null;
  } catch { return null; }
}
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    if (await getRefreshToken()) redirect("/api/auth/refresh");
    redirect("/sign-in");
  }
  return user;
}
