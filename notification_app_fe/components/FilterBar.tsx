"use client";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const TYPES = ["All", "Placement", "Result", "Event"];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function FilterBar({ value, onChange }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, v) => { if (v) onChange(v); }}
        size="small"
      >
        {TYPES.map((t) => (
          <ToggleButton key={t} value={t} sx={{ textTransform: "none", px: 2 }}>
            {t}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
