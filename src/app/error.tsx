"use client";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) { return <main className="center-state"><h1>Something went wrong</h1><p>Your writing is still yours. Please try again.</p><button className="button primary" onClick={reset}>Try again</button></main>; }
