"use client";

import { useState } from "react";
import { AttachmentList } from "./attachment-list";
import { AttachmentUploader } from "./attachment-uploader";
import { EntryContext } from "./entry-context";
import { EntryTagPicker } from "./entry-tag-picker";

type Attachment = Parameters<typeof AttachmentList>[0]["attachments"][number];
type Context = Parameters<typeof EntryContext>[0]["context"];

export function EntryDetails({ entryId, initialTags, availableTags, attachments, context }: { entryId: string; initialTags: string[]; availableTags: string[]; attachments: Attachment[]; context: Context }) {
  const [placeName, setPlaceName] = useState(context.locations?.place_name || "");
  const hasDetails = Boolean(initialTags.length || attachments.length || placeName || context.weather_data);
  return <details className="entry-details">
    <summary>{hasDetails ? "Details" : "+ Add details"}<span>{placeName}{attachments.length ? `${placeName ? " · " : ""}${attachments.length} ${attachments.length === 1 ? "file" : "files"}` : ""}</span></summary>
    <div className="entry-details-content">
      <EntryTagPicker entryId={entryId} initialTags={initialTags} availableTags={availableTags} />
      <section className="entry-context-section" aria-label="Attachments and context">
        {attachments.length > 0 && <AttachmentList attachments={attachments} editable />}
        <AttachmentUploader entryId={entryId} />
        <EntryContext entryId={entryId} context={context} onLocationSaved={setPlaceName} />
      </section>
    </div>
  </details>;
}
