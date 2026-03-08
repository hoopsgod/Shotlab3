import { InsightCard } from "./cards/MobileCards";

export default function ContextSummary({ title = "Training context", items = [], style }) {
  if (!items.length) return null;

  return (
    <InsightCard
      style={{ marginBottom: "var(--space-4)", ...style }}
      title={title}
      subtitle={null}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--control-gap-tight)" }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-1)",
              borderRadius: 999,
              padding: "var(--space-2) var(--space-3)",
              fontSize: 11,
              color: "var(--text-2)",
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: "var(--text-3)", textTransform: "uppercase", fontSize: 9, marginRight: "var(--space-2)" }}>
              {item.label}
            </span>
            <span style={{ color: "var(--text-1)", fontWeight: 700 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}
