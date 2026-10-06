import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
export function EmptyState({ title, description, action = "New entry" }: { title: string; description: string; action?: string }) { return <Box className="empty-state"><Stack spacing={1} sx={{ alignItems: "center" }}><Typography component="h2" variant="h3">{title}</Typography><Typography color="text.secondary">{description}</Typography><Link href="/entries/new" className="button">{action}</Link></Stack></Box>; }
