import { useState } from "react";
import PlayerSessionCloseout from "./PlayerSessionCloseout.jsx";
import styles from "./PlayerTrainingCompletion.module.css";

const clean = (value) => String(value ?? "").trim();
const numberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function ResultMark({ isPB }) {
  return (
    <span className={styles.resultMark} data-pb={isPB ? "true" : "false"} aria-hidden="true">
      {isPB ? (
        <svg viewBox="0 0 24 24">
          <path d="M12 3 14.7 8.5 21 9.4l-4.5 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L3 9.4l6.3-.9L12 3Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <path d="m5 12 4 4L19 6" />
        </svg>
      )}
    </span>
  );
}

export default function PlayerTrainingCompletion({
  data,
  shareCard,
  canChallenge = false,
  completedCount = 0,
  plannedTotal = 0,
  nextCommitment = null,
  currentStreak = null,
  onContinue,
  onChallenge,
  onViewProgress,
}) {
  const [showShareCard, setShowShareCard] = useState(false);
  const [showSessionCloseout, setShowSessionCloseout] = useState(false);
  const score = numberOrNull(data?.score) ?? 0;
  const max = numberOrNull(data?.max);
  const prevBest = numberOrNull(data?.prevBest);
  const isPB = Boolean(data?.isPB);
  const isProgram = data?.src === "program";
  const hasMax = max !== null && max > 0;
  const pct = hasMax ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : null;
  const liveStreak = numberOrNull(currentStreak);
  const homeMomentum = Math.max(1, liveStreak ?? ((numberOrNull(data?.streak) ?? 0) + 1));
  const safeCompleted = Math.max(0, Number(completedCount) || 0);
  const safeTotal = Math.max(safeCompleted, Number(plannedTotal) || 0);
  const planComplete = safeTotal > 0 && safeCompleted >= safeTotal;

  if (showSessionCloseout) {
    return (
      <PlayerSessionCloseout
        data={data}
        completedCount={safeCompleted}
        plannedTotal={safeTotal}
        nextCommitment={nextCommitment}
        currentStreak={liveStreak}
        onDone={onContinue}
        onViewProgress={onViewProgress}
        onResume={() => setShowSessionCloseout(false)}
      />
    );
  }

  let progressTitle = "Result added";
  let progressDetail = "Your work is saved in today’s training history.";
  if (isPB) {
    progressTitle = "New personal best";
    progressDetail = prevBest !== null && prevBest > 0 && score > prevBest
      ? `+${score - prevBest} over your previous best of ${prevBest}.`
      : "You just set a new benchmark for this drill.";
  } else if (prevBest !== null && prevBest > score) {
    progressTitle = `${prevBest - score} from your best`;
    progressDetail = `Best: ${prevBest}. Keep the next rep focused and close the gap.`;
  } else if (prevBest !== null && prevBest === score) {
    progressTitle = "Personal best matched";
    progressDetail = "You repeated your best result. Build on it with the next drill.";
  }

  const nextTitle = planComplete
    ? "Close today’s training loop"
    : isProgram ? "Review the program result" : "Keep today’s session moving";
  const nextDetail = planComplete
    ? "The planned work is complete. Finish the session and bank today’s progress."
    : isProgram
      ? "Your score is logged. Return to the program plan and see where it lands."
      : "The result is banked. Go straight to the next drill while the rep quality is fresh.";
  const nextButton = planComplete ? "Finish session" : isProgram ? "Review program" : "Continue training";
  const handleNext = planComplete ? () => setShowSessionCloseout(true) : onContinue;

  return (
    <section className={styles.root} data-testid="player-training-completion" data-pb={isPB ? "true" : "false"}>
      <div className={styles.kickerRow}>
        <span className={styles.kicker}>RESULT LOGGED</span>
        <span className={styles.mode}>{isProgram ? "PROGRAM" : "AT HOME"}</span>
      </div>

      <div className={styles.resultHero} data-testid="player-training-result-hero">
        <ResultMark isPB={isPB} />
        <div className={styles.resultCopy}>
          <span>{isPB ? "PERSONAL BEST" : "DRILL COMPLETE"}</span>
          <h2>{clean(data?.drill) || "Training drill"}</h2>
        </div>
        <div className={styles.score} data-testid="player-training-result">
          <strong>{score}</strong>
          {hasMax ? <small>/{max}</small> : null}
        </div>
      </div>

      {pct !== null ? (
        <div className={styles.performanceTrack} aria-label={`${pct}% of drill maximum`}>
          <span style={{ width: `${pct}%` }} />
        </div>
      ) : null}

      <div className={styles.insightGrid}>
        <div className={styles.insight} data-testid="player-training-progress-copy">
          <span>WHAT CHANGED</span>
          <strong>{progressTitle}</strong>
          <p>{progressDetail}</p>
        </div>
        <div className={styles.insight}>
          <span>{isProgram ? "STATUS" : "MOMENTUM"}</span>
          <strong>{isProgram ? "Program result saved" : `${homeMomentum}-day rhythm`}</strong>
          <p>{isProgram ? "Ready for leaderboard review." : "Stay in the loop. One clean next rep matters more than lingering here."}</p>
        </div>
      </div>

      <div className={styles.nextCard}>
        <span>NEXT MOVE</span>
        <strong>{nextTitle}</strong>
        <p>{nextDetail}</p>
        <button type="button" className={styles.primaryAction} data-testid="player-training-next-action" onClick={handleNext}>
          <span>{nextButton}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {!planComplete ? (
        <button type="button" className={styles.finishSession} data-testid="player-training-finish-session" onClick={() => setShowSessionCloseout(true)}>
          Finish for today
        </button>
      ) : null}

      <div className={styles.secondaryActions} aria-label="Optional training actions">
        <button
          type="button"
          className={styles.secondaryAction}
          data-testid="player-training-share-toggle"
          aria-expanded={showShareCard}
          onClick={() => setShowShareCard((value) => !value)}
        >
          {showShareCard ? "Hide share card" : "View share card"}
        </button>
        {canChallenge ? (
          <button type="button" className={styles.secondaryAction} data-testid="player-training-challenge-action" onClick={onChallenge}>
            Challenge teammate
          </button>
        ) : null}
      </div>

      {showShareCard ? (
        <div className={styles.sharePanel} data-testid="player-training-share-card">
          <div className={styles.shareLabel}>SHAREABLE RESULT</div>
          {shareCard}
        </div>
      ) : null}
    </section>
  );
}
