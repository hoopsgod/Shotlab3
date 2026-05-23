import React from "react";

export default function HomeShotsLeaderboardCard({
  title = "TOP 10 HOME SHOTS",
  status = "idle",
  error = "",
  rows = [],
  onRefresh,
}) {
  const renderLoading = () => (
    <div style={{ display: "grid", gap: 8 }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`leaderboard-skeleton-${index}`}
          style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr auto",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid var(--stroke-1)",
            background: "var(--surface-2)",
            opacity: 0.7,
          }}
        >
          <div style={{ height: 16, borderRadius: 8, background: "var(--surface-3)" }} />
          <div style={{ height: 16, borderRadius: 8, background: "var(--surface-3)" }} />
          <div style={{ width: 42, height: 16, borderRadius: 8, background: "var(--surface-3)" }} />
        </div>
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--stroke-1)",
        background: "var(--surface-2)",
        color: "var(--text-2)",
        fontSize: 13,
        padding: "16px 14px",
        fontWeight: 600,
      }}
    >
      <div style={{ color: "var(--text-1)", fontWeight: 700, marginBottom: 4 }}>No leaderboard data yet. Log shots to enter the rankings.</div>
      <div style={{ color: "var(--text-2)", lineHeight: 1.45 }}>No shots logged yet — once players log At Home Shots, leaders will appear here.</div>
    </div>
  );

  const renderError = () => (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,69,69,0.4)",
        background: "rgba(255,69,69,0.08)",
        color: "#FF8B8B",
        fontSize: 13,
        padding: "16px 14px",
      }}
    >
      <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Could not load leaderboard</div>
      <div style={{ marginTop: 6, color: "#FFB5B5" }}>{error || "Please try again."}</div>
      {typeof onRefresh === "function" && (
        <button
          onClick={onRefresh}
          style={{
            marginTop: 10,
            borderRadius: 8,
            border: "1px solid rgba(255,139,139,0.45)",
            background: "transparent",
            color: "#FFE2E2",
            cursor: "pointer",
            padding: "6px 10px",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            fontWeight: 700,
          }}
        >
          Refresh
        </button>
      )}
    </div>
  );

  const renderRows = () => (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.slice(0, 10).map((entry) => (
        <div
          key={`${entry.rank}-${entry.player_display_name}`}
          style={{
            display: "grid",
            gridTemplateColumns: "50px 1fr auto",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid var(--stroke-1)",
            background: "var(--surface-2)",
          }}
        >
          <div
            style={{
              color: "var(--accent)",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "0.03em",
              textAlign: "center",
            }}
          >
            <span style={{ display: "inline-flex", minWidth: 28, justifyContent: "center", borderRadius: 999, padding: "2px 6px", border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)", background: "color-mix(in srgb, var(--accent) 14%, transparent)" }}>#{entry.rank}</span>
          </div>
          <div style={{ color: "var(--text-1)", fontSize: 13, fontWeight: 700, letterSpacing: "0.01em" }}>
            {String(entry.player_display_name || "Player").toUpperCase()}
          </div>
          <div style={{ color: "var(--text-1)", fontSize: 14, fontWeight: 800 }}>{entry.total_home_shots}</div>
        </div>
      ))}
    </div>
  );

  return (
    <section
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--stroke-1)",
        borderRadius: 16,
        padding: 14,
      }}
      aria-live="polite"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ color: "var(--text-1)", fontSize: 12, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{title}</div>
        <div style={{ color: "var(--text-3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Rank 1–10
        </div>
      </div>

      {status === "loading"
        ? renderLoading()
        : status === "idle"
          ? renderEmpty()
        : status === "error"
          ? renderError()
          : rows.length === 0
            ? renderEmpty()
            : renderRows()}
    </section>
  );
}
