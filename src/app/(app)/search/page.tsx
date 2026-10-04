import { userDb } from "@/lib/db";
import { listJournals, listTags } from "@/lib/journal-service";
import { EntryCard } from "@/components/entry-card";
import Link from "next/link";
import { SearchForm } from "@/components/search-form";
export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string; journal?: string; tag?: string; favorites?: string; from?: string; to?: string; media?: string }> }) {
  const params = await searchParams; const [journals, tags] = await Promise.all([listJournals(), listTags()]);
  const { db } = await userDb();
  const query = (params.q || "").trim().slice(0, 200);
  const { data: rows, error } = await db.rpc("search_journal", { p_query: query, p_journal: params.journal || null, p_favorites: params.favorites === "1", p_tags: params.tag ? [params.tag] : [], p_from: params.from || null, p_to: params.to || null, p_media_type: params.media || null });
  if (error) throw error;
  const journalMap = new Map(journals.map(j => [j.id, j]));
  const entries = (rows || []) as (Parameters<typeof EntryCard>[0]["entry"] & { journal_id: string })[];
  return <main className="page narrow"><header className="page-header"><div><p className="eyebrow">FIND A MOMENT</p><h1>Search</h1><p>Look across words, tags, places, and dates.</p></div></header><SearchForm params={{ ...params, q: query }} journals={journals} tags={tags}/><div className="section-heading"><h2>Results</h2><span>{entries.length}{entries.length === 50 ? "+" : ""} entries</span></div>{entries.length ? <div className="entry-list">{entries.map(entry => <EntryCard key={entry.id} entry={{ ...entry, journals: journalMap.get(entry.journal_id) || null }} />)}</div> : <div className="empty-state"><h2>No entries found</h2><p>Try a different word or fewer filters.</p><Link className="button" href="/search">Clear filters</Link></div>}</main>;
}
