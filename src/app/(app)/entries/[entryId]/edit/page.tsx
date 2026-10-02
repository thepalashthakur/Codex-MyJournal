import { EntryEditor } from "@/components/entry-editor";
import { getEntry, listJournals } from "@/lib/journal-service";
import { notFound } from "next/navigation";
export default async function EditEntry({ params }: { params: Promise<{ entryId: string }> }) { const id = (await params).entryId; const [entry, journals] = await Promise.all([getEntry(id), listJournals()]); if (!entry || entry.deleted_at) notFound(); return <EntryEditor entry={entry as unknown as Parameters<typeof EntryEditor>[0]["entry"]} journals={journals} />; }
