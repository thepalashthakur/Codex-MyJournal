"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { Cloud, MapPin } from "lucide-react";
import { EntryContextSummary } from "./entry-context-summary";

type Context = {
  locations?: { place_name: string | null; latitude: number | null; longitude: number | null; source: string } | null;
  weather_data?: { temperatureC?: number; condition?: string } | null;
};

export function EntryContext({ entryId, context }: { entryId: string; context: Context }) {
  const router = useRouter();
  const compact = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [placeName, setPlaceName] = useState(context.locations?.place_name || "");
  const [latitude, setLatitude] = useState(context.locations?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(context.locations?.longitude?.toString() || "");
  const [locationSource, setLocationSource] = useState<"manual" | "browser">(context.locations?.source === "browser" ? "browser" : "manual");
  const [temperature, setTemperature] = useState(context.weather_data?.temperatureC?.toString() || "");
  const [condition, setCondition] = useState(context.weather_data?.condition || "");
  const [saved, setSaved] = useState({ placeName: context.locations?.place_name || "", latitude: context.locations?.latitude?.toString() || "", longitude: context.locations?.longitude?.toString() || "", locationSource: context.locations?.source === "browser" ? "browser" as const : "manual" as const, temperature: context.weather_data?.temperatureC?.toString() || "", condition: context.weather_data?.condition || "" });
  const [dialog, setDialog] = useState<"location" | "weather" | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  function currentLocation() {
    if (!window.isSecureContext || !navigator.geolocation) { setStatus("Current location is unavailable. Enter it manually."); return; }
    setLocating(true); setStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(position => {
      setLatitude(String(position.coords.latitude)); setLongitude(String(position.coords.longitude)); setLocationSource("browser"); setLocating(false);
      setStatus("Coordinates found. Save location to keep them.");
    }, () => { setLocating(false); setStatus("Couldn't get your location. Enter it manually."); }, { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 });
  }

  async function save() {
    setSaving(true); setStatus("Saving…");
    try {
      const response = await fetch(`/api/entries/${entryId}/context`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeName, latitude: latitude ? Number(latitude) : null, longitude: longitude ? Number(longitude) : null, locationSource, temperatureC: temperature ? Number(temperature) : null, condition }),
      });
      if (!response.ok) throw new Error();
      setSaved({ placeName, latitude, longitude, locationSource, temperature, condition });
      setDialog(null); setStatus("Context saved"); router.refresh();
    } catch { setStatus("Couldn't save this change. Retry."); }
    finally { setSaving(false); }
  }

  function close() {
    setPlaceName(saved.placeName); setLatitude(saved.latitude); setLongitude(saved.longitude); setLocationSource(saved.locationSource);
    setTemperature(saved.temperature); setCondition(saved.condition);
    setDialog(null); setStatus("");
  }

  const hasLocation = Boolean(saved.placeName || saved.latitude || saved.longitude);
  const hasWeather = Boolean(saved.temperature || saved.condition);
  return <section className="entry-context-controls" aria-label="Location and weather">
    <EntryContextSummary placeName={saved.placeName} hasLocation={hasLocation} temperatureC={saved.temperature} condition={saved.condition}/>
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
      <Button startIcon={<MapPin size={17}/>} onClick={() => { setStatus(""); setDialog("location"); }}>{hasLocation ? "Edit location" : "Add location"}</Button>
      <Button startIcon={<Cloud size={17}/>} onClick={() => { setStatus(""); setDialog("weather"); }}>{hasWeather ? "Edit weather" : "Add weather"}</Button>
    </Stack>
    {status && !dialog && <Typography role="status" variant="body2" color="text.secondary">{status}</Typography>}
    <Dialog open={dialog === "location"} onClose={close} fullWidth maxWidth="sm" fullScreen={compact} aria-labelledby="location-dialog-title">
      <DialogTitle id="location-dialog-title">Location</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">Location is saved only when you choose Save location.</Typography>
        <TextField label="Place" value={placeName} onChange={event => setPlaceName(event.target.value)} placeholder="A place to remember" fullWidth />
        <Button variant="outlined" disabled={locating} onClick={currentLocation} sx={{ alignSelf: "flex-start" }}>{locating ? "Finding location…" : "Use current location"}</Button>
        <Accordion elevation={0}><AccordionSummary aria-controls="location-advanced" id="location-advanced-title">Advanced coordinates</AccordionSummary><AccordionDetails id="location-advanced"><Stack spacing={2}><TextField label="Latitude" type="number" value={latitude} onChange={event => { setLatitude(event.target.value); setLocationSource("manual"); }} slotProps={{ htmlInput: { min: -90, max: 90, step: "any" } }}/><TextField label="Longitude" type="number" value={longitude} onChange={event => { setLongitude(event.target.value); setLocationSource("manual"); }} slotProps={{ htmlInput: { min: -180, max: 180, step: "any" } }}/></Stack></AccordionDetails></Accordion>
        {status && <Typography role="status" variant="body2" color={status.startsWith("Couldn't") ? "error" : "text.secondary"}>{status}</Typography>}
      </Stack></DialogContent><DialogActions><Button onClick={close}>Cancel</Button>{hasLocation && <Button color="error" disabled={saving} onClick={() => { setPlaceName(""); setLatitude(""); setLongitude(""); setLocationSource("manual"); setStatus("Location cleared. Save location to apply."); }}>Clear location</Button>}<Button variant="contained" disabled={saving || locating} onClick={() => void save()}>{saving ? "Saving…" : "Save location"}</Button></DialogActions>
    </Dialog>
    <Dialog open={dialog === "weather"} onClose={close} fullWidth maxWidth="sm" fullScreen={compact} aria-labelledby="weather-dialog-title">
      <DialogTitle id="weather-dialog-title">Weather</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">Add weather manually for this moment.</Typography>
        <TextField label="Temperature °C" type="number" value={temperature} onChange={event => setTemperature(event.target.value)} slotProps={{ htmlInput: { step: "any", min: -100, max: 70 } }}/>
        <TextField label="Condition" value={condition} onChange={event => setCondition(event.target.value)} placeholder="Clear" />
        {status && <Typography role="status" variant="body2" color={status.startsWith("Couldn't") ? "error" : "text.secondary"}>{status}</Typography>}
      </Stack></DialogContent><DialogActions><Button onClick={close}>Cancel</Button>{hasWeather && <Button color="error" disabled={saving} onClick={() => { setTemperature(""); setCondition(""); setStatus("Weather cleared. Save weather to apply."); }}>Clear weather</Button>}<Button variant="contained" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save weather"}</Button></DialogActions>
    </Dialog>
  </section>;
}
