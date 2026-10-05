import { notFound } from "next/navigation";
import Link from "next/link";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { AttachmentList } from "@/components/attachment-list";
import { EntryContextSummary } from "@/components/entry-context-summary";
import { RichContent } from "@/components/rich-content";
import { listEntrySections } from "@/lib/context-service";
import { getEntry } from "@/lib/journal-service";

export default async function EntryPage({ params }: { params: Promise<{ entryId: string }> }) {
  const id = (await params).entryId;
  const entry = await getEntry(id);
  if (!entry || entry.deleted_at) notFound();
  const sections = await listEntrySections(id);
  const journal = entry.journals as unknown as { name: string } | null;
  const weather = entry.weather_data as { temperatureC?: number; condition?: string } | null;
  const location = entry.locations;

  return <main className="page narrow reader">
    <div className="between">
      <Link href="/timeline" className="muted">← Timeline</Link>
      <Link className="button" href={`/entries/${entry.id}/edit`}>Edit entry</Link>
    </div>
    <header className="reader-head">
      <p className="eyebrow">{journal?.name || "Journal"} · {entry.local_date}</p>
      <h1>{entry.title || "Untitled entry"}</h1>
      <EntryContextSummary
        placeName={location?.place_name}
        latitude={location?.latitude}
        longitude={location?.longitude}
        temperatureC={weather?.temperatureC}
        condition={weather?.condition}
      />
    </header>
    {entry.content_text?.trim() && <div className="reader-body"><RichContent content={entry.content}/></div>}
    {sections.map((section, index) => <section className="reader-body reader-section" key={section.id} aria-label={section.title || `Writing section ${index + 1}`}>
      {section.title && <h2>{section.title}</h2>}
      <RichContent content={section.content}/>
      {(section.emotion || section.impacts.length > 0) && <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 2 }}>
        {section.emotion && <Chip label={`${section.emotion.emotion_name}${section.emotion.intensity ? ` · ${section.emotion.intensity}/10` : ""}`}/>}
        {section.impacts.map(area => <Chip key={area.id} label={`${area.area_name}${area.entities.length ? `: ${area.entities.map(entity => entity.entity_name).join(", ")}` : ""}`}/>)}
      </Stack>}
    </section>)}
    <AttachmentList attachments={entry.attachments} />
  </main>;
}
