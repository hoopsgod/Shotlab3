import styles from "./PlayerDailyPrimitives.module.css";

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));

export function ExperienceProgressRing({ value = 0, max = 100, label, detail, size = 92, testId }) {
  const pct = clamp(max > 0 ? (Number(value) / Number(max)) * 100 : 0);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className={styles.progressRing} style={{ "--ring-size": `${size}px` }} data-testid={testId} aria-label={`${label || "Progress"}: ${Math.round(pct)}%`}>
      <svg viewBox="0 0 84 84" aria-hidden="true">
        <circle className={styles.progressRingTrack} cx="42" cy="42" r={radius} />
        <circle className={styles.progressRingValue} cx="42" cy="42" r={radius} strokeDasharray={circumference} strokeDashoffset={dashOffset} />
      </svg>
      <div className={styles.progressRingCopy}>
        <strong>{Math.round(pct)}%</strong>
        {label ? <span>{label}</span> : null}
      </div>
      {detail ? <div className={styles.progressRingDetail}>{detail}</div> : null}
    </div>
  );
}

export function ExperienceSignal({ eyebrow, title, detail, tone = "neutral", children, testId }) {
  return (
    <section className={`${styles.signal} ${styles[`tone_${tone}`] || ""}`} data-testid={testId}>
      <div className={styles.signalCopy}>
        {eyebrow ? <div className={styles.signalEyebrow}>{eyebrow}</div> : null}
        <div className={styles.signalTitle}>{title}</div>
        {detail ? <div className={styles.signalDetail}>{detail}</div> : null}
      </div>
      {children ? <div className={styles.signalVisual}>{children}</div> : null}
    </section>
  );
}

export function ExperiencePill({ children, tone = "neutral" }) {
  return <span className={`${styles.pill} ${styles[`tone_${tone}`] || ""}`}>{children}</span>;
}
