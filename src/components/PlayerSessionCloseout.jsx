import styles from "./PlayerSessionCloseout.module.css";

const clean = (value) => String(value ?? "").trim();
const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function formatCommitment(commitment) {
  if (!commitment) return { title: "No team event scheduled", detail: "Your next training decision stays with you." };
  const title = clean(commitment?.title || commitment?.name || commitment?.type) || "Team commitment";
  const rawDate = clean(commitment?.date);
  let dateLabel = rawDate || "Upcoming";
  if (rawDate) {
    const date = new Date(`${rawDate}T00:00:00`);
    if (!Number.isNaN(date.getTime())) dateLabel = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  const time = clean(commitment?.time);
  return { title, detail: time ? `${dateLabel} · ${time}` : dateLabel };
}

export default function PlayerSessionCloseout({
  data,
  completedCount = 0,
  plannedTotal = 0,
  nextCommitment = null,
  currentStreak = null,
  onDone,
  onViewProgress,
  onResume,
}) {
  const completed = Math.max(0, asNumber(completedCount));
  const total = Math.max(completed, asNumber(plannedTotal));
  const planComplete = total > 0 && completed >= total;
  const completionPct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 100;
  const liveStreak = asNumber(currentStreak, null);
  const momentum = Math.max(1, liveStreak !== null ? liveStreak : asNumber(data?.streak) + (data?.src === "program" ? 0 : 1));
  const score = Math.max(0, asNumber(data?.score));
  const max = asNumber(data?.max, null);
  const isPB = Boolean(data?.isPB);
  const commitment = formatCommitment(nextCommitment);
  const modeLabel = data?.src === "program" ? "PROGRAM" : "AT HOME";

  return (
    <section className={styles.root} data-testid="player-session-closeout" data-complete={planComplete ? "true" : "false"}>
      <div className={styles.topline}>
        <span>SESSION COMPLETE</span>
        <span>{modeLabel}</span>
      </div>

      <div className={styles.hero} data-testid="player-session-closeout-hero">
        <div className={styles.mark} aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>
        </div>
        <div>
          <span>{planComplete ? "PLAN COMPLETE" : "SESSION BANKED"}</span>
          <h2>Today’s work is banked.</h2>
          <p>{planComplete ? "You completed the full training plan. Close the loop, then let the work compound." : `You logged ${completed} of ${total || completed} planned results. Finish intentionally and resume with a clean next target.`}</p>
        </div>
      </div>

      {total > 0 ? (
        <div className={styles.planProgress} aria-label={`${completionPct}% of training plan completed`}>
          <span style={{ width: `${completionPct}%` }} />
        </div>
      ) : null}

      <div className={styles.metrics} data-testid="player-session-closeout-metrics">
        <div><span>RESULTS LOGGED</span><strong>{completed}</strong></div>
        <div><span>PLAN STATUS</span><strong>{planComplete ? "Complete" : `${completed}/${total || completed}`}</strong></div>
        <div><span>MOMENTUM</span><strong>{data?.src === "program" ? "Program banked" : `${momentum}-day rhythm`}</strong></div>
      </div>

      <div className={styles.signalGrid}>
        <div className={styles.signal} data-testid="player-session-best-moment">
          <span>BEST MOMENT</span>
          <strong>{isPB ? "New personal best" : clean(data?.drill) || "Latest result"}</strong>
          <p>{clean(data?.drill) || "Training drill"} · {score}{max ? `/${max}` : ""}{isPB ? " · new benchmark" : " logged"}</p>
        </div>
        <div className={styles.signal} data-testid="player-session-next-commitment">
          <span>NEXT COMMITMENT</span>
          <strong>{commitment.title}</strong>
          <p>{commitment.detail}</p>
        </div>
      </div>

      <div className={styles.closeoutCard}>
        <span>CLOSE THE LOOP</span>
        <strong>{planComplete ? "Recovery starts now." : "Leave with a clear stopping point."}</strong>
        <p>{planComplete ? "Your training history is updated. Review progress when you want context; otherwise, get out of the app and recover." : "Stopping intentionally is better than drifting. Your logged work stays saved and the remaining plan stays visible."}</p>
        <button type="button" className={styles.primary} data-testid="player-session-done" onClick={onDone}>
          <span>Done for today</span><span aria-hidden="true">✓</span>
        </button>
      </div>

      <div className={styles.actions}>
        <button type="button" data-testid="player-session-view-progress" onClick={onViewProgress}>View progress</button>
        {!planComplete ? <button type="button" data-testid="player-session-resume" onClick={onResume}>Resume training</button> : null}
      </div>
    </section>
  );
}
