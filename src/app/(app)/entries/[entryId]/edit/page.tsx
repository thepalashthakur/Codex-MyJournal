import { notFound } from "next/navigation";
import { EntryEditor } from "@/components/entry-editor";
import { EntrySectionsEditor } from "@/components/entry-sections-editor";
import { EntryDetails } from "@/components/entry-details";
import { getEntry, listJournals, listTags } from "@/lib/journal-service";
import { emotionSuggestions, listEmotionLibrary, listEntrySections, listImpactLibrary } from "@/lib/context-service";

export default async function EditEntry({ params }: { params: Promise<{ entryId: string }> }) {
  const id = (await params).entryId;
  const entry = await getEntry(id);
  if (!entry || entry.deleted_at) notFound();
  const [journals, tags, sections, emotions, impacts, suggestions] = await Promise.all([
    listJournals(), listTags(), listEntrySections(id), listEmotionLibrary(), listImpactLibrary(), emotionSuggestions(),
  ]);
  return <main className="page editor-page">
    <EntryEditor entry={entry as unknown as Parameters<typeof EntryEditor>[0]["entry"]} journals={journals} />
    <div className="entry-support">
      <EntrySectionsEditor entryId={id} initialSections={sections} initialEmotions={emotions} initialAreas={impacts.areas} initialEntities={impacts.entities} recentIds={suggestions.recentIds} frequentIds={suggestions.frequentIds}/>
      <EntryDetails entryId={id} initialTags={(entry.entry_tags || []).map(item => (item.tags as unknown as { name: string } | null)?.name).filter((name): name is string => Boolean(name))} availableTags={tags.map(tag => tag.name)} attachments={entry.attachments} context={entry as unknown as Parameters<typeof EntryDetails>[0]["context"]} />
    </div>
  </main>;
}
