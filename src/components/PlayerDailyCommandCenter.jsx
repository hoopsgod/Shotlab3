import styles from "./PlayerDailyCommandCenter.module.css";

const urgencyLabel = (urgency = "normal") => {
  if (urgency === "urgent") return "Needs attention";
  if (urgency === "priority") return "Priority";
  if (urgency === "complete") return "Complete";
  return "Next best action";
};

const rankLabel = (rank = 0) => (Number(rank) > 0 ? `#${Number(rank)}` : "—");

export default function PlayerDailyCommandCenter({ model, onAction }) {
  if (!model?.primaryAction) return null;
  const primary = model.primaryAction;
  const queue = Array.isArray(model.queue) ? model.queue.slice(1, 4) : [];

  return (
    <section className={styles.root} data-testid="player-daily-command-center" aria-label="Daily training command center">
      <div className={styles.header}>
        <div className={styles.eyebrow}>Today · Daily Command Center</div>
        <div className={styles.status}>{urgencyLabel(primary.urgency)}</div>
      </div>

      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.meta}>{primary.source === "coach" ? "Coach directed" : primary.source === "team" ? "Team commitment" : "Personal development"}</div>
          <div className={styles.meta}>About {primary.estimatedMinutes || 1} min</div>
        </div>
        <h1 className={styles.title}>{primary.title}</h1>
        <p className={styles.description}>{primary.detail}</p>
        <button
          type="button"
          className={styles.primaryButton}
          data-testid="player-daily-primary-action"
          onClick={() => onAction?.(primary)}
        >
          {primary.actionLabel} →
        </button>
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
          <div className={styles.sectionLabel}>After this</div>
          <div className={styles.tasks} data-testid="player-daily-task-queue">
            {queue.map((task) => (
              <div className={styles.taskRow} key={task.id}>
                <div className={styles.taskCopy}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  <div className={styles.taskMeta}>{task.detail} · {task.estimatedMinutes || 1} min</div>
                </div>
                <button type="button" className={styles.taskButton} onClick={() => onAction?.(task)}>{task.actionLabel}</button>
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
                {!step.done && step.target !== "home" && <button type="button" className={styles.activationButton} onClick={() => onAction?.({ target: step.target, kind: `activation-${step.id}` })}>Do now</button>}
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
