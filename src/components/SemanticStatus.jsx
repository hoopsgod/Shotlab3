import React from "react";
import styles from "./SemanticStatus.module.css";

const VALID_TONES = new Set(["success", "info", "warning", "danger", "neutral"]);

export default function SemanticStatus({
  tone = "neutral",
  children,
  compact = false,
  testId,
  className = "",
}) {
  const safeTone = VALID_TONES.has(tone) ? tone : "neutral";
  const classes = [styles.status, compact ? styles.compact : "", className].filter(Boolean).join(" ");

  return (
    <span
      className={classes}
      data-tone={safeTone}
      data-testid={testId}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
