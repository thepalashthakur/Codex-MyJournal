import { NewEntry } from "@/components/new-entry";
import { listJournals } from "@/lib/journal-service";
import { userDb } from "@/lib/db";
export default async function NewEntryPage({ searchParams }: { searchParams: Promise<{ template?: string; prompt?: string }> }) {
  const params = await searchParams;
  const journals = await listJournals();
  const { db, user } = await userDb();
  const { data: template } = params.template ? await db.from("entry_templates").select("id,content,journal_id").eq("id", params.template).eq("user_id", user.id).maybeSingle() : { data: null };
  return <main className="page narrow"><header className="page-header"><div><p className="eyebrow">CAPTURE A MOMENT</p><h1>New entry</h1><p>{journals.length > 1 ? `Write in ${journals[0].name} or choose another journal.` : `Your entry will be saved in ${journals[0].name}.`}</p></div></header><NewEntry journals={journals} template={template} prompt={params.prompt?.slice(0, 500)} /></main>;
}
