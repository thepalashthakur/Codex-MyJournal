import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Cloud, MapPin } from "lucide-react";

export function EntryContextSummary({ placeName, hasLocation, temperatureC, condition }: { placeName?: string | null; hasLocation?: boolean; temperatureC?: string | number | null; condition?: string | null }) {
  const weather = [temperatureC !== null && temperatureC !== undefined && String(temperatureC) !== "" ? `${temperatureC}°C` : "", condition || ""].filter(Boolean).join(" · ");
  if (!hasLocation && !placeName && !weather) return null;
  return <Stack direction="row" sx={{ flexWrap: "wrap", gap: { xs: 1, sm: 2 }, alignItems: "center" }} aria-label="Entry place and weather">
    {(hasLocation || placeName) && <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><MapPin size={16} aria-hidden="true"/><Typography variant="body2">{placeName || "Location saved"}</Typography></Stack>}
    {weather && <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Cloud size={16} aria-hidden="true"/><Typography variant="body2">{weather}</Typography></Stack>}
  </Stack>;
}
