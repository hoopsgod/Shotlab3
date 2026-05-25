import React from "react";

const DEFAULT_PLAYER_EMPTY = "No leaderboard data yet. Log shots to enter the rankings.";
const DEFAULT_COACH_EMPTY = "No team leaderboard data yet. Players will appear here after they log shots.";

const compactCardStyle = {
  background: "var(--surface-1)",
  border: "1px solid var(--stroke-1)",
  borderRadius: 14,
  padding: "12px 12px 10px",
};

export default function CompactLeaderboardPreviewCard({
  title = "Team Leaders",
  rows = [],
  status = "idle",
  mode = "player",
  userEmail = "",
  emptyMessage,
  maxRows,
  areaTitle = "Leaderboards",
  categoryLabel = "Home Shots",
  fullLeaderboardHref = "",
  onViewAll,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const isCoachMode = mode === "coach";
  const limit = Number.isFinite(maxRows) ? maxRows : isCoachMode ? 5 : 3;
  const normalizedUser = String(userEmail || "").trim().toLowerCase();
  const playerRank = normalizedUser
    ? safeRows.find((row) => String(row?.email || "").trim().toLowerCase() === normalizedUser)?.rank
    : null;

  const previewRows = safeRows.slice(0, Math.max(1, limit));
  const message = emptyMessage || (isCoachMode ? DEFAULT_COACH_EMPTY : DEFAULT_PLAYER_EMPTY);
  const hasRows = status === "success" && previewRows.length > 0;

  return (
    <section style={{...compactCardStyle,boxShadow:"0 10px 24px rgba(0,0,0,0.22)",border:"1px solid color-mix(in srgb,var(--accent) 24%, var(--stroke-1))"}} aria-live="polite">
      <div style={{ color: "var(--accent)", fontSize: 10, fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 8 }}>{areaTitle}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ color: "var(--text-1)", fontSize: 13, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</div>
        <div style={{ color: "var(--accent)", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", border:"1px solid color-mix(in srgb,var(--accent) 40%, transparent)", borderRadius:999, padding:"2px 8px", background:"color-mix(in srgb,var(--accent) 12%, transparent)" }}>{categoryLabel}</div>
        {!isCoachMode && (
          <div style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 700 }}>
            {playerRank ? `Your rank: #${playerRank}` : "Your rank: —"}
          </div>
        )}
      </div>

      {hasRows ? (
        <div style={{ display: "grid", gap: 7, marginTop: 9 }}>
          {previewRows.map((entry) => (
            <div key={`${entry.rank}-${entry.player_display_name}`} style={{ display: "grid", gridTemplateColumns: "40px 1fr auto", alignItems: "center", gap: 9, borderRadius: 10, border: "1px solid var(--stroke-1)", background: "var(--surface-2)", padding: "7px 10px" }}>
              <div style={{ color: "var(--accent)", fontSize: 12, fontWeight: 800 }}>#{entry.rank}</div>
              <div style={{ color: "var(--text-1)", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.player_display_name || "Player"}</div>
              <div style={{ color: "var(--text-2)", fontSize: 12, fontWeight: 700 }}>{entry.total_home_shots}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 9, borderRadius: 10, border: "1px solid var(--stroke-1)", background: "var(--surface-2)", color: "var(--text-2)", fontSize: 12, lineHeight: 1.45, padding: "10px 11px", fontWeight: 600 }}>
          {message}
        </div>
      )}
      {typeof onViewAll === "function" ? (
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={onViewAll} style={{ border:"none", background:"transparent", color:"var(--accent)", fontSize:11, fontWeight:800, letterSpacing:"0.03em", padding:0, cursor:"pointer" }}>
            View all leaderboards
          </button>
        </div>
      ) : fullLeaderboardHref ? (
        <div style={{ marginTop: 8 }}>
          <a href={fullLeaderboardHref} style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
            View all leaderboards
          </a>
        </div>
      ) : null}
    </section>
  );
}
