import React from "react";
import { Text } from "react-native";
import { useTheme } from "@/lib/theme";

export type Platform = string;

interface PlatformIconProps {
  platform: Platform;
  size?: number;
}

// ─── Public Monospace Text Icon Component ─────────────────────────────────
export function PlatformIcon({ platform, size = 28 }: PlatformIconProps) {
  const { colors, fonts } = useTheme();
  const normalized = platform.trim().toLowerCase();

  return (
    <Text
      style={{
        fontFamily: fonts.mono,
        fontSize: Math.max(11, size * 0.55),
        color: colors.textMuted,
        textTransform: "lowercase",
      }}
    >
      [{normalized}]
    </Text>
  );
}

// ─── Platform Metadata (Monochrome Colors) ────────────────────────────────
export const PLATFORM_META: {
  value: Platform;
  label: string;
  color: string;
}[] = [
  { value: "whatsapp",  label: "WhatsApp",  color: "#888888" },
  { value: "instagram", label: "Instagram", color: "#888888" },
  { value: "imessage",  label: "iMessage",  color: "#888888" },
  { value: "telegram",  label: "Telegram",  color: "#888888" },
  { value: "x",         label: "X",         color: "#888888" },
  { value: "other",     label: "Other",     color: "#888888" },
];
