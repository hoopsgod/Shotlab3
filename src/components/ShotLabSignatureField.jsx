import styles from "./ShotLabSignatureField.module.css";

const cx = (...values) => values.filter(Boolean).join(" ");

export default function ShotLabSignatureField({
  variant = "court",
  className = "",
  style,
  testId,
}) {
  return (
    <div
      className={cx(styles.root, styles[variant], className)}
      style={style}
      data-testid={testId}
      data-shotlab-signature={variant}
      aria-hidden="true"
    >
      <svg className={styles.court} viewBox="0 0 420 300" preserveAspectRatio="xMidYMid slice">
        <path className={styles.boundary} d="M18 18H402V282H18Z" />
        <path className={styles.centerLine} d="M210 18V282" />
        <circle className={styles.centerCircle} cx="210" cy="150" r="42" />
        <path className={styles.key} d="M18 104H118V196H18" />
        <path className={styles.arc} d="M18 70C112 70 158 100 158 150S112 230 18 230" />
        <path className={styles.backboard} d="M58 126V174" />
        <circle className={styles.rim} cx="68" cy="150" r="8" />
        <path className={styles.cornerTop} d="M18 84H54" />
        <path className={styles.cornerBottom} d="M18 216H54" />
      </svg>
      <svg className={styles.ball} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="48" />
        <path d="M18 60h84M60 12c18 18 27 34 27 48S78 90 60 108M60 12C42 30 33 46 33 60s9 30 27 48M26 31c22 12 46 18 68 18M26 89c22-12 46-18 68-18" />
      </svg>
      <div className={styles.trajectory}>
        <span /><span /><span /><span /><span />
      </div>
      <div className={styles.wordmark}>SL</div>
    </div>
  );
}
