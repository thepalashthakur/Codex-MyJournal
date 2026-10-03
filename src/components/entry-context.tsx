"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";

type Context = {
  locations?: { place_name: string | null; latitude: number | null; longitude: number | null; source: string } | null;
  weather_data?: { temperatureC?: number; condition?: string } | null;
};

export function EntryContext({ entryId, context }: { entryId: string; context: Context }) {
  const location = context.locations;
  const [placeName, setPlaceName] = useState(location?.place_name || "");
  const [latitude, setLatitude] = useState(location?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(location?.longitude?.toString() || "");
  const [locationSource, setLocationSource] = useState<"manual" | "browser">(location?.source === "browser" ? "browser" : "manual");
  const [temperature, setTemperature] = useState(context.weather_data?.temperatureC?.toString() || "");
  const [condition, setCondition] = useState(context.weather_data?.condition || "");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const locatingRef = useRef(false);

  const fetchCurrentLocation = useCallback((automatic = false) => {
    if (!window.isSecureContext || !navigator.geolocation) {
      if (!automatic) setStatus("Current location is unavailable here. Enter a place or coordinates manually.");
      return;
    }
    if (locatingRef.current) return;
    locatingRef.current = true;
    setLocating(true);
    setStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      position => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setLocationSource("browser");
        locatingRef.current = false;
        setLocating(false);
        setStatus("Current coordinates filled. Save context to keep them.");
      },
      error => {
        locatingRef.current = false;
        setLocating(false);
        setStatus(error.code === 1
          ? "Location permission was denied. Enter a place or coordinates manually."
          : error.code === 3
            ? "Location lookup timed out. Enter it manually or try again."
            : "Current location is unavailable. Enter it manually or try again.");
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }, []);

  useEffect(() => {
    if (location?.latitude != null && location?.longitude != null) return;
    if (!navigator.permissions?.query) return;
    let active = true;
    navigator.permissions.query({ name: "geolocation" })
      .then(permission => { if (active && permission.state === "granted") fetchCurrentLocation(true); })
      .catch(() => { /* The button remains available if permission status cannot be queried. */ });
    return () => { active = false; };
  }, [location?.latitude, location?.longitude, fetchCurrentLocation]);

  async function save() {
    setSaving(true);
    setStatus("Saving…");
    try {
      const response = await fetch(`/api/entries/${entryId}/context`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeName,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          locationSource,
          temperatureC: temperature ? Number(temperature) : null,
          condition,
        }),
      });
      setStatus(response.ok ? "Context saved" : "Could not save context");
    } catch {
      setStatus("Could not save context");
    } finally {
      setSaving(false);
    }
  }

  return <Paper component="section" elevation={0} className="panel stack" style={{ marginTop: 24 }}>
    <h2 style={{ margin: 0 }}>Place & weather</h2>
    <p className="muted">Use your current coordinates or enter a place manually. Location is saved only when you choose Save context.</p>
    <div><Button type="button" variant="outlined" disabled={locating} onClick={() => fetchCurrentLocation()}>{locating ? "Finding location…" : "Use current location"}</Button></div>
    <div className="search-filters">
      <TextField label="Place" value={placeName} onChange={event => setPlaceName(event.target.value)} placeholder="A place to remember" />
      <TextField label="Latitude" type="number" slotProps={{ htmlInput: { min: -90, max: 90, step: "any" } }} value={latitude} onChange={event => { setLatitude(event.target.value); setLocationSource("manual"); }} />
      <TextField label="Longitude" type="number" slotProps={{ htmlInput: { min: -180, max: 180, step: "any" } }} value={longitude} onChange={event => { setLongitude(event.target.value); setLocationSource("manual"); }} />
      <TextField label="Temperature °C" type="number" slotProps={{ htmlInput: { step: "any" } }} value={temperature} onChange={event => setTemperature(event.target.value)} />
      <TextField label="Condition" value={condition} onChange={event => setCondition(event.target.value)} placeholder="Sunny" />
    </div>
    <div className="row"><Button type="button" variant="contained" disabled={saving || locating} onClick={() => void save()}>{saving ? "Saving…" : "Save context"}</Button><span role="status" className="muted">{status}</span></div>
  </Paper>;
}
