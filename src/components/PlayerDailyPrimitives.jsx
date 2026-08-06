import ShotLabIcon from "./ShotLabIcon";
import styles from "./PlayerDailyPrimitives.module.css";

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));
const signalIcon = (tone, eyebrow = "") => {
  const value = String(eyebrow).toLowerCase();
  if (value.includes("coach")) return "coach";
  if (value.includes("momentum") || value.includes("progress")) return "momentum";
  if (value.includes("schedule") || value.includes("event")) return "calendar";
  if (tone === "warning") return "alert";
  if (tone === "success") return "check";
  return "target";
};

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
