import { useMemo } from "react";
import { buildPlayerCareerHistory } from "../lib/playerCareerHistory.js";
import styles from "./PlayerCareerHistory.module.css";

const number = (value) => Number(value || 0).toLocaleString();
const seasonRange = (season) => [season.seasonStartDate, season.seasonEndDate].filter(Boolean).join(" — ");

const comparisonLabel = (comparison) => {
  if (!comparison) return "Archive a completed season to unlock a verified year-over-year comparison.";
  if (comparison.delta === 0) return `Current season matches ${comparison.comparedTo} at ${number(comparison.currentValue)} shooting makes.`;
  const gap = Math.abs(comparison.delta);
  const direction = comparison.delta > 0 ? "ahead of" : "behind";
  const percent = comparison.percent == null ? "" : ` · ${Math.abs(comparison.percent)}% ${direction}`;
  return `Current season is ${number(gap)} shooting makes ${direction} ${comparison.comparedTo}${percent}.`;
};

const recordLabel = (season, valueField, suffix) => (
  season
    ? `${season.seasonName} · ${number(season[valueField])}${suffix}`
    : "No completed work yet"
);

export default function PlayerCareerHistory({
  player,
  teamId,
  seasonArchives = [],
  currentSeasonName = "Current Season",
  scores = [],
  programScores = [],
  shotLogs = [],
  events = [],
  rsvps = [],
  scSessions = [],
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
    events,
    rsvps,
    scSessions,
    scRsvps,
    scLogs,
  }), [
    player,
    teamId,
    seasonArchives,
    currentSeasonName,
    scores,
    programScores,
    shotLogs,
    events,
    rsvps,
    scSessions,
    scRsvps,
    scLogs,
  ]);

  const participation = history.career.eventRsvpCount
    + history.career.scRsvpCount
    + history.career.scLogCount;
  const metrics = [
    { label: "Career shooting makes", value: number(history.career.totalShootingMakes), primary: true },
    { label: "Home makes", value: number(history.career.totalHomeMakes) },
    { label: "Program entries", value: number(history.career.programEntryCount) },
    { label: "Team participation", value: number(participation) },
  ];
  const records = [
    {
      label: "Best shooting season",
      value: recordLabel(history.records.bestShootingSeason, "shootingMakes", " makes"),
    },
    {
      label: "Best at-home season",
      value: recordLabel(history.records.bestHomeSeason, "totalHomeMakes", " makes"),
    },
    {
      label: "Most program work",
      value: recordLabel(history.records.mostProgramEntries, "programScoreCount", " entries"),
    },
  ];

  return (
    <section
      className={styles.shell}
      data-testid="player-career-history"
      data-viewer-role={viewerRole}
      aria-labelledby={`player-career-history-title-${viewerRole}`}
    >
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>{viewerRole === "coach" ? "Coach career view" : "Player career"}</div>
          <h2 className={styles.title} id={`player-career-history-title-${viewerRole}`}>Career History</h2>
          <p className={styles.copy}>
            Current work and immutable season archives in one trusted record. Shooting,
            Program entries, and participation stay separate so unlike metrics are never combined.
          </p>
        </div>
        <div className={styles.seasonCount} aria-label={`${history.career.seasons} seasons`}>
          <strong>{history.career.seasons}</strong>
          <span>Seasons</span>
        </div>
      </div>

      <div className={styles.metrics}>
        {metrics.map((metric) => (
          <div className={`${styles.metric} ${metric.primary ? styles.metricPrimary : ""}`} key={metric.label}>
            <div className={styles.metricLabel}>{metric.label}</div>
            <div className={styles.metricValue}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.comparison}>
        <div className={styles.comparisonIcon} aria-hidden="true">↗</div>
        <div>
          <div className={styles.sectionLabel}>Current season vs last archive</div>
          <strong data-testid="career-improvement">{comparisonLabel(history.comparison)}</strong>
        </div>
      </div>

      <div className={styles.records} aria-label="Personal records">
        {records.map((record) => (
          <div className={styles.record} key={record.label}>
            <div className={styles.sectionLabel}>{record.label}</div>
            <strong>{record.value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.seasonSection}>
        <div className={styles.sectionLabel}>Season by season</div>
        <div className={styles.seasonList} data-testid="career-season-list">
          {history.seasons.map((season) => (
            <article
              className={styles.season}
              key={`${season.isCurrent ? "current" : season.archiveId}-${season.seasonName}`}
            >
              <div className={styles.seasonIdentity}>
                <div className={styles.seasonName}>{season.seasonName}</div>
                <div className={styles.seasonRange}>
                  {season.isCurrent ? "Active season" : seasonRange(season) || "Archived season"}
                </div>
              </div>
              <div className={styles.seasonMetrics}>
                {[
                  ["Shooting", season.shootingMakes],
                  ["Home", season.totalHomeMakes],
                  ["Program", season.programScoreCount],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className={styles.seasonMetricValue}>{number(value)}</div>
                    <div className={styles.seasonMetricLabel}>{label}</div>
                  </div>
                ))}
              </div>
              {season.isCurrent ? (
                <span className={`${styles.status} ${styles.statusCurrent}`}>Current</span>
              ) : typeof onOpenArchive === "function" && season.archiveId ? (
                <button
                  className={styles.archiveButton}
                  type="button"
                  onClick={() => onOpenArchive(season.archiveId)}
                  aria-label={`View archive ${season.seasonName}`}
                >
                  View archive
                </button>
              ) : (
                <span className={styles.status}>Archived</span>
              )}
            </article>
          ))}
        </div>
      </div>

      {!history.hasHistory && (
        <div className={styles.empty}>
          No career activity yet. The first logged workout and every completed season archive will
          appear here automatically.
        </div>
      )}
    </section>
  );
}
