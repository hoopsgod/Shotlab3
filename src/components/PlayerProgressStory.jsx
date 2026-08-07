import { useMemo } from "react";
import { derivePlayerProgressStory } from "../lib/playerProgressStory.js";
import styles from "./PlayerProgressStory.module.css";

function TrendSparkline({ points = [] }) {
  const values = points.map((point) => Number(point?.made) || 0);
  const max = Math.max(...values, 1);
  const width = 260;
  const height = 66;
  const polyline = values.map((value, index) => {
    const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * width;
    const y = height - 8 - ((value / max) * (height - 18));
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  return (
    <svg className={styles.sparkline} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Fourteen day at-home make trend" preserveAspectRatio="none">
      <line x1="0" y1={height - 8} x2={width} y2={height - 8} className={styles.sparkTrack} />
      <polyline points={polyline} className={styles.sparkPath} />
    </svg>
  );
}

function SignalCard({ eyebrow, title, detail, testId }) {
  return (
    <article className={styles.signalCard} data-testid={testId}>
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </article>
  );
}

export default function PlayerProgressStory({
  userName = "Player",
  userEmail = "",
  teamId = "",
  shotLogs = [],
  scores = [],
  programScores = [],
  drills = [],
  programDrills = [],
  streak = 0,
  coachPriorities = {},
  today,
  onStartTraining,
  onOpenFullProfile,
}) {
  const story = useMemo(() => derivePlayerProgressStory({
    userEmail,
    teamId,
    shotLogs,
    scores,
    programScores,
    drills,
    programDrills,
    streak,
    coachPriorities,
    today,
  }), [userEmail, teamId, shotLogs, scores, programScores, drills, programDrills, streak, coachPriorities, today]);

  const trendWord = story.trend === "rising" ? "RISING" : story.trend === "cooling" ? "RESET" : "STEADY";
  const firstName = String(userName || "Player").trim().split(/\s+/)[0] || "Player";

  return (
    <section className={styles.root} data-testid="player-progress-story" data-trend={story.trend}>
      <div className={styles.hero} data-testid="player-progress-story-hero">
        <div className={styles.heroTopline}>
          <span>DEVELOPMENT STORY</span>
          <span data-testid="player-progress-trend-badge">{trendWord}</span>
        </div>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span className={styles.playerLabel}>{firstName.toUpperCase()} · LAST 14 DAYS</span>
            <h2>{story.headline}</h2>
            <p>{story.trendDetail}</p>
          </div>
          <div className={styles.trendPanel} data-testid="player-progress-trend-chart">
            <div>
              <span>AT-HOME VOLUME</span>
              <strong>{story.recent7Makes}</strong>
              <small>makes · last 7 days</small>
            </div>
            <TrendSparkline points={story.dailyMakes} />
          </div>
        </div>
        <div className={styles.metricStrip} data-testid="player-progress-metrics">
          <div><span>ACTIVE DAYS</span><strong>{story.activeDays7}<small>/7</small></strong></div>
          <div><span>LIVE RHYTHM</span><strong>{story.currentStreak}<small>D</small></strong></div>
          <div><span>RECENT PBS</span><strong>{story.pbCount30}<small>30D</small></strong></div>
        </div>
      </div>

      <div className={styles.readoutHeader}>
        <div>
          <span>DEVELOPMENT READOUT</span>
          <h3>What the work says now</h3>
        </div>
        <p>{story.evidenceLabel}</p>
      </div>

      <div className={styles.signalGrid}>
        <SignalCard {...story.strongest} testId="player-progress-strongest-signal" />
        <SignalCard {...story.opportunity} testId="player-progress-opportunity" />
      </div>

      <article className={styles.nextFocus} data-testid="player-progress-next-focus">
        <div className={styles.nextFocusCopy}>
          <span>{story.nextFocus.label}</span>
          <strong>{story.nextFocus.title}</strong>
          <p>{story.nextFocus.detail}</p>
        </div>
        <button type="button" data-testid="player-progress-start-focus" onClick={onStartTraining}>
          <span>Start next focus</span><span aria-hidden="true">→</span>
        </button>
      </article>

      <div className={styles.detailRow}>
        <div>
          <span>WHY THIS READOUT</span>
          <p>ShotLab separates comparable drill quality from simple practice frequency. It does not combine unrelated drill scores into a fake overall rating.</p>
        </div>
        <button type="button" data-testid="player-progress-open-profile" onClick={onOpenFullProfile}>Open full progress profile</button>
      </div>
    </section>
  );
}
