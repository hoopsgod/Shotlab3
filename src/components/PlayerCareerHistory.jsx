import { useMemo } from "react";
import { buildPlayerCareerHistory } from "../lib/playerCareerHistory.js";
import { buildPlayerCareerMilestoneStory } from "../lib/playerCareerMilestones.js";
import ShotLabIcon from "./ShotLabIcon";
import styles from "./PlayerCareerHistory.module.css";
import milestoneStyles from "./PlayerCareerMilestoneLadder.module.css";

const number = (value) => Number(value || 0).toLocaleString();
const seasonRange = (season) => [season.seasonStartDate, season.seasonEndDate].filter(Boolean).join(" — ");
const playerName = (player) => String(player?.name || player?.displayName || player?.email || "Athlete").trim();
const initials = (value) => value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SL";

const comparisonLabel = (comparison) => {
  if (!comparison) return "Archive a completed season to unlock a verified year-over-year comparison.";
  if (comparison.delta === 0) return `Current season matches ${comparison.comparedTo} at ${number(comparison.currentValue)} shooting makes.`;
  const gap = Math.abs(comparison.delta);
  const direction = comparison.delta > 0 ? "ahead of" : "behind";
  const percent = comparison.percent == null ? "" : ` · ${Math.abs(comparison.percent)}% ${direction}`;
  return `Current season is ${number(gap)} shooting makes ${direction} ${comparison.comparedTo}${percent}.`;
};

const recordLabel = (season, valueField, suffix) => season
  ? `${season.seasonName} · ${number(season[valueField])}${suffix}`
  : "No completed work yet";

