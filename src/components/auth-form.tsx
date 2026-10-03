"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";

export function AuthForm() {
  const router = useRouter();
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
      else router.push("/today");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <Paper component="section" className="auth-card" elevation={0}><p className="eyebrow">YOUR PRIVATE SPACE</p><h1>{mode === "sign-in" ? "Welcome back" : "Begin your journal"}</h1><p>Sign in to write, remember, and return.</p><form onSubmit={submit}><TextField label="Email" name="email" type="email" autoComplete="email" required fullWidth /><TextField label="Password" name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} slotProps={{ htmlInput: { minLength: mode === "sign-up" ? 8 : 1 } }} required fullWidth />{message && <p role="status" className="form-message">{message}</p>}<Button variant="contained" type="submit" disabled={busy} fullWidth>{busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}</Button></form><Button variant="text" type="button" className="text-button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }}>{mode === "sign-in" ? "New here? Create an account" : "Already have an account? Sign in"}</Button></Paper>;
}
