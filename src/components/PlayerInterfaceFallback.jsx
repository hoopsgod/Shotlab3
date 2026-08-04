import styles from "./PlayerInterfaceFallback.module.css";

export default function PlayerInterfaceFallback({
  label = "Player workspace",
  testId = "player-interface-loading",
  variant = "panel",
}) {
  return (
    <div
      className={`${styles.root} ${styles[variant] || styles.panel}`}
      data-testid={testId}
      data-loading-variant={variant}
      role="status"
      aria-live="polite"
      aria-label={`Preparing ${label}`}
    >
      <div className={styles.signal} aria-hidden="true" />
      <div className={styles.copy}>
        <span className={styles.eyebrow}>Player experience</span>
        <strong>Preparing {label}</strong>
      </div>
      <div className={styles.pulse} aria-hidden="true"><span /><span /><span /></div>
    </div>
  );
}
