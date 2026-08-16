import { deriveShotLabPerformanceVisual } from "../lib/shotlabPerformanceVisual.js";
import ShotLabIcon from "./ShotLabIcon";
import styles from "./PlayerDailyPrimitives.module.css";

const signalIcon = (tone, eyebrow = "") => {
  const value = String(eyebrow).toLowerCase();
  if (value.includes("coach")) return "coach";
  if (value.includes("momentum") || value.includes("progress")) return "momentum";
  if (value.includes("schedule") || value.includes("event")) return "calendar";
  if (tone === "warning") return "alert";
  if (tone === "success") return "check";
  return "target";
};

const TARGET_PATH = "M22 104V92C22 45 47 23 80 23S138 45 138 92V104";
const OVERFLOW_PATH = "M14 104V89C14 34 44 14 80 14S146 34 146 89V104";

export function ShotLabPerformanceCourt({ value = 0, max = 100, label, detail, size = 92, testId }) {
  const visual = deriveShotLabPerformanceVisual({ value, target: max });
  const width = Math.max(104, Math.round(Number(size || 92) * 1.28));
  const targetDash = visual.targetPercent >= 100 ? "100 0" : `${visual.targetPercent} ${100 - visual.targetPercent}`;
  const overflowDash = visual.overflowPercent >= 100 ? "100 0" : `${visual.overflowPercent} ${100 - visual.overflowPercent}`;

  return (
    <div
      className={styles.performanceCourt}
      style={{ "--court-size": `${width}px` }}
      data-testid={testId}
      data-performance-visual="shotlab-target-court"
      data-performance-state={visual.state}
      data-target-percent={visual.targetPercent}
      data-above-target={Math.round(visual.aboveTarget)}
      role="img"
      aria-label={visual.accessibleLabel}
    >
      <svg viewBox="0 0 160 118" aria-hidden="true" focusable="false">
        <path className={styles.courtBaseline} d="M14 104H146" />
        <path className={styles.courtLane} d="M59 104V63H101V104" />
        <path className={styles.courtFreeThrow} d="M59 63H101M65 63a15 15 0 0 0 30 0" />
        <path className={styles.courtRestricted} d="M69 84a11 11 0 0 1 22 0" />
        <path className={styles.courtBackboard} d="M67 78H93" />
        <ellipse className={styles.courtRim} cx="80" cy="82" rx="9" ry="2.6" />
        <path className={styles.courtNet} d="M73 84l4 10h6l4-10M76 88h8" />

        <path d={TARGET_PATH} pathLength="100" className={styles.courtTargetTrack} />
        <path d={TARGET_PATH} pathLength="100" className={styles.courtTargetValue} strokeDasharray={targetDash} />

        {visual.state === "above" ? <>
          <path d={OVERFLOW_PATH} pathLength="100" className={styles.courtOverflowTrack} />
          <path d={OVERFLOW_PATH} pathLength="100" className={styles.courtOverflowValue} strokeDasharray={overflowDash} />
        </> : null}

        <g className={styles.courtTargetLock}>
          <circle cx="80" cy="23" r="5" />
          <path d="M77.5 23l1.7 1.8 3.7-4" />
        </g>
      </svg>
      <span className={styles.performanceCourtState} aria-hidden="true">
        {visual.state === "above" ? `+${Math.round(visual.aboveTarget)} banked` : visual.state === "complete" ? "Target locked" : visual.state === "near" ? "Finish line" : label || "Target path"}
      </span>
      {detail ? <span className={styles.performanceCourtDetail}>{detail}</span> : null}
    </div>
  );
}

// Compatibility wrapper retained for older isolated Player contracts. Player Home
// imports ShotLabPerformanceCourt directly so the Phase 2 visual is explicit.
export function ExperienceProgressRing(props) {
  return <ShotLabPerformanceCourt {...props} />;
}

export function ExperienceSignal({ eyebrow, title, detail, tone = "neutral", icon, children, testId }) {
  const iconName = icon || signalIcon(tone, eyebrow);
  return (
    <section className={`${styles.signal} ${styles[`tone_${tone}`] || ""}`} data-testid={testId}>
      <span className={styles.signalIcon} aria-hidden="true"><ShotLabIcon name={iconName} size={20} /></span>
      <div className={styles.signalCopy}>
        {eyebrow ? <div className={styles.signalEyebrow}>{eyebrow}</div> : null}
        <div className={styles.signalTitle}>{title}</div>
        {detail ? <div className={styles.signalDetail}>{detail}</div> : null}
      </div>
      {children ? <div className={styles.signalVisual}>{children}</div> : null}
    </section>
  );
}

export function ExperiencePill({ children, tone = "neutral", icon }) {
  return <span className={`${styles.pill} ${styles[`tone_${tone}`] || ""}`}>{icon ? <ShotLabIcon name={icon} size={13} /> : null}{children}</span>;
}
