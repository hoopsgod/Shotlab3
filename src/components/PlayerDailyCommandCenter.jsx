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
        <div className={styles.eyebrow}>Today · Daily Command Center</div>
        <div className={styles.status}>{urgencyLabel(primary.urgency)}</div>
      </div>

      <div className={`${styles.hero} ${dailyComplete ? styles.heroComplete : ""}`}>
        <div className={styles.heroTop}>
          <ExperiencePill tone={primary.source === "coach" ? "info" : primary.source === "team" ? "attention" : "positive"}>
            {primary.source === "coach" ? "Coach directed" : primary.source === "team" ? "Team commitment" : "Personal development"}
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

      <section className={styles.coachSignal} data-testid="player-coach-priority-signal" aria-label="Coach assignment">
        <div className={styles.coachSignalHeader}>
          <div>
            <div className={styles.coachSignalEyebrow}>Coach assignment</div>
            <h2 className={styles.coachSignalTitle}>{coachSignal.focus || "Build quality reps today"}</h2>
          </div>
          <span className={styles.coachSignalStatus}>Team focus</span>
        </div>
        <div className={styles.coachSignalGrid}>
          <div className={styles.coachSignalItem}>
            <div className={styles.coachSignalLabel}>Priority drill</div>
            <div className={styles.coachSignalValue}>{coachSignal.priorityDrill || "Next unfinished training block"}</div>
          </div>
          <div className={styles.coachSignalItem}>
            <div className={styles.coachSignalLabel}>Challenge</div>
            <div className={styles.coachSignalValue}>{coachSignal.challenge || "Complete one focused block and log the result."}</div>
          </div>
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
                {!step.done && step.target !== "home" && <button type="button" className={styles.activationButton} onClick={() => runAction({ target: step.target, kind: `activation-${step.id}` })}>Do now</button>}
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
