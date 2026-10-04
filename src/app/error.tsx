"use client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) { return <main className="center-state"><Stack spacing={2} sx={{ alignItems: "center", maxWidth: 440 }}><h1>Something went wrong</h1><Alert severity="error">Your writing is still yours. Please try again.</Alert><Button variant="contained" onClick={reset}>Try again</Button></Stack></main>; }
