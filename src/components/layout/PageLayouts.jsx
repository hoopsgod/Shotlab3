import { useState } from "react";

export function HeroSection({ kicker, title, subtitle, metrics = [], accent = "var(--accent)", action }) {
  return (
    <section
      style={{
        background: `linear-gradient(140deg, ${accent}26 0%, ${accent}10 36%, var(--surface-1) 100%)`,
        border: `1px solid ${accent}66`,
        borderRadius: 20,
        padding: "18px 16px",
        marginBottom: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div>
          {kicker && <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>{kicker}</div>}
          <h2 style={{ margin: "6px 0 0", fontSize: 28, letterSpacing: "0.06em", lineHeight: 1, color: "var(--text-1)" }}>{title}</h2>
          {subtitle && <p style={{ margin: "8px 0 0", color: "var(--text-2)", fontSize: 12 }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {metrics.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(metrics.length, 3)}, minmax(0,1fr))`, gap: 8, marginTop: 14 }}>
          {metrics.map((metric) => (
            <div key={metric.label} style={{ border: "1px solid var(--border-1)", borderRadius: 12, padding: "10px 9px", background: "var(--surface-3)" }}>
              <div style={{ color: metric.color || "var(--text-1)", fontSize: 20, fontWeight: 700 }}>{metric.value}</div>
              <div style={{ color: "var(--text-3)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{metric.label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function StatisticBanner({ title, subtitle, stats = [], accent = "var(--accent)", icon }) {
  return (
    <section style={{ borderRadius: 18, border: `1px solid ${accent}44`, background: `linear-gradient(180deg, ${accent}0f, var(--surface-2))`, padding: "14px", marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        {icon}
        <div>
          <div style={{ color: "var(--text-1)", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>{title}</div>
          {subtitle && <div style={{ color: "var(--text-3)", fontSize: 11 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)", borderRadius: 12, padding: "10px 8px" }}>
            <div style={{ color: stat.color || "var(--text-1)", fontSize: 19, fontWeight: 700 }}>{stat.value}</div>
            <div style={{ color: "var(--text-3)", fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 3 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GridList({ items = [], columns = 2, renderItem, gap = 10 }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap }}>{items.map((item, index) => <div key={item.id || item.label || index}>{renderItem(item, index)}</div>)}</div>;
}

export function CollapsibleGroup({ title, subtitle, defaultOpen = true, children, accent = "var(--accent)" }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section style={{ marginBottom: 14 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border-1)", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", cursor: "pointer" }}>
        <div>
          <div style={{ color: "var(--text-1)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{title}</div>
          {subtitle && <div style={{ color: "var(--text-3)", fontSize: 10, marginTop: 3 }}>{subtitle}</div>}
        </div>
        <span style={{ color: accent, fontSize: 18, lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </section>
  );
}
