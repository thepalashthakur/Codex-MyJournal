import { NewEntry } from "@/components/new-entry";
import { listJournals } from "@/lib/journal-service";
import { userDb } from "@/lib/db";

export default async function NewEntryPage({ searchParams }: { searchParams: Promise<{ template?: string; prompt?: string }> }) {
  const params = await searchParams;
  const journals = await listJournals();
  let template: { content: Record<string, unknown>; journal_id: string | null } | null = null;
  if (params.template) {
    const { db, user } = await userDb();
    const result = await db.from("entry_templates").select("content,journal_id").eq("id", params.template).eq("user_id", user.id).maybeSingle();
    template = result.data;
  }
  return <NewEntry journals={journals} template={template} prompt={params.prompt?.slice(0, 500)} />;
}
