"use client";
import { useState, useEffect, useRef } from "react";
import { Notification } from "@/lib/types";
import { fetchNotifications } from "@/lib/api";
import NotificationCard from "./NotificationCard";
import FilterBar from "./FilterBar";
import { Typography, Box, Pagination, CircularProgress, Alert, Button } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import Link from "next/link";

const PAGE_SIZE = 10;

export default function NotificationsClient() {
  const [all, setAll] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const seenIds = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchNotifications();
        if (cancelled) return;

        const incoming = data.notifications ?? [];
        const freshIds = incoming.map((n) => n.ID).filter((id) => !seenIds.current.has(id));
        freshIds.forEach((id) => seenIds.current.add(id));
        setNewIds(new Set(freshIds));
        setAll(incoming);
      } catch {
        if (!cancelled) setError("Failed to load notifications. Check your token.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const filtered = filter === "All" ? all : all.filter((n) => n.Type === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading && all.length === 0)
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>;

  if (error)
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          All Notifications{" "}
          <Typography component="span" variant="body2" color="text.secondary">
            ({filtered.length})
          </Typography>
        </Typography>
        <Button
          component={Link}
          href="/priority"
          variant="contained"
          startIcon={<StarIcon />}
          size="small"
        >
          Priority Inbox
        </Button>
      </Box>

      <FilterBar value={filter} onChange={(v) => { setFilter(v); setPage(1); }} />

      {paginated.length === 0 ? (
        <Typography color="text.secondary">No notifications.</Typography>
      ) : (
        paginated.map((n) => (
          <NotificationCard key={n.ID} notification={n} isNew={newIds.has(n.ID)} />
        ))
      )}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}
    </Box>
  );
}
