"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

type Journal = { id: string; name: string };
type Template = { content: Record<string, unknown>; journal_id: string | null };

export function NewEntry({ journals, template, prompt }: { journals: Journal[]; template?: Template | null; prompt?: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const journalId = journals.find(journal => journal.id === template?.journal_id)?.id || journals[0]?.id;

  const create = useCallback(async () => {
    if (!journalId) return;
    try {
      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const content = template?.content || (prompt ? {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: prompt }] }, { type: "paragraph" }],
      } : undefined);
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          entryDate: now.toISOString(),
          localDate,
          content,
        }),
      });
      if (!response.ok) throw new Error("Could not open your entry. Please try again.");
      const entry = await response.json();
      router.replace(`/entries/${entry.id}/edit`);
    } catch {
      setError("Could not open your entry. Please try again.");
      setBusy(false);
    }
  }, [journalId, prompt, router, template]);

  useEffect(() => {
    if (started.current || !journalId) return;
    started.current = true;
    void create();
  }, [create, journalId]);

  function retry() {
    setError("");
    setBusy(true);
    void create();
  }

  return <main className="page editor-page">
    {error || !journalId ? <Alert severity="error" action={journalId ? <Button color="inherit" onClick={retry}>Try again</Button> : undefined}>
      {error || "No journal is available. Create a journal in Settings before writing an entry."}
    </Alert> : <Box aria-busy={busy} aria-label="Opening your entry" role="status">
      <Stack className="editor-top" direction="row" sx={{ justifyContent: "space-between" }}><Skeleton width={90} /><Skeleton width={80} /></Stack>
      <Box className="editor-main">
        <Skeleton variant="text" width="65%" height={56} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ my: 3 }}>
          <Skeleton variant="rounded" height={48} sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={48} sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={48} sx={{ flex: 1 }} />
        </Stack>
        <Skeleton variant="text" width="75%" /><Skeleton variant="text" width="92%" /><Skeleton variant="text" width="60%" />
      </Box>
    </Box>}
  </main>;
}
