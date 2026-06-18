import { useColorScheme } from "react-native";
import { useStore } from "@/store/useStore";

export const COLORS = {
  light: {
    bg: "#F9F9F7",
    surface: "#FFFFFF",
    border: "#E8E8E4",
    textPrimary: "#0A0A0A",
    textMuted: "#9A9A96",
    accent: "#0A0A0A",
    accentText: "#FFFFFF",
  },
  dark: {
    bg: "#0A0A0A",
    surface: "#141414",
    border: "#1F1F1F",
    textPrimary: "#F0F0EE",
    textMuted: "#5A5A58",
    accent: "#F0F0EE",
    accentText: "#0A0A0A",
  },
  pending: "#C8A96E", // warm amber
  done: "#5A9E7A",    // soft green
  danger: "#C0392B",  // red
  overdue: "#C0392B",
};

export const FONTS = {
  serif: "InstrumentSerif_400Regular_Italic",
  serifRegular: "InstrumentSerif_400Regular",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansBold: "Inter_600SemiBold",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
};

export const SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
  160: 160,
};

export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
};

export function useTheme() {
  const systemScheme = useColorScheme();
  const themePreference = useStore((s) => s.theme);
  
  const activeScheme = themePreference === "auto"
    ? (systemScheme === "light" ? "light" : "dark")
    : themePreference;
    
  const colors = COLORS[activeScheme];

  return {
    isDark: activeScheme === "dark",
    colors: {
      ...colors,
      pending: COLORS.pending,
      done: COLORS.done,
      danger: COLORS.danger,
      overdue: COLORS.overdue,
    },
    fonts: FONTS,
    spacing: SPACING,
    radius: RADIUS,
  };
}

