"use client";
import { useState } from "react";
type Context = { locations?: { place_name: string | null; latitude: number | null; longitude: number | null } | null; weather_data?: { temperatureC?: number; condition?: string } | null };
export function EntryContext({ entryId, context }: { entryId: string; context: Context }) {
  const location = context.locations;
  const [placeName, setPlaceName] = useState(location?.place_name || "");
  const [latitude, setLatitude] = useState(location?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(location?.longitude?.toString() || "");
  const [temperature, setTemperature] = useState(context.weather_data?.temperatureC?.toString() || "");
  const [condition, setCondition] = useState(context.weather_data?.condition || "");
  const [status, setStatus] = useState("");
  async function save() { setStatus("Saving…"); const response = await fetch(`/api/entries/${entryId}/context`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placeName, latitude: latitude ? Number(latitude) : null, longitude: longitude ? Number(longitude) : null, temperatureC: temperature ? Number(temperature) : null, condition }) }); setStatus(response.ok ? "Context saved" : "Could not save context"); }
  return <section className="panel stack" style={{ marginTop: 24 }}><h2 style={{ margin: 0 }}>Place & weather</h2><p className="muted">Add these only when you want to. Precise location is never captured automatically.</p><div className="search-filters"><label>Place<input value={placeName} onChange={event => setPlaceName(event.target.value)} placeholder="A place to remember" /></label><label>Latitude<input type="number" min={-90} max={90} step="any" value={latitude} onChange={event => setLatitude(event.target.value)} /></label><label>Longitude<input type="number" min={-180} max={180} step="any" value={longitude} onChange={event => setLongitude(event.target.value)} /></label><label>Temperature °C<input type="number" step="any" value={temperature} onChange={event => setTemperature(event.target.value)} /></label><label>Condition<input value={condition} onChange={event => setCondition(event.target.value)} placeholder="Sunny" /></label></div><div className="row"><button type="button" className="button" onClick={() => void save()}>Save context</button><span role="status" className="muted">{status}</span></div></section>;
}
