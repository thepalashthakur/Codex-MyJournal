export function localDateOf(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function onThisDayFilter(today: string) {
  const [, month, day] = today.split("-").map(Number);
  return { month, day, leapDay: month === 2 && day === 29 };
}
export function monthBounds(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Invalid month.");
  const [year, number] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, number, 1)).toISOString().slice(0, 10);
  return { start: `${month}-01`, end: next };
}
