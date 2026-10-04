import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
export default function Loading() { return <main className="page" aria-label="Opening your journal"><Stack spacing={2} sx={{ pt: 4 }}><Skeleton variant="text" width={120} height={24}/><Skeleton variant="text" width="55%" height={54}/><Skeleton variant="rounded" height={150} sx={{ borderRadius: 2 }}/><Skeleton variant="rounded" height={90} sx={{ borderRadius: 2 }}/><Skeleton variant="rounded" height={90} sx={{ borderRadius: 2 }}/></Stack></main>; }
