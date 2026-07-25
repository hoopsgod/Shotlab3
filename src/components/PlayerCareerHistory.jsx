import { useMemo } from "react";
import { buildPlayerCareerHistory } from "../lib/playerCareerHistory.js";

const styles = {
  shell: { background: "linear-gradient(155deg, rgba(200,255,0,.08), rgba(18,18,18,.98) 36%)", border: "1px solid rgba(200,255,0,.25)", borderRadius: 16, padding: 14, marginBottom: 18 },
  eyebrow: { color: "var(--accent, #c8ff00)", fontSize: 10, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" },
  title: { color: "var(--text-1, #fff)", fontSize: 20, fontWeight: 900, marginTop: 4 },
  copy: { color: "var(--text-3, #aaa)", fontSize: 11, lineHeight: 1.5, marginTop: 5 },
  metricGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 12 },
  metric: { background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 11, padding: "10px 9px" },
  season: { border: "1px solid rgba(255,255,255,.11)", borderRadius: 12, padding: 11, background: "rgba(255,255,255,.018)" },
};

const number = (value) => Number(value || 0).toLocaleString();
const seasonRange = (season) => [season.seasonStartDate, season.seasonEndDate].filter(Boolean).join(" — ");
const improvementLabel = (improvement) => {
  if (!improvement) return "Archive a completed season to unlock season-over-season shooting progress.";
  if (improvement.delta === 0) return `Even with ${improvement.comparedTo}`;
  const direction = improvement.delta > 0 ? "+" : "";
  const pct = improvement.percent == null ? "" : ` (${direction}${improvement.percent}%)`;
  return `${direction}${number(improvement.delta)} shooting makes vs ${improvement.comparedTo}${pct}`;
};

