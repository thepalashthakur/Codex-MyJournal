import Link from "next/link";
import { userDb } from "@/lib/db";
import { AttachmentList } from "@/components/attachment-list";
import { EmptyState } from "@/components/empty-state";
export default async function Media({ searchParams }: { searchParams: Promise<{ type?: string; before?: string }> }) {
  const params = await searchParams; const { db, user } = await userDb();
  let query = db.from("attachments").select("id,type,file_name,mime_type,caption,entry_id,created_at,entries!inner(deleted_at)").eq("user_id", user.id).is("entries.deleted_at", null).order("created_at", { ascending: false }).limit(30);
  const type = ["IMAGE","VIDEO","AUDIO","DOCUMENT","PDF"].includes(params.type || "") ? params.type : "";
  if (type) query = query.eq("type", type);
  if (params.before) query = query.lt("created_at", params.before);
  const { data: media, error } = await query; if (error) throw error;
  const last = media?.at(-1);
  return <main className="page"><header className="page-header"><div><p className="eyebrow">MOMENTS IN MORE THAN WORDS</p><h1>Media</h1><p>Photos, recordings, and files from your entries.</p></div></header><div className="toolbar">{[["","All"],["IMAGE","Photos"],["VIDEO","Videos"],["AUDIO","Audio"],["DOCUMENT","Documents"],["PDF","PDFs"]].map(([value,label]) => <Link key={value} href={value ? `/media?type=${value}` : "/media"} className="button subtle compact-filter" aria-current={type === value ? "page" : undefined}>{label}</Link>)}</div>{media?.length ? <><AttachmentList attachments={media} /><div className="attachment-grid">{media.map(item => <Link className="text-button" key={item.id} href={`/entries/${item.entry_id}`}>View entry → {item.file_name}</Link>)}</div>{media.length === 30 && last && <Link className="button" href={`/media?${new URLSearchParams({ ...(type && { type }), before: last.created_at })}`}>Older media</Link>}</> : <EmptyState title="No media yet" description="Photos and files attached to entries will appear here." action="Create entry" />}</main>;
}
