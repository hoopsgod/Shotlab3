import { ShotLabPerformanceCourt } from "./PlayerDailyPrimitives.jsx";
import { deriveShotLabPerformanceVisual } from "../lib/shotlabPerformanceVisual.js";
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

const targetMeaning = (visual) => {
  if (!visual) return "Result banked";
  if (visual.state === "above") return `+${Math.round(visual.aboveTarget)} above target`;
  if (visual.state === "complete") return "Target locked";
  if (visual.state === "near") return `${Math.round(visual.remaining)} to lock`;
  return `${Math.round(visual.remaining)} to target`;
};

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
  const liveStreak = asNumber(currentStreak, null);
  const momentum = Math.max(1, liveStreak !== null ? liveStreak : asNumber(data?.streak) + (data?.src === "program" ? 0 : 1));
  const score = Math.max(0, asNumber(data?.score));
  const max = asNumber(data?.max, null);
  const hasMax = max !== null && max > 0;
  const targetVisual = hasMax ? deriveShotLabPerformanceVisual({ value: score, target: max }) : null;
  const isPB = Boolean(data?.isPB);
  const commitment = formatCommitment(nextCommitment);
  const modeLabel = data?.src === "program" ? "PROGRAM" : "AT HOME";
  const planLabel = total > 0 ? `${completed} / ${total}` : `${completed}`;

  return (
    <section className={styles.root} data-testid="player-session-closeout" data-complete={planComplete ? "true" : "false"} data-performance-language="shotlab-target-court">
      <div className={styles.topline}>
        <span>SESSION COMPLETE</span>
        <span>{modeLabel}</span>
      </div>

      <div className={styles.hero} data-testid="player-session-closeout-hero">
        <div className={styles.heroCopy}>
          <span>{planComplete ? "PLAN COMPLETE" : "WORK BANKED"}</span>
          <h2>{planComplete ? "The work is in." : "Bank it. Know what’s left."}</h2>
          <p>{planComplete ? "Your planned results are logged. Read the proof, close the loop, then recover." : `You logged ${completed} of ${total || completed} planned results. The saved work stays in your history and the remaining plan stays clear.`}</p>
        </div>
        {hasMax ? (
          <div className={styles.heroCourt} data-testid="player-session-closeout-target-court">
            <ShotLabPerformanceCourt
              value={score}
              max={max}
              size={74}
              label="Target path"
              contextLabel="on this drill"
              testId="player-session-closeout-target-visual"
            />
          </div>
        ) : (
          <div className={styles.rimMark} aria-hidden="true">
            <svg viewBox="0 0 92 64"><path d="M8 54h76M27 54V30h38v24M35 30a11 11 0 0 0 22 0M38 40h16"/><ellipse cx="46" cy="43" rx="8" ry="2.2"/></svg>
          </div>
        )}
      </div>

      <div className={styles.proofRail} data-testid="player-session-closeout-metrics" aria-label="Session performance proof">
        <div><span>WORK LOGGED</span><strong>{planLabel}</strong><small>{total > 0 ? "planned results" : "results"}</small></div>
        <div><span>LATEST TARGET</span><strong>{targetMeaning(targetVisual)}</strong><small>{hasMax ? `${score} / ${max} latest drill` : clean(data?.drill) || "Latest result"}</small></div>
        <div><span>RHYTHM</span><strong>{data?.src === "program" ? "Program banked" : `${momentum} days`}</strong><small>{data?.src === "program" ? "team work saved" : "current streak"}</small></div>
      </div>

      <div className={styles.meaningGrid}>
        <div className={styles.meaning} data-testid="player-session-best-moment">
          <span>PERFORMANCE PROOF</span>
          <strong>{isPB ? "New personal best" : clean(data?.drill) || "Latest result"}</strong>
          <p>{isPB ? `${clean(data?.drill) || "Training drill"} established a new benchmark.` : `${clean(data?.drill) || "Training drill"} · ${score}${hasMax ? `/${max}` : ""} is now in your history.`}</p>
        </div>
        <div className={styles.meaning} data-testid="player-session-next-commitment">
          <span>NEXT COMMITMENT</span>
          <strong>{commitment.title}</strong>
          <p>{commitment.detail}</p>
        </div>
      </div>

      <div className={styles.nextChapter}>
        <span>NEXT</span>
        <strong>{planComplete ? "Recovery starts now." : "Leave with a clean stopping point."}</strong>
        <p>{planComplete ? "Your history is updated. Review progress when you want context; otherwise, get out of the app and recover." : "Stopping intentionally is better than drifting. Resume later with the remaining work still visible."}</p>
        <button type="button" className={styles.primary} data-testid="player-session-done" onClick={onDone}>
          <span>Done for today</span><span aria-hidden="true">→</span>
        </button>
      </div>

      <div className={styles.actions}>
        <button type="button" data-testid="player-session-view-progress" onClick={onViewProgress}>View progress</button>
        {!planComplete ? <button type="button" data-testid="player-session-resume" onClick={onResume}>Resume training</button> : null}
      </div>
    </section>
  );
}
