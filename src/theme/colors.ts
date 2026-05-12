export const colors = {
  // ── Marca ──────────────────────────────────────────
  primary: "#2B8EF0",
  primaryLight: "#EBF4FF",
  primaryMid: "#C8E0FF",
  primaryDark: "#1A6FC4",

  // ── Semánticos ─────────────────────────────────────
  success: "#2EAA6E",
  successLight: "#E6F7EF",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",
  danger: "#E03E3E",
  dangerLight: "#FDEAEA",

  // ── Neutros ────────────────────────────────────────
  ink: "#0F172A",
  inkSoft: "#334155",
  grayText: "#8492A6",
  grayBorder: "#DDE3EE",
  grayBg: "#F0F4FA",
  grayLight: "#F6F7FB",
  white: "#FFFFFF",
  black: "#000000",

  // ── Tarjeta menú ───────────────────────────────────
  cardBlue: "#45B5FA",

  // ── Transparencias ─────────────────────────────────
  overlayDark: "rgba(0,0,0,0.5)",
  overlayLight: "rgba(255,255,255,0.85)",
  shadowDark: "rgba(0,0,0,0.55)",
} as const;

// Dark mode overrides
export const colorsDark = {
  ...colors,
  ink: "#F8FAFC",
  inkSoft: "#CBD5E1",
  grayBg: "#0F172A",
  grayBorder: "#1E293B",
  grayLight: "#1E293B",
  white: "#151F2E",
  cardBlue: "#1E3A5F",
} as const;

export type Colors = typeof colors;
