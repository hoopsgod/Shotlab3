import styles from "./ExperiencePrimitives.module.css";

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));

export function ExperienceSparkline({ values = [], label = "Trend", tone = "neutral", testId }) {
  const safeValues = (Array.isArray(values) ? values : []).map((value) => Number(value) || 0);
  const points = safeValues.length ? safeValues : [0, 0];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const coordinates = points.map((value, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 34 - ((value - min) / range) * 28;
    return `${x},${y}`;
  }).join(" ");
  const latest = points.at(-1) || 0;
  const previous = points.at(-2) ?? latest;
  const direction = latest > previous ? "up" : latest < previous ? "down" : "flat";

  return (
    <div className={`${styles.sparkline} ${styles[`tone_${tone}`] || ""}`} data-testid={testId} aria-label={`${label}: ${direction}`}>
      <div className={styles.sparklineHeader}>
        <span>{label}</span>
        <strong>{direction === "up" ? "↗" : direction === "down" ? "↘" : "→"}</strong>
      </div>
      <svg viewBox="0 0 100 38" role="img" aria-hidden="true" preserveAspectRatio="none">
        <polyline points={coordinates} fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

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

export function ExperienceSignal({ eyebrow, title, detail, tone = "neutral", action, children, testId }) {
  return (
    <section className={`${styles.signal} ${styles[`tone_${tone}`] || ""}`} data-testid={testId}>
      <div className={styles.signalCopy}>
        {eyebrow ? <div className={styles.signalEyebrow}>{eyebrow}</div> : null}
        <div className={styles.signalTitle}>{title}</div>
        {detail ? <div className={styles.signalDetail}>{detail}</div> : null}
      </div>
      {children ? <div className={styles.signalVisual}>{children}</div> : null}
      {action?.label ? <button type="button" className={styles.signalAction} onClick={action.onClick}>{action.label}</button> : null}
    </section>
  );
}

export function ExperiencePill({ children, tone = "neutral" }) {
  return <span className={`${styles.pill} ${styles[`tone_${tone}`] || ""}`}>{children}</span>;
}
