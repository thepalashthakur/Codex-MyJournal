import { notFound } from "next/navigation";
import { EntryEditor } from "@/components/entry-editor";
import { EntrySectionsEditor } from "@/components/entry-sections-editor";
import { EntryTagPicker } from "@/components/entry-tag-picker";
import { EntryContext } from "@/components/entry-context";
import { AttachmentUploader } from "@/components/attachment-uploader";
import { AttachmentList } from "@/components/attachment-list";
import Typography from "@mui/material/Typography";
import { getEntry, listJournals, listTags } from "@/lib/journal-service";
import { emotionSuggestions, listEmotionLibrary, listEntrySections, listImpactLibrary } from "@/lib/context-service";

export default async function EditEntry({ params }: { params: Promise<{ entryId: string }> }) {
  const id = (await params).entryId;
  const entry = await getEntry(id);
  if (!entry || entry.deleted_at) notFound();
  const [journals, tags, sections, emotions, impacts, suggestions] = await Promise.all([
    listJournals(), listTags(), listEntrySections(id), listEmotionLibrary(), listImpactLibrary(), emotionSuggestions(),
  ]);
  return <>
    <EntryEditor entry={entry as unknown as Parameters<typeof EntryEditor>[0]["entry"]} journals={journals} />
    <div className="page editor-page entry-support">
      <EntrySectionsEditor entryId={id} initialSections={sections} initialEmotions={emotions} initialAreas={impacts.areas} initialEntities={impacts.entities} recentIds={suggestions.recentIds} frequentIds={suggestions.frequentIds}/>
      <EntryTagPicker entryId={id} initialTags={(entry.entry_tags || []).map(item => (item.tags as unknown as { name: string } | null)?.name).filter((name): name is string => Boolean(name))} availableTags={tags.map(tag => tag.name)} />
      <section className="entry-context-section" aria-label="Attachments and context">
        <Typography variant="h2">Add context</Typography>
        {entry.attachments.length > 0 && <AttachmentList attachments={entry.attachments} editable />}
        <AttachmentUploader entryId={id} />
        <EntryContext entryId={id} context={entry as unknown as Parameters<typeof EntryContext>[0]["context"]} />
      </section>
    </div>
  </>;
}
