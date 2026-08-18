import { ShotLabPerformanceCourt } from "./PlayerDailyPrimitives.jsx";
import { deriveShotLabPerformanceVisual } from "../lib/shotlabPerformanceVisual.js";
import TeamIdentityTitleStage from "./TeamIdentityTitleStage.jsx";
import styles from "./PlayerTrainingSessionHeader.module.css";

const clean = (value) => String(value ?? "").trim();

const targetStatus = (visual) => {
  if (!visual) return "QUALITY REPS";
  if (visual.state === "above") return `+${Math.round(visual.aboveTarget)} BANKED`;
  if (visual.state === "complete") return "TARGET LOCKED";
  if (visual.state === "near") return `${Math.round(visual.remaining)} TO LOCK`;
  return `${Math.round(visual.remaining)} TO TARGET`;
};

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
  const liveValue = hasScore ? numericScore : 0;
  const visual = hasMax ? deriveShotLabPerformanceVisual({ value: liveValue, target: max }) : null;
  const boundedIndex = Math.max(1, Number(currentIndex) || 1);
  const boundedTotal = Math.max(boundedIndex, Number(total) || 1);

  return (
    <section
      className={styles.root}
      data-testid="player-training-session-header"
      data-mode={mode}
      data-performance-language="shotlab-target-court"
    >
      <TeamIdentityTitleStage
        variant="compact"
        surface="light"
        role={isProgram ? "PROGRAM" : "PLAYER"}
        eyebrow={isProgram ? "PROGRAM SESSION" : "AT-HOME SESSION"}
        title={clean(drill?.name) || "Training drill"}
        summary={clean(drill?.desc) || "Complete the drill with intent, then log the result."}
        status={`DRILL ${boundedIndex} / ${boundedTotal}`}
        backAction={{ label: "Back to training plan", onClick: onBack }}
        showTonalCrest={false}
        testId="player-training-session-title-stage"
      />

      <div className={styles.performanceBand} data-testid="player-training-performance-band">
        <div className={styles.planSignal}>
          <span>SESSION PATH</span>
          <strong>{boundedIndex} OF {boundedTotal}</strong>
          <small>{boundedIndex < boundedTotal ? `${boundedTotal - boundedIndex} drill${boundedTotal - boundedIndex === 1 ? "" : "s"} after this` : "Final planned drill"}</small>
        </div>

        {hasMax ? (
          <div className={styles.targetSignal} data-testid="player-training-live-target-wrap">
            <div className={styles.targetCopy}>
              <span>DRILL TARGET</span>
              <strong>{targetStatus(visual)}</strong>
              <small>{hasScore ? `${numericScore} / ${max}` : `0 / ${max}`}</small>
            </div>
            <ShotLabPerformanceCourt
              value={liveValue}
              max={max}
              size={70}
              label="Target path"
              contextLabel="on this drill"
              testId="player-training-live-target"
            />
          </div>
        ) : (
          <div className={styles.targetSignal} data-testid="player-training-live-target-wrap">
            <div className={styles.targetCopy}>
              <span>DRILL STANDARD</span>
              <strong>QUALITY REPS</strong>
              <small>{hasScore ? `${numericScore} logged` : "Log the honest result"}</small>
            </div>
            <div className={styles.baselineMark} aria-hidden="true">
              <svg viewBox="0 0 92 58"><path d="M8 49h76M28 49V27h36v22M36 27a10 10 0 0 0 20 0M39 36h14"/><ellipse cx="46" cy="39" rx="7" ry="2"/></svg>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
