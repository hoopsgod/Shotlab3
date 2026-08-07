import styles from "./PlayerTrainingSessionHeader.module.css";

const clean = (value) => String(value ?? "").trim();

function SessionMark({ mode }) {
  return mode === "program" ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4v3M17 4v3M5 8h14M6 5h12a1 1 0 0 1 1 1v13H5V6a1 1 0 0 1 1-1Z" />
      <path d="m9 14 2 2 4-5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M4.7 9.2c4.4.7 8.9 4.1 10.2 8.7M9 4.7c.7 4.4 4.1 8.9 8.7 10.2M5.6 16.9c4.1-3.4 8.3-6.8 12.8-9.8" />
    </svg>
  );
}

export default function PlayerTrainingSessionHeader({
  drill,
  mode = "home",
  currentIndex = 1,
  total = 1,
  score = "",
  onBack,
}) {
  const isProgram = mode === "program";
  const max = Number(drill?.max);
  const hasMax = Number.isFinite(max) && max > 0;
  const numericScore = Number(score);
  const hasScore = clean(score) !== "" && Number.isFinite(numericScore) && numericScore >= 0;
  const scorePct = hasMax && hasScore ? Math.max(0, Math.min(100, Math.round((numericScore / max) * 100))) : 0;
  const boundedIndex = Math.max(1, Number(currentIndex) || 1);
  const boundedTotal = Math.max(boundedIndex, Number(total) || 1);
  const planPct = Math.min(100, Math.round(((boundedIndex - 1) / boundedTotal) * 100));

  return (
    <section
      className={styles.root}
      data-testid="player-training-session-header"
      data-mode={mode}
    >
      <div className={styles.topline}>
        <button type="button" className={styles.back} onClick={onBack} aria-label="Back to training plan">
          <span aria-hidden="true">←</span>
        </button>
        <span className={styles.mode}>{isProgram ? "PROGRAM SESSION" : "AT HOME SESSION"}</span>
        <span className={styles.step}>Drill {boundedIndex} of {boundedTotal}</span>
      </div>

      <div className={styles.hero}>
        <div className={styles.mark}><SessionMark mode={mode} /></div>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>CURRENT WORK</span>
          <h1>{clean(drill?.name) || "Training drill"}</h1>
          <p>{clean(drill?.desc) || "Complete the drill with intent, then log the result."}</p>
        </div>
      </div>

      <div className={styles.targetRow}>
        <div>
          <span>SESSION TARGET</span>
          <strong>{hasMax ? `${max} max` : "Quality reps"}</strong>
        </div>
        <div className={styles.liveScore}>
          <span>LIVE SCORE</span>
          <strong>{hasScore ? numericScore : "—"}{hasMax && hasScore ? <small>/{max}</small> : null}</strong>
        </div>
      </div>

      <div className={styles.progressTrack} aria-label="Training plan progress">
        <i style={{ width: `${planPct}%` }} />
      </div>

      {hasMax && hasScore ? (
        <div className={styles.scoreProgress} data-testid="player-training-live-progress">
          <span style={{ width: `${scorePct}%` }} />
        </div>
      ) : null}
    </section>
  );
}
