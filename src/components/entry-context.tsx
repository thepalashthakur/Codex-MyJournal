"use client";

import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Cloud, MapPin } from "lucide-react";
import { lookupCurrentPlace } from "@/lib/reverse-geocode-client";
import { EntryContextSummary } from "./entry-context-summary";

type Location = { place_name: string | null; latitude: number | null; longitude: number | null; source: string };
type Context = { locations?: Location | null; weather_data?: { temperatureC?: number; condition?: string } | null };
type Values = { placeName: string; latitude: string; longitude: string; locationSource: "manual" | "browser"; temperature: string; condition: string };

export function EntryContext({ entryId, context, onLocationSaved }: { entryId: string; context: Context; onLocationSaved?: (placeName: string) => void }) {
  const initial: Values = {
    placeName: context.locations?.place_name || "",
    latitude: context.locations?.latitude?.toString() || "",
    longitude: context.locations?.longitude?.toString() || "",
    locationSource: context.locations?.source === "browser" ? "browser" : "manual",
    temperature: context.weather_data?.temperatureC?.toString() || "",
    condition: context.weather_data?.condition || "",
  };
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState<"location" | "weather" | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const hasLocation = Boolean(saved.placeName || saved.latitude || saved.longitude);
  const hasWeather = Boolean(saved.temperature || saved.condition);

  function open(kind: "location" | "weather") {
    if (editing === kind) { cancel(); return; }
    setDraft(saved); setStatus(""); setEditing(kind);
  }

  function cancel() { setDraft(saved); setEditing(null); setStatus(""); }

  function currentLocation() {
    if (!window.isSecureContext || !navigator.geolocation) { setStatus("Current location is unavailable. Enter it manually."); return; }
    setLocating(true); setStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(async position => {
      const { latitude, longitude } = position.coords;
      setDraft(current => ({ ...current, placeName: "", latitude: String(latitude), longitude: String(longitude), locationSource: "browser" }));
      setStatus("Finding the city…");
      try {
        const placeName = await lookupCurrentPlace(latitude, longitude, navigator.language.split("-")[0]);
        if (placeName) {
          setDraft(current => ({ ...current, placeName }));
          setStatus("City found. Review the name, then save the location.");
        } else {
          setStatus("We couldn't find a city for these coordinates. Enter a place name.");
        }
      } catch {
        setStatus("Couldn't find the city. Enter a place name to save this location.");
      } finally {
        setLocating(false);
      }
    }, () => { setLocating(false); setStatus("Couldn't get your location. Enter it manually."); }, { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 });
  }

  async function save(kind: "location" | "weather", values: Values = draft) {
    if (kind === "location" && !values.placeName.trim() && (values.latitude || values.longitude)) {
      setStatus("Add a place name before saving this location.");
      return;
    }
    setSaving(true); setStatus("Saving…");
    try {
      const response = await fetch(`/api/entries/${entryId}/context`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeName: values.placeName.trim(), latitude: values.latitude ? Number(values.latitude) : null, longitude: values.longitude ? Number(values.longitude) : null, locationSource: values.locationSource, temperatureC: values.temperature ? Number(values.temperature) : null, condition: values.condition.trim() }),
      });
      if (!response.ok) throw new Error();
      const next = { ...values, placeName: values.placeName.trim(), condition: values.condition.trim() };
      setSaved(next); setDraft(next); setEditing(null);
      if (kind === "location") onLocationSaved?.(next.placeName);
      setStatus(`${kind === "location" ? "Location" : "Weather"} saved`);
    } catch { setStatus("Couldn't save this change. Retry."); }
    finally { setSaving(false); }
  }

  return <section className="entry-context-controls" aria-label="Location and weather">
    <EntryContextSummary placeName={saved.placeName} latitude={saved.latitude} longitude={saved.longitude} temperatureC={saved.temperature} condition={saved.condition}/>
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
      <Button startIcon={<MapPin size={17}/>} aria-expanded={editing === "location"} aria-controls={editing === "location" ? "entry-location-fields" : undefined} disabled={saving || locating} onClick={() => open("location")}>{hasLocation ? "Edit location" : "Add location"}</Button>
      <Button startIcon={<Cloud size={17}/>} aria-expanded={editing === "weather"} aria-controls={editing === "weather" ? "entry-weather-fields" : undefined} disabled={saving || locating} onClick={() => open("weather")}>{hasWeather ? "Edit weather" : "Add weather"}</Button>
    </Stack>
    {editing === "location" && <Box id="entry-location-fields" className="entry-context-fields" aria-label="Location details">
      <Stack spacing={2}>
        <Typography variant="subtitle2">Location</Typography>
        <TextField label="Place name" value={draft.placeName} onChange={event => setDraft(current => ({ ...current, placeName: event.target.value }))} placeholder="A place to remember" helperText="Use current location finds a city name. You can edit it before saving." disabled={locating} fullWidth autoFocus />
        <Button variant="outlined" disabled={locating || saving} onClick={currentLocation} sx={{ alignSelf: "flex-start" }}>{locating ? "Finding location…" : "Use current location"}</Button>
        <Typography variant="caption" color="text.secondary">Using current location sends your coordinates to BigDataCloud to find the city.</Typography>
        <Accordion elevation={0}><AccordionSummary aria-controls="location-advanced" id="location-advanced-title">Advanced coordinates</AccordionSummary><AccordionDetails id="location-advanced"><Stack spacing={2}>
          <TextField label="Latitude" type="number" value={draft.latitude} onChange={event => setDraft(current => ({ ...current, latitude: event.target.value, locationSource: "manual" }))} slotProps={{ htmlInput: { min: -90, max: 90, step: "any" } }}/>
          <TextField label="Longitude" type="number" value={draft.longitude} onChange={event => setDraft(current => ({ ...current, longitude: event.target.value, locationSource: "manual" }))} slotProps={{ htmlInput: { min: -180, max: 180, step: "any" } }}/>
        </Stack></AccordionDetails></Accordion>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
          {hasLocation && <Button color="error" disabled={saving} onClick={() => void save("location", { ...draft, placeName: "", latitude: "", longitude: "", locationSource: "manual" })}>Remove location</Button>}
          <Button onClick={cancel} disabled={saving || locating}>Cancel</Button>
          <Button variant="contained" disabled={saving || locating || (!hasLocation && !draft.placeName.trim() && !draft.latitude && !draft.longitude)} onClick={() => void save("location")}>{saving ? "Saving…" : "Save location"}</Button>
        </Stack>
      </Stack>
    </Box>}
    {editing === "weather" && <Box id="entry-weather-fields" className="entry-context-fields" aria-label="Weather details">
      <Stack spacing={2}>
        <Typography variant="subtitle2">Weather</Typography>
        <TextField label="Temperature °C" type="number" value={draft.temperature} onChange={event => setDraft(current => ({ ...current, temperature: event.target.value }))} slotProps={{ htmlInput: { step: "any", min: -100, max: 70 } }}/>
        <TextField label="Condition" value={draft.condition} onChange={event => setDraft(current => ({ ...current, condition: event.target.value }))} placeholder="Clear" />
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
          {hasWeather && <Button color="error" disabled={saving} onClick={() => void save("weather", { ...draft, temperature: "", condition: "" })}>Remove weather</Button>}
          <Button onClick={cancel} disabled={saving}>Cancel</Button>
          <Button variant="contained" disabled={saving || (!hasWeather && !draft.temperature && !draft.condition.trim())} onClick={() => void save("weather")}>{saving ? "Saving…" : "Save weather"}</Button>
        </Stack>
      </Stack>
    </Box>}
    {status && <Typography role="status" variant="body2" color={status.startsWith("Couldn't") || status.startsWith("Add a") ? "error" : "text.secondary"}>{status}</Typography>}
  </section>;
}
