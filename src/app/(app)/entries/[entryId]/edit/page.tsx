import { EntryEditor } from "@/components/entry-editor";
import { getEntry, listJournals } from "@/lib/journal-service";
import { notFound } from "next/navigation";
import { AttachmentUploader } from "@/components/attachment-uploader";
import { AttachmentList } from "@/components/attachment-list";
import { EntryContext } from "@/components/entry-context";
export default async function EditEntry({ params }: { params: Promise<{ entryId: string }> }) { const id = (await params).entryId; const [entry, journals] = await Promise.all([getEntry(id), listJournals()]); if (!entry || entry.deleted_at) notFound(); return <><EntryEditor entry={entry as unknown as Parameters<typeof EntryEditor>[0]["entry"]} journals={journals} /><section className="page" style={{ maxWidth: 850, marginTop: 25 }}><h2>Attachments</h2><AttachmentUploader entryId={id} /><AttachmentList attachments={entry.attachments} editable /><EntryContext entryId={id} context={entry as unknown as Parameters<typeof EntryContext>[0]["context"]} /></section></>; }
