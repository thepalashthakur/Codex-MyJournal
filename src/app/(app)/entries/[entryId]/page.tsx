import { getEntry } from "@/lib/journal-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AttachmentList } from "@/components/attachment-list";
import { RichContent } from "@/components/rich-content";
export default async function EntryPage({ params }: { params: Promise<{ entryId: string }> }) { const entry = await getEntry((await params).entryId); if (!entry || entry.deleted_at) notFound(); const journal = entry.journals as unknown as { name: string } | null; return <main className="page narrow reader"><div className="between"><Link href="/timeline" className="muted">← Timeline</Link><Link className="button" href={`/entries/${entry.id}/edit`}>Edit entry</Link></div><div className="reader-head"><p className="eyebrow">{journal?.name || "Journal"} · {entry.local_date}</p><h1>{entry.title || "Untitled entry"}</h1></div><div className="reader-body"><RichContent content={entry.content} /></div><AttachmentList attachments={entry.attachments} /></main>; }
