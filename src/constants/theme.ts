import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#1C1E21",
    background: "#FFFFFF",
    backgroundElement: "#F3F4F6",
    backgroundSelected: "#E5E7EB",
    textSecondary: "#5F6670",
    border: "#D9DCE1",
    accent: "#3E4C59",
    accentText: "#FFFFFF",
  },
  dark: {
    text: "#F3F4F6",
    background: "#0F1012",
    backgroundElement: "#1A1C1F",
    backgroundSelected: "#26292D",
    textSecondary: "#A3A9B1",
    border: "#2E3135",
    accent: "#CBD2D9",
    accentText: "#14161A",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 640;
