import { EntryEditor } from "@/components/entry-editor";
import { getEntry, listJournals } from "@/lib/journal-service";
import { notFound } from "next/navigation";
import { AttachmentUploader } from "@/components/attachment-uploader";
import { AttachmentList } from "@/components/attachment-list";
import { EntryContext } from "@/components/entry-context";
import { EntrySectionsEditor } from "@/components/entry-sections-editor";
import { emotionSuggestions, listEmotionLibrary, listEntrySections, listImpactLibrary } from "@/lib/context-service";
export default async function EditEntry({ params }: { params: Promise<{ entryId: string }> }) { const id = (await params).entryId; const entry = await getEntry(id); if (!entry || entry.deleted_at) notFound(); const [journals, sections, emotions, impacts, suggestions] = await Promise.all([listJournals(), listEntrySections(id), listEmotionLibrary(), listImpactLibrary(), emotionSuggestions()]); return <><EntryEditor entry={entry as unknown as Parameters<typeof EntryEditor>[0]["entry"]} journals={journals} /><div className="page narrow"><EntrySectionsEditor entryId={id} initialSections={sections} initialEmotions={emotions} initialAreas={impacts.areas} initialEntities={impacts.entities} recentIds={suggestions.recentIds} frequentIds={suggestions.frequentIds}/></div><section className="page" style={{ maxWidth: 850, marginTop: 25 }}><h2>Attachments</h2><AttachmentUploader entryId={id} /><AttachmentList attachments={entry.attachments} editable /><EntryContext entryId={id} context={entry as unknown as Parameters<typeof EntryContext>[0]["context"]} /></section></>; }
