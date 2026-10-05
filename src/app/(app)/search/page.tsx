import { userDb } from "@/lib/db";
import { listJournals, listTags, withEntrySectionPreviews } from "@/lib/journal-service";
import { EntryCard } from "@/components/entry-card";
import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { listEmotionLibrary, listImpactLibrary } from "@/lib/context-service";
import { z } from "zod";
export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string; journal?: string; tag?: string; favorites?: string; from?: string; to?: string; media?: string; emotion?: string; area?: string; entity?: string }> }) {
  const params = await searchParams; const [journals, tags, emotions, impacts] = await Promise.all([listJournals(), listTags(), listEmotionLibrary(), listImpactLibrary()]);
  const { db } = await userDb();
  const query = (params.q || "").trim().slice(0, 200);
  const validId = (value?: string) => value && z.uuid().safeParse(value).success ? value : null;
  const { data: rows, error } = await db.rpc("search_journal", { p_query: query, p_journal: validId(params.journal), p_favorites: params.favorites === "1", p_tags: validId(params.tag) ? [params.tag] : [], p_from: params.from || null, p_to: params.to || null, p_media_type: params.media || null, p_emotion: validId(params.emotion), p_impact_area: validId(params.area), p_impact_entity: validId(params.entity) });
  if (error) throw error;
  const journalMap = new Map(journals.map(j => [j.id, j]));
  const entries = await withEntrySectionPreviews((rows || []) as (Parameters<typeof EntryCard>[0]["entry"] & { journal_id: string })[]);
  return <main className="page narrow"><header className="page-header"><div><p className="eyebrow">FIND A MOMENT</p><h1>Search</h1><p>Look across words, tags, places, dates, emotions, and impacts.</p></div></header><SearchForm params={{ ...params, q: query }} journals={journals} tags={tags} emotions={emotions} areas={impacts.areas} entities={impacts.entities}/><div className="section-heading"><h2>Results</h2><span>{entries.length}{entries.length === 50 ? "+" : ""} entries</span></div>{entries.length ? <div className="entry-list">{entries.map(entry => <EntryCard key={entry.id} entry={{ ...entry, journals: journalMap.get(entry.journal_id) || null }} />)}</div> : <div className="empty-state"><h2>No entries found</h2><p>Try a different word or fewer filters.</p><Link className="button" href="/search">Clear filters</Link></div>}</main>;
}
