import { NextRequest } from "next/server";
import { z } from "zod";
import { userDb } from "@/lib/db";
import { privateJson, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
const schema = z.object({ placeName: z.string().trim().max(200).optional(), latitude: z.number().min(-90).max(90).nullable().optional(), longitude: z.number().min(-180).max(180).nullable().optional(), locationSource: z.enum(["manual", "browser"]).default("manual"), temperatureC: z.number().min(-100).max(70).nullable().optional(), condition: z.string().max(100).optional() }).strict();
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403);
  try { const id = z.uuid().parse((await params).id); const value = schema.parse(await request.json()); const { db, user } = await userDb();
    const { data: entry } = await db.from("entries").select("id,location_id").eq("id", id).eq("user_id", user.id).is("deleted_at", null).maybeSingle(); if (!entry) return privateJson({ error: "Entry not found." }, 404);
    const previousLocationId: string | null = entry.location_id;
    let locationId: string | null = previousLocationId;
    if (value.placeName || value.latitude != null || value.longitude != null) {
      if (locationId) { const { error } = await db.from("locations").update({ place_name: value.placeName || null, latitude: value.latitude ?? null, longitude: value.longitude ?? null, source: value.locationSource }).eq("id", locationId).eq("user_id", user.id); if (error) throw error; }
      else { const { data, error } = await db.from("locations").insert({ user_id: user.id, place_name: value.placeName || null, latitude: value.latitude ?? null, longitude: value.longitude ?? null, source: value.locationSource }).select("id").single(); if (error) throw error; locationId = data.id; }
    } else locationId = null;
    const weather = value.temperatureC != null || value.condition ? { temperatureC: value.temperatureC, condition: value.condition, provider: "manual", observedAt: new Date().toISOString() } : null;
    const { error } = await db.from("entries").update({ location_id: locationId, weather_data: weather }).eq("id", id).eq("user_id", user.id); if (error) throw error;
    if (previousLocationId && !locationId) {
      const { count, error: countError } = await db.from("entries").select("id", { count: "exact", head: true }).eq("location_id", previousLocationId);
      if (!countError && count === 0) await db.from("locations").delete().eq("id", previousLocationId).eq("user_id", user.id);
    }
    return privateJson({ ok: true });
  } catch { return privateJson({ error: "Could not save context." }, 400); }
}
