import type { CSSProperties } from "react";
import type { CarColor, Gear } from "../../shared/protocol";

export const colors = {
  background: "#16110e",
  panel: "#241a15",
  raised: "#2f221b",
  border: "#4a3429",
  text: "#f7ede7",
  muted: "#c4ab9e",
  faint: "#7d665a",
  accent: "#ff6a2b",
  heat: "#ff3d3d",
  good: "#5fd38d",
  warn: "#ffc23d",
};

export const gearColors: Record<Gear, string> = {
  1: "#4fb3ff",
  2: "#5fd38d",
  3: "#ffc23d",
  4: "#ff5a36",
};

// Car colours as swatches. `ink` is the text colour that reads on top.
export const carColors: Record<
  CarColor,
  { label: string; fill: string; ink: string }
> = {
  red: { label: "Red", fill: "#d93030", ink: "#fff" },
  blue: { label: "Blue", fill: "#2f6fd8", ink: "#fff" },
  green: { label: "Green", fill: "#2f9e52", ink: "#fff" },
  yellow: { label: "Yellow", fill: "#f2c42e", ink: "#16110e" },
  black: { label: "Black", fill: "#1b1b1b", ink: "#fff" },
  white: { label: "White", fill: "#f4f1ec", ink: "#16110e" },
  purple: { label: "Purple", fill: "#8a46d6", ink: "#fff" },
  orange: { label: "Orange", fill: "#f07a1e", ink: "#16110e" },
};

export const page: CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  padding: "1.25rem 1rem 2rem",
  color: colors.text,
  maxWidth: 480,
  margin: "0 auto",
  boxSizing: "border-box",
};

export const primaryButton: CSSProperties = {
  width: "100%",
  padding: "0.95rem",
  fontSize: "1.1rem",
  fontWeight: 700,
  borderRadius: 999,
  border: "none",
  background: colors.accent,
  color: colors.background,
};

export const secondaryButton: CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  fontSize: "1rem",
  borderRadius: 999,
  border: `1px solid ${colors.border}`,
  background: "transparent",
  color: colors.text,
};

export const linkButton: CSSProperties = {
  background: "none",
  border: "none",
  color: colors.accent,
  fontSize: "0.95rem",
  padding: 0,
};

export const pillButton: CSSProperties = {
  background: "none",
  border: `1px solid ${colors.border}`,
  color: colors.muted,
  borderRadius: 999,
  padding: "0.4rem 0.9rem",
  fontSize: "0.85rem",
};

export const panel: CSSProperties = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: 16,
  padding: "1rem",
};

export const help: CSSProperties = {
  color: colors.muted,
  fontSize: "0.9rem",
  lineHeight: 1.45,
};

export const input: CSSProperties = {
  fontSize: "1.15rem",
  padding: "0.7rem 0.8rem",
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  background: colors.background,
  color: colors.text,
  width: "100%",
  boxSizing: "border-box",
};

export const label: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
  fontSize: "0.9rem",
  color: colors.muted,
};
