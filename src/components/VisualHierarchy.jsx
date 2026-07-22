import React from "react";
import styles from "./VisualHierarchy.module.css";

const cx = (...values) => values.filter(Boolean).join(" ");

export function DominantObjectiveCard({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled = false,
  secondaryLabel,
  onSecondary,
  badge,
  children,
  testId,
}) {
  return (
    <section className={styles.objective} data-testid={testId}>
      <div className={styles.objectiveGlow} aria-hidden="true" />
      <div className={styles.objectiveContent}>
        <div className={styles.objectiveCopy}>
          <div className={styles.objectiveTopline}>
            {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
            {badge ? <span className={styles.badge}>{badge}</span> : null}
          </div>
          <h2 className={styles.objectiveTitle}>{title}</h2>
          {description ? <p className={styles.objectiveDescription}>{description}</p> : null}
          {children ? <div className={styles.objectiveBody}>{children}</div> : null}
        </div>
        {(actionLabel || secondaryLabel) ? (
          <div className={styles.objectiveActions}>
            {actionLabel ? (
              <button
                type="button"
                className={styles.primaryAction}
                onClick={onAction}
                disabled={actionDisabled}
              >
                {actionLabel}
              </button>
            ) : null}
            {secondaryLabel ? (
              <button type="button" className={styles.secondaryAction} onClick={onSecondary}>
                {secondaryLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function MetricStrip({ items = [], testId }) {
  const safeItems = Array.isArray(items) ? items.slice(0, 3) : [];
  return (
    <section className={styles.metricStrip} data-testid={testId} aria-label="Key metrics">
      {safeItems.map((item, index) => (
        <div className={styles.metric} key={item?.label || index}>
          <div className={styles.metricValue}>{item?.value ?? "—"}</div>
          <div className={styles.metricLabel}>{item?.label || "Metric"}</div>
          {item?.detail ? <div className={styles.metricDetail}>{item.detail}</div> : null}
        </div>
      ))}
    </section>
  );
}

export function ProgressiveDisclosure({
  title,
  summary,
  children,
  defaultOpen = false,
  testId,
}) {
  return (
    <details className={styles.disclosure} open={defaultOpen} data-testid={testId}>
      <summary className={styles.disclosureSummary}>
        <span>
          <span className={styles.disclosureTitle}>{title}</span>
          {summary ? <span className={styles.disclosureMeta}>{summary}</span> : null}
        </span>
        <span className={styles.disclosureChevron} aria-hidden="true">⌄</span>
      </summary>
      <div className={styles.disclosureBody}>{children}</div>
    </details>
  );
}

export function QuietSection({ title, eyebrow, actionLabel, onAction, children, className, testId }) {
  return (
    <section className={cx(styles.quietSection, className)} data-testid={testId}>
      {(title || eyebrow || actionLabel) ? (
        <header className={styles.quietHeader}>
          <div>
            {eyebrow ? <div className={styles.quietEyebrow}>{eyebrow}</div> : null}
            {title ? <h3 className={styles.quietTitle}>{title}</h3> : null}
          </div>
          {actionLabel ? (
            <button type="button" className={styles.quietAction} onClick={onAction}>
              {actionLabel}
            </button>
          ) : null}
        </header>
      ) : null}
      <div className={styles.quietBody}>{children}</div>
    </section>
  );
}

export default {
  DominantObjectiveCard,
  MetricStrip,
  ProgressiveDisclosure,
  QuietSection,
};
