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
  const [tags, setTags] = useState(initialTags);
  const [weather, setWeather] = useState({ temperature: context.weather_data?.temperatureC?.toString() || "", condition: context.weather_data?.condition || "" });
  const weatherLabel = [weather.temperature ? `${weather.temperature}°C` : "", weather.condition].filter(Boolean).join(" · ");
  const hasDetails = Boolean(tags.length || attachments.length || placeName || weatherLabel);
  const summary = [placeName, weatherLabel, tags.length ? `${tags.length} ${tags.length === 1 ? "tag" : "tags"}` : "", attachments.length ? `${attachments.length} ${attachments.length === 1 ? "file" : "files"}` : ""].filter(Boolean).join(" · ");
  return <details className="entry-details">
    <summary>{hasDetails ? "Details" : "+ Add details"}<span>{summary}</span></summary>
    <div className="entry-details-content">
      <EntryTagPicker entryId={entryId} initialTags={initialTags} availableTags={availableTags} onTagsChanged={setTags} />
      <section className="entry-context-section" aria-label="Attachments and context">
        {attachments.length > 0 && <AttachmentList attachments={attachments} editable />}
        <AttachmentUploader entryId={entryId} />
        <EntryContext entryId={entryId} context={context} onLocationSaved={setPlaceName} onWeatherSaved={(temperature, condition) => setWeather({ temperature, condition })} />
      </section>
    </div>
  </details>;
}
