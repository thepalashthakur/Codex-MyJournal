export function zonedLocalToIso(local: string, timezone: string) {
  const [date, time = "00:00"] = local.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  let timestamp = Date.UTC(year, month - 1, day, hour, minute);
  const format = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = Object.fromEntries(format.formatToParts(new Date(timestamp)).map(p => [p.type, p.value]));
    const actual = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    const delta = Date.UTC(year, month - 1, day, hour, minute) - actual;
    if (!delta) break;
    timestamp += delta;
  }
  return new Date(timestamp).toISOString();
}
export function isoToZonedLocal(iso: string, timezone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