const milestoneStateLabel = (step) => {
  if (step.state === "complete") return `${number(step.value)} makes milestone complete`;
  if (step.state === "current") return `${number(step.value)} makes is the current milestone target`;
  return `${number(step.value)} makes milestone locked`;
};

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
    player, teamId, seasonArchives, currentSeasonName, scores, programScores, shotLogs,
    events, rsvps, scSessions, scRsvps, scLogs,
  }), [player, teamId, seasonArchives, currentSeasonName, scores, programScores, shotLogs, events, rsvps, scSessions, scRsvps, scLogs]);

  const participation = history.career.eventRsvpCount + history.career.scRsvpCount + history.career.scLogCount;
  const identity = playerName(player);
  const milestone = buildPlayerCareerMilestoneStory(history.career.totalShootingMakes);
  const metrics = [
    { label: "Career makes", value: number(history.career.totalShootingMakes), detail: "Verified shooting work", primary: true },
    { label: "At-home makes", value: number(history.career.totalHomeMakes), detail: "Independent training" },
    { label: "Program entries", value: number(history.career.programEntryCount), detail: "Coach-programmed work" },
    { label: "Team participation", value: number(participation), detail: "Events and strength work" },
  ];
  const records = [
    { label: "Best shooting season", value: recordLabel(history.records.bestShootingSeason, "shootingMakes", " makes") },
    { label: "Best at-home season", value: recordLabel(history.records.bestHomeSeason, "totalHomeMakes", " makes") },
    { label: "Most program work", value: recordLabel(history.records.mostProgramEntries, "programScoreCount", " entries") },
  ];

  return (
    <section className={styles.shell} data-testid="player-career-history" data-viewer-role={viewerRole} aria-labelledby={`player-career-history-title-${viewerRole}`}>
      <header className={styles.hero}>
        <div className={styles.identityMark} aria-hidden="true">{initials(identity)}</div>
        <div className={styles.identityCopy}>
          <div className={styles.eyebrow}>{viewerRole === "coach" ? "Coach athlete view" : "Athlete profile"}</div>
          <h2 className={styles.title} id={`player-career-history-title-${viewerRole}`}>{identity}</h2>
          <p className={styles.copy}>A trusted record of current-season work, personal bests, and immutable season history.</p>
          <div className={styles.identityMeta}><span>{currentSeasonName}</span><span>{history.career.seasons} {history.career.seasons === 1 ? "season" : "seasons"}</span></div>
        </div>
        <div className={styles.careerTotal} aria-label={`${number(history.career.totalShootingMakes)} career shooting makes`}><strong>{number(history.career.totalShootingMakes)}</strong><span>Career makes</span></div>
      </header>

      <div className={styles.ledger} aria-label="Career summary">
        {metrics.map((metric) => <div className={`${styles.metric} ${metric.primary ? styles.metricPrimary : ""}`} key={metric.label}><div className={styles.metricLabel}>{metric.label}</div><div className={styles.metricValue}>{metric.value}</div><div className={styles.metricDetail}>{metric.detail}</div></div>)}
      </div>

      <section className={styles.progressBrief}>
        <div className={styles.progressIcon} aria-hidden="true"><ShotLabIcon name="momentum" size={19} /></div>
        <div><div className={styles.sectionLabel}>Season momentum</div><strong data-testid="career-improvement">{comparisonLabel(history.comparison)}</strong></div>
      </section>

      <section className={styles.milestoneCard} data-testid="career-milestone-story" aria-labelledby={`career-milestone-title-${viewerRole}`}>
        <span className={styles.milestoneIcon} aria-hidden="true"><ShotLabIcon name="trophy" size={24} /></span>
        <div className={styles.milestoneBody}>
          <div className={styles.milestoneTopline}><div><div className={styles.sectionLabel}>Career milestone</div><h3 id={`career-milestone-title-${viewerRole}`}>{milestone.title}</h3></div><strong>{Math.round(milestone.progress)}%</strong></div>
          <div className={styles.milestoneTrack} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(milestone.progress)} aria-label={milestone.complete ? "Highest career milestone complete" : `Progress toward ${number(milestone.next)} career makes`}><span style={{ width: `${milestone.progress}%` }} /></div>
          <div className={styles.milestoneFooter}><p>{milestone.detail}</p><span>{milestone.status}</span></div>
          <ol className={milestoneStyles.ladder} aria-label="Career shooting milestone ladder" data-testid="career-milestone-ladder">
            {milestone.ladder.map((step) => (
              <li
                className={milestoneStyles.step}
                data-state={step.state}
                aria-current={step.state === "current" ? "step" : undefined}
                aria-label={milestoneStateLabel(step)}
                key={step.value}
              >
                <span className={milestoneStyles.dot} aria-hidden="true">{step.state === "complete" ? <ShotLabIcon name="check" size={12} /> : null}</span>
                <strong aria-hidden="true">{step.label}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.recordsSection} aria-label="Personal records">
        <div className={styles.sectionHeading}><div><div className={styles.sectionLabel}>Personal records</div><h3>Career bests</h3></div><p>Recognition without collapsing unlike metrics into one score.</p></div>
        <div className={styles.records}>{records.map((record, index) => <article className={styles.record} key={record.label}><span className={styles.recordNumber}>0{index + 1}</span><div><div className={styles.sectionLabel}>{record.label}</div><strong>{record.value}</strong></div></article>)}</div>
      </section>

      <section className={styles.seasonSection}>
        <div className={styles.sectionHeading}><div><div className={styles.sectionLabel}>Career timeline</div><h3>Season by season</h3></div><p>Current activity stays live. Completed seasons remain preserved.</p></div>
        <div className={styles.seasonList} data-testid="career-season-list">
          {history.seasons.map((season, index) => (
            <article className={`${styles.season} ${season.isCurrent ? styles.seasonCurrent : ""}`} key={`${season.isCurrent ? "current" : season.archiveId}-${season.seasonName}`}>
              <div className={styles.timelineRail} aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className={styles.seasonIdentity}><div className={styles.seasonName}>{season.seasonName}</div><div className={styles.seasonRange}>{season.isCurrent ? "Active season" : seasonRange(season) || "Archived season"}</div></div>
              <div className={styles.seasonMetrics}>{[["Shooting", season.shootingMakes], ["Home", season.totalHomeMakes], ["Program", season.programScoreCount]].map(([label, value]) => <div key={label}><div className={styles.seasonMetricValue}>{number(value)}</div><div className={styles.seasonMetricLabel}>{label}</div></div>)}</div>
              {season.isCurrent ? <span className={`${styles.status} ${styles.statusCurrent}`}>Current</span> : typeof onOpenArchive === "function" && season.archiveId ? <button className={styles.archiveButton} type="button" onClick={() => onOpenArchive(season.archiveId)} aria-label={`View archive ${season.seasonName}`}>View archive</button> : <span className={styles.status}>Archived</span>}
            </article>
          ))}
        </div>
      </section>

      {!history.hasHistory && <div className={styles.empty}><ShotLabIcon name="training" size={24} /><strong>Your career record starts here.</strong><span>The first logged workout and every completed season archive will appear automatically.</span></div>}
    </section>
  );
}