export default function PlayerCareerHistory({
  player,
  teamId,
  seasonArchives = [],
  currentSeasonName = "Current Season",
  scores = [],
  programScores = [],
  shotLogs = [],
  rsvps = [],
  scRsvps = [],
  scLogs = [],
  viewerRole = "player",
  onOpenArchive,
}) {
  const history = useMemo(() => buildPlayerCareerHistory({
    player,
    teamId,
    seasonArchives,
    currentSeasonName,
    scores,
    programScores,
    shotLogs,
    rsvps,
    scRsvps,
    scLogs,
  }), [player, teamId, seasonArchives, currentSeasonName, scores, programScores, shotLogs, rsvps, scRsvps, scLogs]);

  const metrics = [
    ["Career Shooting Makes", number(history.career.totalShootingMakes)],
    ["Seasons", history.career.seasons],
    ["Home Makes", number(history.career.totalHomeMakes)],
    ["Shot-Log Makes", number(history.career.totalShotLogMakes)],
    ["Program Entries", number(history.career.programEntryCount)],
    ["Team Participation", number(history.career.eventRsvpCount + history.career.scRsvpCount + history.career.scLogCount)],
  ];

  return <section data-testid="player-career-history" data-viewer-role={viewerRole} style={styles.shell}>
    <div style={styles.eyebrow}>{viewerRole === "coach" ? "Coach career view" : "Player career"}</div>
    <div style={styles.title}>CAREER HISTORY</div>
    <div style={styles.copy}>Current activity is combined with immutable season archives. Shooting makes, program entries, and participation remain separate so unlike drill scores are never added together.</div>

    <div style={styles.metricGrid}>
      {metrics.map(([label, value]) => <div key={label} style={styles.metric}>
        <div style={{ color: "var(--text-3, #aaa)", fontSize: 9, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase" }}>{label}</div>
        <div style={{ color: "var(--text-1, #fff)", fontSize: 21, fontWeight: 900, marginTop: 4 }}>{value}</div>
      </div>)}
    </div>

    <div style={{ marginTop: 14, padding: 11, borderRadius: 11, border: "1px solid rgba(200,255,0,.22)", background: "rgba(200,255,0,.055)" }}>
      <div style={{ color: "var(--accent, #c8ff00)", fontSize: 9, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>Season-over-season shooting</div>
      <div data-testid="career-improvement" style={{ color: "var(--text-1, #fff)", fontSize: 12, fontWeight: 800, marginTop: 5 }}>{improvementLabel(history.improvement)}</div>
    </div>

    <div style={{ marginTop: 15 }}>
      <div style={{ color: "var(--text-2, #ddd)", fontSize: 11, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Personal records</div>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ color: "var(--text-3, #aaa)", fontSize: 11 }}>Best shooting season: <strong style={{ color: "var(--text-1, #fff)" }}>{history.records.bestShootingSeason?.seasonName || "No season yet"}{history.records.bestShootingSeason ? ` · ${number(history.records.bestShootingSeason.shootingMakes)} makes` : ""}</strong></div>
        <div style={{ color: "var(--text-3, #aaa)", fontSize: 11 }}>Best home-makes season: <strong style={{ color: "var(--text-1, #fff)" }}>{history.records.bestHomeSeason?.seasonName || "No season yet"}{history.records.bestHomeSeason ? ` · ${number(history.records.bestHomeSeason.totalHomeMakes)}` : ""}</strong></div>
        <div style={{ color: "var(--text-3, #aaa)", fontSize: 11 }}>Most program entries: <strong style={{ color: "var(--text-1, #fff)" }}>{history.records.mostProgramEntries?.seasonName || "No season yet"}{history.records.mostProgramEntries ? ` · ${number(history.records.mostProgramEntries.programScoreCount)}` : ""}</strong></div>
      </div>
    </div>

    <div style={{ marginTop: 16 }}>
      <div style={{ color: "var(--text-2, #ddd)", fontSize: 11, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Season by season</div>
      <div data-testid="career-season-list" style={{ display: "grid", gap: 8 }}>
        {history.seasons.map((season) => <article key={`${season.isCurrent ? "current" : season.archiveId}-${season.seasonName}`} style={styles.season}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "var(--text-1, #fff)", fontSize: 12, fontWeight: 900 }}>{season.seasonName}</div>
              <div style={{ color: "var(--text-3, #aaa)", fontSize: 9, marginTop: 2 }}>{season.isCurrent ? "Active season" : seasonRange(season) || "Archived season"}</div>
            </div>
            <span style={{ flexShrink: 0, borderRadius: 999, border: `1px solid ${season.isCurrent ? "rgba(200,255,0,.38)" : "rgba(255,255,255,.16)"}`, color: season.isCurrent ? "var(--accent, #c8ff00)" : "var(--text-3, #aaa)", padding: "3px 7px", fontSize: 8, fontWeight: 900, textTransform: "uppercase" }}>{season.isCurrent ? "Current" : "Archived"}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6, marginTop: 9 }}>
            {[["Shooting", season.shootingMakes], ["Home", season.totalHomeMakes], ["Program Entries", season.programScoreCount]].map(([label, value]) => <div key={label} style={{ minWidth: 0 }}><div style={{ color: "var(--text-1, #fff)", fontSize: 14, fontWeight: 900 }}>{number(value)}</div><div style={{ color: "var(--text-3, #aaa)", fontSize: 8, textTransform: "uppercase" }}>{label}</div></div>)}
          </div>
          {!season.isCurrent && season.archiveId && typeof onOpenArchive === "function" && <button type="button" onClick={() => onOpenArchive(season.archiveId)} style={{ marginTop: 9, border: 0, background: "transparent", color: "var(--accent, #c8ff00)", padding: 0, fontSize: 10, fontWeight: 900, cursor: "pointer" }}>VIEW ARCHIVE →</button>}
        </article>)}
      </div>
    </div>

    {!history.hasHistory && <div style={{ color: "var(--text-3, #aaa)", fontSize: 11, lineHeight: 1.5, marginTop: 12 }}>No career activity yet. Current work and completed season archives will appear here automatically.</div>}
  </section>;
}
