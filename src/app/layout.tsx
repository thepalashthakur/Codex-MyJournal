import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Stillroom — your private journal", description: "A quiet, private place for your days.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
