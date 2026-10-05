import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Cloud, MapPin } from "lucide-react";

export function EntryContextSummary({ placeName, latitude, longitude, temperatureC, condition }: { placeName?: string | null; latitude?: string | number | null; longitude?: string | number | null; temperatureC?: string | number | null; condition?: string | null }) {
  const coordinates = latitude !== null && latitude !== undefined && String(latitude) !== "" && longitude !== null && longitude !== undefined && String(longitude) !== "" ? `${Number(latitude).toFixed(3)}, ${Number(longitude).toFixed(3)}` : "";
  const place = placeName?.trim() || coordinates;
  const weather = [temperatureC !== null && temperatureC !== undefined && String(temperatureC) !== "" ? `${temperatureC}°C` : "", condition || ""].filter(Boolean).join(" · ");
  if (!place && !weather) return null;
  return <Stack direction="row" sx={{ flexWrap: "wrap", gap: { xs: 1, sm: 2 }, alignItems: "center" }} aria-label="Entry place and weather">
    {place && <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><MapPin size={16} aria-hidden="true"/><Typography variant="body2">{place}</Typography></Stack>}
    {weather && <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Cloud size={16} aria-hidden="true"/><Typography variant="body2">{weather}</Typography></Stack>}
  </Stack>;
}
