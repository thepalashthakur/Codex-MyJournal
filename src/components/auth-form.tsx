"use client";
import { FormEvent, useState } from "react";

export function AuthForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      if (data.confirmation_required) setMessage("Check your email to confirm your account, then sign in.");
      else window.location.assign("/today");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="auth-card"><p className="eyebrow">YOUR PRIVATE SPACE</p><h1>{mode === "sign-in" ? "Welcome back" : "Begin your journal"}</h1><p>Sign in to write, remember, and return.</p><form onSubmit={submit}><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-up" ? 8 : 1} required /></label>{message && <p role="status" className="form-message">{message}</p>}<button className="button primary" disabled={busy}>{busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}</button></form><button className="text-button" type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }}>{mode === "sign-in" ? "New here? Create an account" : "Already have an account? Sign in"}</button></section>;
}
