import { cookies } from "next/headers";
export async function viewerTimezone() {
  const value = (await cookies()).get("stillroom_timezone")?.value || "UTC";
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }); return value; }
  catch { return "UTC"; }
}
