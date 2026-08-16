import { useEffect, useRef, useState } from "react";
import { installPlayerAssignmentEnhancer } from "../lib/playerAssignmentEnhancer.js";
import { derivePlayerPerformanceNarrative } from "../lib/playerPerformanceNarrative.js";
import { ExperienceProgressRing, ExperienceSignal } from "./PlayerDailyPrimitives.jsx";
import ShotLabIcon from "./ShotLabIcon";
import styles from "./PlayerDailyCommandCenter.module.css";

const rankLabel = (rank = 0) => (Number(rank) > 0 ? `#${Number(rank)}` : "—");
const actionKey = (action = {}) => String(action.id || action.kind || action.target || action.title || "action");
const coachSignalStatus = (signal = {}) => signal.stale ? "Stale" : signal.freshness === "current" ? signal.ageDays === 0 ? "Published today" : `${signal.ageDays}d old` : "Unverified";
const coachSignalIcon = (signal = {}) => signal.stale ? "clock" : signal.freshness === "current" ? "verified" : "neutral";
const iconButtonStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9 };
const compactCoachValueStyle = { fontSize: 12.5, lineHeight: 1.26, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" };

export default function PlayerDailyCommandCenter({ model, onAction }) {
  const [activeAction, setActiveAction] = useState("");
  const feedbackTimer = useRef(null);

  useEffect(() => {
    installPlayerAssignmentEnhancer();
  }, []);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  if (!model?.primaryAction) return null;

  const primary = model.primaryAction;
  const queue = Array.isArray(model.queue) ? model.queue.slice(1, 3) : [];
  const coachSignal = model.coachSignal || {};
  const firstSession = model.firstSession || {};
  const narrative = derivePlayerPerformanceNarrative({
    daily: model.daily,
    weekly: model.weekly,
    streak: model.streak,
    firstSession,
    primaryAction: primary,
  });
  const dailyRemaining = narrative.remaining;
  const dailyComplete = narrative.complete;
  const weeklyGoal = Number(model.weekly?.goal) || 0;
  const weeklyComplete = weeklyGoal > 0 && Number(model.weekly?.pct) >= 100;
  const momentumTone = dailyComplete ? "positive" : primary.urgency === "urgent" ? "attention" : "info";
  const momentumTitle = dailyComplete ? "Daily target complete" : dailyRemaining > 0 ? `${dailyRemaining} makes from today’s target` : "Your next action is ready";
  const momentumDetail = dailyComplete
    ? weeklyComplete
      ? "Today and this week are complete. Review progress or protect the streak with optional work."
      : weeklyGoal > 0
        ? `${model.weekly.makes} of ${weeklyGoal} makes this week. Choose the next action that best builds on today’s work.`
        : `${model.weekly?.makes || 0} makes logged this week. No weekly target is set, so choose the next action that best builds on today’s work.`
    : `${narrative.streakText} · ${rankLabel(model.leaderboardRank)} team rank · ${model.actionableCount} open ${model.actionableCount === 1 ? "action" : "actions"}.`;
  const progressShouldOpen = dailyComplete || primary.urgency === "urgent";

  const runAction = (action) => {
    const key = actionKey(action);
    setActiveAction(key);
    onAction?.(action);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setActiveAction(""), 900);
  };

  const primaryWorking = activeAction === actionKey(primary);

  return (
    <section className={styles.root} data-testid="player-daily-command-center" data-phase="dashboard-showstopper-phase-1" data-page-hierarchy="performance-command-center" data-mobile-product-reset="phase-1" aria-label="Daily training command center">
      <div className={`${styles.hero} ${dailyComplete ? styles.heroComplete : ""}`} data-command-role="primary" data-layout-role="primary-decision">
        <div className={styles.heroKicker}>
          <span>Today</span>
          <strong>{narrative.contextLabel}</strong>
        </div>

        <div className={styles.performanceStage} data-testid="player-today-performance">
          <div className={styles.todayMetric}>
            <div className={styles.todayValue} aria-label={`${narrative.makes} makes today`}>
              <span>{narrative.makes}</span>
              <span className={styles.todayUnit}>Made</span>
            </div>
            <div className={styles.interpretation} data-tone={narrative.interpretationTone} data-testid="player-target-interpretation">
              {narrative.interpretation}
            </div>
          </div>
          <div className={styles.heroRing} aria-hidden="true">
            <ExperienceProgressRing value={narrative.makes} max={narrative.goal} label="Today" detail={`${narrative.makes} of ${narrative.goal} makes`} size={86} testId="player-daily-progress-ring" />
          </div>
        </div>

        <div className={styles.statusBlock}>
          <h1 className={styles.title}>{narrative.headline}</h1>
          <p className={styles.description}>{narrative.description}</p>
        </div>

        <div className={styles.momentumRow} role="group" data-testid="player-command-evidence" data-layout-role="supporting-evidence" aria-label="Weekly progress and momentum">
          <div className={styles.momentumItem} aria-label={`${narrative.weeklyText} ${narrative.weeklyLabel}`}>
            <div className={styles.momentumValue}>{narrative.weeklyText}</div>
            <div className={styles.momentumLabel}>{narrative.weeklyLabel}</div>
          </div>
          <div className={styles.momentumItem} aria-label={`Momentum: ${narrative.streakText}`}>
            <div className={styles.momentumValue}>{narrative.streakText}</div>
            <div className={styles.momentumLabel}>Momentum</div>
          </div>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          style={iconButtonStyle}
          data-testid="player-daily-primary-action"
          data-state={primaryWorking ? "working" : "idle"}
          aria-busy={primaryWorking || undefined}
          disabled={primaryWorking}
          onClick={() => runAction(primary)}
        >
          <span>{primaryWorking ? "Opening…" : primary.actionLabel}</span>
          <ShotLabIcon name={primaryWorking ? "clock" : primary.urgency === "complete" ? "check" : "arrow"} size={18} />
        </button>
      </div>

      {firstSession.complete && !model.activation.complete && <div className={styles.momentumSignal} data-testid="player-first-result-confirmation" data-command-role="confirmation">
        <ExperienceSignal eyebrow="First session complete" title={firstSession.title || "First result banked"} detail={firstSession.detail || "Your training baseline is active. Every result from here builds your progress history."} tone="positive" icon="verified" />
      </div>}

      <section
        className={styles.coachSignal}
        data-testid="player-coach-priority-signal"
        data-command-role="coach-priority"
        data-layout-role="supporting-evidence"
        data-freshness={coachSignal.freshness || "unknown"}
        aria-label="Coach assignment"
        style={{
          "--coach-signal-accent": coachSignal.stale ? "#ffb547" : "var(--team-brand-primary,var(--accent,#c8ff1a))",
          marginTop: 14,
          paddingTop: 14,
          paddingBottom: 12,
        }}
      >
        <div className={styles.coachSignalHeader} style={{ display: "block" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div className={styles.coachSignalEyebrow} style={coachSignal.stale ? { color: "#ffca76" } : undefined}>{coachSignal.stale ? "Coach assignment needs refresh" : "Coach assignment"}</div>
            <span className={styles.coachSignalStatus} style={coachSignal.stale ? { marginTop: 0, borderColor: "rgba(255,181,71,.48)", background: "rgba(255,181,71,.12)", color: "#ffd18a", gap: 5 } : { marginTop: 0, paddingInline: 0, gap: 5 }}>
              <ShotLabIcon name={coachSignalIcon(coachSignal)} size={13} /><span>{coachSignalStatus(coachSignal)}</span>
            </span>
          </div>
          <h2 className={styles.coachSignalTitle} style={{ fontSize: "clamp(17px,4.6vw,20px)", lineHeight: 1.04, maxWidth: "none", letterSpacing: "-.03em", marginTop: 7 }}>{coachSignal.stale ? "Waiting for an updated team focus" : coachSignal.focus || "Build quality reps today"}</h2>
        </div>
        <div className={styles.coachSignalGrid} style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", marginTop: 9 }}>
          {coachSignal.stale ? <>
            <div className={styles.coachSignalItem} style={{ paddingTop: 9, paddingRight: 12 }}><div className={styles.coachSignalLabel}>Last published</div><div className={styles.coachSignalValue} style={compactCoachValueStyle}>{coachSignal.ageDays} days ago</div></div>
            <div className={styles.coachSignalItem} style={{ marginTop: 0, paddingTop: 9, paddingLeft: 12, borderTop: 0, borderLeft: "1px solid rgba(23,26,24,.1)" }}><div className={styles.coachSignalLabel}>What to do</div><div className={styles.coachSignalValue} style={compactCoachValueStyle}>Continue your current training plan until your coach republishes Team Focus.</div></div>
          </> : <>
            <div className={styles.coachSignalItem} style={{ paddingTop: 9, paddingRight: 12 }}><div className={styles.coachSignalLabel}>Priority drill</div><div className={styles.coachSignalValue} style={compactCoachValueStyle}>{coachSignal.priorityDrill || "Next unfinished training block"}</div></div>
            <div className={styles.coachSignalItem} style={{ marginTop: 0, paddingTop: 9, paddingLeft: 12, borderTop: 0, borderLeft: "1px solid rgba(23,26,24,.1)" }}><div className={styles.coachSignalLabel}>Challenge</div><div className={styles.coachSignalValue} style={compactCoachValueStyle}>{coachSignal.challenge || "Complete one focused block and log the result."}</div></div>
          </>}
        </div>
      </section>

      {queue.length > 0 && <div className={styles.section} data-command-role="next-actions" data-layout-role="quiet-secondary">
        <div className={styles.sectionHeading} data-visual-role="next-actions-heading"><div><div className={styles.sectionLabel} data-visual-role="next-actions-eyebrow">After this</div><div className={styles.sectionTitle} data-visual-role="next-actions-title">Your next moves</div></div><div className={styles.meta} data-visual-role="next-actions-meta">{queue.length} queued</div></div>
        <div className={styles.tasks} data-testid="player-daily-task-queue">
          {queue.map((task, index) => {
            const taskWorking = activeAction === actionKey(task);
            return <div className={styles.taskRow} key={task.id}>
              <div className={styles.taskIndex} aria-label={`Queued action ${index + 2}`}><ShotLabIcon name="neutral" size={17} /></div>
              <div className={styles.taskCopy}><div className={styles.taskTitle}>{task.title}</div><div className={styles.taskMeta}>{task.detail} · {task.estimatedMinutes || 1} min</div></div>
              <button type="button" className={styles.taskButton} style={iconButtonStyle} data-state={taskWorking ? "working" : "idle"} disabled={taskWorking} aria-busy={taskWorking || undefined} onClick={() => runAction(task)}><span>{taskWorking ? "Opening…" : task.actionLabel}</span><ShotLabIcon name={taskWorking ? "clock" : "arrow"} size={16} /></button>
            </div>;
          })}
        </div>
      </div>}

      <details className="playerProgressDisclosure" data-testid="player-progress-disclosure" data-command-role="progress-details" data-layout-role="quiet-secondary" open={progressShouldOpen || undefined}>
        <summary><span><small>Progress snapshot</small><strong>{narrative.makes} made today · {narrative.weeklyText} {narrative.weeklyLabel.toLowerCase()}</strong></span><span>View details</span></summary>
        <div className="playerProgressDisclosureBody">
          <div className={styles.momentumSignal}>
            <ExperienceSignal eyebrow="Momentum" title={momentumTitle} detail={momentumDetail} tone={momentumTone} testId="player-daily-momentum-signal" />
          </div>
          <div className={styles.metrics} aria-label="Supporting player metrics">
            <div className={styles.metric}><div className={styles.metricValue}>{rankLabel(model.leaderboardRank)}</div><div className={styles.metricLabel}>Team rank</div></div>
            <div className={styles.metric}><div className={styles.metricValue}>{model.actionableCount}</div><div className={styles.metricLabel}>Open actions</div></div>
          </div>
        </div>
      </details>

      {!model.activation.complete && <details className={styles.activation} data-testid="player-activation-loop" data-command-role="activation" data-layout-role="quiet-secondary" open={model.activation.completeCount < 2}>
        <summary>First-week activation · {model.activation.completeCount}/{model.activation.total} complete</summary>
        <div className={styles.activationRows}>{model.activation.steps.map((step) => <div className={styles.activationRow} key={step.id}>
          <span className={`${styles.activationDot} ${step.done ? styles.activationDotDone : ""}`} aria-hidden="true"><ShotLabIcon name={step.done ? "verified" : "neutral"} size={17} /></span>
          <span className={styles.activationText}>{step.label}</span>
          {!step.done && step.target !== "home" && <button type="button" className={styles.activationButton} style={iconButtonStyle} onClick={() => runAction({ target: step.target, kind: `activation-${step.id}` })}><span>{step.actionLabel || "Do now"}</span><ShotLabIcon name="plus" size={15} /></button>}
        </div>)}</div>
      </details>}
    </section>
  );
}