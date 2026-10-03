import "server-only";
import { config } from "./config";
import { userDb } from "./db";
export async function storageRequest(body: unknown) {
  const { token } = await userDb();
  const settings = config();
  if (!settings?.storageUrl) throw new Error("Media storage is not configured.");
  const response = await fetch(`${settings.storageUrl}/api/s3/sign`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    if ((body as { action?: string }).action === "delete" && response.status === 404) return { deleted: true };
    throw new Error(data.error || "Storage request failed.");
  }
  return data;
}
