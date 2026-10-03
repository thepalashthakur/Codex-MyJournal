import Link from "next/link";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { entriesForDate, listJournals } from "@/lib/journal-service";
import { localDateOf } from "@/lib/dates";
import { viewerTimezone } from "@/lib/viewer-timezone";
import { userDb } from "@/lib/db";
const builtInPrompts = ["What made today meaningful?", "What are you grateful for?", "What challenged you today?", "What did you learn?", "What do you want to remember about today?"];
export default async function Today() {
  const timezone = await viewerTimezone();
  const today = localDateOf(new Date(), timezone);
  const [todayEntries, journals, context] = await Promise.all([entriesForDate(today), listJournals(), userDb()]);
  const { data: personalPrompts } = await context.db.from("prompts").select("text").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(20);
  const prompts = [...builtInPrompts, ...(personalPrompts || []).map(item => item.text)];
  const prompt = prompts[Math.floor(Date.UTC(...today.split("-").map(Number) as [number, number, number]) / 86400000) % prompts.length];
  return <main className="page narrow"><header className="page-header"><div><p className="eyebrow">YOUR SPACE TO REFLECT</p><h1>Today</h1><p>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: timezone })}</p></div><Link className="button primary" href="/entries/new">+ Write an entry</Link></header><section className="prompt-panel"><div><p className="eyebrow">A QUESTION FOR TODAY</p><h2>{prompt}</h2></div><Link className="text-button" href={`/entries/new?prompt=${encodeURIComponent(prompt)}`}>Write from this prompt →</Link></section><div className="section-heading"><h2>Your day</h2><span>{todayEntries.length} {todayEntries.length === 1 ? "entry" : "entries"}</span></div>{todayEntries.length ? <div className="entry-list">{todayEntries.map(entry => <EntryCard key={entry.id} entry={entry} />)}</div> : <EmptyState title="Your journal starts here" description={`Write a few words about today. They’ll be saved in ${journals[0].name}.`} />}</main>;
}
