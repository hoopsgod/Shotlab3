import React from "react";

const rhythm = { card: 14, sectionGap: 10, rowGap: 8 };

export default function HomeShotsLeaderboardCard({
  title = "TOP 10 HOME SHOTS",
  status = "idle",
  error = "",
  rows = [],
  onRetry,
}) {
  const renderLoading = () => (
    <div role="status" aria-live="polite" style={{ borderRadius: 12, border: "1px solid var(--stroke-1)", background: "var(--surface-2)", padding: "14px" }}>
      <div style={{ color: "var(--text-2)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Loading leaderboard…</div>
      <div style={{ display: "grid", gap: rhythm.rowGap }}>
        {Array.from({ length: 5 }).map((_, index) => <div key={index} className="tb" style={{ height: 10, borderRadius: 999, width: `${index === 4 ? 72 : 100}%`, background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.13), rgba(255,255,255,0.03))" }} />)}
      </div>
    </div>
  );

  const renderEmpty = () => (
    <div style={{ borderRadius: 12, border: "1px solid var(--stroke-1)", background: "var(--surface-2)", color: "var(--text-2)", fontSize: 13, lineHeight: 1.45, padding: "14px 12px", fontWeight: 600 }}>
      <div style={{ color: "var(--text-1)", fontWeight: 700, marginBottom: 4 }}>No shots logged yet — once players log At Home Shots, leaders will appear here.</div>
      <div style={{ color: "var(--text-2)" }}>Nothing to show yet — once your team starts using ShotLab, this section will fill in.</div>
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
      {typeof onRetry === "function" && (
        <button
          onClick={onRetry}
          style={{ marginTop: 10, borderRadius: 10, border: "1px solid rgba(255,139,139,0.45)", background: "transparent", color: "#FFE2E2", cursor: "pointer", minHeight: 36, padding: "6px 10px", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700 }}
        >
          Retry
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
    <section style={{ background: "var(--surface-1)", border: "1px solid var(--stroke-1)", borderRadius: 16, padding: rhythm.card }} aria-live="polite">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: rhythm.rowGap, marginBottom: rhythm.sectionGap }}>
        <div style={{ color: "var(--text-1)", fontSize: 12, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", lineHeight: 1.2 }}>{title}</div>
        <div style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.2 }}>Rank 1–10</div>
      </div>

      {status === "loading" || status === "idle"
        ? renderLoading()
        : status === "error"
          ? renderError()
          : rows.length === 0
            ? renderEmpty()
            : renderRows()}
    </section>
  );
}
