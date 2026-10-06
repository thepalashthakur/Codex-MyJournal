import Alert from "@mui/material/Alert";
import Link from "next/link";
import { z } from "zod";
import { EntryCard } from "@/components/entry-card";
import { SearchForm } from "@/components/search-form";
import { listEmotionLibrary, listImpactLibrary } from "@/lib/context-service";
import { userDb } from "@/lib/db";
import { listJournals, listTags, withEntrySectionPreviews } from "@/lib/journal-service";

type SearchParams = {
  q?: string; journal?: string; tag?: string; favorites?: string; from?: string;
  to?: string; media?: string; emotion?: string; area?: string; entity?: string;
};

export default async function Search({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const [journals, tags] = await Promise.all([listJournals(), listTags()]);
  const [emotionResult, impactResult] = await Promise.allSettled([listEmotionLibrary(), listImpactLibrary()]);
  if (emotionResult.status === "rejected") console.error("Search emotion library unavailable", emotionResult.reason);
  if (impactResult.status === "rejected") console.error("Search impact library unavailable", impactResult.reason);
  const emotions = emotionResult.status === "fulfilled" ? emotionResult.value : [];
  const impacts = impactResult.status === "fulfilled" ? impactResult.value : { areas: [], entities: [] };

  const query = (params.q || "").trim().slice(0, 200);
  const validId = (value?: string) => value && z.uuid().safeParse(value).success ? value : null;
  const contextFilter = Boolean(validId(params.emotion) || validId(params.area) || validId(params.entity));
  const { db } = await userDb();
  const commonArgs = {
    p_query: query,
    p_journal: validId(params.journal),
    p_favorites: params.favorites === "1",
    p_tags: validId(params.tag) ? [params.tag] : [],
    p_from: params.from || null,
    p_to: params.to || null,
    p_media_type: params.media || null,
  };
  let result = await db.rpc("search_journal", {
    ...commonArgs,
    p_emotion: validId(params.emotion),
    p_impact_area: validId(params.area),
    p_impact_entity: validId(params.entity),
  });
  let unavailableContextFilter = false;
  if (result.error?.code === "PGRST202") {
    // Older databases expose the seven-argument search function until the
    // context-search migration is applied. Never silently ignore a filter.
    if (contextFilter) {
      unavailableContextFilter = true;
    } else {
      result = await db.rpc("search_journal", commonArgs);
    }
  }
  if (result.error && !unavailableContextFilter) console.error("Search query failed", result.error);
  const searchFailed = Boolean(result.error && !unavailableContextFilter);
  const rows = searchFailed || unavailableContextFilter ? [] : result.data || [];
  const entries = await withEntrySectionPreviews(rows as (Parameters<typeof EntryCard>[0]["entry"] & { journal_id: string })[]);
  const journalMap = new Map(journals.map(journal => [journal.id, journal]));

  return <main className="page narrow">
    <header className="page-header"><div><p className="eyebrow">FIND A MOMENT</p><h1>Search</h1><p>Look across words, tags, places, dates, emotions, and impacts.</p></div></header>
    <SearchForm params={{ ...params, q: query }} journals={journals} tags={tags} emotions={emotions} areas={impacts.areas} entities={impacts.entities}/>
    <div className="section-heading"><h2>Results</h2>{!searchFailed && !unavailableContextFilter && <span>{entries.length}{entries.length === 50 ? "+" : ""} entries</span>}</div>
    {unavailableContextFilter ? <Alert severity="warning">Emotion and impact search will be available after the journal database update. Clear those filters to search your entries now.</Alert>
      : searchFailed ? <Alert severity="error" action={<Link href="/search">Reset search</Link>}>Search is temporarily unavailable. Please try again.</Alert>
      : entries.length ? <div className="entry-list">{entries.map(entry => <EntryCard key={entry.id} entry={{ ...entry, journals: journalMap.get(entry.journal_id) || null }} />)}</div>
      : <div className="empty-state"><h2>No entries found</h2><p>Try a different word or fewer filters.</p><Link className="button" href="/search">Clear filters</Link></div>}
  </main>;
}
