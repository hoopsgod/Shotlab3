import React from "react";

const DEFAULT_PLAYER_EMPTY = "No leaderboard data yet. Log shots to enter the rankings.";
const DEFAULT_COACH_EMPTY = "No team leaderboard data yet. Players will appear here after they log shots.";

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
  const playerRank = safeRows.find((row) => row?.isCurrentUser === true
    || row?.is_current_user === true
    || (normalizedUser && String(row?.email || "").trim().toLowerCase() === normalizedUser))?.rank || null;

  const previewRows = safeRows.slice(0, Math.max(1, limit));
  const message = emptyMessage || (isCoachMode ? DEFAULT_COACH_EMPTY : DEFAULT_PLAYER_EMPTY);
  const hasRows = status === "success" && previewRows.length > 0;

  return (
    <section style={{borderTop:"1px solid var(--stroke-1)",borderBottom:"1px solid var(--stroke-1)",padding:"13px 0 11px"}} aria-live="polite" data-testid="compact-leaderboard-preview">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
        <div>
          <div style={{ color: "var(--accent)", fontSize: 10, fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase" }}>{areaTitle}</div>
          <div style={{ color: "var(--text-1)", fontSize: 16, fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", marginTop:3 }}>{title}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{ color: "var(--text-3)", fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{categoryLabel}</div>
          {!isCoachMode ? <div style={{ color: playerRank ? "var(--accent)" : "var(--text-3)", fontSize: 11, fontWeight: 700, marginTop:3 }}>{playerRank ? `Your rank #${playerRank}` : "Your rank —"}</div> : null}
        </div>
      </div>

      {hasRows ? (
        <div style={{ display: "grid", marginTop: 10 }}>
          {previewRows.map((entry,index) => {
            const displayName = entry.player_display_name || entry.displayName || entry.name || (entry.email ? String(entry.email).split("@")[0] : "Player");
            const scoreValue = entry.metricValue ?? entry.total_home_shots ?? entry.score ?? entry.total ?? "";
            const currentPlayer = entry?.isCurrentUser === true
              || entry?.is_current_user === true
              || (normalizedUser && String(entry?.email || "").trim().toLowerCase() === normalizedUser);
            return <div key={`${entry.rank}-${displayName}`} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", alignItems: "center", gap: 9, borderTop:index===0?"none":"1px solid var(--stroke-1)", padding: "10px 2px", background:index===0?"linear-gradient(90deg, color-mix(in srgb,var(--accent) 7%, transparent), transparent)":"transparent" }}>
              <div style={{ color: index===0?"var(--accent)":"var(--text-3)", fontSize: index===0?14:12, fontWeight: 900 }}>#{entry.rank}</div>
              <div style={{ color: currentPlayer?"var(--accent)":"var(--text-1)", fontSize: 13, fontWeight: index===0?800:700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
              <div style={{ color: index===0?"var(--text-1)":"var(--text-2)", fontSize: 13, fontWeight: 800 }}>{scoreValue}</div>
            </div>;
          })}
        </div>
      ) : (
        <div style={{ marginTop: 10, borderTop: "1px solid var(--stroke-1)", color: "var(--text-2)", fontSize: 12, lineHeight: 1.45, padding: "11px 2px 2px", fontWeight: 600 }}>
          {message}
        </div>
      )}
      {typeof onViewAll === "function" ? (
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={onViewAll} style={{ border:"none", background:"transparent", color:"var(--accent)", fontSize:11, fontWeight:800, letterSpacing:"0.03em", padding:"4px 0", cursor:"pointer" }}>
            View all leaderboards →
          </button>
        </div>
      ) : fullLeaderboardHref ? (
        <div style={{ marginTop: 8 }}>
          <a href={fullLeaderboardHref} style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
            View all leaderboards →
          </a>
        </div>
      ) : null}
    </section>
  );
}
