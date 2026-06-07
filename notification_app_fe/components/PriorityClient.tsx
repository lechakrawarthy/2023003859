"use client";
import { useState, useEffect } from "react";
import { Notification } from "@/lib/types";
import { fetchNotifications } from "@/lib/api";
import { getTopN } from "@/lib/priority";
import NotificationCard from "./NotificationCard";
import { Typography, Box, Slider, CircularProgress, Alert, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";

export default function PriorityClient() {
  const [all, setAll] = useState<Notification[]>([]);
  const [topN, setTopN] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications()
      .then((data) => setAll(data.notifications ?? []))
      .catch(() => setError("Failed to load notifications. Check your token."))
      .finally(() => setLoading(false));
  }, []);

  const top = getTopN(all, topN);

  if (loading)
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>;

  if (error)
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;

  return (
    <Box>
      <Button component={Link} href="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }} size="small">
        All Notifications
      </Button>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Priority Inbox
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ranked by type (Placement &gt; Result &gt; Event) then recency. Showing top {topN}.
      </Typography>

      <Box sx={{ mb: 3, px: 1 }}>
        <Typography variant="body2" gutterBottom>
          Show top N: <strong>{topN}</strong>
        </Typography>
        <Slider
          value={topN}
          min={5}
          max={20}
          step={5}
          marks={[
            { value: 5, label: "5" },
            { value: 10, label: "10" },
            { value: 15, label: "15" },
            { value: 20, label: "20" },
          ]}
          onChange={(_, v) => setTopN(v as number)}
          sx={{ maxWidth: 300 }}
        />
      </Box>

      {top.map((n, i) => (
        <Box key={n.ID} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ minWidth: 24, mt: 2, fontWeight: 600 }}
          >
            {i + 1}.
          </Typography>
          <Box sx={{ flex: 1 }}>
            <NotificationCard notification={n} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
