import React from "react";
import { resolveLeaderboardDataState } from "../lib/leaderboardSelectors.js";
import ShotLabIcon from "./ShotLabIcon.jsx";
import ShotLabPerformanceMark from "./ShotLabPerformanceMark.jsx";
import ShotLabStatePanel from "./ShotLabStatePanel.jsx";

const DEFAULT_PLAYER_EMPTY = "No leaderboard data yet. Log shots to enter the rankings.";
const DEFAULT_COACH_EMPTY = "No team leaderboard data yet. Players will appear here after they log shots.";
const DEFAULT_ERROR = "Leaderboard data is temporarily unavailable. Saved training results are still safe.";
export default function CompactLeaderboardPreviewCard({
  title = "Team Leaders",
  rows = [],
  status = "idle",
  error = "",
  teamId = "",
  mode = "player",
  userEmail = "",
  emptyMessage,
  errorMessage,
  loadingMessage = "Loading leaderboard data…",
  maxRows,
  areaTitle = "Leaderboards",
  categoryLabel = "Home Shots",
  fullLeaderboardHref = "",
  onViewAll,
  onRetry,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const isCoachMode = mode === "coach";
  const limit = Number.isFinite(maxRows) ? maxRows : isCoachMode ? 5 : 3;
  const normalizedUser = String(userEmail || "").trim().toLowerCase();
  const playerRank = safeRows.find((row) => row?.isCurrentUser === true
    || row?.is_current_user === true
    || (normalizedUser && String(row?.email || "").trim().toLowerCase() === normalizedUser))?.rank || null;

  const previewRows = safeRows.slice(0, Math.max(1, limit));
  const dataState = resolveLeaderboardDataState({ status, rows: previewRows, error, teamId: teamId || "preview" });
  const displayState = dataState.kind;
  const emptyCopy = emptyMessage || (isCoachMode ? DEFAULT_COACH_EMPTY : DEFAULT_PLAYER_EMPTY);
  const message = displayState === "loading"
    ? loadingMessage
    : ["error", "permission", "unavailable", "missing_context", "stale"].includes(displayState)
      ? (dataState.message || errorMessage || DEFAULT_ERROR)
      : emptyCopy;
  const recoveryState = displayState === "loading" ? "loading" : ["error", "permission", "unavailable", "missing_context"].includes(displayState) ? "error" : "empty";
  const recoveryTitle = displayState === "loading"
    ? "Syncing team rankings"
    : displayState === "permission"
      ? "Rankings are protected"
      : displayState === "unavailable"
        ? "Rankings are unavailable"
        : displayState === "missing_context"
          ? "Choose a team first"
          : displayState === "error"
            ? "Rankings need a retry"
      : isCoachMode ? "Recognition starts with activity" : "Your ranking starts with a result";
  const keepsRankingFrame = ["ready", "refreshing", "stale", "empty"].includes(displayState);

  return (
    <section
      style={{borderTop:"1px solid var(--stroke-1)",borderBottom:"1px solid var(--stroke-1)",padding:"13px 0 11px"}}
      aria-live="polite"
      aria-busy={displayState === "loading"}
      data-testid="compact-leaderboard-preview"
      data-viewer-role={mode}
      data-data-state={displayState}
    >
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

      {keepsRankingFrame ? (
        <div
          style={{ display: "grid", marginTop: 10 }}
          data-testid={displayState === "ready" ? "leaderboard-ready-state" : "leaderboard-empty-state"}
          data-state={displayState}
        >
          {displayState === "stale" ? <div role="status" style={{ minHeight:40, display:"grid", alignContent:"center", borderBottom:"1px solid var(--stroke-1)", padding:"4px 2px 8px" }}>
            <div style={{ color:"var(--text-2)", fontSize:11, fontWeight:800 }}>Showing your last confirmed rankings</div>
            <div style={{ color:"var(--text-3)", fontSize:10, lineHeight:1.35, marginTop:2 }}>{message}</div>
            {typeof onRetry === "function" ? <button type="button" onClick={onRetry} style={{ justifySelf:"start", minHeight:36, marginTop:5, border:0, background:"transparent", color:"var(--accent)", fontSize:11, fontWeight:800, padding:0, cursor:"pointer" }}>Retry leaderboard</button> : null}
          </div> : null}
          {displayState === "refreshing" ? <div role="status" style={{ minHeight:32, display:"flex", alignItems:"center", borderBottom:"1px solid var(--stroke-1)", padding:"4px 2px 8px", color:"var(--text-3)", fontSize:10, fontWeight:800 }}>Refreshing rankings…</div> : null}
          {displayState === "empty" ? <div style={{ minHeight:84, display:"grid", alignContent:"center", borderBottom:"1px solid var(--stroke-1)", padding:"8px 2px" }}>
            <div style={{ color:"var(--text-2)", fontSize:11, fontWeight:800 }}>{recoveryTitle}</div>
            <div style={{ color:"var(--text-3)", fontSize:10, lineHeight:1.35, marginTop:2 }}>{message}</div>
          </div> : null}
          {previewRows.map((entry,index) => {
            const displayName = entry.player_display_name || entry.displayName || entry.name || (entry.email ? String(entry.email).split("@")[0] : "Player");
            const scoreValue = entry.metricValue ?? entry.total_home_shots ?? entry.score ?? entry.total ?? "";
            const currentPlayer = entry?.isCurrentUser === true
              || entry?.is_current_user === true
              || (normalizedUser && String(entry?.email || "").trim().toLowerCase() === normalizedUser);
            const rank = Number(entry.rank) || index + 1;
            const premiumRank = rank <= 3;
            return <div key={`${entry.rank}-${displayName}`} data-leaderboard-rank={rank} style={{ display: "grid", gridTemplateColumns: premiumRank ? "44px 1fr auto" : "34px 1fr auto", alignItems: "center", gap: 9, borderTop:index===0?"none":"1px solid var(--stroke-1)", padding: premiumRank ? "8px 2px" : "10px 2px", background:index===0?"linear-gradient(90deg, color-mix(in srgb,var(--accent) 7%, transparent), transparent)":"transparent" }}>
              {premiumRank
                ? <ShotLabPerformanceMark kind="rank" value={rank} compact testId={`leaderboard-rank-mark-${rank}`} />
                : <div style={{ color: "var(--text-3)", fontSize: 12, fontWeight: 900 }}>#{rank}</div>}
              <div style={{ color: currentPlayer?"var(--accent)":"var(--text-1)", fontSize: 13, fontWeight: index===0?800:700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
              <div style={{ color: index===0?"var(--text-1)":"var(--text-2)", fontSize: 13, fontWeight: 800 }}>{scoreValue}</div>
            </div>;
          })}
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          <ShotLabStatePanel
            state={recoveryState}
            eyebrow={displayState === "loading" ? "Live team data" : "Data recovery"}
            title={recoveryTitle}
            detail={message}
            actionLabel={["error", "permission", "unavailable"].includes(displayState) && typeof onRetry === "function" ? "Retry leaderboard" : undefined}
            onAction={["error", "permission", "unavailable"].includes(displayState) ? onRetry : undefined}
            compact
            surface="light"
            testId={`leaderboard-${displayState}-state`}
          />
        </div>
      )}
      {typeof onViewAll === "function" ? (
        <div style={{ marginTop: 6 }}>
          <button type="button" onClick={onViewAll} style={{ border:"none", background:"transparent", color:"var(--accent)", fontSize:11, fontWeight:800, letterSpacing:"0.03em", minHeight:44, display:"inline-flex", alignItems:"center", gap:6, padding:"0 4px", marginLeft:-4, cursor:"pointer" }}>
            <span>View all leaderboards</span><ShotLabIcon name="arrow" size={14} aria-hidden="true" />
          </button>
        </div>
      ) : fullLeaderboardHref ? (
        <div style={{ marginTop: 6 }}>
          <a href={fullLeaderboardHref} style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700, textDecoration: "none", minHeight:44, display:"inline-flex", alignItems:"center", gap:6, padding:"0 4px", marginLeft:-4 }}>
            <span>View all leaderboards</span><ShotLabIcon name="arrow" size={14} aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </section>
  );
}
