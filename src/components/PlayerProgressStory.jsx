import { useMemo } from "react";
import { PLAYER_DAILY_SHOT_TARGET } from "../lib/appDataModels.js";
import { derivePlayerProgressStory } from "../lib/playerProgressStory.js";
import styles from "./PlayerProgressStory.module.css";
import ShotLabPerformanceMark from "./ShotLabPerformanceMark.jsx";
import { ShotLabPerformanceCourt } from "./PlayerDailyPrimitives.jsx";
import TeamIdentityTitleStage from "./TeamIdentityTitleStage.jsx";

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
  const todayMakes = Math.max(0, Number(story.dailyMakes?.[story.dailyMakes.length - 1]?.made) || 0);

  return (
    <section className={styles.root} data-testid="player-progress-story" data-trend={story.trend} data-page-hierarchy="command-story">
      <TeamIdentityTitleStage
        variant="standard"
        surface="light"
        role="PLAYER"
        eyebrow="TEAM DEVELOPMENT"
        title="Progress"
        summary="Your development story, current standard, and next useful training move."
        status={`${trendWord} · LAST 14 DAYS`}
        showTonalCrest
        testId="player-progress-title-stage"
      />

      <div className={styles.hero} data-testid="player-progress-story-hero" data-layout-role="command-story-header">
        <div className={styles.heroTopline} data-testid="player-progress-story-topline">
          <span>DEVELOPMENT STORY</span>
          <span data-testid="player-progress-trend-badge">{trendWord}</span>
        </div>
        <div className={styles.heroGrid} data-testid="player-progress-story-hero-grid">
          <div className={styles.heroCopy} data-testid="player-progress-story-copy">
            <span className={styles.playerLabel}>{firstName.toUpperCase()} · LAST 14 DAYS</span>
            <h2>{story.headline}</h2>
            <p>{story.trendDetail}</p>
          </div>
          <div className={styles.targetPanel} data-testid="player-progress-target-court">
            <div className={styles.targetPanelCopy} data-testid="player-progress-target-summary">
              <span>TODAY’S STANDARD</span>
              <strong>{todayMakes}<small>/{PLAYER_DAILY_SHOT_TARGET}</small></strong>
            </div>
            <ShotLabPerformanceCourt
              value={todayMakes}
              max={PLAYER_DAILY_SHOT_TARGET}
              size={76}
              label="Target path"
              testId="player-progress-target-visual"
            />
          </div>
        </div>
        <div className={styles.metricStrip} data-testid="player-progress-metrics">
          <div className={styles.metricMark}>
            <ShotLabPerformanceMark kind="milestone" value={`${story.activeDays7}/7`} label="Active days" detail="Last 7 days" compact testId="player-progress-active-days-mark" />
          </div>
          <div className={styles.metricMark}>
            <ShotLabPerformanceMark kind="streak" value={`${story.currentStreak}D`} label="Live rhythm" detail="Current streak" compact testId="player-progress-streak-mark" />
          </div>
          <div className={styles.metricMark}>
            <ShotLabPerformanceMark kind="pb" value={story.pbCount30} label="Recent PBs" detail="Last 30 days" compact testId="player-progress-pb-mark" />
          </div>
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
