import { AuthForm } from "@/components/auth-form";
import Link from "next/link";
export default function SignIn() { return <main className="auth-page"><div className="auth-brand"><Link href="/">stillroom<span>.</span></Link><p>A quiet place to keep your days.</p></div><AuthForm /></main>; }
