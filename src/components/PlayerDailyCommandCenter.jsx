import { useEffect, useRef, useState } from "react";
import { ExperiencePill, ExperienceProgressRing, ExperienceSignal } from "./ExperiencePrimitives.jsx";
import styles from "./PlayerDailyCommandCenter.module.css";

const urgencyLabel = (urgency = "normal") => {
  if (urgency === "urgent") return "Needs attention";
  if (urgency === "priority") return "Priority";
  if (urgency === "complete") return "Complete";
  return "Next best action";
};

const rankLabel = (rank = 0) => (Number(rank) > 0 ? `#${Number(rank)}` : "—");
const actionKey = (action = {}) => String(action.id || action.kind || action.target || action.title || "action");
const coachSignalStatus = (signal = {}) => {
  if (signal.stale) return "Stale";
  if (signal.freshness === "current") return signal.ageDays === 0 ? "Published today" : `${signal.ageDays}d old`;
  return "Unverified";
};

export default function PlayerDailyCommandCenter({ model, onAction }) {
  const [activeAction, setActiveAction] = useState("");
  const feedbackTimer = useRef(null);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  if (!model?.primaryAction) return null;
  const primary = model.primaryAction;
  const queue = Array.isArray(model.queue) ? model.queue.slice(1, 4) : [];
  const coachSignal = model.coachSignal || {};
  const firstSession = model.firstSession || {};
  const dailyRemaining = Math.max((Number(model.daily?.goal) || 0) - (Number(model.daily?.makes) || 0), 0);
  const dailyComplete = Number(model.daily?.pct) >= 100 || primary.urgency === "complete";
  const weeklyComplete = Number(model.weekly?.pct) >= 100;
  const momentumTone = dailyComplete ? "positive" : primary.urgency === "urgent" ? "attention" : "info";
  const momentumTitle = dailyComplete
    ? "Daily target complete"
    : dailyRemaining > 0
      ? `${dailyRemaining} makes from today’s target`
      : "Your next action is ready";
  const momentumDetail = dailyComplete
    ? weeklyComplete
      ? "Today and this week are complete. Review progress or protect the streak with optional work."
      : `${model.weekly.makes}/${model.weekly.goal} makes this week. The next action should build on the work already completed.`
    : `${model.streak || 0}-day streak · ${rankLabel(model.leaderboardRank)} team rank · ${model.actionableCount} open ${model.actionableCount === 1 ? "action" : "actions"}.`;

  const runAction = (action) => {
    const key = actionKey(action);
    setActiveAction(key);
    onAction?.(action);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setActiveAction(""), 900);
  };

  return (
    <section className={styles.root} data-testid="player-daily-command-center" aria-label="Daily training command center">
      <div className={styles.header}>
        <div className={styles.eyebrow}>{firstSession.pending ? "First session · Create your baseline" : "Today · Daily Command Center"}</div>
        <div className={styles.status}>{firstSession.pending ? "Activation" : urgencyLabel(primary.urgency)}</div>
      </div>

      <div className={`${styles.hero} ${dailyComplete ? styles.heroComplete : ""}`}>
        <div className={styles.heroTop}>
          <ExperiencePill tone={primary.source === "coach" ? "info" : primary.source === "team" ? "attention" : "positive"}>
            {primary.source === "activation" ? "First result" : primary.source === "coach" ? "Coach directed" : primary.source === "team" ? "Team commitment" : "Personal development"}
          </ExperiencePill>
          <div className={styles.meta}>About {primary.estimatedMinutes || 1} min</div>
        </div>
        <h1 className={styles.title}>{dailyComplete ? "Work banked. Keep building." : primary.title}</h1>
        <p className={styles.description}>{dailyComplete ? "Your daily standard is complete. Use the next action to extend the week, review progress, or handle a team commitment." : primary.detail}</p>
        <button
          type="button"
          className={styles.primaryButton}
          data-testid="player-daily-primary-action"
          data-state={activeAction === actionKey(primary) ? "working" : "idle"}
          onClick={() => runAction(primary)}
        >
          {activeAction === actionKey(primary) ? "Opening…" : `${primary.actionLabel} →`}
        </button>
      </div>

      {firstSession.complete && !model.activation.complete && (
        <div className={styles.momentumSignal} data-testid="player-first-result-confirmation">
          <ExperienceSignal
            eyebrow="First session complete"
            title={firstSession.title || "First result banked"}
            detail={firstSession.detail || "Your training baseline is active. Every result from here builds your progress history."}
            tone="positive"
          />
        </div>
      )}

      <section
        className={styles.coachSignal}
        data-testid="player-coach-priority-signal"
        data-freshness={coachSignal.freshness || "unknown"}
        aria-label="Coach assignment"
        style={coachSignal.stale ? {
          borderColor: "rgba(255,181,71,.42)",
          background: "linear-gradient(145deg, rgba(255,181,71,.075), rgba(0,0,0,.16))",
        } : undefined}
      >
        <div className={styles.coachSignalHeader}>
          <div>
            <div className={styles.coachSignalEyebrow} style={coachSignal.stale ? { color: "#ffca76" } : undefined}>
              {coachSignal.stale ? "Coach assignment needs refresh" : "Coach assignment"}
            </div>
            <h2 className={styles.coachSignalTitle}>
              {coachSignal.stale ? "Waiting for an updated team focus" : coachSignal.focus || "Build quality reps today"}
            </h2>
          </div>
          <span
            className={styles.coachSignalStatus}
            style={coachSignal.stale ? {
              borderColor: "rgba(255,181,71,.48)",
              background: "rgba(255,181,71,.12)",
              color: "#ffd18a",
            } : undefined}
          >
            {coachSignalStatus(coachSignal)}
          </span>
        </div>
        <div className={styles.coachSignalGrid}>
          {coachSignal.stale ? (
            <>
              <div className={styles.coachSignalItem}>
                <div className={styles.coachSignalLabel}>Last published</div>
                <div className={styles.coachSignalValue}>{coachSignal.ageDays} days ago</div>
              </div>
              <div className={styles.coachSignalItem}>
                <div className={styles.coachSignalLabel}>What to do</div>
                <div className={styles.coachSignalValue}>Continue your current training plan until your coach republishes Team Focus.</div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.coachSignalItem}>
                <div className={styles.coachSignalLabel}>Priority drill</div>
                <div className={styles.coachSignalValue}>{coachSignal.priorityDrill || "Next unfinished training block"}</div>
              </div>
              <div className={styles.coachSignalItem}>
                <div className={styles.coachSignalLabel}>Challenge</div>
                <div className={styles.coachSignalValue}>{coachSignal.challenge || "Complete one focused block and log the result."}</div>
              </div>
            </>
          )}
        </div>
      </section>

      <div className={styles.momentumSignal}>
        <ExperienceSignal
          eyebrow="Momentum"
          title={momentumTitle}
          detail={momentumDetail}
          tone={momentumTone}
          testId="player-daily-momentum-signal"
        >
          <ExperienceProgressRing
            value={model.daily.makes}
            max={model.daily.goal || 1}
            label="Today"
            detail={`${model.daily.makes} of ${model.daily.goal} makes`}
            size={88}
            testId="player-daily-progress-ring"
          />
        </ExperienceSignal>
      </div>

      <div className={styles.progressGrid}>
        {[{ label: "Today", value: `${model.daily.makes}/${model.daily.goal}`, pct: model.daily.pct }, { label: "This week", value: `${model.weekly.makes}/${model.weekly.goal}`, pct: model.weekly.pct }].map((item) => (
          <div className={styles.progressCard} key={item.label}>
            <div className={styles.progressHeader}>
              <div className={styles.sectionLabel}>{item.label}</div>
              <div className={styles.meta}>{item.pct}%</div>
            </div>
            <div className={styles.progressValue}>{item.value}</div>
            <div className={styles.progressTrack} aria-label={`${item.label} progress ${item.pct}%`}>
              <div className={styles.progressFill} style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.metrics} aria-label="Player momentum metrics">
        <div className={styles.metric}><div className={styles.metricValue}>{model.streak || 0}</div><div className={styles.metricLabel}>Day streak</div></div>
        <div className={styles.metric}><div className={styles.metricValue}>{rankLabel(model.leaderboardRank)}</div><div className={styles.metricLabel}>Team rank</div></div>
        <div className={styles.metric}><div className={styles.metricValue}>{model.actionableCount}</div><div className={styles.metricLabel}>Open actions</div></div>
      </div>

      {queue.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <div className={styles.sectionLabel}>After this</div>
              <div className={styles.sectionTitle}>Your next moves</div>
            </div>
            <div className={styles.meta}>{queue.length} queued</div>
          </div>
          <div className={styles.tasks} data-testid="player-daily-task-queue">
            {queue.map((task, index) => (
              <div className={styles.taskRow} key={task.id}>
                <div className={styles.taskIndex}>{index + 2}</div>
                <div className={styles.taskCopy}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  <div className={styles.taskMeta}>{task.detail} · {task.estimatedMinutes || 1} min</div>
                </div>
                <button
                  type="button"
                  className={styles.taskButton}
                  data-state={activeAction === actionKey(task) ? "working" : "idle"}
                  onClick={() => runAction(task)}
                >
                  {activeAction === actionKey(task) ? "Opening…" : task.actionLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!model.activation.complete && (
        <details className={styles.activation} data-testid="player-activation-loop" open={model.activation.completeCount < 2}>
          <summary>First-week activation · {model.activation.completeCount}/{model.activation.total} complete</summary>
          <div className={styles.activationRows}>
            {model.activation.steps.map((step) => (
              <div className={styles.activationRow} key={step.id}>
                <span className={`${styles.activationDot} ${step.done ? styles.activationDotDone : ""}`} aria-hidden="true">{step.done ? "✓" : "·"}</span>
                <span className={styles.activationText}>{step.label}</span>
                {!step.done && step.target !== "home" && <button type="button" className={styles.activationButton} onClick={() => runAction({ target: step.target, kind: `activation-${step.id}` })}>{step.actionLabel || "Do now"}</button>}
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}