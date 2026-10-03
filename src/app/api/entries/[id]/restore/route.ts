import { NextRequest } from "next/server";
import { setEntryDeleted } from "@/lib/journal-service";
import { privateJson, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { if (!sameOrigin(request)) return privateJson({ error: "Invalid origin." }, 403); try { await setEntryDeleted((await params).id, false); return privateJson({ ok: true }); } catch { return privateJson({ error: "Could not restore entry." }, 400); } }
