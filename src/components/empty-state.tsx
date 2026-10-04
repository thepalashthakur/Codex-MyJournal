import Link from "next/link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
export function EmptyState({ title, description, action = "New entry" }: { title: string; description: string; action?: string }) { return <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}><Stack spacing={1.5} sx={{ alignItems: "center" }}><Typography variant="h2">{title}</Typography><Typography color="text.secondary">{description}</Typography><Link href="/entries/new" className="button primary">{action}</Link></Stack></Paper>; }
