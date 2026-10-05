type CityLookup = { city?: unknown; locality?: unknown };

export function placeNameFromLookup(result: CityLookup | null): string | null {
  if (!result) return null;
  for (const value of [result.city, result.locality]) {
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 200);
  }
  return null;
}

// The free endpoint requires a direct browser request using this device's current coordinates.
export async function lookupCurrentPlace(latitude: number, longitude: number, language: string): Promise<string | null> {
  const url = new URL("https://api-bdc.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("localityLanguage", /^[a-z]{2}$/i.test(language) ? language.toLowerCase() : "en");
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Place lookup failed");
  return placeNameFromLookup(await response.json() as CityLookup);
}
