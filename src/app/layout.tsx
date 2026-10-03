import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { AppThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";
export const metadata: Metadata = { title: "Stillroom — your private journal", description: "A quiet, private place for your days.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><AppRouterCacheProvider><AppThemeProvider>{children}</AppThemeProvider></AppRouterCacheProvider></body></html>; }
