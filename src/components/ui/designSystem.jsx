import React from "react";

export const DS_TOKENS = {
  radius: { sm: 10, md: 12, lg: 14, xl: 16 },
  spacing: { xxs: 4, xs: 6, sm: 8, md: 10, lg: 12, xl: 14, xxl: 16, card: 14, section: 20 },
  shadow: {
    card: "0 6px 20px rgba(0,0,0,0.28)",
    elevated: "0 10px 28px rgba(0,0,0,0.36)",
    glow: "0 8px 24px color-mix(in srgb,var(--accent) 28%, transparent)",
  },
  motion: {
    easeStandard: "cubic-bezier(0.2, 0, 0, 1)",
    easeDecel: "cubic-bezier(0, 0, 0, 1)",
    easeAccel: "cubic-bezier(0.4, 0, 1, 1)",
    fast: "120ms",
    base: "180ms",
    slow: "240ms",
    pressScale: 0.985,
    hoverLift: -1,
  },
  gradient: {
    surface: "linear-gradient(165deg, rgba(255,255,255,0.04), rgba(0,0,0,0.28))",
    accent: "linear-gradient(145deg, color-mix(in srgb,var(--accent) 17%, transparent), rgba(9,11,14,0.92) 58%)",
  },
  type: {
    label: { fontSize: 11, letterSpacing: "0.06em", lineHeight: 1.25, weight: 700 },
    body: { fontSize: 13, lineHeight: 1.45 },
    stat: { fontSize: 24, lineHeight: 1, weight: 800 },
    heading: { fontSize: 18, lineHeight: 1.1, weight: 800 },
  },
};

const BASE_BUTTON = {
  minHeight: 42,
  borderRadius: DS_TOKENS.radius.md,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: DS_TOKENS.type.label.fontSize,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  transition: `transform ${DS_TOKENS.motion.fast} ${DS_TOKENS.motion.easeStandard}, border-color ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}, background ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}, color ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}, box-shadow ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}, opacity ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}`,
  WebkitTapHighlightColor: "transparent",
  willChange: "transform",
};

export function DSButton({ variant = "secondary", style, ...props }) {
  const variants = {
    primary: { border: "1px solid var(--accent)", background: "var(--accent)", color: "#0B0D10", boxShadow: DS_TOKENS.shadow.glow },
    secondary: { border: "1px solid var(--stroke-1)", background: "var(--surface-1)", color: "var(--text-2)" },
    ghost: { border: "1px solid transparent", background: "transparent", color: "var(--text-2)" },
  };
  return <button {...props} className="ds-button" style={{ ...BASE_BUTTON, ...(variants[variant] || variants.secondary), ...style }} />;
}

export function DSCard({ children, style, accent = false, ...props }) {
  return <div {...props} style={{ borderRadius: DS_TOKENS.radius.lg, border: "1px solid var(--stroke-1)", background: accent ? DS_TOKENS.gradient.accent : DS_TOKENS.gradient.surface, boxShadow: DS_TOKENS.shadow.card, ...style }}>{children}</div>;
}

export function DSMetricCard({ label, value, onClick, style, valueStyle }) {
  return <button type="button" className="ds-metric-card" onClick={onClick} style={{ minHeight: 72, borderRadius: DS_TOKENS.radius.lg, border: "1px solid color-mix(in srgb, var(--accent) 12%, var(--stroke-1))", background: "linear-gradient(165deg, rgba(255,255,255,0.06), rgba(0,0,0,0.32) 62%)", padding: DS_TOKENS.spacing.lg, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "left", cursor: "pointer", transition: `transform ${DS_TOKENS.motion.fast} ${DS_TOKENS.motion.easeStandard}, border-color ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}, box-shadow ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}`, willChange: "transform", ...style }}><div style={{ fontSize: DS_TOKENS.type.label.fontSize - 1, fontWeight: DS_TOKENS.type.label.weight, letterSpacing: "0.05em", color: "var(--text-tertiary)", textTransform: "uppercase", lineHeight: DS_TOKENS.type.label.lineHeight }}>{label}</div><div style={{ marginTop: DS_TOKENS.spacing.xs, fontSize: DS_TOKENS.type.stat.fontSize, lineHeight: DS_TOKENS.type.stat.lineHeight, fontWeight: DS_TOKENS.type.stat.weight, color: "var(--text-1)", ...valueStyle }}>{value}</div></button>;
}

export function DSSectionHeader({ title, meta }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: DS_TOKENS.spacing.sm, marginBottom: DS_TOKENS.spacing.md }}><div style={{ color: "var(--text-1)", fontSize: 12, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", lineHeight: 1.2 }}>{title}</div>{meta ? <div style={{ color: "var(--text-3)", fontSize: DS_TOKENS.type.label.fontSize, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: DS_TOKENS.type.label.lineHeight }}>{meta}</div> : null}</div>; }
export function DSChip({ active, children, style, ...props }) { return <button type="button" className="ds-chip" aria-pressed={Boolean(active)} {...props} style={{ minHeight: 38, borderRadius: DS_TOKENS.radius.sm, border: `1px solid ${active ? "var(--accent)" : "var(--stroke-1)"}`, background: active ? "var(--accent-soft)" : "var(--surface-2)", color: active ? "var(--accent)" : "var(--text-2)", fontSize: DS_TOKENS.type.label.fontSize, lineHeight: DS_TOKENS.type.label.lineHeight, fontWeight: 700, padding: "0 12px", textTransform: "uppercase", cursor: "pointer", transition: `transform ${DS_TOKENS.motion.fast} ${DS_TOKENS.motion.easeStandard}, border-color ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}, background ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}, color ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}`, willChange: "transform", ...style }}>{children}</button>; }
export function DSInput({ style, ...props }) { return <input {...props} className="ds-input" style={{ minHeight: 42, borderRadius: DS_TOKENS.radius.md, border: "1px solid var(--stroke-1)", background: "var(--surface-1)", color: "var(--text-1)", padding: "10px 12px", transition: `border-color ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}, box-shadow ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}, background ${DS_TOKENS.motion.base} ${DS_TOKENS.motion.easeStandard}`, ...style }} />; }
export function DSEmptyState({ title, message, style }) { return <div style={{ borderRadius: DS_TOKENS.radius.md, border: "1px solid var(--stroke-1)", background: "var(--surface-2)", color: "var(--text-2)", fontSize: DS_TOKENS.type.body.fontSize, lineHeight: DS_TOKENS.type.body.lineHeight, padding: `${DS_TOKENS.spacing.card}px ${DS_TOKENS.spacing.lg}px`, fontWeight: 600, ...style }}><div style={{ color: "var(--text-1)", fontWeight: 700, marginBottom: DS_TOKENS.spacing.xxs }}>{title}</div><div>{message}</div></div>; }

export function DSLoadingState({ label = "Loading", lines = 3, style }) {
  const skeletonLines = Array.from({ length: Math.max(1, lines) });
  return <div role="status" aria-live="polite" style={{ borderRadius: DS_TOKENS.radius.md, border: "1px solid var(--stroke-1)", background: "var(--surface-2)", padding: "14px", ...style }}>
    <div style={{ color: "var(--text-2)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>{label}…</div>
    <div style={{ display: "grid", gap: 8 }}>
      {skeletonLines.map((_, index) => <div key={index} className="tb" style={{ height: 10, borderRadius: 999, width: `${index === skeletonLines.length - 1 ? 72 : 100}%`, background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.13), rgba(255,255,255,0.03))" }} />)}
    </div>
  </div>;
}
