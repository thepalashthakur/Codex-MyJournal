import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
export const runtime = "nodejs";
const tables = ["journal_collections", "journals", "locations", "tags", "entry_tags", "entries", "attachments", "entry_templates", "prompts", "journal_reminders"] as const;
export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") === "markdown" ? "markdown" : "json";
  const { db, user } = await userDb();
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (text: string) => controller.enqueue(encoder.encode(text));
      try {
        if (format === "json") {
          write('{"format":"stillroom-v1","exportedAt":' + JSON.stringify(new Date().toISOString()));
          for (const table of tables) {
            write(`,"${table}":[`); let first = true;
            for (let start = 0; ; start += 500) {
              let query = db.from(table).select("*").eq("user_id", user.id).order(table === "entry_tags" ? "entry_id" : "id");
              if (table === "entry_tags") query = query.order("tag_id");
              const { data, error } = await query.range(start, start + 499);
              if (error) throw error;
              for (const row of data || []) { write((first ? "" : ",") + JSON.stringify(row)); first = false; }
              if (!data || data.length < 500) break;
            }
            write("]");
          }
          write("}");
        } else {
          write(`# Stillroom journal export\n\nExported ${new Date().toISOString()}\n\n`);
          for (let start = 0; ; start += 500) {
            const { data, error } = await db.from("entries").select("id,title,content_text,local_date,entry_date,timezone,journal_id,is_favorite,metadata,weather_data").eq("user_id", user.id).is("deleted_at", null).order("entry_date").range(start, start + 499);
            if (error) throw error;
            for (const row of data || []) write(`## ${row.title || "Untitled entry"}\n\n- Date: ${row.local_date}\n- Time: ${row.entry_date}\n- Timezone: ${row.timezone}\n- Journal ID: ${row.journal_id}\n- Favorite: ${row.is_favorite ? "yes" : "no"}\n\n${row.content_text || ""}\n\n---\n\n`);
            if (!data || data.length < 500) break;
          }
        }
        controller.close();
      } catch (error) { controller.error(error); }
    },
  });
  return new Response(stream, { headers: { "Content-Type": format === "json" ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="stillroom-export.${format === "json" ? "json" : "md"}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
