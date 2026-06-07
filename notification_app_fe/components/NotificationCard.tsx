"use client";
import { Notification } from "@/lib/types";
import { Card, CardContent, Typography, Chip, Box, useTheme } from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import EventIcon from "@mui/icons-material/Event";

const TYPE_CONFIG = {
  Placement: { color: "success" as const, Icon: WorkIcon },
  Result:    { color: "warning" as const, Icon: SchoolIcon },
  Event:     { color: "info"    as const, Icon: EventIcon },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  notification: Notification;
  isNew?: boolean;
}

export default function NotificationCard({ notification, isNew }: Props) {
  const theme = useTheme();
  const { color, Icon } = TYPE_CONFIG[notification.Type];

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderLeft: `4px solid ${theme.palette[color].main}`,
        backgroundColor: isNew ? `${theme.palette[color].light}22` : "background.paper",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: 3 },
      }}
    >
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Icon fontSize="small" color={color} />
            <Typography variant="body1" sx={{ fontWeight: isNew ? 700 : 400 }}>
              {notification.Message}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2, flexShrink: 0 }}>
            <Chip label={notification.Type} color={color} size="small" />
            {isNew && <Chip label="New" size="small" color="error" variant="outlined" />}
            <Typography variant="caption" color="text.secondary">
              {timeAgo(notification.Timestamp)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
